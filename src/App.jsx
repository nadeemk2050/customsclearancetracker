import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { TeamManagementModal } from './components/TeamManagementModal';
import { DeveloperConsoleModal } from './components/DeveloperConsoleModal';
import { LossPreventionBanner } from './components/LossPreventionBanner';
import { KpiMetrics } from './components/KpiMetrics';
import { FilterToolbar } from './components/FilterToolbar';
import { ShipmentTable } from './components/ShipmentTable';
import { ShipmentModal } from './components/ShipmentModal';
import { DossierDrawer } from './components/DossierDrawer';
import { CustomerPortal } from './components/CustomerPortal';
import { ExportImportModal } from './components/ExportImportModal';
import { LossPreventionRadarView } from './components/LossPreventionRadarView';
import { AllBlMasterView } from './components/AllBlMasterView';
import { ManageMastersModal } from './components/ManageMastersModal';
import { 
  subscribeToShipments, 
  persistShipment, 
  removeShipment, 
  saveLocalShipments,
  pushCompanyVaultToCloud,
  getLocalSyncStatus,
  exportToJsonFile, 
  exportToCsvFile 
} from './services/storageService';
import { 
  subscribeToMasters, 
  persistMasters, 
  INITIAL_MASTERS 
} from './services/masterService';
import { 
  getCurrentSession, 
  setCurrentSession, 
  logout as authLogout 
} from './services/authService';
import { makeLive, stopSync, flushPending } from './sync/engine';
import { subscribeSyncStatus } from './sync/status';
import { calculateDetentionMetrics, calculateFleetRiskRadar } from './utils/detentionEngine';

