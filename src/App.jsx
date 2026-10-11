import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { LossPreventionBanner } from './components/LossPreventionBanner';
import { KpiMetrics } from './components/KpiMetrics';
import { FilterToolbar } from './components/FilterToolbar';
import { ShipmentTable } from './components/ShipmentTable';
import { ShipmentModal } from './components/ShipmentModal';
import { DossierDrawer } from './components/DossierDrawer';
import { CustomerPortal } from './components/CustomerPortal';
import { ExportImportModal } from './components/ExportImportModal';
import { LossPreventionRadarView } from './components/LossPreventionRadarView';
import { ManageMastersModal } from './components/ManageMastersModal';
import { 
  subscribeToShipments, 
  persistShipment, 
  removeShipment, 
  saveLocalShipments,
  exportToJsonFile, 
  exportToCsvFile 
} from './services/storageService';
import { 
  subscribeToMasters, 
  persistMasters, 
  INITIAL_MASTERS 
} from './services/masterService';
import { calculateDetentionMetrics, calculateFleetRiskRadar } from './utils/detentionEngine';

export function App() {
  // Application Data State
  const [shipments, setShipments] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard | radar | portal

  // Master Data State
  const [masters, setMasters] = useState(INITIAL_MASTERS);
  const [isMastersModalOpen, setIsMastersModalOpen] = useState(false);

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

  // Subscribe to live Firestore + local cache for Shipments
  useEffect(() => {
    const unsubscribe = subscribeToShipments(
      (data) => {
        setShipments(data);
      },
      (error) => {
        console.warn('Sync notice:', error);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Subscribe to live Firestore + local cache for Masters
  useEffect(() => {
    const unsubscribe = subscribeToMasters((data) => {
      setMasters(data);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

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

  // Handlers
  const handleOpenNewModal = () => {
    setEditingShipment(null);
    setIsModalOpen(true);
  };

  const handleEditShipment = (shipment) => {
    setEditingShipment(shipment);
    setIsModalOpen(true);
  };

  const handleViewDossier = (shipment) => {
    setDossierShipment(shipment);
    setIsDossierOpen(true);
  };

  const handleSaveShipment = async (formData) => {
    const updated = await persistShipment(formData, shipments);
    setShipments(updated);
    if (dossierShipment && dossierShipment.id === formData.id) {
      setDossierShipment(formData);
    }
  };

  const handleDeleteShipment = async (id) => {
    if (window.confirm('Are you sure you want to delete this Bill of Lading shipment record? This action cannot be undone.')) {
      const updated = await removeShipment(id, shipments);
      setShipments(updated);
      if (dossierShipment && dossierShipment.id === id) {
        setIsDossierOpen(false);
      }
    }
  };

  const handleQuickUpdateStatus = async (shipment, newStatus) => {
    const updated = {
      ...shipment,
      customsStatus: newStatus,
      updatedAt: new Date().toISOString()
    };
    const newList = await persistShipment(updated, shipments);
    setShipments(newList);
    if (dossierShipment && dossierShipment.id === shipment.id) {
      setDossierShipment(updated);
    }
  };

  const handleQuickContainerReturn = async (shipment, containerId, actionType) => {
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

    const newList = await persistShipment(updatedShipment, shipments);
    setShipments(newList);
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
    saveLocalShipments(newList);
    setShipments(newList);
  };

  const handleSaveMasters = async (newMasters) => {
    await persistMasters(newMasters);
    setMasters(newMasters);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* 1. Top Navbar with Hamburger Menu & Manage Masters */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenNewModal={handleOpenNewModal}
        onExportJson={() => exportToJsonFile(shipments)}
        onExportCsv={() => exportToCsvFile(shipments)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenMastersModal={() => setIsMastersModalOpen(true)}
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="app-container flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 CustomsTrack Pro (CCT). Professional Customs Clearing & Demurrage Shield Suite.</p>
          <p className="text-slate-400 font-mono">
            Firebase Project: <span className="text-slate-600 font-bold">proformatracker</span> • Hosting Site: <span className="text-sky-600 font-bold">customsclearance-tracker</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
