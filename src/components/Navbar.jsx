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
  UserCheck
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
                  Administration & Configuration
                </div>

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
                  onClick={() => {
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

            <div className="brand-subtitle flex items-center gap-2" style={{ marginTop: '2px' }}>
              <span>Enterprise Customs & Demurrage Shield</span>
              <span style={{ color: '#64748b' }}>•</span>
              <span className="inline-flex items-center gap-1 text-xs text-sky-300">
                <Globe size={11} /> customsclearance-tracker.web.app
              </span>
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
            <span>Operations Command</span>
          </button>

          <button
            id="tab-loss-radar"
            onClick={() => setCurrentView('radar')}
            className={`nav-tab-btn ${currentView === 'radar' ? 'active' : ''}`}
          >
            <ShieldAlert size={16} />
            <span>Loss Prevention Radar</span>
          </button>

          <button
            id="tab-customer-portal"
            onClick={() => setCurrentView('portal')}
            className={`nav-tab-btn ${currentView === 'portal' ? 'active' : ''}`}
          >
            <Search size={16} />
            <span>Public Tracking Portal</span>
          </button>

          {/* Quick Assign Team Button on Header */}
          <button
            id="btn-nav-assign-team"
            onClick={onOpenTeamModal}
            className="btn btn-outline btn-sm text-sky-200 border-sky-400/30 hover:bg-sky-500/10 flex items-center gap-1.5"
            title="Assign and manage team members, roles & passwords"
          >
            <Users size={15} className="text-sky-400" />
            <span>Assign Team</span>
          </button>

          {/* Direct Manage Masters Button on Header */}
          <button
            id="btn-nav-manage-masters"
            onClick={onOpenMastersModal}
            className="btn btn-outline btn-sm text-slate-300 border-slate-600/50 hover:bg-white/10 hidden md:inline-flex items-center gap-1.5"
            title="Manage Shipping Lines, Consignees, Shippers, Ports & Cargo"
          >
            <Database size={15} className="text-slate-400" />
            <span>Masters</span>
          </button>

          {/* Offline-First Cloud Sync Status Chip */}
          <div 
            onClick={handleManualSyncClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: syncStatus.pending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: syncStatus.pending ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '20px',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: syncStatus.pending ? '#fbbf24' : '#34d399',
              cursor: 'pointer',
              userSelect: 'none'
            }}
            title={syncStatus.pending ? 'Local PC Saved • Click to push cloud sync now' : 'Local PC Saved & Cloud Synced. Click to force sync.'}
          >
            <HardDrive size={12} color="#38bdf8" />
            {isSyncing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={11} className="animate-spin" /> Syncing...
              </span>
            ) : syncStatus.pending ? (
              <span>Local Saved (Pending Sync)</span>
            ) : (
              <span>Offline-First (Safe & Synced)</span>
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
                background: currentSession?.userType === 'admin' ? '#f59e0b' : '#0284c7',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>
                  {displayName}
                </span>
                <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>
                  {role}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="btn btn-outline btn-sm text-slate-300 hover:text-rose-400 hover:border-rose-400/40 p-1.5"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
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
