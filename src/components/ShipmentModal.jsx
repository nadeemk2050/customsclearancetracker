import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Ship,
  MapPin,
  CalendarClock,
  Coins,
  Box,
  Paperclip,
  Save,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock
} from 'lucide-react';
import { addDays, getDaysDifference } from '../utils/dateUtils';
import { BlAttachmentUpload } from './BlAttachmentUpload';
import { BL_ATTACHMENT_SLOTS } from '../services/attachmentService';
import { STATUS_STAGES } from '../utils/statusStages';

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

// Only the fields shown on this page are edited here. Every other dossier field keeps
// whatever value the record already had, so nothing is lost when saving.
const DEFAULT_SHIPMENT = {
  blNo: '',
  shippingLine: '',
  vessel: '',
  voyage: '',
  pol: '',
  pod: '',
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
    status: 'Deposited (Awaiting Empty Return)',
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

const CONTAINER_SIZES = [
  { value: '20GP', label: "20' General Purpose" },
  { value: '40GP', label: "40' General Purpose" },
  { value: '40HC', label: "40' High Cube" },
  { value: '45HC', label: "45' High Cube" },
  { value: '20RF', label: "20' Reefer" },
  { value: '40RF', label: "40' Reefer" },
  { value: '20OT', label: "20' Open Top" },
  { value: '40OT', label: "40' Open Top" },
  { value: '40FR', label: "40' Flat Rack" }
];

const CONTAINER_STATUSES = [
  'At Port (Full)',
  'Gate Out (In Transit)',
  'At Consignee (Unloading)',
  'Empty Returned (Safe)'
];

const DEPOSIT_STATUSES = [
  'Deposited (Awaiting Empty Return)',
  'Refund Claimed',
  'Refunded',
  'Forfeited / Deducted',
  'Not Applicable'
];

const labelText = (label, required) => (
  <span>
    {label}
    {required ? <span className="req"> *</span> : null}
  </span>
);

const Field = ({ id, label, required, value, onChange, placeholder, hint, listId, type = 'text', inputMode, mono }) => (
  <div>
    <label className="bl-label" htmlFor={id}>{labelText(label, required)}</label>
    <input
      id={id}
      type={type}
      className={'bl-input' + (mono ? ' mono' : '')}
      list={listId}
      inputMode={inputMode}
      autoComplete="off"
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
    />
    {hint ? <div className="bl-hint">{hint}</div> : null}
  </div>
);

const Select = ({ id, label, required, value, onChange, options, hint }) => (
  <div>
    <label className="bl-label" htmlFor={id}>{labelText(label, required)}</label>
    <select id={id} className="bl-input" value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
      <option value="">- Select -</option>
      {options.map((option) => {
        const val = typeof option === 'string' ? option : option.value;
        const text = typeof option === 'string' ? option : option.label;
        return <option key={val} value={val}>{text}</option>;
      })}
      {value && !options.some((option) => (typeof option === 'string' ? option : option.value) === value) ? (
        <option value={value}>{value}</option>
      ) : null}
    </select>
    {hint ? <div className="bl-hint">{hint}</div> : null}
  </div>
);

const Section = ({ id, step, title, Icon, meta, isOpen, onToggle, children }) => (
  <section id={'bl-sec-' + id} className={'bl-section' + (isOpen ? ' open' : '')}>
    <button type="button" className="bl-section-head" onClick={onToggle} aria-expanded={isOpen}>
      <span className="bl-step-badge">{step}</span>
      <Icon size={15} style={{ color: '#2563eb', flexShrink: 0 }} />
      <span className="bl-section-title">{title}</span>
      {meta ? <span className="bl-section-meta">{meta}</span> : null}
      {isOpen
        ? <ChevronDown size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
        : <ChevronRight size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />}
    </button>
    {isOpen ? <div className="bl-section-body">{children}</div> : null}
  </section>
);

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
  const [openSections, setOpenSections] = useState({
    carrier: true,
    routing: true,
    dates: true,
    deposit: true,
    containers: true,
    attachments: true
  });
  const [error, setError] = useState('');

  const shippingLines = (masters.shippingLines || []).map((line) => line.name);
  const consignees = masters.consignees || [];
  const shippers = (masters.shippers || []).map((item) => item.name);
  const ports = (masters.ports || []).map((port) => port.name);
  const cargoItems = masters.cargoDescriptions || [];

  // Depots are filtered by the selected carrier, falling back to the full list
  const depotOptions = useMemo(() => {
    const all = masters.depots || [];
    const forLine = all.filter((d) => !d.shippingLine || d.shippingLine === formData.shippingLine);
    return (forLine.length > 0 ? forLine : all).map((depot) => depot.name);
  }, [masters.depots, formData.shippingLine]);

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

  // Free-time countdowns: how many days remain, not what they would cost
  const freeTime = useMemo(() => {
    const asDays = (value) => {
      const parsed = parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const build = (label, expiry) => {
      if (!expiry) return { label, state: 'muted', text: 'Set discharge date' };
      const left = getDaysDifference(expiry);
      if (left === null) return { label, state: 'muted', text: 'Not set' };
      if (left < 0) return { label, state: 'over', text: Math.abs(left) + ' day(s) over' };
      if (left === 0) return { label, state: 'warn', text: 'Expires today' };
      if (left <= 2) return { label, state: 'warn', text: left + ' day(s) left' };
      return { label, state: 'safe', text: left + ' day(s) left' };
    };

    const discharge = formData.dischargeDate;
    return [
      build('Port free storage', discharge ? addDays(discharge, asDays(formData.portFreeDays)) : ''),
      build('Line D&D free time', discharge ? addDays(discharge, asDays(formData.lineFreeDays)) : '')
    ];
  }, [formData.dischargeDate, formData.portFreeDays, formData.lineFreeDays]);

  if (!isOpen) return null;

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sectionProps = (id) => ({
    id,
    isOpen: openSections[id],
    onToggle: () => toggleSection(id)
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const revealSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: true }));
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        document.getElementById('bl-sec-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  // Master auto-fills
  const handleShippingLineSelect = (lineName) => {
    const matched = (masters.shippingLines || []).find((line) => line.name === lineName);
    setFormData((prev) => ({
      ...prev,
      shippingLine: lineName,
      portFreeDays: matched?.defaultPortFreeDays ?? prev.portFreeDays,
      lineFreeDays: matched?.defaultLineFreeDays ?? prev.lineFreeDays
    }));
  };

  const handleConsigneeSelect = (name) => {
    const matched = consignees.find((item) => item.name.toLowerCase() === name.toLowerCase());
    setFormData((prev) => ({
      ...prev,
      consignee: name,
      finalDestination: matched?.destinationYard || matched?.address || prev.finalDestination
    }));
  };

  const handlePodSelect = (podName) => {
    const matched = (masters.ports || []).find((port) => port.name.toLowerCase() === podName.toLowerCase());
    setFormData((prev) => ({
      ...prev,
      pod: podName,
      portFreeDays: matched?.defaultPortFreeDays ?? prev.portFreeDays
    }));
  };

  const handleCargoSelect = (cargoDesc) => {
    const matched = cargoItems.find((item) => item.description.toLowerCase() === cargoDesc.toLowerCase());
    setFormData((prev) => ({
      ...prev,
      cargoDescription: cargoDesc,
      hsCode: matched?.defaultHsCode || prev.hsCode,
      totalPackages: matched?.defaultPackaging || prev.totalPackages
    }));
  };

  const handleDepositChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      doSecurityDeposit: { ...prev.doSecurityDeposit, [field]: value }
    }));
  };

  const handleBlAttachmentChange = (slotKey, attachment) => {
    setFormData((prev) => ({
      ...prev,
      blDocuments: { ...(prev.blDocuments || {}), [slotKey]: attachment }
    }));
  };

  const handleContainerChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      containers: prev.containers.map((container, i) => (i === index ? { ...container, [field]: value } : container))
    }));
  };

  const addContainerRow = () => {
    setFormData((prev) => ({
      ...prev,
      containers: [
        ...prev.containers,
        {
          ...DEFAULT_CONTAINER,
          id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          dischargeDate: prev.dischargeDate || '',
          emptyReturnDepot: depotOptions[0] || ''
        }
      ]
    }));
  };

  const removeContainerRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      containers: prev.containers.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    if (!formData.blNo.trim()) return { message: 'Bill of Lading (BL) Number is required.', section: 'carrier' };
    if (!formData.shippingLine.trim()) return { message: 'Shipping Line / Carrier is required.', section: 'carrier' };
    if (!formData.pod.trim()) return { message: 'Port of Discharge (POD) is required.', section: 'routing' };
    if (!formData.consignee.trim()) return { message: 'Consignee (Importer) is required.', section: 'routing' };
    if (!formData.dischargeDate) {
      return { message: 'Vessel Discharge Date is required - it starts the free-time clock (day 0).', section: 'dates' };
    }
    const emptyIndex = formData.containers.findIndex((container) => !container.containerNo.trim());
    if (emptyIndex >= 0) {
      return { message: 'Container Number is required for unit #' + (emptyIndex + 1) + '.', section: 'containers' };
    }
    return null;
  };

  const handleSubmit = (event) => {
    if (event?.preventDefault) event.preventDefault();

    const problem = validate();
    if (problem) {
      setError(problem.message);
      revealSection(problem.section);
      return;
    }

    onSave({
      ...formData,
      blNo: formData.blNo.trim().toUpperCase(),
      // Keep the manifest aligned with the vessel discharge date
      containers: formData.containers.map((container) => ({
        ...container,
        containerNo: container.containerNo.trim().toUpperCase(),
        dischargeDate: container.dischargeDate || formData.dischargeDate
      }))
    });
    onClose();
  };

  const containerCount = formData.containers.length;

  return (
    <div className="bl-form-page" role="dialog" aria-modal="true" aria-label="BL consignment details">
      {/* Master data powering the dropdowns (typing a new value stays possible) */}
      <datalist id="master-shipping-lines">{shippingLines.map((name) => <option key={name} value={name} />)}</datalist>
      <datalist id="master-consignees">{consignees.map((item) => <option key={item.id || item.name} value={item.name} />)}</datalist>
      <datalist id="master-shippers">{shippers.map((name) => <option key={name} value={name} />)}</datalist>
      <datalist id="master-ports">{ports.map((name) => <option key={name} value={name} />)}</datalist>
      <datalist id="master-cargo">{cargoItems.map((item) => <option key={item.id || item.description} value={item.description} />)}</datalist>
      <datalist id="master-depots">{depotOptions.map((name) => <option key={name} value={name} />)}</datalist>

      <header className="bl-form-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}
          >
            <Ship size={21} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>{shipmentToEdit ? 'Edit BLs Consignment - ' + shipmentToEdit.blNo : 'Add New BL Consignment'}</h2>
            <p>
              {containerCount} container unit(s)
              {formData.blNo ? ' | BL ' + formData.blNo : ''}
              {formData.customsStatus ? ' | ' + formData.customsStatus : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-icon-only"
          onClick={onClose}
          aria-label="Close BL form"
          style={{ color: '#cbd5e1', flexShrink: 0 }}
        >
          <X size={20} />
        </button>
      </header>

      <div className="bl-form-body">
        <form className="bl-form-inner" onSubmit={handleSubmit} noValidate>
          {error ? (
            <div className="bl-error-bar">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          ) : null}

          <Section
            {...sectionProps('carrier')}
            step="1"
            title="BL and Ship Details"
            Icon={Ship}
            meta={formData.shippingLine || ''}
          >
            <div className="bl-form-grid">
              <Field
                id="bl-no"
                label="Bill of Lading (BL) Number"
                required
                mono
                value={formData.blNo}
                onChange={(value) => handleInputChange('blNo', value.toUpperCase())}
                placeholder="e.g. HLCUTOR260620111"
              />
              <Field
                id="bl-carrier"
                listId="master-shipping-lines"
                label="Shipping Line / Carrier"
                required
                value={formData.shippingLine}
                onChange={handleShippingLineSelect}
                placeholder="Select carrier or type..."
                hint="Picking a master carrier loads its default free days"
              />
              <Field
                id="bl-vessel"
                label="Vessel Name"
                value={formData.vessel}
                onChange={(value) => handleInputChange('vessel', value)}
                placeholder="e.g. AL ZUBARA"
              />
              <Field
                id="bl-voyage"
                label="Voyage Number"
                value={formData.voyage}
                onChange={(value) => handleInputChange('voyage', value)}
                placeholder="e.g. 2604E"
              />
            </div>
          </Section>

          <Section
            {...sectionProps('routing')}
            step="2"
            title="Shipper, Consignee and Cargo Details"
            Icon={MapPin}
            meta={formData.pod || ''}
          >
            <div className="bl-form-grid">
              <Field
                id="bl-pol"
                listId="master-ports"
                label="Port of Loading (POL)"
                value={formData.pol}
                onChange={(value) => handleInputChange('pol', value)}
                placeholder="e.g. Hamburg Port (DEHAM)"
              />
              <Field
                id="bl-pod"
                listId="master-ports"
                label="Port of Discharge (POD)"
                required
                value={formData.pod}
                onChange={handlePodSelect}
                placeholder="e.g. Jebel Ali Port (AEJEA)"
                hint="Picking a master port loads its default storage days"
              />
              <Field
                id="bl-consignee"
                listId="master-consignees"
                label="Consignee (Importer)"
                required
                value={formData.consignee}
                onChange={handleConsigneeSelect}
                placeholder="Select master consignee or type..."
                hint={formData.finalDestination ? 'Delivery address: ' + formData.finalDestination : 'Auto-fills the delivery address'}
              />
              <Field
                id="bl-shipper"
                listId="master-shippers"
                label="Shipper (Exporter / Supplier)"
                value={formData.shipper}
                onChange={(value) => handleInputChange('shipper', value)}
                placeholder="Select master shipper or type..."
              />
              <Field
                id="bl-cargo"
                listId="master-cargo"
                label="Cargo Description"
                value={formData.cargoDescription}
                onChange={handleCargoSelect}
                placeholder="Select from master cargo or type..."
                hint={formData.hsCode ? 'HS Code: ' + formData.hsCode : 'Auto-fills HS code and packaging'}
              />
              <Field
                id="bl-packages"
                label="Packaging & Total Packages"
                value={formData.totalPackages}
                onChange={(value) => handleInputChange('totalPackages', value)}
                placeholder="e.g. 960 Bags / 24 Pallets"
              />
              <Field
                id="bl-weight"
                label="Gross Weight (KG)"
                inputMode="decimal"
                value={formData.grossWeightKg}
                onChange={(value) => handleInputChange('grossWeightKg', value)}
                placeholder="e.g. 52140"
              />
            </div>
          </Section>

          <Section
            {...sectionProps('dates')}
            step="3"
            title="Dates, Free Time & Milestone"
            Icon={CalendarClock}
            meta={formData.customsStatus || ''}
          >
            <div className="bl-form-grid">
              <Field
                id="bl-eta"
                type="date"
                label="Estimated Time of Arrival (ETA)"
                value={formData.eta}
                onChange={(value) => handleInputChange('eta', value)}
              />
              <Field
                id="bl-discharge"
                type="date"
                label="Vessel Discharge Date (Clock Start Day 0)"
                required
                value={formData.dischargeDate}
                onChange={(value) => handleInputChange('dischargeDate', value)}
              />
              <Field
                id="bl-port-free"
                label="Port Terminal Free Storage Days"
                inputMode="numeric"
                value={formData.portFreeDays}
                onChange={(value) => handleInputChange('portFreeDays', value)}
                placeholder="e.g. 5"
              />
              <Field
                id="bl-line-free"
                label="Shipping Line Demurrage & Detention Free Days"
                inputMode="numeric"
                value={formData.lineFreeDays}
                onChange={(value) => handleInputChange('lineFreeDays', value)}
                placeholder="e.g. 14"
              />
              <Select
                id="bl-milestone"
                label="Current Customs Clearance Milestone"
                value={formData.customsStatus}
                onChange={(value) => handleInputChange('customsStatus', value)}
                options={STATUS_STAGES.map((stage) => ({ value: stage.id, label: stage.label }))}
              />
              <div className="bl-field-full">
                <span className="bl-label">Free Time Remaining</span>
                <div className="bl-days-chips">
                  {freeTime.map((chip) => (
                    <span key={chip.label} className={'bl-days-chip ' + chip.state}>
                      <Clock size={13} />
                      {chip.label}: <strong>{chip.text}</strong>
                    </span>
                  ))}
                </div>
                <div className="bl-hint">Counted from the vessel discharge date plus the free days above.</div>
              </div>
            </div>
          </Section>

          <Section
            {...sectionProps('deposit')}
            step="4"
            title="Shipping Line Container Security Deposit"
            Icon={Coins}
            meta={formData.doSecurityDeposit.amount ? '$' + formData.doSecurityDeposit.amount : ''}
          >
            <div className="bl-form-grid">
              <Field
                id="bl-deposit-amount"
                label="Security Deposit Amount ($)"
                inputMode="decimal"
                value={formData.doSecurityDeposit.amount}
                onChange={(value) => handleDepositChange('amount', value)}
                placeholder="e.g. 2000"
              />
              <Select
                id="bl-deposit-status"
                label="Deposit Refund Status"
                value={formData.doSecurityDeposit.status}
                onChange={(value) => handleDepositChange('status', value)}
                options={DEPOSIT_STATUSES}
              />
              <Field
                id="bl-deposit-ref"
                label="Guarantee / Receipt Ref #"
                mono
                value={formData.doSecurityDeposit.receiptNo}
                onChange={(value) => handleDepositChange('receiptNo', value)}
                placeholder="e.g. HL-DEP-99410"
              />
            </div>
          </Section>

          <Section
            {...sectionProps('containers')}
            step="5"
            title="Container Details and Status"
            Icon={Box}
            meta={containerCount + ' unit(s)'}
          >
            <div>
              {formData.containers.map((container, index) => (
                <div key={container.id || index} className="bl-container-card">
                  <div className="bl-container-head">
                    <span className="bl-container-unit">
                      Unit #{index + 1}
                      {container.containerNo ? ' - ' + container.containerNo : ' - Pending Container #'}
                    </span>
                    {formData.containers.length > 1 ? (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm btn-icon-only"
                        onClick={() => removeContainerRow(index)}
                        title={'Remove unit #' + (index + 1)}
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>

                  <div className="bl-form-grid">
                    <Field
                      id={'cont-no-' + index}
                      label="Container Number"
                      required
                      mono
                      value={container.containerNo}
                      onChange={(value) => handleContainerChange(index, 'containerNo', value.toUpperCase())}
                      placeholder="e.g. FSCU8083274"
                    />
                    <Select
                      id={'cont-size-' + index}
                      label="Size / ISO Type"
                      value={container.sizeType}
                      onChange={(value) => handleContainerChange(index, 'sizeType', value)}
                      options={CONTAINER_SIZES}
                    />
                    <Field
                      id={'cont-seal-' + index}
                      label="Seal Number"
                      mono
                      value={container.sealNo}
                      onChange={(value) => handleContainerChange(index, 'sealNo', value)}
                      placeholder="e.g. HL773192"
                    />
                    <Select
                      id={'cont-status-' + index}
                      label="Current Unit Status"
                      value={container.status}
                      onChange={(value) => handleContainerChange(index, 'status', value)}
                      options={CONTAINER_STATUSES}
                    />
                    <Field
                      id={'cont-gateout-' + index}
                      type="date"
                      label="Port Gate-Out Date"
                      value={container.gateOutDate}
                      onChange={(value) => handleContainerChange(index, 'gateOutDate', value)}
                    />
                    <Field
                      id={'cont-depot-' + index}
                      listId="master-depots"
                      label="Empty Return Depot"
                      value={container.emptyReturnDepot}
                      onChange={(value) => handleContainerChange(index, 'emptyReturnDepot', value)}
                      placeholder="Select master depot or type..."
                    />
                    <Field
                      id={'cont-return-' + index}
                      type="date"
                      label="Empty Return Date"
                      value={container.emptyReturnDate}
                      onChange={(value) => handleContainerChange(index, 'emptyReturnDate', value)}
                    />
                    <Field
                      id={'cont-eir-' + index}
                      label="EIR Receipt #"
                      mono
                      value={container.eirNumber}
                      onChange={(value) => handleContainerChange(index, 'eirNumber', value)}
                      placeholder="e.g. EIR-881923"
                    />
                  </div>
                </div>
              ))}

              <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: '0.8rem' }} onClick={addContainerRow}>
                <Plus size={14} />
                <span>Add Container Box</span>
              </button>
            </div>
          </Section>

          <Section
            {...sectionProps('attachments')}
            step="6"
            title="BL Consignment Attachments"
            Icon={Paperclip}
            meta={
              [formData.blDocuments?.blDraft, formData.blDocuments?.originalBL].filter(Boolean).length + ' of 2 attached'
            }
          >
            <div>
              <p className="bl-hint" style={{ marginBottom: '0.7rem' }}>
                Attach the BL draft, the original BL, or both. Images (JPG, PNG, WebP) and PDF files are accepted and
                automatically compressed to under 150 KB before being uploaded to Firebase Storage.
              </p>
              <div className="bl-attach-grid">
                {BL_ATTACHMENT_SLOTS.map((slot) => (
                  <BlAttachmentUpload
                    key={slot.key}
                    slot={slot.key}
                    label={slot.label}
                    hint={slot.hint}
                    value={formData.blDocuments?.[slot.key] || null}
                    companyId={companyId}
                    shipmentId={formData.id}
                    user={currentUser}
                    onChange={(attachment) => handleBlAttachmentChange(slot.key, attachment)}
                  />
                ))}
              </div>
            </div>
          </Section>
        </form>
      </div>

      <footer className="bl-form-footer">
        <span className="bl-hint" style={{ marginTop: 0 }}>
          Fields marked <span className="req">*</span> are required.
        </span>
        <div className="bl-form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            <Save size={15} />
            <span>Save BL Consignment</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ShipmentModal;