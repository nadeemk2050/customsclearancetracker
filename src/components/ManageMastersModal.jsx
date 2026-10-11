import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Search, 
  Ship, 
  Building2, 
  Truck, 
  Anchor, 
  Box, 
  Warehouse,
  CheckCircle,
  Database
} from 'lucide-react';
import { requestActionPassword } from '../utils/securityGate';

const TABS = [
  { key: 'shippingLines', label: 'Shipping Lines', icon: Ship },
  { key: 'consignees', label: 'Consignees (Importers)', icon: Building2 },
  { key: 'shippers', label: 'Shippers (Exporters)', icon: Truck },
  { key: 'ports', label: 'Ports (POL & POD)', icon: Anchor },
  { key: 'cargoDescriptions', label: 'Cargo & HS Codes', icon: Box },
  { key: 'depots', label: 'Empty Return Depots', icon: Warehouse }
];

export const ManageMastersModal = ({ 
  isOpen, 
  onClose, 
  masters = {}, 
  onSaveMasters 
}) => {
  const [activeTab, setActiveTab] = useState('shippingLines');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const showStatus = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleAddNew = () => {
    let blankItem = { id: 'item_' + Date.now() };
    if (activeTab === 'shippingLines') {
      blankItem = { ...blankItem, name: '', scac: '', defaultPortFreeDays: 5, defaultLineFreeDays: 14, defaultDetentionRate: 80, contactEmail: '', phone: '' };
    } else if (activeTab === 'consignees') {
      blankItem = { ...blankItem, name: '', address: '', trn: '', contactPerson: '', phone: '', email: '', destinationYard: '' };
    } else if (activeTab === 'shippers') {
      blankItem = { ...blankItem, name: '', country: '', address: '', contactPerson: '', phone: '', email: '' };
    } else if (activeTab === 'ports') {
      blankItem = { ...blankItem, name: '', code: '', country: '', terminal: '', defaultPortFreeDays: 5, defaultPortDailyRate: 45 };
    } else if (activeTab === 'cargoDescriptions') {
      blankItem = { ...blankItem, description: '', defaultHsCode: '', defaultDutyPercent: 5, defaultPackaging: '' };
    } else if (activeTab === 'depots') {
      blankItem = { ...blankItem, name: '', shippingLine: '', location: '', workingHours: '' };
    }
    setEditItem(blankItem);
    setIsEditing(true);
  };

  const handleEdit = (item) => {
    setEditItem({ ...item });
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    if (!requestActionPassword('delete this master record')) return;
    if (window.confirm('Are you sure you want to delete this master record?')) {
      const currentList = masters[activeTab] || [];
      const updatedList = currentList.filter(item => item.id !== id);
      const updatedMasters = { ...masters, [activeTab]: updatedList };
      onSaveMasters(updatedMasters);
      showStatus('Master record deleted successfully.');
    }
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    const currentList = masters[activeTab] || [];
    const exists = currentList.some(item => item.id === editItem.id);
    let updatedList;
    if (exists) {
      updatedList = currentList.map(item => item.id === editItem.id ? editItem : item);
      showStatus('Master record updated successfully.');
    } else {
      updatedList = [...currentList, editItem];
      showStatus('New master record added successfully.');
    }
    const updatedMasters = { ...masters, [activeTab]: updatedList };
    onSaveMasters(updatedMasters);
    setIsEditing(false);
    setEditItem(null);
  };

  const list = (masters[activeTab] || []).filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return Object.values(item).some(val => 
      typeof val === 'string' && val.toLowerCase().includes(q)
    );
  });

  return (
    <div className="modal-overlay">
      <div className="modal-box masters-modal-box">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}>
              <Database size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Master Data Management
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0' }}>
                Pre-configure Shipping Lines, Consignees, Ports, and Cargo for instant, error-free auto-completion.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-only text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Polished Tab Bar */}
        <div className="masters-nav-bar">
          {TABS.map(({ key, label, icon: Icon }) => {
            const count = (masters[key] || []).length;
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveTab(key);
                  setIsEditing(false);
                  setSearchQuery('');
                }}
                className={`masters-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={15} style={{ color: isActive ? '#2563eb' : '#64748b' }} />
                <span>{label}</span>
                <span className="masters-tab-badge">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '1.5rem' }}>
          {statusMessage && (
            <div style={{
              padding: '10px 14px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '1rem'
            }}>
              <CheckCircle size={16} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Subheader Toolbar */}
          {!isEditing && (
            <div className="masters-toolbar">
              <div className="masters-search-wrap">
                <Search size={15} />
                <input
                  type="text"
                  className="masters-search-input"
                  placeholder="Search master records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                onClick={handleAddNew}
                className="btn btn-primary btn-sm"
              >
                <Plus size={15} />
                <span>Add New {TABS.find(t => t.key === activeTab)?.label.split(' ')[0]}</span>
              </button>
            </div>
          )}

          {/* EDIT / CREATE FORM */}
          {isEditing && editItem && (
            <form onSubmit={handleSaveItem} className="masters-form-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {editItem.name || editItem.description ? 'Edit Master Record' : 'Create New Master Record'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
              </div>

              {/* Form Fields by Tab */}
              {activeTab === 'shippingLines' && (
                <div className="masters-form-grid">
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Shipping Line Name *
                    </label>
                    <input
                      required
                      type="text"
                      className="form-control"
                      value={editItem.name || ''}
                      onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                      placeholder="e.g. Hapag-Lloyd"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Carrier Code / SCAC
                    </label>
                    <input
                      type="text"
                      className="form-control uppercase font-mono"
                      value={editItem.scac || ''}
                      onChange={(e) => setEditItem({ ...editItem, scac: e.target.value.toUpperCase() })}
                      placeholder="e.g. HLCU"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Default Port Free Storage Days
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={editItem.defaultPortFreeDays ?? 5}
                      onChange={(e) => setEditItem({ ...editItem, defaultPortFreeDays: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Default Line Demurrage Free Days
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={editItem.defaultLineFreeDays ?? 14}
                      onChange={(e) => setEditItem({ ...editItem, defaultLineFreeDays: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Default Daily Detention Rate ($/day)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={editItem.defaultDetentionRate ?? 80}
                      onChange={(e) => setEditItem({ ...editItem, defaultDetentionRate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Customer Service Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={editItem.contactEmail || ''}
                      onChange={(e) => setEditItem({ ...editItem, contactEmail: e.target.value })}
                      placeholder="imports@hapag-lloyd.com"
                    />
                  </div>
                  <div className="form-full">
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Customer Service Phone
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.phone || ''}
                      onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })}
                      placeholder="+971 4 397 8888"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'consignees' && (
                <div className="masters-form-grid">
                  <div className="form-full">
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Consignee (Importer) Company Name *
                    </label>
                    <input
                      required
                      type="text"
                      className="form-control font-bold"
                      value={editItem.name || ''}
                      onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                      placeholder="e.g. MUMTAZ PLASTIC RECYCLING LLC"
                    />
                  </div>
                  <div className="form-full">
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Official Registered Address
                    </label>
                    <textarea
                      rows={2}
                      className="form-control"
                      value={editItem.address || ''}
                      onChange={(e) => setEditItem({ ...editItem, address: e.target.value })}
                      placeholder="Plot, Street, Area, City, Country"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Tax / VAT / TRN / Registration #
                    </label>
                    <input
                      type="text"
                      className="form-control font-mono"
                      value={editItem.trn || ''}
                      onChange={(e) => setEditItem({ ...editItem, trn: e.target.value })}
                      placeholder="TRN 100294829100003"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Default Destination Yard / Warehouse
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.destinationYard || ''}
                      onChange={(e) => setEditItem({ ...editItem, destinationYard: e.target.value })}
                      placeholder="Dubai Industrial City Yard, Warehouse 4"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Contact Person
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.contactPerson || ''}
                      onChange={(e) => setEditItem({ ...editItem, contactPerson: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Contact Phone / Mobile
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.phone || ''}
                      onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'shippers' && (
                <div className="masters-form-grid">
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Shipper (Exporter) Company Name *
                    </label>
                    <input
                      required
                      type="text"
                      className="form-control font-bold"
                      value={editItem.name || ''}
                      onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                      placeholder="e.g. POLYMER GLOBAL GMBH"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Country of Origin
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.country || ''}
                      onChange={(e) => setEditItem({ ...editItem, country: e.target.value })}
                      placeholder="e.g. Germany"
                    />
                  </div>
                  <div className="form-full">
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Address
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.address || ''}
                      onChange={(e) => setEditItem({ ...editItem, address: e.target.value })}
                      placeholder="Street, City, Postal Code"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Contact Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={editItem.email || ''}
                      onChange={(e) => setEditItem({ ...editItem, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.phone || ''}
                      onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'ports' && (
                <div className="masters-form-grid">
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Port Name *
                    </label>
                    <input
                      required
                      type="text"
                      className="form-control font-bold"
                      value={editItem.name || ''}
                      onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                      placeholder="e.g. Jebel Ali Port (AEJEA)"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Port UN/LOCODE
                    </label>
                    <input
                      type="text"
                      className="form-control font-mono uppercase"
                      value={editItem.code || ''}
                      onChange={(e) => setEditItem({ ...editItem, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. AEJEA"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Country
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.country || ''}
                      onChange={(e) => setEditItem({ ...editItem, country: e.target.value })}
                      placeholder="UAE"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Terminal Operator
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.terminal || ''}
                      onChange={(e) => setEditItem({ ...editItem, terminal: e.target.value })}
                      placeholder="DP World Terminal 1 / 2"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Default Port Free Days
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={editItem.defaultPortFreeDays ?? 5}
                      onChange={(e) => setEditItem({ ...editItem, defaultPortFreeDays: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Default Port Daily Storage Rate ($)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={editItem.defaultPortDailyRate ?? 45}
                      onChange={(e) => setEditItem({ ...editItem, defaultPortDailyRate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'cargoDescriptions' && (
                <div className="masters-form-grid">
                  <div className="form-full">
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Cargo Description *
                    </label>
                    <input
                      required
                      type="text"
                      className="form-control font-bold"
                      value={editItem.description || ''}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      placeholder="e.g. POST INDUSTRIAL RECYCLED POLYPROPYLENE GRANULES"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Default HS Tariff Code
                    </label>
                    <input
                      type="text"
                      className="form-control font-mono"
                      value={editItem.defaultHsCode || ''}
                      onChange={(e) => setEditItem({ ...editItem, defaultHsCode: e.target.value })}
                      placeholder="e.g. 3902.10.00"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Standard Customs Duty (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      value={editItem.defaultDutyPercent ?? 5}
                      onChange={(e) => setEditItem({ ...editItem, defaultDutyPercent: e.target.value })}
                      placeholder="5"
                    />
                  </div>
                  <div className="form-full">
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Default Packaging Type
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.defaultPackaging || ''}
                      onChange={(e) => setEditItem({ ...editItem, defaultPackaging: e.target.value })}
                      placeholder="e.g. Bags / 24 Pallets"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'depots' && (
                <div className="masters-form-grid">
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Container Return Depot Name *
                    </label>
                    <input
                      required
                      type="text"
                      className="form-control font-bold"
                      value={editItem.name || ''}
                      onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                      placeholder="e.g. Hapag-Lloyd Inland Depot 4"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Associated Shipping Line
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.shippingLine || ''}
                      onChange={(e) => setEditItem({ ...editItem, shippingLine: e.target.value })}
                      placeholder="Hapag-Lloyd"
                    />
                  </div>
                  <div className="form-full">
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Depot Location / Address
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.location || ''}
                      onChange={(e) => setEditItem({ ...editItem, location: e.target.value })}
                      placeholder="Dubai Industrial City, Yard 4"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                      Working / Gate Hours
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.workingHours || ''}
                      onChange={(e) => setEditItem({ ...editItem, workingHours: e.target.value })}
                      placeholder="08:00 - 20:00"
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  <Save size={14} />
                  <span>Save Master Record</span>
                </button>
              </div>
            </form>
          )}

          {/* MASTER RECORDS TABLE */}
          {!isEditing && (
            <div className="masters-table-wrap">
              <table className="masters-table">
                <thead>
                  <tr>
                    <th>Name / Description</th>
                    {activeTab === 'shippingLines' && (
                      <>
                        <th>SCAC Code</th>
                        <th>Port Free</th>
                        <th>Line Free</th>
                        <th>Detention Rate</th>
                      </>
                    )}
                    {activeTab === 'consignees' && (
                      <>
                        <th>TRN / Tax #</th>
                        <th>Address</th>
                        <th>Phone</th>
                      </>
                    )}
                    {activeTab === 'shippers' && (
                      <>
                        <th>Country</th>
                        <th>Address</th>
                        <th>Contact</th>
                      </>
                    )}
                    {activeTab === 'ports' && (
                      <>
                        <th>UN/LOCODE</th>
                        <th>Country</th>
                        <th>Terminal</th>
                        <th>Free Storage</th>
                      </>
                    )}
                    {activeTab === 'cargoDescriptions' && (
                      <>
                        <th>HS Tariff Code</th>
                        <th>Duty Rate</th>
                        <th>Packaging</th>
                      </>
                    )}
                    {activeTab === 'depots' && (
                      <>
                        <th>Line</th>
                        <th>Location</th>
                        <th>Gate Hours</th>
                      </>
                    )}
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                        No records found matching "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    list.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong style={{ color: '#0f172a', fontWeight: 700 }}>
                            {item.name || item.description}
                          </strong>
                        </td>

                        {activeTab === 'shippingLines' && (
                          <>
                            <td>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#1d4ed8' }}>
                                {item.scac || '—'}
                              </span>
                            </td>
                            <td>{item.defaultPortFreeDays} Days</td>
                            <td>{item.defaultLineFreeDays} Days</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                              ${item.defaultDetentionRate} / day
                            </td>
                          </>
                        )}

                        {activeTab === 'consignees' && (
                          <>
                            <td style={{ fontFamily: 'var(--font-mono)', color: '#475569' }}>
                              {item.trn || '—'}
                            </td>
                            <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={item.address}>
                              {item.address || '—'}
                            </td>
                            <td style={{ color: '#475569' }}>{item.phone || '—'}</td>
                          </>
                        )}

                        {activeTab === 'shippers' && (
                          <>
                            <td style={{ fontWeight: 600, color: '#334155' }}>{item.country || '—'}</td>
                            <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={item.address}>
                              {item.address || '—'}
                            </td>
                            <td style={{ color: '#475569' }}>{item.contactPerson || item.email || '—'}</td>
                          </>
                        )}

                        {activeTab === 'ports' && (
                          <>
                            <td>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0284c7' }}>
                                {item.code || '—'}
                              </span>
                            </td>
                            <td>{item.country || '—'}</td>
                            <td style={{ color: '#64748b' }}>{item.terminal || '—'}</td>
                            <td>{item.defaultPortFreeDays} Days (${item.defaultPortDailyRate}/day)</td>
                          </>
                        )}

                        {activeTab === 'cargoDescriptions' && (
                          <>
                            <td>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#1d4ed8' }}>
                                {item.defaultHsCode || '—'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{item.defaultDutyPercent}%</td>
                            <td style={{ color: '#64748b' }}>{item.defaultPackaging || '—'}</td>
                          </>
                        )}

                        {activeTab === 'depots' && (
                          <>
                            <td style={{ fontWeight: 700, color: '#1e3a8a' }}>{item.shippingLine || '—'}</td>
                            <td style={{ color: '#334155' }}>{item.location || '—'}</td>
                            <td style={{ color: '#64748b' }}>{item.workingHours || '—'}</td>
                          </>
                        )}

                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => handleEdit(item)}
                            className="masters-action-btn edit"
                            title="Edit Master Record"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="masters-action-btn delete"
                            title="Delete Master Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-outline">
            Close Masters
          </button>
        </div>
      </div>
    </div>
  );
};
