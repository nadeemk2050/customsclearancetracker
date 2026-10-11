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
  Settings
} from 'lucide-react';

export const Navbar = ({ 
  currentView, 
  setCurrentView, 
  onOpenNewModal, 
  onExportJson, 
  onExportCsv, 
  onOpenImportModal,
  onOpenMastersModal,
  totalShipments
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand Section with Top-Left 3-Dot Hamburger Menu */}
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
              <div className="menu-dropdown-box">
                <div className="menu-header-label">
                  System Administration
                </div>

                <button
                  id="btn-menu-manage-masters"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenMastersModal();
                  }}
                  className="menu-item-action menu-item-highlight"
                >
                  <div className="menu-icon-square">
                    <Database size={18} />
                  </div>
                  <div>
                    <div className="menu-item-title">Manage Masters</div>
                    <div className="menu-item-sub">Shipping lines, Consignees, Ports, Cargo</div>
                  </div>
                </button>

                <div className="menu-divider"></div>

                <div className="menu-header-label">
                  Data Archival & Tools
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
                  <span className="font-semibold text-xs">Download Backup (JSON)</span>
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
              </div>
            )}
          </div>

          <div className="brand-icon-box">
            <Ship size={24} strokeWidth={2.2} />
          </div>
          <div className="brand-title-wrap">
            <h1>
              CustomsTrack <span style={{ color: '#38bdf8' }}>PRO</span>
              <span className="brand-badge">CCT Suite</span>
            </h1>
            <div className="brand-subtitle flex items-center gap-2">
              <span>Enterprise Customs & Demurrage Shield</span>
              <span style={{ color: '#64748b' }}>•</span>
              <span className="inline-flex items-center gap-1 text-xs text-sky-300" title="Hosted independently on customsclearance-tracker.web.app">
                <Globe size={11} /> customsclearance-tracker.web.app
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="nav-actions">
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

          {/* Direct Manage Masters Button on Header */}
          <button
            id="btn-nav-manage-masters"
            onClick={onOpenMastersModal}
            className="btn btn-outline btn-sm text-sky-200 border-sky-400/30 hover:bg-sky-500/10 flex items-center gap-1.5"
            title="Manage Shipping Lines, Consignees, Shippers, Ports & Cargo"
          >
            <Database size={15} className="text-sky-400" />
            <span>Manage Masters</span>
          </button>

          {/* Data Tools */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <button
              onClick={onExportCsv}
              className="btn btn-outline btn-sm text-white border-white/20 hover:bg-white/10 hidden lg:inline-flex"
              title="Download Excel / CSV shipment report"
            >
              <FileSpreadsheet size={15} />
              <span>CSV</span>
            </button>

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
      </div>
    </nav>
  );
};
