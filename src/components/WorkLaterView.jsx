import React, { useState } from 'react';
import { 
  Lock, 
  Layers, 
  ShieldAlert, 
  Globe, 
  ArrowLeft
} from 'lucide-react';
import { KpiMetrics } from './KpiMetrics';
import { FilterToolbar } from './FilterToolbar';
import { ShipmentTable } from './ShipmentTable';
import { LossPreventionRadarView } from './LossPreventionRadarView';
import { CustomerPortal } from './CustomerPortal';

export const WorkLaterView = ({
  shipments = [],
  filteredShipments = [],
  fleetMetrics,
  searchQuery,
  setSearchQuery,
  selectedLine,
  setSelectedLine,
  selectedStatus,
  setSelectedStatus,
  selectedRisk,
  setSelectedRisk,
  activePreset,
  setActivePreset,
  shippingLines,
  onResetFilters,
  onViewDossier,
  onEditShipment,
  onDeleteShipment,
  onQuickUpdateStatus,
  onQuickContainerReturn,
  onBackToAbcTracker
}) => {
  // Tabs: 'operations' | 'radar' | 'portal'
  const [activeTab, setActiveTab] = useState('operations');

  const tabs = [
    {
      id: 'operations',
      label: '1. Operations Tracking',
      shortLabel: 'Operations',
      icon: Layers,
      color: '#38bdf8',
      desc: 'Active shipments, demurrage timelines & dossiers'
    },
    {
      id: 'radar',
      label: '2. Loss Prevention Radar',
      shortLabel: 'Loss Radar',
      icon: ShieldAlert,
      color: '#ef4444',
      desc: 'Demurrage risk watchdog & daily penalty burn'
    },
    {
      id: 'portal',
      label: '3. Public Tracking Portal',
      shortLabel: 'Public Portal',
      icon: Globe,
      color: '#10b981',
      desc: 'External client live BL self-service tracker'
    }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      background: '#070c18',
      color: '#f8fafc'
    }}>
      {/* Top Banner & Tab Navigation Bar */}
      <div style={{
        background: '#0b1329',
        borderBottom: '1px solid #1e293b',
        padding: '12px 18px',
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Title & Lock Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)'
            }}>
              <Lock size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#f8fafc'
                }}>
                  Work Later Sections
                </h1>
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#a5b4fc',
                  letterSpacing: '0.04em'
                }}>
                  ENCRYPTED AREA
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                Protected workspace sections reserved for specialized tracking workflows
              </p>
            </div>
          </div>

          {/* Return to ABC Tracker Button */}
          <button
            onClick={onBackToAbcTracker}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#15203b',
              border: '1px solid #334155',
              color: '#fbbf24',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 120ms'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1e293b';
              e.currentTarget.style.borderColor = '#fbbf24';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#15203b';
              e.currentTarget.style.borderColor = '#334155';
            }}
            title="Return to ABC Tracking directory"
          >
            <ArrowLeft size={14} />
            <span>Back to ABC Tracking</span>
          </button>
        </div>

        {/* 3 Dedicated Section Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '12px',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: isActive ? `1px solid ${tab.color}` : '1px solid #1e293b',
                  background: isActive ? `${tab.color}18` : '#070c18',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} color={isActive ? tab.color : '#64748b'} />
                <span>{tab.label}</span>
                {isActive && (
                  <span style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: tab.color
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {/* Tab 1: Operations Tracking */}
        {activeTab === 'operations' && (
          <div className="app-container pt-4 pb-16">
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
              onResetFilters={onResetFilters}
              shipments={shipments}
            />

            {/* High-Density Shipment Master-Detail Table */}
            <ShipmentTable
              shipments={filteredShipments}
              onViewDossier={onViewDossier}
              onEditShipment={onEditShipment}
              onDeleteShipment={onDeleteShipment}
              onQuickUpdateStatus={onQuickUpdateStatus}
              onQuickContainerReturn={onQuickContainerReturn}
            />
          </div>
        )}

        {/* Tab 2: Loss Prevention Radar */}
        {activeTab === 'radar' && (
          <div className="app-container pt-6 pb-16">
            <LossPreventionRadarView
              shipments={shipments}
              onViewDossier={onViewDossier}
              onEditShipment={onEditShipment}
            />
          </div>
        )}

        {/* Tab 3: Public Tracking Portal */}
        {activeTab === 'portal' && (
          <div style={{ paddingBottom: '3rem' }}>
            <CustomerPortal shipments={shipments} />
          </div>
        )}
      </div>
    </div>
  );
};
export default WorkLaterView;
