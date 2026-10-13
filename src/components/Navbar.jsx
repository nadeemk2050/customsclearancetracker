import React, { useState, useRef, useEffect } from 'react';
import { 
  Ship, 
  ShieldAlert, 
  Search, 
  PlusCircle, 
  Layers, 
  Globe,
  Menu,
  MoreVertical,
  Database,
  Building2,
  Users,
  LogOut,
  HardDrive,
  RefreshCw,
  Terminal,
  Table,
  Lock,
  KeyRound,
  X
} from 'lucide-react';
import { requestMaintenanceAccess } from '../utils/securityGate';
import {
  isViewLocked,
  getMaintenanceLabel,
  isViewUnlockedThisSession,
  unlockViewForSession
} from '../config/maintenanceMode';

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
  const [showWorkLaterModal, setShowWorkLaterModal] = useState(false);
  const [workLaterPassword, setWorkLaterPassword] = useState('');
  const [workLaterError, setWorkLaterError] = useState('');
  const menuRef = useRef(null);

  const handleWorkLaterClick = () => {
    setIsMenuOpen(false);
    const isUnlocked = sessionStorage.getItem('cct_work_later_unlocked') === 'true';
    if (isUnlocked) {
      setCurrentView('work-later');
      return;
    }
    setWorkLaterPassword('');
    setWorkLaterError('');
    setShowWorkLaterModal(true);
  };

  const handleWorkLaterSubmit = (e) => {
    if (e) e.preventDefault();
    if (workLaterPassword === 'abcd') {
      sessionStorage.setItem('cct_work_later_unlocked', 'true');
      setShowWorkLaterModal(false);
      setCurrentView('work-later');
    } else {
      setWorkLaterError('Incorrect password. Enter "abcd" to unlock.');
    }
  };

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

  // Views under maintenance stay hidden until the password is entered (once per session)
  const handleLockedView = (viewId) => {
    if (!isViewLocked(viewId) || isViewUnlockedThisSession(viewId)) return true;
    if (requestMaintenanceAccess(getMaintenanceLabel(viewId))) {
      unlockViewForSession(viewId);
      return true;
    }
    return false;
  };

  const companyName = currentSession?.companyName || 'AL MUMTAZ CUSTOMS CLEARING LLC';  const displayName = currentSession?.displayName || currentSession?.username || 'Administrator';
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

                {/* Work Later Sections (Encrypted with Password "abcd") */}
                <button
                  id="btn-menu-work-later"
                  onClick={handleWorkLaterClick}
                  className={`menu-item-action ${currentView === 'work-later' ? 'menu-item-highlight' : ''}`}
                  style={{
                    background: currentView === 'work-later'
                      ? 'linear-gradient(to right, rgba(99, 102, 241, 0.22), transparent)'
                      : 'linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent)'
                  }}
                >
                  <div className="menu-icon-square" style={{ background: '#4f46e5', color: '#ffffff' }}>
                    <Lock size={17} />
                  </div>
                  <div>
                    <div className="menu-item-title" style={{ color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Work Later Sections</span>
                      <span style={{ fontSize: '0.6rem', background: '#312e81', color: '#c7d2fe', padding: '1px 5px', borderRadius: '4px', border: '1px solid #4338ca', fontWeight: 800 }}>
                        PASSWORD
                      </span>
                    </div>
                    <div className="menu-item-sub">Operations, Radar & Public Portal</div>
                  </div>
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
                className="nav-company-chip"
                title={`Active Customs House Agent Account: ${companyName}`}
              >
                <Building2 size={13} color="#38bdf8" />
                <span className="nav-company-name">{companyName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Right Header Actions */}
        <div className="nav-actions">
          {/* View Indicator (Operations Tracking is now locked inside Work Later Sections) */}
          {currentView === 'work-later' && (
            <button
              id="tab-work-later-active"
              onClick={() => setCurrentView('bl-master')}
              className="nav-tab-btn active"
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.45)',
                color: '#c7d2fe'
              }}
              title="Work Later Sections active. Click to return to ABC Tracking Directory."
            >
              <Lock size={14} />
              <span>Work Later (Active)</span>
            </button>
          )}





          {/* Offline-First Bidirectional Sync Status Chip */}
          <div 
            onClick={handleManualSyncClick}
            className="nav-sync-chip"
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
              <span className="nav-sync-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={11} className="animate-spin" /> Syncing...
              </span>
            ) : syncStatus.status === 'offline' ? (
              <span className="nav-sync-text">Offline (Local-First Active)</span>
            ) : (syncStatus.metrics?.queueDepth > 0) ? (
              <span className="nav-sync-text">{syncStatus.metrics.queueDepth} Queued (Syncing...)</span>
            ) : (
              <span className="nav-sync-text">🟢 Live Synced (Local-First)</span>
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
            <div 
              className="nav-user-chip"
              style={{
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
              <div className="nav-user-text" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
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
            className="btn btn-primary btn-sm ml-1 nav-cta"
          >
            <PlusCircle size={16} />
            <span className="nav-cta-full">New Shipment BL</span>
            <span className="nav-cta-short">New BL</span>
          </button>
        </div>
      </div>

      {/* Password Modal for Work Later Sections (Password: "abcd") */}
      {showWorkLaterModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowWorkLaterModal(false)}
        >
          <div 
            style={{
              background: '#0b1329',
              border: '1px solid #312e81',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '380px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              color: '#ffffff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Lock size={18} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>Work Later Sections</h3>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Encrypted Workspace Protection</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowWorkLaterModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              This section contains <strong>Operations Tracking</strong>, <strong>Loss Prevention Radar</strong>, and <strong>Public Portal</strong>. Enter authorization password to proceed:
            </p>

            <form onSubmit={handleWorkLaterSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
                  <input
                    type="password"
                    autoFocus
                    value={workLaterPassword}
                    onChange={(e) => {
                      setWorkLaterPassword(e.target.value);
                      setWorkLaterError('');
                    }}
                    placeholder="Enter password..."
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      background: '#070c18',
                      border: workLaterError ? '1px solid #ef4444' : '1px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
                {workLaterError && (
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>
                    {workLaterError}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowWorkLaterModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#15203b',
                    border: '1px solid #334155',
                    color: '#cbd5e1',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  Unlock & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};
