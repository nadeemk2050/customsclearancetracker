import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Box, 
  Save, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Ship, 
  FileCheck2, 
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  Coins
} from 'lucide-react';
import { addDays, formatDate, formatCurrency } from '../utils/dateUtils';
import { BlAttachmentUpload } from './BlAttachmentUpload';
import { BL_ATTACHMENT_SLOTS } from '../services/attachmentService';

const DEFAULT_CONTAINER = {
  id: '',
  containerNo: '',
  sizeType: '40HC',
  sealNo: '',
  dischargeDate: '',
  gateOutDate: '',
  deliveryDate: '',
  emptyReturnDepot: '',
  emptyReturnDate: '',
  eirNumber: '',
  status: 'At Port (Full)'
};

const DEFAULT_SHIPMENT = {
  blNo: '',
  shippingLine: 'Hapag-Lloyd',
  vessel: '',
  voyage: '',
  pol: '',
  pod: 'Jebel Ali Port (AEJEA)',
  finalDestination: '',
  consignee: '',
  shipper: '',
  cargoDescription: '',
  totalPackages: '',
  grossWeightKg: '',
  volumeCbm: '',
  customsDeclarationNo: '',
  customsDeclarationDate: '',
  hsCode: '',
  customsDutyAmount: '',
  customsVatAmount: '',
  customsStatus: 'Pre-Arrival',
  inspectionType: 'None',
  doValidityDate: '',
  doSecurityDeposit: {
    amount: '',
    currency: 'USD',
    status: 'Deposited',
    receiptNo: ''
  },
  eta: '',
  ata: '',
  dischargeDate: '',
  portFreeDays: 5,
  lineFreeDays: 14,
  portStorageDailyRate: 50,
  lineDetentionDailyRate: 85,
  notes: '',
  documents: {
    commercialInvoice: false,
    packingList: false,
    originalBL: false,
    certificateOfOrigin: false,
    formEFTA: false,
    deliveryOrder: false,
    customsDeclaration: false,
    dutyPaymentReceipt: false,
    portGatePass: false,
    emptyReturnEIR: false
  },
  blDocuments: {
    blDraft: null,
    originalBL: null
  },
  containers: [{ ...DEFAULT_CONTAINER, id: 'c_' + Date.now() }]
};

const TABS = [
  { id: 'general', step: '1', label: 'Logistics & Routing', icon: Ship },
  { id: 'freetime', step: '2', label: 'Demurrage & Free Time', icon: ShieldAlert },
  { id: 'customs', step: '3', label: 'Customs & DO', icon: DollarSign },
  { id: 'containers', step: '4', label: 'Containers', icon: Box },
  { id: 'documents', step: '5', label: 'Document Checklist', icon: FileCheck2 }
];

