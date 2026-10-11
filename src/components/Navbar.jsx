import React, { useState, useRef, useEffect } from 'react';
import { 
  Ship, 
  ShieldAlert, 
  Search, 
  PlusCircle, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Layers, 
  Globe,
  Menu,
  MoreVertical,
  Database,
  Building2,
  Users,
  LogOut,
  CloudCheck,
  CloudUpload,
  CheckCircle,
  HardDrive,
  RefreshCw,
  UserCheck,
  Terminal,
  Table
} from 'lucide-react';

export const Navbar = ({ 
  currentView, 
  setCurrentView, 
  onOpenNewModal, 
  onExportJson, 
  onExportCsv, 
  onOpenImportModal,
  onOpenMastersModal,
  onOpenTeamModal,
  onOpenDevModal,
  onLogout,
  onTriggerSync,
  currentSession,
  syncStatus = { pending: false },
  totalShipments
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualSyncClick = async () => {
    if (onTriggerSync) {
      setIsSyncing(true);
      try {
        await onTriggerSync();
      } finally {
        setTimeout(() => setIsSyncing(false), 800);
      }
    }
  };

  const companyName = currentSession?.companyName || 'AL MUMTAZ CUSTOMS CLEARING LLC';
  const displayName = currentSession?.displayName || currentSession?.username || 'Administrator';
  const role = currentSession?.role || 'CHA Administrator';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Left Section: 3-Dot Hamburger Menu & Brand Title */}
        <div className="brand-section">
          {/* Top Left Hamburger / 3-Dot Menu */}
          <div className="relative" ref={menuRef}>
            <button
              id="btn-hamburger-menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`}
              title="Open System Administration & Masters Menu"
              aria-label="System Administration & Masters Menu"
            >
              <Menu size={18} />
              <MoreVertical size={14} className="-ml-1" />
            </button>

            {/* Hamburger Dropdown Menu */}
            {isMenuOpen && (
              <div className="menu-dropdown-box" style={{ width: '280px' }}>
                <div className="menu-header-label">
                  Workspace Views
                </div>

                <button
                  id="btn-menu-dashboard"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setCurrentView('dashboard');
                  }}
                  className={`menu-item-action ${currentView === 'dashboard' ? 'menu-item-highlight' : ''}`}
                  style={currentView === 'dashboard' ? { background: 'linear-gradient(to right, rgba(56, 189, 248, 0.15), transparent)' } : {}}
                >
                  <div className="menu-icon-square" style={{ background: currentView === 'dashboard' ? '#0284c7' : '#1e293b', color: '#ffffff' }}>
                    <Layers size={17} />
                  </div>
                  <div>
                    <div className="menu-item-title" style={{ color: currentView === 'dashboard' ? '#38bdf8' : '#f8fafc' }}>Operations Tracking</div>
                    <div className="menu-item-sub">Active BL shipments & dossiers</div>
                  </div>
                </button>

                {/* All BL Consignments Master Directory */}
                <button
                  id="btn-menu-all-bl-master"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setCurrentView('bl-master');
                  }}
                  className={`menu-item-action ${currentView === 'bl-master' ? 'menu-item-highlight' : ''}`}
                  style={currentView === 'bl-master' ? { background: 'linear-gradient(to right, rgba(251, 191, 36, 0.18), transparent)' } : {}}
                >
                  <div className="menu-icon-square" style={{ background: currentView === 'bl-master' ? '#f59e0b' : '#1e293b', color: currentView === 'bl-master' ? '#000000' : '#fbbf24' }}>
                    <Table size={17} />
                  </div>
                  <div>
                    <div className="menu-item-title" style={{ color: currentView === 'bl-master' ? '#fbbf24' : '#f8fafc' }}>All BL Consignments Directory</div>
                    <div className="menu-item-sub">All active & cleared BL records in 1 list</div>
                  </div>
                </button>

                <button
                  id="btn-menu-loss-radar"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setCurrentView('radar');
                  }}
                  className={`menu-item-action ${currentView === 'radar' ? 'menu-item-highlight' : ''}`}
                  style={currentView === 'radar' ? { background: 'linear-gradient(to right, rgba(239, 68, 68, 0.15), transparent)' } : {}}
                >
                  <div className="menu-icon-square" style={{ background: currentView === 'radar' ? '#ef4444' : '#1e293b', color: '#ffffff' }}>
                    <ShieldAlert size={17} />
                  </div>
                  <div>
                    <div className="menu-item-title" style={{ color: currentView === 'radar' ? '#f87171' : '#f8fafc' }}>Loss Prevention Radar</div>
                    <div className="menu-item-sub">Demurrage & detention cutoffs</div>
                  </div>
                </button>

                <button
                  id="btn-menu-customer-portal"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setCurrentView('portal');
                  }}
                  className={`menu-item-action ${currentView === 'portal' ? 'menu-item-highlight' : ''}`}
                  style={currentView === 'portal' ? { background: 'linear-gradient(to right, rgba(14, 165, 233, 0.15), transparent)' } : {}}
                >
                  <div className="menu-icon-square" style={{ background: currentView === 'portal' ? '#0284c7' : '#1e293b', color: '#ffffff' }}>
                    <Search size={17} />
                  </div>
                  <div>
                    <div className="menu-item-title" style={{ color: currentView === 'portal' ? '#38bdf8' : '#f8fafc' }}>Public Tracking Portal</div>
                    <div className="menu-item-sub">Client self-service tracking</div>
                  </div>
                </button>

                <div className="menu-divider"></div>

                <div className="menu-header-label">
                  Administration & Configuration
                </div>

                {/* Developer Super-Admin Console */}
                {currentSession?.isDeveloper && (
                  <button
                    id="btn-menu-dev-console"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onOpenDevModal) onOpenDevModal();
                    }}
                    className="menu-item-action"
                    style={{ background: 'linear-gradient(to right, rgba(245, 158, 11, 0.16), transparent)' }}
                  >
                    <div className="menu-icon-square" style={{ background: '#f59e0b', color: '#000000' }}>
                      <Terminal size={17} />
                    </div>
                    <div>
                      <div className="menu-item-title" style={{ color: '#fbbf24' }}>Developer Powers</div>
                      <div className="menu-item-sub">Allow, revoke & delete firms globally</div>
                    </div>
                  </button>
                )}

                {/* 1. Assign Team Members */}
                <button
                  id="btn-menu-assign-team"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenTeamModal();
                  }}
                  className="menu-item-action menu-item-highlight"
                  style={{ background: 'linear-gradient(to right, rgba(56, 189, 248, 0.12), transparent)' }}
                >
                  <div className="menu-icon-square" style={{ background: '#0284c7', color: '#ffffff' }}>
                    <Users size={17} />
                  </div>
                  <div>
                    <div className="menu-item-title" style={{ color: '#0284c7' }}>Assign Team Members</div>
                    <div className="menu-item-sub">Add staff, roles, tel & login passwords</div>
                  </div>
                </button>

                {/* 2. Manage Masters */}
                <button
                  id="btn-menu-manage-masters"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenMastersModal();
                  }}
                  className="menu-item-action"
                >
                  <div className="menu-icon-square">
                    <Database size={17} />
                  </div>
                  <div>
                    <div className="menu-item-title">Manage Masters</div>
                    <div className="menu-item-sub">Shipping lines, Consignees, Ports, Cargo</div>
                  </div>
                </button>

                <div className="menu-divider"></div>

                <div className="menu-header-label">
                  Offline PC Storage & Archival
                </div>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onExportCsv();
                  }}
                  className="menu-item-action"
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center text-emerald-400 bg-emerald-500/10">
                    <FileSpreadsheet size={15} />
                  </div>
                  <span className="font-semibold text-xs">Export Spreadsheet (CSV)</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onExportJson();
                  }}
                  className="menu-item-action"
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center text-blue-400 bg-blue-500/10">
                    <Download size={15} />
                  </div>
                  <span className="font-semibold text-xs">Download PC Backup (JSON)</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenImportModal();
                  }}
                  className="menu-item-action"
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center text-amber-400 bg-amber-500/10">
                    <Upload size={15} />
                  </div>
                  <span className="font-semibold text-xs">Restore Database from File</span>
                </button>

                <div className="menu-divider"></div>

                {/* Sign Out Button */}
                <button
                  id="btn-menu-logout"
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="menu-item-action"
                  style={{ color: '#ef4444' }}
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center text-rose-400 bg-rose-500/10">
                    <LogOut size={15} />
                  </div>
                  <span className="font-semibold text-xs">Sign Out / Switch Account</span>
                </button>
              </div>
            )}
          </div>

          {/* Brand Icon */}
          <div className="brand-icon-box">
            <Ship size={24} strokeWidth={2.2} />
          </div>

          {/* Brand Title & CHA Company Prominent Banner */}
          <div className="brand-title-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0 }}>
                CustomsTrack <span style={{ color: '#38bdf8' }}>PRO</span>
              </h1>

              {/* Prominent Main CHA Company Badge */}
              <div 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(37, 99, 235, 0.35))',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  boxShadow: '0 2px 8px rgba(14, 165, 233, 0.2)'
                }}
                title={`Active Customs House Agent Account: ${companyName}`}
              >
                <Building2 size={13} color="#38bdf8" />
                <span>{companyName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Right Header Actions */}
        <div className="nav-actions">
          {/* Main Views Switcher */}
          <button
            id="tab-ops-dashboard"
            onClick={() => setCurrentView('dashboard')}
            className={`nav-tab-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          >
            <Layers size={16} />
            <span>Operations Tracking</span>
          </button>





          {/* Offline-First Bidirectional Sync Status Chip */}
          <div 
            onClick={handleManualSyncClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: syncStatus.status === 'error' ? 'rgba(239, 68, 68, 0.15)' 
                : (syncStatus.status === 'syncing' || isSyncing) ? 'rgba(56, 189, 248, 0.15)'
                : syncStatus.status === 'offline' ? 'rgba(245, 158, 11, 0.15)' 
                : 'rgba(16, 185, 129, 0.15)',
              border: syncStatus.status === 'error' ? '1px solid rgba(239, 68, 68, 0.35)' 
                : (syncStatus.status === 'syncing' || isSyncing) ? '1px solid rgba(56, 189, 248, 0.35)'
                : syncStatus.status === 'offline' ? '1px solid rgba(245, 158, 11, 0.35)' 
                : '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '20px',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: syncStatus.status === 'error' ? '#f87171' 
                : (syncStatus.status === 'syncing' || isSyncing) ? '#38bdf8' 
                : syncStatus.status === 'offline' ? '#fbbf24' 
                : '#34d399',
              cursor: 'pointer',
              userSelect: 'none'
            }}
            title={`Status: ${syncStatus.status || 'connected'} | Outbox Queue: ${syncStatus.metrics?.queueDepth || 0} | Pushed: ${syncStatus.metrics?.rowsPushed || 0} | Pulled: ${syncStatus.metrics?.rowsPulled || 0}. Click to trigger sync.`}
          >
            <HardDrive size={12} color="#38bdf8" />
            {(isSyncing || syncStatus.status === 'syncing') ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={11} className="animate-spin" /> Syncing...
              </span>
            ) : syncStatus.status === 'offline' ? (
              <span>Offline (Local-First Active)</span>
            ) : (syncStatus.metrics?.queueDepth > 0) ? (
              <span>{syncStatus.metrics.queueDepth} Queued (Syncing...)</span>
            ) : (
              <span>🟢 Live Synced (Local-First)</span>
            )}
          </div>

          {/* Logged In User Profile Chip & Logout */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '8px',
            borderLeft: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            {/* Developer Console Button */}
            {currentSession?.isDeveloper && (
              <button
                id="btn-nav-dev-console"
                onClick={onOpenDevModal}
                className="btn btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  border: 'none',
                  boxShadow: '0 2px 12px rgba(245, 158, 11, 0.4)',
                  padding: '5px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px'
                }}
                title="Developer Super-Admin Console"
              >
                <Terminal size={14} />
                <span>Dev Powers</span>
              </button>
            )}

            {/* Active User Info & Sign Out */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '4px 10px 4px 6px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: currentSession?.isDeveloper ? '#ef4444' : currentSession?.userType === 'admin' ? '#f59e0b' : '#0284c7',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {currentSession?.isDeveloper ? '⚡' : displayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>
                  {displayName}
                </span>
                <span style={{ fontSize: '0.625rem', color: currentSession?.isDeveloper ? '#fbbf24' : '#94a3b8' }}>
                  {role}
                </span>
              </div>
            </div>
          </div>

          {/* New Shipment BL CTA Button */}
          <button
            id="btn-add-shipment"
            onClick={onOpenNewModal}
            className="btn btn-primary btn-sm ml-1"
          >
            <PlusCircle size={16} />
            <span>New Shipment BL</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
