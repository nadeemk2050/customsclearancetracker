import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { TeamManagementModal } from './components/TeamManagementModal';
import { DeveloperConsoleModal } from './components/DeveloperConsoleModal';
import { KpiMetrics } from './components/KpiMetrics';
import { FilterToolbar } from './components/FilterToolbar';
import { ShipmentTable } from './components/ShipmentTable';
import { ShipmentModal } from './components/ShipmentModal';
import { DossierDrawer } from './components/DossierDrawer';
import { CustomerPortal } from './components/CustomerPortal';
import { ExportImportModal } from './components/ExportImportModal';
import { StatusUpdateModal } from './components/StatusUpdateModal';
import { LossPreventionRadarView } from './components/LossPreventionRadarView';
import { AllBlMasterView } from './components/AllBlMasterView';
import { ManageMastersModal } from './components/ManageMastersModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WorkLaterView } from './components/WorkLaterView';
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
import { buildStatusLogEntry } from './utils/statusStages';
import { requestActionPassword } from './utils/securityGate';

export function App() {
  // Session State (Multi-Tenant Authentication)
  const [session, setSession] = useState(() => getCurrentSession());

  // Application Data State
  const [shipments, setShipments] = useState([]);
  // All BLs Consignments Tracking is the app's main landing page
  const [currentView, setCurrentView] = useState('bl-master'); // bl-master | dashboard | radar | portal
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
  // Pending status change waiting for the audit questionnaire
  const [statusPrompt, setStatusPrompt] = useState(null);

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
        const cctMatch = (shipment.cctRefNo || shipment.id)?.toLowerCase().includes(q);
        const blMatch = shipment.blNo?.toLowerCase().includes(q);
        const dealerMatch = shipment.dealerName?.toLowerCase().includes(q);
        const lotMatch = shipment.lotNo?.toLowerCase().includes(q);
        const consigneeMatch = shipment.consignee?.toLowerCase().includes(q);
        const shipperMatch = shipment.shipper?.toLowerCase().includes(q);
        const vesselMatch = shipment.vessel?.toLowerCase().includes(q);
        const podMatch = shipment.pod?.toLowerCase().includes(q);
        const hsMatch = shipment.hsCode?.toLowerCase().includes(q);
        const boeMatch = shipment.customsDeclarationNo?.toLowerCase().includes(q);
        const cargoMatch = shipment.cargoDescription?.toLowerCase().includes(q);
        const containerMatch = shipment.containers?.some(c => c.containerNo?.toLowerCase().includes(q));

        if (!cctMatch && !blMatch && !dealerMatch && !lotMatch && !consigneeMatch && !shipperMatch && !vesselMatch && !podMatch && !hsMatch && !boeMatch && !cargoMatch && !containerMatch) {
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

  const handleEditShipment = (shipment) => {
    setIsDossierOpen(false);
    setEditingShipment(shipment);
    setIsModalOpen(true);
  };

  const handleViewDossier = (shipment) => {
    setDossierShipment(shipment);
    setIsDossierOpen(true);
  };

  const handleSaveShipment = async (formData) => {
    const previous = shipments.find(s => s.id === formData.id);
    const statusChanged = !!previous && previous.customsStatus !== formData.customsStatus;

    // Hold the new status back until the audit questionnaire has been answered
    const payload = statusChanged ? { ...formData, customsStatus: previous.customsStatus } : formData;
    const updated = await persistShipment(payload, shipments, activeCompanyId);
    setShipments(updated);
    setSyncStatus({ pending: true });
    if (dossierShipment && dossierShipment.id === payload.id) {
      setDossierShipment(payload);
    }
    if (statusChanged) {
      setStatusPrompt({
        shipment: payload,
        newStatus: formData.customsStatus,
        containerId: null,
        actionType: null,
        containerNo: null,
        requestedAt: new Date().toISOString()
      });
    }
  };

  const handleDeleteShipment = async (id) => {
    if (!requestActionPassword('permanently delete this Bill of Lading (BL) shipment')) return;
    if (window.confirm('⚠️ Are you sure you want to delete this Bill of Lading shipment record? This action cannot be undone.')) {
      const updated = await removeShipment(id, shipments, activeCompanyId);
      setShipments(updated);
      setSyncStatus({ pending: true });
      if (dossierShipment && dossierShipment.id === id) {
        setIsDossierOpen(false);
      }
    }
  };

  // Every status change (table dropdown, fast-forward button, dossier stepper or edit
  // form) requires the "abcd" authorization password and then opens the stage
  // questionnaire so each update is stamped with time and user.
  const handleQuickUpdateStatus = (shipment, newStatus) => {
    if (!shipment || shipment.customsStatus === newStatus) return;
    if (!requestActionPassword(`update customs status to "${newStatus}"`)) return;
    setStatusPrompt({
      shipment,
      newStatus,
      containerId: null,
      actionType: null,
      containerNo: null,
      requestedAt: new Date().toISOString()
    });
  };

  const handleQuickContainerReturn = (shipment, containerId, actionType) => {
    const container = (shipment.containers || []).find(c => c.id === containerId);
    const stageLabel = actionType === 'gateOut' ? 'Port Gate-Out' : 'Empties Returned';
    if (!requestActionPassword(`update container status to "${stageLabel}"`)) return;
    setStatusPrompt({
      shipment,
      newStatus: actionType === 'gateOut' ? 'Gate Out' : 'Empties Returned',
      containerId,
      actionType,
      containerNo: container?.containerNo || '',
      requestedAt: new Date().toISOString()
    });
  };

  const handleConfirmStatusUpdate = async (answers) => {
    if (!statusPrompt) return;

    const { newStatus, containerId, actionType, containerNo } = statusPrompt;
    const current = shipments.find(s => s.id === statusPrompt.shipment.id) || statusPrompt.shipment;
    const logEntry = buildStatusLogEntry({ status: newStatus, answers, session, containerNo: containerNo || null });

    let updatedShipment = {
      ...current,
      updatedAt: logEntry.at,
      updatedBy: logEntry.by,
      statusHistory: [...(current.statusHistory || []), logEntry]
    };

    if (containerId && actionType) {
      const today = new Date().toISOString().split('T')[0];
      const updatedContainers = (current.containers || []).map(c => {
        if (c.id !== containerId) return c;
        if (actionType === 'gateOut') {
          return {
            ...c,
            gateOutDate: today,
            status: 'Gate Out (In Transit)'
          };
        }
        return {
          ...c,
          emptyReturnDate: today,
          eirNumber: c.eirNumber || `EIR-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'Empty Returned (Safe)'
        };
      });

      const allReturned = updatedContainers.every(c => !!c.emptyReturnDate);
      updatedShipment = {
        ...updatedShipment,
        containers: updatedContainers,
        customsStatus: allReturned ? 'Empties Returned' : current.customsStatus
      };
    } else {
      updatedShipment = { ...updatedShipment, customsStatus: newStatus };
    }

    const newList = await persistShipment(updatedShipment, shipments, activeCompanyId);
    setShipments(newList);
    setSyncStatus({ pending: true });
    if (dossierShipment && dossierShipment.id === updatedShipment.id) {
      setDossierShipment(updatedShipment);
    }
    setStatusPrompt(null);
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

      {/* 2. Main Views */}
      <main className={(currentView === 'bl-master' || currentView === 'work-later') ? 'flex-1 min-h-0 flex flex-col' : 'flex-1 pb-16'}>
        {currentView === 'work-later' && (
          <ErrorBoundary>
            <WorkLaterView
              shipments={shipments}
              filteredShipments={filteredShipments}
              fleetMetrics={fleetMetrics}
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
              onViewDossier={handleViewDossier}
              onEditShipment={handleEditShipment}
              onDeleteShipment={handleDeleteShipment}
              onQuickUpdateStatus={handleQuickUpdateStatus}
              onQuickContainerReturn={handleQuickContainerReturn}
              onBackToAbcTracker={() => setCurrentView('bl-master')}
            />
          </ErrorBoundary>
        )}

        {currentView === 'bl-master' && (
          <ErrorBoundary>
            <AllBlMasterView
              shipments={shipments}
              onViewDossier={handleViewDossier}
              onEditShipment={handleEditShipment}
            />
          </ErrorBoundary>
        )}

        {/* Fallbacks for any direct view navigation */}
        {currentView === 'dashboard' && (
          <ErrorBoundary>
            <WorkLaterView
              shipments={shipments}
              filteredShipments={filteredShipments}
              fleetMetrics={fleetMetrics}
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
              onViewDossier={handleViewDossier}
              onEditShipment={handleEditShipment}
              onDeleteShipment={handleDeleteShipment}
              onQuickUpdateStatus={handleQuickUpdateStatus}
              onQuickContainerReturn={handleQuickContainerReturn}
              onBackToAbcTracker={() => setCurrentView('bl-master')}
            />
          </ErrorBoundary>
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
        companyId={activeCompanyId}
        currentUser={session}
        existingShipments={shipments}
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
        companyName={session?.companyName || 'CustomsTrack PRO'}
      />

      {/* Backup & Archival Modal */}
      <ExportImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        shipments={shipments}
        onRestoreData={handleRestoreData}
      />

      {/* Status Change Questionnaire — always stamps time + user */}
      <StatusUpdateModal
        key={statusPrompt ? `${statusPrompt.shipment.id}-${statusPrompt.newStatus}-${statusPrompt.containerId || 'bl'}` : 'idle'}
        isOpen={!!statusPrompt}
        shipment={statusPrompt?.shipment}
        status={statusPrompt?.newStatus}
        containerNo={statusPrompt?.containerNo}
        currentUser={session}
        requestedAt={statusPrompt?.requestedAt}
        onClose={() => setStatusPrompt(null)}
        onConfirm={handleConfirmStatusUpdate}
      />

    </div>
  );
}

export default App;