export function App() {
  // Session State (Multi-Tenant Authentication)
  const [session, setSession] = useState(() => getCurrentSession());

  // Application Data State
  const [shipments, setShipments] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard | radar | portal
  const [syncStatus, setSyncStatus] = useState({ status: 'connected', metrics: { queueDepth: 0 } });

  // Master Data State
  const [masters, setMasters] = useState(INITIAL_MASTERS);
  const [isMastersModalOpen, setIsMastersModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLine, setSelectedLine] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [activePreset, setActivePreset] = useState('all');

  // Modals & Drawers State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [dossierShipment, setDossierShipment] = useState(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const activeCompanyId = session?.companyId || 'cha_al_mumtaz';

  // Initialize Bidirectional Sync Engine & Observable Status for active tenant
  useEffect(() => {
    if (!session || !session.isLoggedIn) return;

    // 1. Make tenant live (starts pusher & delta puller)
    makeLive(activeCompanyId, {
      name: session.companyName,
      ownerEmail: session.email || ''
    });

    // 2. Subscribe to observable sync state store
    const unsubStatus = subscribeSyncStatus((state) => {
      setSyncStatus(state);
    });

    // 3. Subscribe to shipments (local first + remote updates)
    const unsubShipments = subscribeToShipments(
      activeCompanyId,
      (data) => {
        setShipments(data);
      }
    );

    return () => {
      unsubStatus();
      if (typeof unsubShipments === 'function') unsubShipments();
      stopSync(activeCompanyId);
    };
  }, [session, activeCompanyId]);

  // Subscribe to offline-first cache + cloud vault for Masters
  useEffect(() => {
    if (!session || !session.isLoggedIn) return;

    const unsubscribe = subscribeToMasters(activeCompanyId, (data) => {
      setMasters(data);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [session, activeCompanyId]);

  // Compute fleet risk metrics
  const fleetMetrics = useMemo(() => {
    return calculateFleetRiskRadar(shipments);
  }, [shipments]);

  // Extract distinct shipping lines (combines existing shipments + master lines)
  const shippingLines = useMemo(() => {
    const set = new Set();
    (masters.shippingLines || []).forEach(l => set.add(l.name));
    shipments.forEach(s => {
      if (s.shippingLine) set.add(s.shippingLine);
    });
    return Array.from(set).sort();
  }, [shipments, masters]);

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      const metrics = calculateDetentionMetrics(shipment);

      // 1. Text Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const blMatch = shipment.blNo?.toLowerCase().includes(q);
        const consigneeMatch = shipment.consignee?.toLowerCase().includes(q);
        const shipperMatch = shipment.shipper?.toLowerCase().includes(q);
        const vesselMatch = shipment.vessel?.toLowerCase().includes(q);
        const podMatch = shipment.pod?.toLowerCase().includes(q);
        const hsMatch = shipment.hsCode?.toLowerCase().includes(q);
        const boeMatch = shipment.customsDeclarationNo?.toLowerCase().includes(q);
        const cargoMatch = shipment.cargoDescription?.toLowerCase().includes(q);
        const containerMatch = shipment.containers?.some(c => c.containerNo?.toLowerCase().includes(q));

        if (!blMatch && !consigneeMatch && !shipperMatch && !vesselMatch && !podMatch && !hsMatch && !boeMatch && !cargoMatch && !containerMatch) {
          return false;
        }
      }

      // 2. Shipping Line Filter
      if (selectedLine !== 'ALL' && shipment.shippingLine !== selectedLine) {
        return false;
      }

      // 3. Customs Status Filter
      if (selectedStatus !== 'ALL' && shipment.customsStatus !== selectedStatus) {
        return false;
      }

      // 4. Demurrage Risk Level Filter
      if (selectedRisk !== 'ALL' && metrics.overallRisk !== selectedRisk) {
        return false;
      }

      // 5. Preset Pill Filters
      if (activePreset === 'urgent') {
        if (metrics.overallRisk !== 'CRITICAL' && metrics.overallRisk !== 'OVERDUE') return false;
      } else if (activePreset === 'port-risk') {
        if (metrics.portDaysLeft === null || metrics.portDaysLeft > 3 || metrics.containersAtPort === 0) return false;
      } else if (activePreset === 'inspection') {
        if (shipment.customsStatus !== 'Under Inspection') return false;
      } else if (activePreset === 'unreturned') {
        if (metrics.unreturnedContainers === 0) return false;
      } else if (activePreset === 'deposit') {
        if (!shipment.doSecurityDeposit || shipment.doSecurityDeposit.status !== 'Deposited') return false;
      } else if (activePreset === 'completed') {
        if (shipment.customsStatus !== 'Empties Returned' && shipment.customsStatus !== 'Delivered') return false;
      } else if (activePreset === 'in-port') {
        if (metrics.containersAtPort === 0) return false;
      }

      return true;
    });
  }, [shipments, searchQuery, selectedLine, selectedStatus, selectedRisk, activePreset]);

  // Auth Handlers
  const handleLoginSuccess = (newSession) => {
    setCurrentSession(newSession);
    setSession(newSession);
  };

  const handleLogout = () => {
    try {
      stopSync(activeCompanyId);
    } catch {}
    authLogout();
    setSession(null);
  };

  // Manual Cloud Sync Trigger
  const handleManualSync = async () => {
    await pushCompanyVaultToCloud(activeCompanyId, shipments);
    setSyncStatus({ pending: false, lastSyncedAt: new Date().toISOString() });
  };

  // Handlers for shipments
  const handleOpenNewModal = () => {
    setEditingShipment(null);
    setIsModalOpen(true);
  };

  const checkActionPassword = (actionName = 'proceed with this operation') => {
    const pwd = window.prompt(`🔒 Security Verification:\nEnter authorization password to ${actionName}:`);
    if (pwd === 'abcd') {
      return true;
    }
    if (pwd !== null) {
      alert('❌ Access Denied: Incorrect password. You must enter "abcd" to proceed.');
    }
    return false;
  };

  const handleEditShipment = (shipment) => {
    if (!checkActionPassword('edit this Bill of Lading (BL) shipment')) return;
    setEditingShipment(shipment);
    setIsModalOpen(true);
  };

  const handleViewDossier = (shipment) => {
    setDossierShipment(shipment);
    setIsDossierOpen(true);
  };

  const handleSaveShipment = async (formData) => {
    const updated = await persistShipment(formData, shipments, activeCompanyId);
    setShipments(updated);
    setSyncStatus({ pending: true });
    if (dossierShipment && dossierShipment.id === formData.id) {
      setDossierShipment(formData);
    }
  };

  const handleDeleteShipment = async (id) => {
    if (!checkActionPassword('permanently delete this Bill of Lading (BL) shipment')) return;
    if (window.confirm('⚠️ Are you sure you want to delete this Bill of Lading shipment record? This action cannot be undone.')) {
      const updated = await removeShipment(id, shipments, activeCompanyId);
      setShipments(updated);
      setSyncStatus({ pending: true });
      if (dossierShipment && dossierShipment.id === id) {
        setIsDossierOpen(false);
      }
    }
  };

  const handleQuickUpdateStatus = async (shipment, newStatus) => {
    if (!checkActionPassword(`update customs status to "${newStatus}"`)) return;
    const updated = {
      ...shipment,
      customsStatus: newStatus,
      updatedAt: new Date().toISOString()
    };
    const newList = await persistShipment(updated, shipments, activeCompanyId);
    setShipments(newList);
    setSyncStatus({ pending: true });
    if (dossierShipment && dossierShipment.id === shipment.id) {
      setDossierShipment(updated);
    }
  };

  const handleQuickContainerReturn = async (shipment, containerId, actionType) => {
    if (!checkActionPassword('update container tracking status')) return;
    const today = new Date().toISOString().split('T')[0];
    const updatedContainers = (shipment.containers || []).map(c => {
      if (c.id === containerId) {
        if (actionType === 'gateOut') {
          return {
            ...c,
            gateOutDate: today,
            status: 'Gate Out (In Transit)'
          };
        } else if (actionType === 'emptyReturned') {
          return {
            ...c,
            emptyReturnDate: today,
            eirNumber: c.eirNumber || `EIR-${Math.floor(100000 + Math.random() * 900000)}`,
            status: 'Empty Returned (Safe)'
          };
        }
      }
      return c;
    });

    const allReturned = updatedContainers.every(c => !!c.emptyReturnDate);
    const updatedShipment = {
      ...shipment,
      containers: updatedContainers,
      customsStatus: allReturned ? 'Empties Returned' : shipment.customsStatus,
      updatedAt: new Date().toISOString()
    };

    const newList = await persistShipment(updatedShipment, shipments, activeCompanyId);
    setShipments(newList);
    setSyncStatus({ pending: true });
    if (dossierShipment && dossierShipment.id === shipment.id) {
      setDossierShipment(updatedShipment);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLine('ALL');
    setSelectedStatus('ALL');
    setSelectedRisk('ALL');
    setActivePreset('all');
  };

  const handleRestoreData = (newList) => {
    saveLocalShipments(newList, activeCompanyId);
    setShipments(newList);
    setSyncStatus({ pending: true });
  };

  const handleSaveMasters = async (newMasters) => {
    await persistMasters(newMasters, activeCompanyId);
    setMasters(newMasters);
  };

  // If user is not authenticated, render Login & Sign Up Portal
  if (!session || !session.isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* 1. Top Navbar with Hamburger Menu, CHA Company Badge, and Sync Status */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenNewModal={handleOpenNewModal}
        onExportJson={() => exportToJsonFile(shipments, session.companyName)}
        onExportCsv={() => exportToCsvFile(shipments, session.companyName)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenMastersModal={() => setIsMastersModalOpen(true)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onOpenDevModal={() => setIsDevModalOpen(true)}
        onLogout={handleLogout}
        onTriggerSync={handleManualSync}
        currentSession={session}
        syncStatus={syncStatus}
        totalShipments={shipments.length}
      />

      {/* 2. Loss Prevention Active Radar Banner */}
      <LossPreventionBanner
        fleetMetrics={fleetMetrics}
        onFilterUrgent={() => {
          setCurrentView('dashboard');
          setActivePreset('urgent');
        }}
      />

      {/* 3. Main Views */}
      <main className="flex-1 pb-16">
        {currentView === 'dashboard' && (
          <div className="app-container pt-4">
            {/* KPI Cards */}
            <KpiMetrics
              fleetMetrics={fleetMetrics}
              onPresetFilter={(preset) => setActivePreset(preset)}
            />

            {/* Filter & Universal Search Toolbar */}
            <FilterToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedLine={selectedLine}
              setSelectedLine={setSelectedLine}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              selectedRisk={selectedRisk}
              setSelectedRisk={setSelectedRisk}
              activePreset={activePreset}
              setActivePreset={setActivePreset}
              shippingLines={shippingLines}
              onResetFilters={handleResetFilters}
              shipments={shipments}
            />

            {/* High-Density Shipment Master-Detail Table */}
            <ShipmentTable
              shipments={filteredShipments}
              onViewDossier={handleViewDossier}
              onEditShipment={handleEditShipment}
              onDeleteShipment={handleDeleteShipment}
              onQuickUpdateStatus={handleQuickUpdateStatus}
              onQuickContainerReturn={handleQuickContainerReturn}
            />
          </div>
        )}

        {currentView === 'bl-master' && (
          <div className="app-container pt-4">
            <AllBlMasterView
              shipments={shipments}
              onViewDossier={handleViewDossier}
              onEditShipment={handleEditShipment}
              onAddNewShipment={() => {
                setEditingShipment(null);
                setIsModalOpen(true);
              }}
            />
          </div>
        )}

        {currentView === 'radar' && (
          <div className="app-container pt-6">
            <LossPreventionRadarView
              shipments={shipments}
              onViewDossier={handleViewDossier}
              onEditShipment={handleEditShipment}
            />
          </div>
        )}

        {currentView === 'portal' && (
          <CustomerPortal shipments={shipments} />
        )}
      </main>

      {/* Add / Edit Shipment Modal (Integrated with Live Masters) */}
      <ShipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shipmentToEdit={editingShipment}
        onSave={handleSaveShipment}
        masters={masters}
      />

      {/* Manage Masters Modal */}
      <ManageMastersModal
        isOpen={isMastersModalOpen}
        onClose={() => setIsMastersModalOpen(false)}
        masters={masters}
        onSaveMasters={handleSaveMasters}
      />

      {/* Assign Team Members Modal */}
      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        currentSession={session}
      />

      {/* Developer Super-Admin Console Modal */}
      <DeveloperConsoleModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
        currentSession={session}
        onSessionChange={(updatedSession) => {
          setSession(updatedSession);
          setCurrentSession(updatedSession);
        }}
      />

      {/* Deep-Dive Customs Dossier Drawer */}
      <DossierDrawer
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        shipment={dossierShipment}
        onEdit={handleEditShipment}
        onUpdateStatus={handleQuickUpdateStatus}
      />

      {/* Backup & Archival Modal */}
      <ExportImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        shipments={shipments}
        onRestoreData={handleRestoreData}
      />

    </div>
  );
}

export default App;
