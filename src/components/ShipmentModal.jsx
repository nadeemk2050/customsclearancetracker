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
  Building2
} from 'lucide-react';
import { addDays, formatDate } from '../utils/dateUtils';

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
  containers: [{ ...DEFAULT_CONTAINER, id: 'c_' + Date.now() }]
};

export const ShipmentModal = ({ 
  isOpen, 
  onClose, 
  shipmentToEdit, 
  onSave,
  masters = {}
}) => {
  const [formData, setFormData] = useState(DEFAULT_SHIPMENT);
  const [activeTab, setActiveTab] = useState('general'); // general | freetime | customs | containers | documents
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
        containers: shipmentToEdit.containers && shipmentToEdit.containers.length > 0
          ? shipmentToEdit.containers
          : [{ ...DEFAULT_CONTAINER, id: 'c_' + Date.now() }]
      });
    } else {
      setFormData({
        ...DEFAULT_SHIPMENT,
        containers: [{ ...DEFAULT_CONTAINER, id: 'c_' + Date.now() }]
      });
    }
    setError('');
  }, [shipmentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-populate when selecting a Master Shipping Line
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

  // Auto-populate when selecting a Master Consignee
  const handleConsigneeSelect = (consigneeName) => {
    const matched = consigneesList.find(c => c.name.toLowerCase() === consigneeName.toLowerCase());
    setFormData(prev => ({
      ...prev,
      consignee: consigneeName,
      finalDestination: matched?.destinationYard || matched?.address || prev.finalDestination
    }));
  };

  // Auto-populate when selecting Master Port of Discharge
  const handlePodSelect = (podName) => {
    const matched = portsList.find(p => p.name.toLowerCase() === podName.toLowerCase());
    setFormData(prev => ({
      ...prev,
      pod: podName,
      portFreeDays: matched?.defaultPortFreeDays ?? prev.portFreeDays,
      portStorageDailyRate: matched?.defaultPortDailyRate ?? prev.portStorageDailyRate
    }));
  };

  // Auto-populate when selecting Master Cargo Description
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
      alert('A shipment must have at least one container.');
      return;
    }
    const updated = formData.containers.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, containers: updated }));
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

  // Preview calculations
  const portExpiryPreview = formData.dischargeDate ? addDays(formData.dischargeDate, formData.portFreeDays) : '—';
  const lineExpiryPreview = formData.dischargeDate ? addDays(formData.dischargeDate, formData.lineFreeDays) : '—';

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '980px', maxHeight: '92vh' }}>
        {/* Modal Header */}
        <div className="modal-header bg-slate-900 text-white border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {shipmentToEdit ? `Edit Shipment Dossier — ${shipmentToEdit.blNo}` : 'Create New Customs Clearance Dossier'}
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30">
                End-to-End Tracking
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Integrated with Master Presets: auto-populates free days, HS codes, warehouses & detention rates.
            </p>
          </div>
          <button onClick={onClose} className="btn-icon-only text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Enhanced Modern Tab Navigation Bar */}
        <div className="flex border-b border-slate-200 bg-slate-100/90 px-6 gap-2 pt-2.5 overflow-x-auto">
          {[
            { id: 'general', label: '1. Logistics & Routing', icon: Ship },
            { id: 'freetime', label: '2. Demurrage & Free Time', icon: ShieldAlert },
            { id: 'customs', label: '3. Customs & Delivery Order', icon: DollarSign },
            { id: 'containers', label: `4. Containers (${formData.containers.length})`, icon: Box },
            { id: 'documents', label: '5. Document Checklist', icon: FileCheck2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center gap-2 whitespace-nowrap border-t border-l border-r ${
                  isActive
                    ? 'bg-white text-blue-700 border-slate-300 shadow-sm border-b-2 border-b-white -mb-[1px]'
                    : 'bg-slate-200/60 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Datalists for Instant Auto-complete from Masters */}
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

          {/* TAB 1: GENERAL LOGISTICS */}
          {activeTab === 'general' && (
            <div className="form-grid">
              <div className="form-group">
                <label>Bill of Lading (BL) Number *</label>
                <input
                  required
                  type="text"
                  className="form-control uppercase font-mono font-bold"
                  placeholder="e.g. HLCUTOR260620111"
                  value={formData.blNo}
                  onChange={(e) => handleInputChange('blNo', e.target.value.toUpperCase())}
                />
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Shipping Line / Carrier *</label>
                  <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                    <Sparkles size={11} /> Auto-sets free days & rates
                  </span>
                </div>
                <select
                  className="form-control font-semibold"
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

              <div className="form-group">
                <label>Vessel Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. AL ZUBARA"
                  value={formData.vessel}
                  onChange={(e) => handleInputChange('vessel', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Voyage Number</label>
                <input
                  type="text"
                  className="form-control font-mono"
                  placeholder="e.g. 2604E"
                  value={formData.voyage}
                  onChange={(e) => handleInputChange('voyage', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Port of Loading (POL)</label>
                <input
                  type="text"
                  list="master-ports-list"
                  className="form-control"
                  placeholder="Select from Master Ports or type (e.g. Hamburg, Germany)"
                  value={formData.pol}
                  onChange={(e) => handleInputChange('pol', e.target.value)}
                />
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Port of Discharge (POD) *</label>
                  <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                    <Sparkles size={11} /> Auto-sets terminal storage
                  </span>
                </div>
                <input
                  required
                  type="text"
                  list="master-ports-list"
                  className="form-control font-semibold"
                  placeholder="Select Master Port (e.g. Jebel Ali Port (AEJEA))"
                  value={formData.pod}
                  onChange={(e) => handlePodSelect(e.target.value)}
                />
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Consignee (Importer) *</label>
                  <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                    <Sparkles size={11} /> Auto-sets destination yard
                  </span>
                </div>
                <input
                  required
                  type="text"
                  list="master-consignees-list"
                  className="form-control font-semibold"
                  placeholder="Select Master Consignee (e.g. MUMTAZ PLASTIC RECYCLING LLC)"
                  value={formData.consignee}
                  onChange={(e) => handleConsigneeSelect(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Shipper (Exporter / Supplier)</label>
                <input
                  type="text"
                  list="master-shippers-list"
                  className="form-control"
                  placeholder="Select Master Shipper (e.g. POLYMER GLOBAL GMBH)"
                  value={formData.shipper}
                  onChange={(e) => handleInputChange('shipper', e.target.value)}
                />
              </div>

              <div className="form-group form-full">
                <label>Final Inland Destination / Consignee Yard</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dubai Industrial City Yard, Warehouse 4"
                  value={formData.finalDestination}
                  onChange={(e) => handleInputChange('finalDestination', e.target.value)}
                />
              </div>

              <div className="form-group form-full">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Cargo Description</label>
                  <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                    <Sparkles size={11} /> Auto-sets HS code & packaging
                  </span>
                </div>
                <input
                  type="text"
                  list="master-cargo-list"
                  className="form-control"
                  placeholder="Select Master Cargo Description or type custom..."
                  value={formData.cargoDescription}
                  onChange={(e) => handleCargoSelect(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Total Packages & Packaging Type</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 960 Bags / 24 Pallets"
                  value={formData.totalPackages}
                  onChange={(e) => handleInputChange('totalPackages', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Gross Weight (KG)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 52140"
                  value={formData.grossWeightKg}
                  onChange={(e) => handleInputChange('grossWeightKg', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB 2: FREE TIME & DEMURRAGE RULES */}
          {activeTab === 'freetime' && (
            <div className="form-grid">
              <div className="form-full bg-blue-50 border border-blue-200 p-4 rounded-lg mb-2">
                <h4 className="text-xs font-bold uppercase text-blue-900 tracking-wide mb-1 flex items-center gap-1.5">
                  <ShieldAlert size={15} />
                  Automated Dual-Clock Demurrage Prevention Rules
                </h4>
                <p className="text-xs text-blue-800">
                  Pre-configured from Master Shipping Line (<strong>{formData.shippingLine}</strong>) and Master Port (<strong>{formData.pod}</strong>).
                </p>
              </div>

              <div className="form-group">
                <label>Estimated Arrival (ETA)</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.eta}
                  onChange={(e) => handleInputChange('eta', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Actual Arrival (ATA)</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.ata}
                  onChange={(e) => handleInputChange('ata', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Vessel Discharge Date (Clock Start Day 0) *</label>
                <input
                  type="date"
                  className="form-control font-bold"
                  value={formData.dischargeDate}
                  onChange={(e) => handleInputChange('dischargeDate', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Delivery Order (DO) Validity Expiry Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.doValidityDate}
                  onChange={(e) => handleInputChange('doValidityDate', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Port Terminal Storage Free Days (Default: 5-7)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.portFreeDays}
                  onChange={(e) => handleInputChange('portFreeDays', e.target.value)}
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Calculated Port Storage Expiry: <strong>{formatDate(portExpiryPreview)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label>Shipping Line D&D Free Days (Default: 14-21)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.lineFreeDays}
                  onChange={(e) => handleInputChange('lineFreeDays', e.target.value)}
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Calculated Empty Return Cutoff: <strong>{formatDate(lineExpiryPreview)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label>Daily Port Storage Rate ($/Container/Day)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.portStorageDailyRate}
                  onChange={(e) => handleInputChange('portStorageDailyRate', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Daily Line Detention Rate ($/Container/Day)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.lineDetentionDailyRate}
                  onChange={(e) => handleInputChange('lineDetentionDailyRate', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMS & DELIVERY ORDER */}
          {activeTab === 'customs' && (
            <div className="form-grid">
              <div className="form-group">
                <label>Current Customs Clearance Stage</label>
                <select
                  className="form-control font-bold"
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

              <div className="form-group">
                <label>Inspection / Regulatory Routing Channel</label>
                <select
                  className="form-control"
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

              <div className="form-group">
                <label>Customs Declaration / BOE Number</label>
                <input
                  type="text"
                  className="form-control font-mono"
                  placeholder="e.g. DXB-CUST-883921"
                  value={formData.customsDeclarationNo}
                  onChange={(e) => handleInputChange('customsDeclarationNo', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Declaration Filing Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.customsDeclarationDate}
                  onChange={(e) => handleInputChange('customsDeclarationDate', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Harmonized System (HS) Code</label>
                <input
                  type="text"
                  className="form-control font-mono"
                  placeholder="e.g. 3902.10.00"
                  value={formData.hsCode}
                  onChange={(e) => handleInputChange('hsCode', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Assessed Customs Duty ($)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 2607"
                  value={formData.customsDutyAmount}
                  onChange={(e) => handleInputChange('customsDutyAmount', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Assessed VAT / Tax ($)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 2737"
                  value={formData.customsVatAmount}
                  onChange={(e) => handleInputChange('customsVatAmount', e.target.value)}
                />
              </div>

              {/* Security Deposit Section */}
              <div className="form-full border-t pt-4 mt-2">
                <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-3">
                  Shipping Line Container Security Deposit Tracking
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Deposit Amount ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 2000"
                      value={formData.doSecurityDeposit.amount}
                      onChange={(e) => handleDepositChange('amount', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Deposit Status</label>
                    <select
                      className="form-control font-medium"
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
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Deposit Receipt / Guarantee Ref</label>
                    <input
                      type="text"
                      className="form-control font-mono"
                      placeholder="e.g. HL-DEP-99410"
                      value={formData.doSecurityDeposit.receiptNo}
                      onChange={(e) => handleDepositChange('receiptNo', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group form-full">
                <label>Operational Notes & Special Instructions</label>
                <textarea
                  rows={2}
                  className="form-control"
                  placeholder="Inspection notes, customs inspector remarks, trucker booking details..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB 4: MULTI-CONTAINER REPEATER */}
          {activeTab === 'containers' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Container Equipment Manifest ({formData.containers.length} Units)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track discharge, port gate-out, consignee offload, and empty return EIR per container.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addContainerRow}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={14} />
                  <span>Add Container</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.containers.map((cont, index) => (
                  <div key={cont.id || index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">Container #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeContainerRow(index)}
                        className="text-slate-400 hover:text-red-600 transition"
                        title="Delete container"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Container No *</label>
                        <input
                          required
                          type="text"
                          className="form-control uppercase font-mono font-bold"
                          placeholder="e.g. FSCU8083274"
                          value={cont.containerNo}
                          onChange={(e) => handleContainerChange(index, 'containerNo', e.target.value.toUpperCase())}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Size / Type</label>
                        <select
                          className="form-control"
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
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Seal Number</label>
                        <input
                          type="text"
                          className="form-control font-mono"
                          placeholder="e.g. HL773192"
                          value={cont.sealNo}
                          onChange={(e) => handleContainerChange(index, 'sealNo', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
                        <select
                          className="form-control"
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
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Port Gate-Out Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={cont.gateOutDate}
                          onChange={(e) => handleContainerChange(index, 'gateOutDate', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Empty Return Depot</label>
                        <input
                          type="text"
                          list="master-depots-list"
                          className="form-control"
                          placeholder="Select Master Depot or type..."
                          value={cont.emptyReturnDepot}
                          onChange={(e) => handleContainerChange(index, 'emptyReturnDepot', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Empty Return Date</label>
                        <input
                          type="date"
                          className="form-control font-semibold text-emerald-800"
                          value={cont.emptyReturnDate}
                          onChange={(e) => handleContainerChange(index, 'emptyReturnDate', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">EIR Receipt No</label>
                        <input
                          type="text"
                          className="form-control font-mono"
                          placeholder="e.g. EIR-881923"
                          value={cont.eirNumber}
                          onChange={(e) => handleContainerChange(index, 'eirNumber', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DOCUMENT CHECKLIST */}
          {activeTab === 'documents' && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-800">Customs Clearance Document Audit Checklist</h3>
                <p className="text-xs text-slate-500">
                  Ensure all commercial and shipping documents are obtained to prevent regulatory delays.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'commercialInvoice', label: 'Commercial Invoice (Attested / Signed)' },
                  { key: 'packingList', label: 'Packing List (Itemized with Gross/Net Weight)' },
                  { key: 'originalBL', label: 'Original Bill of Lading (or Seaway / Telex Release)' },
                  { key: 'certificateOfOrigin', label: 'Certificate of Origin (COO / Chamber of Commerce)' },
                  { key: 'formEFTA', label: 'FTA / Preferential Duty Exemption (Form E, etc.)' },
                  { key: 'deliveryOrder', label: 'Shipping Line Delivery Order (DO) Issued' },
                  { key: 'customsDeclaration', label: 'Bill of Entry / Customs Declaration Draft' },
                  { key: 'dutyPaymentReceipt', label: 'Customs Duty & Tax Payment Receipt' },
                  { key: 'portGatePass', label: 'Port Terminal Handling (THC) & Gate Pass' },
                  { key: 'emptyReturnEIR', label: 'Equipment Interchange Receipt (Empty Return Proof)' }
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      formData.documents[key] ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-emerald-600 rounded"
                      checked={!!formData.documents[key]}
                      onChange={() => handleDocumentToggle(key)}
                    />
                    <span className="text-xs font-semibold">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="modal-footer mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <Save size={16} />
              <span>Save Shipment Dossier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