export const ShipmentModal = ({ 
  isOpen, 
  onClose, 
  shipmentToEdit, 
  onSave,
  masters = {},
  companyId = 'default',
  currentUser = null
}) => {
  const [formData, setFormData] = useState(DEFAULT_SHIPMENT);
  const [activeTab, setActiveTab] = useState('general');
  const [error, setError] = useState('');

  const shippingLinesList = masters.shippingLines || [];
  const consigneesList = masters.consignees || [];
  const shippersList = masters.shippers || [];
  const portsList = masters.ports || [];
  const cargoList = masters.cargoDescriptions || [];
  const depotsList = masters.depots || [];

  useEffect(() => {
    if (shipmentToEdit) {
      setFormData({
        ...DEFAULT_SHIPMENT,
        ...shipmentToEdit,
        doSecurityDeposit: {
          ...DEFAULT_SHIPMENT.doSecurityDeposit,
          ...(shipmentToEdit.doSecurityDeposit || {})
        },
        documents: {
          ...DEFAULT_SHIPMENT.documents,
          ...(shipmentToEdit.documents || {})
        },
        blDocuments: {
          ...DEFAULT_SHIPMENT.blDocuments,
          ...(shipmentToEdit.blDocuments || {})
        },
        containers: shipmentToEdit.containers && shipmentToEdit.containers.length > 0
          ? shipmentToEdit.containers
          : [{ ...DEFAULT_CONTAINER, id: 'c_' + Date.now() }]
      });
    } else {
      setFormData({
        ...DEFAULT_SHIPMENT,
        // Stable id up front so BL attachments can be stored before the first save
        id: 'CCT-' + Date.now(),
        containers: [{ ...DEFAULT_CONTAINER, id: 'c_' + Date.now() }]
      });
    }
    setError('');
  }, [shipmentToEdit, isOpen]);

  if (!isOpen) return null;

  const currentTabIndex = TABS.findIndex(t => t.id === activeTab);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Master auto-fill when selecting carrier
  const handleShippingLineSelect = (lineName) => {
    const matched = shippingLinesList.find(l => l.name === lineName);
    setFormData(prev => ({
      ...prev,
      shippingLine: lineName,
      portFreeDays: matched?.defaultPortFreeDays ?? prev.portFreeDays,
      lineFreeDays: matched?.defaultLineFreeDays ?? prev.lineFreeDays,
      lineDetentionDailyRate: matched?.defaultDetentionRate ?? prev.lineDetentionDailyRate
    }));
  };

  // Master auto-fill when selecting consignee
  const handleConsigneeSelect = (consigneeName) => {
    const matched = consigneesList.find(c => c.name.toLowerCase() === consigneeName.toLowerCase());
    setFormData(prev => ({
      ...prev,
      consignee: consigneeName,
      finalDestination: matched?.destinationYard || matched?.address || prev.finalDestination
    }));
  };

  // Master auto-fill when selecting POD
  const handlePodSelect = (podName) => {
    const matched = portsList.find(p => p.name.toLowerCase() === podName.toLowerCase());
    setFormData(prev => ({
      ...prev,
      pod: podName,
      portFreeDays: matched?.defaultPortFreeDays ?? prev.portFreeDays,
      portStorageDailyRate: matched?.defaultPortDailyRate ?? prev.portStorageDailyRate
    }));
  };

  // Master auto-fill when selecting cargo
  const handleCargoSelect = (cargoDesc) => {
    const matched = cargoList.find(c => c.description.toLowerCase() === cargoDesc.toLowerCase());
    setFormData(prev => ({
      ...prev,
      cargoDescription: cargoDesc,
      hsCode: matched?.defaultHsCode || prev.hsCode,
      totalPackages: matched?.defaultPackaging || prev.totalPackages
    }));
  };

  const handleDepositChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      doSecurityDeposit: {
        ...prev.doSecurityDeposit,
        [field]: value
      }
    }));
  };

  const handleDocumentToggle = (docKey) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docKey]: !prev.documents[docKey]
      }
    }));
  };

  const handleBlAttachmentChange = (slotKey, attachment) => {
    setFormData(prev => ({
      ...prev,
      blDocuments: {
        ...(prev.blDocuments || {}),
        [slotKey]: attachment
      }
    }));
  };

  const handleContainerChange = (index, field, value) => {
    const updated = [...formData.containers];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, containers: updated }));
  };

  const addContainerRow = () => {
    setFormData(prev => ({
      ...prev,
      containers: [
        ...prev.containers,
        { 
          ...DEFAULT_CONTAINER, 
          id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          dischargeDate: prev.dischargeDate || '',
          emptyReturnDepot: depotsList[0]?.name || ''
        }
      ]
    }));
  };

  const removeContainerRow = (index) => {
    if (formData.containers.length <= 1) {
      alert('A shipment must contain at least one container.');
      return;
    }
    const updated = formData.containers.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, containers: updated }));
  };

  const handleNextTab = () => {
    if (currentTabIndex < TABS.length - 1) {
      setActiveTab(TABS[currentTabIndex + 1].id);
    }
  };

  const handlePrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(TABS[currentTabIndex - 1].id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.blNo.trim()) {
      setError('Bill of Lading (BL) Number is required.');
      setActiveTab('general');
      return;
    }

    const hasEmptyContainerNo = formData.containers.some(c => !c.containerNo.trim());
    if (hasEmptyContainerNo) {
      setError('All containers must have a valid Container Number.');
      setActiveTab('containers');
      return;
    }

    onSave(formData);
    onClose();
  };

  // Live calculations
  const portExpiryPreview = formData.dischargeDate ? addDays(formData.dischargeDate, formData.portFreeDays) : '—';
  const lineExpiryPreview = formData.dischargeDate ? addDays(formData.dischargeDate, formData.lineFreeDays) : '—';
  const verifiedDocCount = Object.values(formData.documents || {}).filter(Boolean).length;

  return (
    <div className="modal-overlay">
      <div className="shipment-modal-container">
        {/* Header */}
        <div className="dossier-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}>
              <Ship size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
                  {shipmentToEdit ? `Edit BLs Consignment — ${shipmentToEdit.blNo}` : 'Add New BL Consignment Details'}
                </h2>
                <span className="brand-badge">Full Suite</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '3px 0 0' }}>
                End-to-end logistics tracking, automated demurrage loss prevention, and multi-container equipment manifest.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-only text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Segmented Pill Tab Bar */}
        <div className="dossier-tab-strip">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const labelText = tab.id === 'containers' 
              ? `Containers (${formData.containers.length})` 
              : tab.id === 'documents'
              ? `Documents (${verifiedDocCount}/10)`
              : tab.label;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`dossier-tab-item ${isActive ? 'active' : ''}`}
              >
                <span className="dossier-step-circle">{tab.step}</span>
                <Icon size={14} style={{ color: isActive ? '#2563eb' : '#64748b' }} />
                <span>{labelText}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="dossier-body-scroll">
          {error && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: '10px',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Datalists for Masters Autocomplete */}
          <datalist id="master-consignees-list">
            {consigneesList.map(c => (
              <option key={c.id} value={c.name}>{c.destinationYard || c.address}</option>
            ))}
          </datalist>

          <datalist id="master-shippers-list">
            {shippersList.map(s => (
              <option key={s.id} value={s.name}>{s.country}</option>
            ))}
          </datalist>

          <datalist id="master-ports-list">
            {portsList.map(p => (
              <option key={p.id} value={p.name}>{p.country} ({p.code})</option>
            ))}
          </datalist>

          <datalist id="master-cargo-list">
            {cargoList.map(crg => (
              <option key={crg.id} value={crg.description}>HS: {crg.defaultHsCode}</option>
            ))}
          </datalist>

          <datalist id="master-depots-list">
            {depotsList.map(d => (
              <option key={d.id} value={d.name}>{d.shippingLine} — {d.location}</option>
            ))}
          </datalist>

          {/* TAB 1: LOGISTICS & ROUTING */}
          {activeTab === 'general' && (
            <div>
              {/* Card 1: Ocean Freight Identification */}
              <div className="dossier-group-card">
                <div className="dossier-group-title">
                  <Ship size={16} color="#2563eb" />
                  <span>1. Ocean Freight & Carrier Identification</span>
                </div>
                <div className="dossier-grid-2">
                  <div>
                    <label className="dossier-field-label">
                      <span>Bill of Lading (BL) Number *</span>
                      <span className="dossier-helper-tag">Master or House BL</span>
                    </label>
                    <input
                      required
                      type="text"
                      className="dossier-input-control mono"
                      style={{ textTransform: 'uppercase', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.05em' }}
                      placeholder="e.g. HLCUTOR260620111"
                      value={formData.blNo}
                      onChange={(e) => handleInputChange('blNo', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">
                      <span>Shipping Line / Carrier *</span>
                      <span className="dossier-helper-tag">
                        <Sparkles size={11} /> Auto-loads free days & tariff rates
                      </span>
                    </label>
                    <select
                      className="dossier-input-control"
                      style={{ fontWeight: 700 }}
                      value={formData.shippingLine}
                      onChange={(e) => handleShippingLineSelect(e.target.value)}
                    >
                      {shippingLinesList.map(l => (
                        <option key={l.id} value={l.name}>
                          {l.name} {l.scac ? `(${l.scac})` : ''}
                        </option>
                      ))}
                      <option value="Other Line / NVOCC">Other Line / NVOCC</option>
                    </select>
                  </div>

                  <div>
                    <label className="dossier-field-label">Vessel Name</label>
                    <input
                      type="text"
                      className="dossier-input-control"
                      placeholder="e.g. AL ZUBARA"
                      value={formData.vessel}
                      onChange={(e) => handleInputChange('vessel', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">Voyage Number</label>
                    <input
                      type="text"
                      className="dossier-input-control mono"
                      placeholder="e.g. 2604E"
                      value={formData.voyage}
                      onChange={(e) => handleInputChange('voyage', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Ports & Inland Routing */}
              <div className="dossier-group-card">
                <div className="dossier-group-title">
                  <MapPin size={16} color="#0891b2" />
                  <span>2. Routing & Inland Delivery Destination</span>
                </div>
                <div className="dossier-grid-2">
                  <div>
                    <label className="dossier-field-label">Port of Loading (POL)</label>
                    <input
                      type="text"
                      list="master-ports-list"
                      className="dossier-input-control"
                      placeholder="e.g. Hamburg Port (DEHAM)"
                      value={formData.pol}
                      onChange={(e) => handleInputChange('pol', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">
                      <span>Port of Discharge (POD) *</span>
                      <span className="dossier-helper-tag">
                        <Sparkles size={11} /> Auto-sets terminal storage days
                      </span>
                    </label>
                    <input
                      required
                      type="text"
                      list="master-ports-list"
                      className="dossier-input-control"
                      style={{ fontWeight: 700 }}
                      placeholder="e.g. Jebel Ali Port (AEJEA)"
                      value={formData.pod}
                      onChange={(e) => handlePodSelect(e.target.value)}
                    />
                  </div>

                  <div className="dossier-grid-full">
                    <label className="dossier-field-label">
                      <span>Final Inland Delivery Destination / Consignee Yard</span>
                      <span className="dossier-helper-tag">Warehouse address</span>
                    </label>
                    <input
                      type="text"
                      className="dossier-input-control"
                      placeholder="e.g. Dubai Industrial City Yard, Warehouse 4"
                      value={formData.finalDestination}
                      onChange={(e) => handleInputChange('finalDestination', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Commercial Parties */}
              <div className="dossier-group-card">
                <div className="dossier-group-title">
                  <Building2 size={16} color="#059669" />
                  <span>3. Commercial Parties (Consignee & Shipper)</span>
                </div>
                <div className="dossier-grid-2">
                  <div>
                    <label className="dossier-field-label">
                      <span>Consignee (Importer) *</span>
                      <span className="dossier-helper-tag">
                        <Sparkles size={11} /> Auto-fills yard address
                      </span>
                    </label>
                    <input
                      required
                      type="text"
                      list="master-consignees-list"
                      className="dossier-input-control"
                      style={{ fontWeight: 700 }}
                      placeholder="Select Master Consignee or type..."
                      value={formData.consignee}
                      onChange={(e) => handleConsigneeSelect(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">Shipper (Exporter / Supplier)</label>
                    <input
                      type="text"
                      list="master-shippers-list"
                      className="dossier-input-control"
                      placeholder="Select Master Shipper or type..."
                      value={formData.shipper}
                      onChange={(e) => handleInputChange('shipper', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Cargo Specifications */}
              <div className="dossier-group-card">
                <div className="dossier-group-title">
                  <Box size={16} color="#7c3aed" />
                  <span>4. Cargo Specifications</span>
                </div>
                <div className="dossier-grid-2">
                  <div className="dossier-grid-full">
                    <label className="dossier-field-label">
                      <span>Cargo Description</span>
                      <span className="dossier-helper-tag">
                        <Sparkles size={11} /> Auto-fills HS code & packaging
                      </span>
                    </label>
                    <input
                      type="text"
                      list="master-cargo-list"
                      className="dossier-input-control"
                      placeholder="Select from Master Cargo or type custom description..."
                      value={formData.cargoDescription}
                      onChange={(e) => handleCargoSelect(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">Packaging & Total Packages</label>
                    <input
                      type="text"
                      className="dossier-input-control"
                      placeholder="e.g. 960 Bags / 24 Pallets"
                      value={formData.totalPackages}
                      onChange={(e) => handleInputChange('totalPackages', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">Gross Weight (KG)</label>
                    <input
                      type="number"
                      className="dossier-input-control"
                      placeholder="e.g. 52140"
                      value={formData.grossWeightKg}
                      onChange={(e) => handleInputChange('grossWeightKg', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEMURRAGE & FREE TIME RULES */}
          {activeTab === 'freetime' && (
            <div>
              {/* Visual Radar Calculation Box */}
              <div className="freetime-radar-preview">
                <div className="freetime-stat-box">
                  <span>Discharge Date (Day 0)</span>
                  <strong>{formatDate(formData.dischargeDate)}</strong>
                  <small>Clocks start ticking upon vessel discharge</small>
                </div>
                <div className="freetime-stat-box">
                  <span>Port Storage Expiry ({formData.portFreeDays || 5} Free Days)</span>
                  <strong style={{ color: '#b45309' }}>{formatDate(portExpiryPreview)}</strong>
                  <small>Terminal penalty: ${formData.portStorageDailyRate || 45}/box/day</small>
                </div>
                <div className="freetime-stat-box">
                  <span>Empty Return Cutoff ({formData.lineFreeDays || 14} Free Days)</span>
                  <strong style={{ color: '#047857' }}>{formatDate(lineExpiryPreview)}</strong>
                  <small>Line detention: ${formData.lineDetentionDailyRate || 80}/box/day</small>
                </div>
              </div>

              <div className="dossier-group-card">
                <div className="dossier-group-title">
                  <Calendar size={16} color="#2563eb" />
                  <span>Vessel Milestones & Delivery Order Expiry</span>
                </div>
                <div className="dossier-grid-2">
                  <div>
                    <label className="dossier-field-label">Estimated Time of Arrival (ETA)</label>
                    <input
                      type="date"
                      className="dossier-input-control"
                      value={formData.eta}
                      onChange={(e) => handleInputChange('eta', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">Actual Time of Arrival (ATA)</label>
                    <input
                      type="date"
                      className="dossier-input-control"
                      value={formData.ata}
                      onChange={(e) => handleInputChange('ata', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">
                      <span>Vessel Discharge Date (Clock Start Day 0) *</span>
                      <span className="dossier-helper-tag">Crucial milestone</span>
                    </label>
                    <input
                      required
                      type="date"
                      className="dossier-input-control font-bold"
                      value={formData.dischargeDate}
                      onChange={(e) => handleInputChange('dischargeDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">
                      <span>Delivery Order (DO) Validity Expiry Date</span>
                      <span className="dossier-helper-tag">Watch for expiry</span>
                    </label>
                    <input
                      type="date"
                      className="dossier-input-control"
                      value={formData.doValidityDate}
                      onChange={(e) => handleInputChange('doValidityDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="dossier-group-card">
                <div className="dossier-group-title">
                  <ShieldAlert size={16} color="#d97706" />
                  <span>Tariff Rules & Daily Penalty Slabs</span>
                </div>
                <div className="dossier-grid-2">
                  <div>
                    <label className="dossier-field-label">Port Terminal Free Storage Days</label>
                    <input
                      type="number"
                      className="dossier-input-control"
                      value={formData.portFreeDays}
                      onChange={(e) => handleInputChange('portFreeDays', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">Daily Port Storage Rate ($/box/day)</label>
                    <input
                      type="number"
                      className="dossier-input-control"
                      value={formData.portStorageDailyRate}
                      onChange={(e) => handleInputChange('portStorageDailyRate', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">Shipping Line Demurrage & Detention Free Days</label>
                    <input
                      type="number"
                      className="dossier-input-control"
                      value={formData.lineFreeDays}
                      onChange={(e) => handleInputChange('lineFreeDays', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">Daily Line Detention Rate ($/box/day)</label>
                    <input
                      type="number"
                      className="dossier-input-control"
                      value={formData.lineDetentionDailyRate}
                      onChange={(e) => handleInputChange('lineDetentionDailyRate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMS & DELIVERY ORDER */}
          {activeTab === 'customs' && (
            <div>
              <div className="dossier-group-card">
                <div className="dossier-group-title">
                  <DollarSign size={16} color="#2563eb" />
                  <span>Customs Declaration Assessment & Channel Routing</span>
                </div>
                <div className="dossier-grid-2">
                  <div>
                    <label className="dossier-field-label">Current Customs Clearance Milestone</label>
                    <select
                      className="dossier-input-control font-bold"
                      value={formData.customsStatus}
                      onChange={(e) => handleInputChange('customsStatus', e.target.value)}
                    >
                      <option value="Pre-Arrival">Pre-Arrival</option>
                      <option value="DO Taken">DO Taken / Issued</option>
                      <option value="Declaration Filed">Customs Declaration Filed</option>
                      <option value="Under Inspection">Under Inspection / Lab Test</option>
                      <option value="Duty Paid">Duty Paid</option>
                      <option value="Customs Cleared">Customs Cleared (OOC)</option>
                      <option value="Gate Out">Gate Out / Dispatched</option>
                      <option value="Delivered">Delivered at Consignee</option>
                      <option value="Empties Returned">Empties Returned (Closed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="dossier-field-label">Inspection / Regulatory Channel</label>
                    <select
                      className="dossier-input-control"
                      value={formData.inspectionType}
                      onChange={(e) => handleInputChange('inspectionType', e.target.value)}
                    >
                      <option value="None">None (Standard)</option>
                      <option value="Green Channel (Direct Release)">Green Channel (Direct Document Release)</option>
                      <option value="Yellow (Assessment / Document Audit)">Yellow Channel (Documentary Audit)</option>
                      <option value="Red (Physical & Customs Lab Sampling)">Red Channel (Physical Exam & Scanner)</option>
                      <option value="Ministry / Food / Health Approval">Special Agency (Food / Health / Municipality)</option>
                    </select>
                  </div>

                  <div>
                    <label className="dossier-field-label">Customs Declaration (Bill of Entry) Number</label>
                    <input
                      type="text"
                      className="dossier-input-control mono"
                      placeholder="e.g. DXB-CUST-883921"
                      value={formData.customsDeclarationNo}
                      onChange={(e) => handleInputChange('customsDeclarationNo', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">Declaration Filing Date</label>
                    <input
                      type="date"
                      className="dossier-input-control"
                      value={formData.customsDeclarationDate}
                      onChange={(e) => handleInputChange('customsDeclarationDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">Harmonized Tariff (HS) Code</label>
                    <input
                      type="text"
                      className="dossier-input-control mono font-bold"
                      placeholder="e.g. 3902.10.00"
                      value={formData.hsCode}
                      onChange={(e) => handleInputChange('hsCode', e.target.value)}
                    />
                  </div>

                  <div className="dossier-grid-2">
                    <div>
                      <label className="dossier-field-label">Customs Duty ($)</label>
                      <input
                        type="number"
                        className="dossier-input-control"
                        placeholder="e.g. 2607"
                        value={formData.customsDutyAmount}
                        onChange={(e) => handleInputChange('customsDutyAmount', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="dossier-field-label">VAT / Tax ($)</label>
                      <input
                        type="number"
                        className="dossier-input-control"
                        placeholder="e.g. 2737"
                        value={formData.customsVatAmount}
                        onChange={(e) => handleInputChange('customsVatAmount', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Line Security Deposit Guarantee */}
              <div className="dossier-group-card">
                <div className="dossier-group-title">
                  <Coins size={16} color="#059669" />
                  <span>Shipping Line Container Security Deposit Tracking</span>
                </div>
                <div className="dossier-grid-3">
                  <div>
                    <label className="dossier-field-label">Security Deposit Amount ($)</label>
                    <input
                      type="number"
                      className="dossier-input-control"
                      placeholder="e.g. 2000"
                      value={formData.doSecurityDeposit.amount}
                      onChange={(e) => handleDepositChange('amount', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="dossier-field-label">Deposit Refund Status</label>
                    <select
                      className="dossier-input-control font-bold"
                      value={formData.doSecurityDeposit.status}
                      onChange={(e) => handleDepositChange('status', e.target.value)}
                    >
                      <option value="None">None Required</option>
                      <option value="Deposited">Deposited (Awaiting Empty Return)</option>
                      <option value="Claimed">Refund Claim Submitted</option>
                      <option value="Refunded">Refund Received</option>
                    </select>
                  </div>

                  <div>
                    <label className="dossier-field-label">Guarantee / Receipt Ref #</label>
                    <input
                      type="text"
                      className="dossier-input-control mono"
                      placeholder="e.g. HL-DEP-99410"
                      value={formData.doSecurityDeposit.receiptNo}
                      onChange={(e) => handleDepositChange('receiptNo', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Operational Remarks */}
              <div className="dossier-group-card">
                <label className="dossier-field-label">Operational Notes & Clearing Instructions</label>
                <textarea
                  rows={2}
                  className="dossier-input-control"
                  placeholder="Inspector instructions, sampling laboratory remarks, truck token slots..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB 4: CONTAINERS REPEATER */}
          {activeTab === 'containers' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Container Equipment Manifest ({formData.containers.length} Units)
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0' }}>
                    Track individual container discharge, gate-out, delivery, and depot EIR return dates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addContainerRow}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} />
                  <span>Add Container Box</span>
                </button>
              </div>

              {formData.containers.map((cont, index) => (
                <div key={cont.id || index} className="container-repeater-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="brand-badge" style={{ background: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' }}>
                        Unit #{index + 1}
                      </span>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#0f172a' }}>
                        {cont.containerNo || 'Pending Container #'}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeContainerRow(index)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="Delete Container Unit"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="dossier-grid-4">
                    <div>
                      <label className="dossier-field-label">Container Number *</label>
                      <input
                        required
                        type="text"
                        className="dossier-input-control mono font-bold uppercase"
                        placeholder="e.g. FSCU8083274"
                        value={cont.containerNo}
                        onChange={(e) => handleContainerChange(index, 'containerNo', e.target.value.toUpperCase())}
                      />
                    </div>

                    <div>
                      <label className="dossier-field-label">Size / ISO Type</label>
                      <select
                        className="dossier-input-control font-semibold"
                        value={cont.sizeType}
                        onChange={(e) => handleContainerChange(index, 'sizeType', e.target.value)}
                      >
                        <option value="20GP">20' General Purpose</option>
                        <option value="40GP">40' General Purpose</option>
                        <option value="40HC">40' High Cube</option>
                        <option value="45HC">45' High Cube</option>
                        <option value="20RF">20' Reefer</option>
                        <option value="40RF">40' Reefer</option>
                        <option value="20OT">20' Open Top</option>
                        <option value="40OT">40' Open Top</option>
                        <option value="40FR">40' Flat Rack</option>
                      </select>
                    </div>

                    <div>
                      <label className="dossier-field-label">Seal Number</label>
                      <input
                        type="text"
                        className="dossier-input-control mono"
                        placeholder="e.g. HL773192"
                        value={cont.sealNo}
                        onChange={(e) => handleContainerChange(index, 'sealNo', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="dossier-field-label">Current Unit Status</label>
                      <select
                        className="dossier-input-control font-bold"
                        value={cont.status}
                        onChange={(e) => handleContainerChange(index, 'status', e.target.value)}
                      >
                        <option value="At Port (Full)">At Port (Full)</option>
                        <option value="Gate Out (In Transit)">Gate Out (In Transit)</option>
                        <option value="At Consignee (Unloading)">At Consignee (Unloading)</option>
                        <option value="Empty Returned (Safe)">Empty Returned (Safe)</option>
                      </select>
                    </div>

                    <div>
                      <label className="dossier-field-label">Port Gate-Out Date</label>
                      <input
                        type="date"
                        className="dossier-input-control"
                        value={cont.gateOutDate}
                        onChange={(e) => handleContainerChange(index, 'gateOutDate', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="dossier-field-label">Empty Return Depot</label>
                      <input
                        type="text"
                        list="master-depots-list"
                        className="dossier-input-control"
                        placeholder="Select Master Depot or type..."
                        value={cont.emptyReturnDepot}
                        onChange={(e) => handleContainerChange(index, 'emptyReturnDepot', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="dossier-field-label">Empty Return Date</label>
                      <input
                        type="date"
                        className="dossier-input-control font-bold"
                        style={{ color: '#047857' }}
                        value={cont.emptyReturnDate}
                        onChange={(e) => handleContainerChange(index, 'emptyReturnDate', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="dossier-field-label">EIR Receipt #</label>
                      <input
                        type="text"
                        className="dossier-input-control mono font-bold"
                        placeholder="e.g. EIR-881923"
                        value={cont.eirNumber}
                        onChange={(e) => handleContainerChange(index, 'eirNumber', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: DOCUMENT AUDIT CHECKLIST */}
          {activeTab === 'documents' && (
            <div>
              {/* BL Consignment Attachments: BL Draft + Original BL */}
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  BL Consignment Attachments
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0.9rem' }}>
                  Attach the BL draft, the original BL, or both. Images (JPG, PNG, WebP) and PDF files are accepted and
                  automatically compressed to under 150 KB before being uploaded to Firebase Storage.
                </p>
                <div className="bl-attach-grid">
                  {BL_ATTACHMENT_SLOTS.map(({ key, label, hint }) => (
                    <BlAttachmentUpload
                      key={key}
                      slot={key}
                      label={label}
                      hint={hint}
                      value={formData.blDocuments?.[key] || null}
                      companyId={companyId}
                      shipmentId={formData.id}
                      user={currentUser}
                      onChange={(attachment) => handleBlAttachmentChange(key, attachment)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Customs Clearance Document Audit Checklist
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0' }}>
                    Verify trade documents to avoid regulatory holds and clearance bottlenecks.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#2563eb' }}>
                    {verifiedDocCount} of 10 Verified ({verifiedDocCount * 10}%)
                  </span>
                  <div style={{ width: '130px', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ width: `${verifiedDocCount * 10}%`, height: '100%', background: '#059669', transition: 'width 250ms ease' }}></div>
                  </div>
                </div>
              </div>

              <div className="checklist-tiles-grid">
                {[
                  { key: 'commercialInvoice', label: 'Commercial Invoice (Attested & Signed)' },
                  { key: 'packingList', label: 'Packing List (Itemized Net/Gross Weight)' },
                  { key: 'originalBL', label: 'Original Bill of Lading (or Seaway / Telex Release)' },
                  { key: 'certificateOfOrigin', label: 'Certificate of Origin (Chamber Legalized)' },
                  { key: 'formEFTA', label: 'Preferential Tariff Exemption (Form E / FTA)' },
                  { key: 'deliveryOrder', label: 'Shipping Line Delivery Order (DO) Issued' },
                  { key: 'customsDeclaration', label: 'Bill of Entry / Customs Declaration Draft' },
                  { key: 'dutyPaymentReceipt', label: 'Customs Duty & VAT Payment Receipt' },
                  { key: 'portGatePass', label: 'Port THC & Gate Pass Token Booked' },
                  { key: 'emptyReturnEIR', label: 'Empty Return EIR Receipt from Depot' }
                ].map(({ key, label }) => {
                  const isChecked = !!formData.documents[key];

                  return (
                    <div
                      key={key}
                      onClick={() => handleDocumentToggle(key)}
                      className={`checklist-tile ${isChecked ? 'checked' : ''}`}
                    >
                      <div className="checklist-checkbox-circle">
                        {isChecked && <Check size={13} strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: isChecked ? 700 : 500 }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Bottom Footer Navigation */}
          <div className="dossier-footer-nav" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
              >
                Cancel
              </button>
              {currentTabIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrevTab}
                  className="btn btn-outline"
                >
                  <ArrowLeft size={15} />
                  <span>Previous</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {currentTabIndex < TABS.length - 1 && (
                <button
                  type="button"
                  onClick={handleNextTab}
                  className="btn btn-outline"
                  style={{ borderColor: '#cbd5e1' }}
                >
                  <span>Next Step</span>
                  <ArrowRight size={15} />
                </button>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px 22px' }}
              >
                <Save size={16} />
                <span>Save Shipment Dossier</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
