import React, { useState, useRef } from 'react';
import { 
  X, 
  Download,
  Loader2,
  Edit3, 
  ShieldAlert, 
  Ship, 
  FileCheck2, 
  Box, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  History,
  Paperclip,
  FileText,
  Eye,
  Upload,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown
} from 'lucide-react';
import { formatDate, formatDateTime, formatCurrency } from '../utils/dateUtils';
import { calculateDetentionMetrics } from '../utils/detentionEngine';
import { BL_ATTACHMENT_SLOTS, formatFileSize, uploadBlAttachment, deleteBlAttachment } from '../services/attachmentService';
import { downloadDossierPdf } from '../utils/dossierPdf';
import { requestActionPassword } from '../utils/securityGate';
import { getStatusStage } from '../utils/statusStages';
import { recordLogEntry } from '../services/logService';
import { StageDetailsModal } from './StageDetailsModal';

const STAGES = [
  { id: 'Pre-Arrival', label: 'Pre-Arrival' },
  { id: 'DO Taken', label: 'DO Issued' },
  { id: 'Declaration Filed', label: 'BOE Filed' },
  { id: 'Under Inspection', label: 'Inspection' },
  { id: 'Duty Paid', label: 'Duty Paid' },
  { id: 'Customs Cleared', label: 'OOC Cleared' },
  { id: 'Gate Out', label: 'Port Gate-Out' },
  { id: 'Delivered', label: 'Delivered' },
  { id: 'Empties Returned', label: 'Empties Returned' }
];

export const DossierDrawer = ({ 
  shipment, 
  isOpen, 
  onClose, 
  onEdit, 
  onUpdateStatus,
  companyName = 'CustomsTrack PRO',
  companyId = 'cha_al_mumtaz',
  currentUser,
  onUpdateShipment
}) => {
  const [pdfState, setPdfState] = useState('idle'); // idle | working | error
  const [pdfError, setPdfError] = useState('');
  const [uploadStatus, setUploadStatus] = useState({}); // { [slotKey]: 'idle' | 'compressing' | 'uploading' }
  const [uploadError, setUploadError] = useState({});
  const fileInputRefs = useRef({});

  // Accordion Sections Open State
  const [sectionsOpen, setSectionsOpen] = useState({
    consignmentDocs: true,
    auditTrail: true,
    shieldStatus: true,
    customsRecon: true,
    containerAudit: true,
    verifiedDocs: true,
    notes: true
  });

  // Stage Details Edit Modal State: { stageId, stageLabel, initialAnswers, isCurrent }
  const [stageEditModal, setStageEditModal] = useState(null);

  if (!isOpen || !shipment) return null;

  const metrics = calculateDetentionMetrics(shipment);
  const currentStageIndex = STAGES.findIndex(s => s.id === shipment.customsStatus);
  const progressPercent = Math.max(0, Math.min(100, (currentStageIndex / (STAGES.length - 1)) * 100));

  // Toggle single section
  const toggleSection = (key) => {
    setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle all sections
  const allExpanded = Object.values(sectionsOpen).every(Boolean);
  const handleToggleAll = () => {
    const nextVal = !allExpanded;
    setSectionsOpen({
      consignmentDocs: nextVal,
      auditTrail: nextVal,
      shieldStatus: nextVal,
      customsRecon: nextVal,
      containerAudit: nextVal,
      verifiedDocs: nextVal,
      notes: nextVal
    });
  };

  // Extract previous answers for any given stage
  const getStageAnswers = (stageId) => {
    const historyList = shipment.statusHistory || [];
    const entry = historyList.find(e => e.status === stageId) || null;
    const initial = { ...(entry?.answers || {}) };

    if (entry?.details) {
      entry.details.forEach(d => {
        if (d.key && initial[d.key] === undefined) {
          initial[d.key] = d.value;
        }
      });
    }

    // Top-level fallbacks
    if (stageId === 'Pre-Arrival') {
      if (!initial.ata && shipment.dischargeDate) initial.ata = shipment.dischargeDate;
      if (!initial.berth && shipment.pod) initial.berth = shipment.pod;
    } else if (stageId === 'DO Taken') {
      if (!initial.doNumber && shipment.doNumber) initial.doNumber = shipment.doNumber;
      if (!initial.doValidity && shipment.doValidityDate) initial.doValidity = shipment.doValidityDate;
      if (!initial.doReceivedBy && shipment.doReceivedBy) initial.doReceivedBy = shipment.doReceivedBy;
    } else if (stageId === 'Declaration Filed') {
      if (!initial.declarationNo && shipment.customsDeclarationNo) initial.declarationNo = shipment.customsDeclarationNo;
      if (!initial.filedDate && shipment.customsDeclarationDate) initial.filedDate = shipment.customsDeclarationDate;
      if (!initial.customsOffice && shipment.pod) initial.customsOffice = shipment.pod;
    } else if (stageId === 'Under Inspection') {
      if (!initial.inspectionType && shipment.inspectionType) initial.inspectionType = shipment.inspectionType;
    } else if (stageId === 'Duty Paid') {
      if (!initial.dutyAmount && shipment.customsDutyAmount) initial.dutyAmount = shipment.customsDutyAmount;
      if (!initial.vatAmount && shipment.customsVatAmount) initial.vatAmount = shipment.customsVatAmount;
    } else if (stageId === 'Customs Cleared') {
      if (!initial.oocRef && shipment.oocNumber) initial.oocRef = shipment.oocNumber;
      if (!initial.oocDate && shipment.customsClearanceDate) initial.oocDate = shipment.customsClearanceDate;
    }

    return initial;
  };

  // Milestone Stepper Click:
  // - If stage <= currentStageIndex: Edit details (Password 'abcd', no status change for passed)
  // - If stage > currentStageIndex: Advance progression to new status
  const handleStageClick = (stage, idx) => {
    if (idx <= currentStageIndex) {
      const isCurrent = idx === currentStageIndex;
      const promptLabel = isCurrent
        ? `edit saved details for current active status "${stage.label}"`
        : `edit saved details for completed status "${stage.label}" (without changing overall shipment status)`;

      if (!requestActionPassword(promptLabel)) {
        return;
      }

      const initialAnswers = getStageAnswers(stage.id);
      setStageEditModal({
        stageId: stage.id,
        stageLabel: stage.label,
        initialAnswers,
        isCurrent
      });
    } else {
      // Future milestone: advance status
      onUpdateStatus(shipment, stage.id);
    }
  };

  // Edit details from Status Update Audit Trail entry
  const handleEditAuditTrailEntry = (entry) => {
    const stageId = entry.status;
    const stageObj = STAGES.find(s => s.id === stageId) || { id: stageId, label: entry.stageLabel || stageId };
    const isCurrent = shipment.customsStatus === stageId;
    const promptLabel = isCurrent
      ? `edit saved details for current status "${stageObj.label}"`
      : `edit saved details for completed status "${stageObj.label}" (without changing overall shipment status)`;

    if (!requestActionPassword(promptLabel)) {
      return;
    }

    const initialAnswers = getStageAnswers(stageId);
    setStageEditModal({
      stageId,
      stageLabel: stageObj.label,
      initialAnswers,
      isCurrent
    });
  };

  // Save updated stage details (for current or passed status) WITHOUT changing status
  const handleSaveStageDetails = async (newAnswers) => {
    if (!stageEditModal?.stageId) return;
    const targetStageId = stageEditModal.stageId;
    const stageObj = getStatusStage(targetStageId) || STAGES.find(s => s.id === targetStageId);
    const stageTitle = stageObj?.label || targetStageId;
    const staffName = currentUser?.displayName || currentUser?.username || 'Staff User';
    const staffRole = currentUser?.role || 'Customs Clearance Specialist';

    // 1. Build updated details list
    const updatedDetails = [];
    (stageObj?.questions || []).forEach(q => {
      const raw = newAnswers[q.key];
      const val = raw === undefined || raw === null ? '' : String(raw).trim();
      if (val) {
        updatedDetails.push({ key: q.key, label: q.label, value: val });
      }
    });

    // 2. Update statusHistory entry
    let matchFound = false;
    const existingHistory = shipment.statusHistory || [];
    const updatedHistory = existingHistory.map(entry => {
      if (entry.status === targetStageId && !matchFound) {
        matchFound = true;
        return {
          ...entry,
          answers: { ...(entry.answers || {}), ...newAnswers },
          details: updatedDetails,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: staffName
        };
      }
      return entry;
    });

    if (!matchFound) {
      updatedHistory.push({
        status: targetStageId,
        stageLabel: stageTitle,
        at: new Date().toISOString(),
        by: staffName,
        byRole: staffRole,
        answers: newAnswers,
        details: updatedDetails
      });
    }

    // 3. Sync top-level fields (PRESERVING customsStatus)
    const updatedShipment = {
      ...shipment,
      statusHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
      updatedBy: staffName
    };

    if (newAnswers.declarationNo) updatedShipment.customsDeclarationNo = newAnswers.declarationNo;
    if (newAnswers.filedDate) updatedShipment.customsDeclarationDate = newAnswers.filedDate;
    if (newAnswers.doNumber) updatedShipment.doNumber = newAnswers.doNumber;
    if (newAnswers.doValidity) updatedShipment.doValidityDate = newAnswers.doValidity;
    if (newAnswers.dutyAmount !== undefined && newAnswers.dutyAmount !== '') {
      updatedShipment.customsDutyAmount = Number(newAnswers.dutyAmount);
    }
    if (newAnswers.vatAmount !== undefined && newAnswers.vatAmount !== '') {
      updatedShipment.customsVatAmount = Number(newAnswers.vatAmount);
    }
    if (newAnswers.oocRef) updatedShipment.oocNumber = newAnswers.oocRef;
    if (newAnswers.oocDate) updatedShipment.customsClearanceDate = newAnswers.oocDate;
    if (newAnswers.inspectionType) updatedShipment.inspectionType = newAnswers.inspectionType;

    // 4. Permanent audit log record
    try {
      await recordLogEntry(companyId, {
        action: 'UPDATE',
        blNo: shipment.blNo || '—',
        cctRefNo: shipment.cctRefNo || shipment.id || '—',
        dealerName: shipment.dealerName || '—',
        lotNo: shipment.lotNo || '—',
        staffName,
        staffRole,
        dateAdded: shipment.createdAt ? shipment.createdAt.substring(0, 10) : '—',
        timesModified: (shipment.timesModified || 0) + 1,
        summary: `Updated details for ${stageEditModal.isCurrent ? 'current' : 'passed'} stage "${stageTitle}" (Authorized with password 'abcd')`,
        changes: updatedDetails.map(d => ({
          field: d.key,
          label: `${stageTitle} — ${d.label}`,
          oldVal: '(Previous saved value)',
          newVal: String(d.value)
        })),
        snapshot: updatedShipment
      });
    } catch (err) {
      console.warn('Log entry warning:', err);
    }

    // 5. Persist shipment
    if (onUpdateShipment) {
      await onUpdateShipment(updatedShipment);
    }

    setStageEditModal(null);
  };

  const handleSlotPick = async (slotKey, event) => {
    const file = event?.target?.files?.[0];
    if (event?.target) event.target.value = '';
    if (!file) return;

    const previousDoc = (shipment.blDocuments || {})[slotKey];
    if (previousDoc?.path && !requestActionPassword(`replace the stored ${slotKey === 'blDraft' ? 'BL Draft' : 'Original BL'}`)) {
      return;
    }

    setUploadError(prev => ({ ...prev, [slotKey]: '' }));
    setUploadStatus(prev => ({ ...prev, [slotKey]: 'compressing' }));

    try {
      const meta = await uploadBlAttachment({
        file,
        companyId,
        shipmentId: shipment.id,
        slot: slotKey,
        user: currentUser,
        onProgress: (info) => {
          if (info?.phase === 'compressing') {
            setUploadStatus(prev => ({ ...prev, [slotKey]: 'compressing' }));
          }
        }
      });

      setUploadStatus(prev => ({ ...prev, [slotKey]: 'uploading' }));

      if (previousDoc?.path) {
        await deleteBlAttachment(previousDoc.path);
      }

      const updatedBlDocs = {
        ...(shipment.blDocuments || {}),
        [slotKey]: meta
      };

      if (onUpdateShipment) {
        await onUpdateShipment(shipment.id, updatedBlDocs);
      }
    } catch (err) {
      setUploadError(prev => ({
        ...prev,
        [slotKey]: err?.message || 'Upload failed. Please try again.'
      }));
    } finally {
      setUploadStatus(prev => ({ ...prev, [slotKey]: 'idle' }));
    }
  };

  const handleSlotRemove = async (slotKey) => {
    const label = slotKey === 'blDraft' ? 'BL Draft' : 'Original BL';
    if (!requestActionPassword(`remove the stored ${label}`)) return;

    const previousDoc = (shipment.blDocuments || {})[slotKey];
    const path = previousDoc?.path;

    const updatedBlDocs = {
      ...(shipment.blDocuments || {})
    };
    delete updatedBlDocs[slotKey];

    if (onUpdateShipment) {
      await onUpdateShipment(shipment.id, updatedBlDocs);
    }
    if (path) {
      await deleteBlAttachment(path);
    }
  };

  const handleSlotDrop = (slotKey, e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleSlotPick(slotKey, { target: { files: [file], value: '' } });
    }
  };

  const handleDownloadPdf = async () => {
    setPdfError('');
    setPdfState('working');
    try {
      await downloadDossierPdf({ shipment, companyName });
      setPdfState('idle');
    } catch (err) {
      setPdfError(err?.message || 'Could not generate the PDF. Please try again.');
      setPdfState('error');
    }
  };

  const uploadedDocsCount = Object.keys(shipment.blDocuments || {}).length;
  const verifiedDocsCount = Object.values(shipment.documents || {}).filter(Boolean).length;
  const totalVerifiedDocs = Object.keys(shipment.documents || {}).length || 8;

  return (
    <div className="bl-form-page" role="dialog" aria-modal="true" aria-label={`BL dossier ${shipment.blNo}`}>
      {/* Header */}
      <header className="bl-form-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold">
            <Ship size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-slate-800 font-mono tracking-tight">
                BL: {shipment.blNo}
              </h2>
              <span className="carrier-tag text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300" title="CCT Universal Reference Number">
                CCT: {shipment.cctRefNo || shipment.id}
              </span>
              {shipment.dealerName && (
                <span className="carrier-tag text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300" title="Dealer (Investor / Indentor)">
                  Dealer: {shipment.dealerName}
                </span>
              )}
              {shipment.lotNo && (
                <span className="carrier-tag text-xs font-mono font-bold bg-purple-100 text-purple-900 border border-purple-300" title="Consignment Lot Number">
                  Lot: {shipment.lotNo}
                </span>
              )}
              <span className="carrier-tag text-xs font-bold bg-blue-100 text-blue-900">
                {shipment.shippingLine}
              </span>
              <span className="status-badge text-xs">
                {shipment.customsStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Full Customs Dossier • Created/Updated: {formatDateTime(shipment.updatedAt)}
              {shipment.updatedBy ? ` • Last update by ${shipment.updatedBy}` : ''}
            </p>
          </div>
        </div>

        <div className="dossier-header-actions">
          <button
            onClick={handleDownloadPdf}
            className="btn btn-outline btn-sm"
            disabled={pdfState === 'working'}
            title="Download this dossier as a PDF document"
          >
            {pdfState === 'working' ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
            <span>{pdfState === 'working' ? 'Preparing PDF...' : 'Download PDF'}</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(shipment);
            }}
            className="btn btn-primary btn-sm"
          >
            <Edit3 size={15} />
            <span>Edit Record</span>
          </button>
          <button onClick={onClose} className="btn-icon-only" style={{ color: '#cbd5e1' }} aria-label="Close dossier">
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="bl-form-body dossier-body space-y-4">
        {pdfError && (
          <div className="bl-error-bar">
            <AlertTriangle size={15} />
            <span>{pdfError}</span>
          </div>
        )}

        {/* Visual Milestone Stepper */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                End-to-End Customs & Logistics Progression
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                (Click Blue point or Green milestones to edit details with password "abcd")
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-blue-700">
              Phase {currentStageIndex + 1} of {STAGES.length} ({Math.round(progressPercent)}%)
            </span>
          </div>

          <div className="milestone-stepper">
            <div className="stepper-progress-track">
              <div 
                className="stepper-progress-fill" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {STAGES.map((stage, idx) => {
              const isPassed = idx < currentStageIndex;
              const isActive = idx === currentStageIndex;

              return (
                <div
                  key={stage.id}
                  onClick={() => handleStageClick(stage, idx)}
                  className={`milestone-step-item ${isPassed ? 'completed' : ''} ${isActive ? 'active' : ''} cursor-pointer group`}
                  title={
                    isActive
                      ? `Active Status (${stage.label}) [Blue point]. Click to view & edit details (Password 'abcd')`
                      : isPassed
                      ? `Passed Status (${stage.label}) [Green check]. Click to edit saved details without changing status (Password 'abcd')`
                      : `Click to advance status to ${stage.label}`
                  }
                >
                  <div className="step-node relative group-hover:scale-105 transition-transform">
                    {isPassed ? <CheckCircle size={16} /> : idx + 1}
                    {(isActive || isPassed) && (
                      <span 
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white text-slate-700 shadow border border-slate-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit stage details"
                      >
                        <Edit3 size={8} />
                      </span>
                    )}
                  </div>
                  <span className="step-label flex items-center justify-center gap-1">
                    {stage.label}
                    {isActive && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOP SUMMARY VIEW: Comprehensive Consignment Executive Overview Card       */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Summary Header Ribbon */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold">
                <FileText size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-300">
                    Consignment Executive Summary
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    Phase {currentStageIndex + 1} of {STAGES.length}: {shipment.customsStatus}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white font-mono tracking-tight m-0">
                  BL: {shipment.blNo} <span className="text-blue-300 font-normal">|</span> CCT: {shipment.cctRefNo || shipment.id}
                </h3>
              </div>
            </div>

            {/* Quick Accordion Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer"
                title={allExpanded ? "Collapse all sections below" : "Expand all sections below"}
              >
                <ChevronsUpDown size={14} />
                <span>{allExpanded ? 'Collapse All Sections' : 'Expand All Sections'}</span>
              </button>
            </div>
          </div>

          {/* Quick KPI Stat Tiles Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/80 border-b border-slate-200">
            <div className="p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Equipment</span>
              <strong className="text-sm font-extrabold text-slate-900 font-mono">
                {shipment.containers?.length || 0} Unit(s)
              </strong>
              <span className="text-[10px] text-slate-500 block truncate">
                {shipment.containers?.[0]?.sizeType || '40HC'} · {shipment.shippingLine || 'Carrier'}
              </span>
            </div>

            <div className="p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Net Weight</span>
              <strong className="text-sm font-extrabold text-blue-900 font-mono">
                {shipment.netWeight ? `${Number(shipment.netWeight).toLocaleString()} KG` : (shipment.grossWeightKg ? `${Number(shipment.grossWeightKg).toLocaleString()} KG` : '—')}
              </strong>
              <span className="text-[10px] text-slate-500 block truncate">
                {shipment.totalPackages || 'Standard pkgs'}
              </span>
            </div>

            <div className="p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">D&D Shield Risk</span>
              <strong className={`text-sm font-extrabold ${
                metrics.overallRisk === 'SAFE' ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {metrics.overallRisk}
              </strong>
              <span className="text-[10px] text-slate-500 block truncate">
                {metrics.portDaysLeft !== null ? `${metrics.portDaysLeft} port days left` : '5 port days'}
              </span>
            </div>

            <div className="p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Declaration (BOE)</span>
              <strong className="text-sm font-extrabold text-slate-900 font-mono truncate block" title={shipment.customsDeclarationNo || 'Unfiled'}>
                {shipment.customsDeclarationNo || 'Unfiled'}
              </strong>
              <span className="text-[10px] text-slate-500 block truncate">
                {shipment.customsDeclarationDate ? formatDate(shipment.customsDeclarationDate) : 'Pending file'}
              </span>
            </div>

            <div className="p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Assessed Duty</span>
              <strong className="text-sm font-extrabold text-slate-900">
                {shipment.customsDutyAmount ? formatCurrency(shipment.customsDutyAmount) : '—'}
              </strong>
              <span className="text-[10px] text-slate-500 block truncate">
                VAT: {shipment.customsVatAmount ? formatCurrency(shipment.customsVatAmount) : '—'}
              </span>
            </div>

            <div className="p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Container Deposit</span>
              <strong className="text-sm font-extrabold text-slate-900">
                {shipment.doSecurityDeposit?.amount ? formatCurrency(shipment.doSecurityDeposit.amount) : '—'}
              </strong>
              <span className="text-[10px] text-slate-500 block truncate">
                Status: {shipment.doSecurityDeposit?.status || 'None'}
              </span>
            </div>
          </div>

          {/* Structured Summary Information Grid */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. Consignment & Dealer */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Consignment & Dealer
              </span>
              <div className="space-y-1">
                <div><span className="text-slate-500">Dealer:</span> <strong className="text-sky-800 font-bold">{shipment.dealerName || '—'}</strong></div>
                <div><span className="text-slate-500">Lot No:</span> <strong className="font-mono text-purple-800 font-bold">{shipment.lotNo || '—'}</strong></div>
                <div><span className="text-slate-500">CCT Ref:</span> <strong className="font-mono text-emerald-800">{shipment.cctRefNo || shipment.id}</strong></div>
              </div>
            </div>

            {/* 2. Customer & Shipper */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Customer & Shipper
              </span>
              <div className="space-y-1">
                <div className="truncate"><span className="text-slate-500">Customer (Importer):</span> <strong className="text-slate-800 font-bold" title={shipment.consignee}>{shipment.consignee || '—'}</strong></div>
                <div className="truncate"><span className="text-slate-500">Shipper (Exporter):</span> <strong className="text-slate-800" title={shipment.shipper}>{shipment.shipper || '—'}</strong></div>
                <div className="truncate"><span className="text-slate-500">Shipping Line:</span> <strong className="text-blue-800 font-bold">{shipment.shippingLine || '—'}</strong></div>
              </div>
            </div>

            {/* 3. Vessel & Route */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Vessel & Routing
              </span>
              <div className="space-y-1">
                <div className="truncate"><span className="text-slate-500">Vessel / Voyage:</span> <strong className="text-slate-800 font-bold">{shipment.vessel || '—'} {shipment.voyage ? `(${shipment.voyage})` : ''}</strong></div>
                <div className="truncate"><span className="text-slate-500">POL &rarr; POD:</span> <strong className="text-slate-800">{shipment.pol || '—'} &rarr; {shipment.pod || '—'}</strong></div>
                <div className="truncate"><span className="text-slate-500">Final Destination:</span> <strong className="text-slate-800">{shipment.finalDestination || '—'}</strong></div>
              </div>
            </div>

            {/* 4. Cargo & Weights */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Cargo Specifications
              </span>
              <div className="space-y-1">
                <div className="truncate"><span className="text-slate-500">Cargo:</span> <strong className="text-slate-800" title={shipment.cargoDescription}>{shipment.cargoDescription || '—'}</strong></div>
                <div><span className="text-slate-500">Gross / Vol:</span> <strong className="text-slate-800">{shipment.grossWeightKg ? `${shipment.grossWeightKg} KG` : '—'} {shipment.volumeCbm ? `/ ${shipment.volumeCbm} CBM` : ''}</strong></div>
                <div><span className="text-slate-500">Packages:</span> <strong className="text-slate-800">{shipment.totalPackages || '—'}</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CLICKABLE ACCORDIONS UNDER THAT SUMMARY (6 REQUIRED SECTIONS)              */}
        {/* ========================================================================= */}

        {/* 1. BL Consignment Documents */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('consignmentDocs')}
            className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer select-none text-left border-b border-transparent"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Paperclip size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    BL Consignment Documents
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {uploadedDocsCount} / 2 Ready
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  BL Draft & Original BL uploads (Compressed to ≤ 150 KB)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[11px] font-medium hidden sm:inline">
                {sectionsOpen.consignmentDocs ? 'Collapse' : 'Expand'}
              </span>
              {sectionsOpen.consignmentDocs ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </button>

          {sectionsOpen.consignmentDocs && (
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BL_ATTACHMENT_SLOTS.map(({ key, label }) => {
                  const doc = (shipment.blDocuments || {})[key];
                  const isImage = (doc?.type || '').startsWith('image/') || doc?.kind === 'image';
                  const slotState = uploadStatus[key] || 'idle';
                  const isBusy = slotState !== 'idle';
                  const errorMsg = uploadError[key];

                  return (
                    <div
                      key={key}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleSlotDrop(key, e)}
                      className={`p-3.5 rounded-xl border transition-all ${
                        doc ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        ref={el => fileInputRefs.current[key] = el}
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleSlotPick(key, e)}
                        style={{ display: 'none' }}
                      />

                      <div className="flex items-center justify-between gap-2 mb-2">
                        <strong className="text-[11px] font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                          <Paperclip size={13} className={doc ? 'text-emerald-600' : 'text-slate-400'} />
                          {label}
                        </strong>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              doc ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {doc ? 'RECEIVED' : 'PENDING'}
                          </span>
                          {!doc && !isBusy && (
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[key]?.click()}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md transition-colors"
                            >
                              <Upload size={11} /> Upload
                            </button>
                          )}
                        </div>
                      </div>

                      {isBusy && (
                        <div className="flex items-center gap-2 p-2.5 my-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                          <Loader2 size={14} className="animate-spin text-blue-600 shrink-0" />
                          <span>{slotState === 'compressing' ? 'Compressing to ≤ 150 KB…' : 'Uploading to Cloud Storage…'}</span>
                        </div>
                      )}

                      {errorMsg && (
                        <div className="flex items-center gap-1.5 p-2 my-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                          <AlertTriangle size={13} className="shrink-0" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      {doc && !isBusy ? (
                        <div className="flex items-center gap-3 mt-1.5">
                          {isImage ? (
                            <a href={doc.url} target="_blank" rel="noreferrer" title="Open full size image">
                              <img
                                src={doc.url}
                                alt={`${label} preview`}
                                className="w-14 h-14 object-cover rounded-lg border border-emerald-300 bg-white hover:opacity-90 shadow-xs"
                              />
                            </a>
                          ) : (
                            <a href={doc.url} target="_blank" rel="noreferrer" title="Open PDF document" className="w-14 h-14 rounded-lg border border-emerald-300 bg-white flex items-center justify-center shrink-0 hover:bg-emerald-100 transition-colors">
                              <FileText size={24} className="text-emerald-700" />
                            </a>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold text-emerald-950 truncate" title={doc.name}>
                              {doc.name}
                            </div>
                            <div className="text-[10px] text-emerald-700">
                              {formatFileSize(doc.size)}
                              {doc.originalSize > doc.size ? ` (compressed from ${formatFileSize(doc.originalSize)})` : ''}
                              {doc.pages ? ` · ${doc.pages} page(s)` : ''}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {doc.uploadedBy} · {formatDateTime(doc.uploadedAt)}
                            </div>

                            <div className="flex items-center gap-2 mt-2 no-print">
                              <a
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded border border-emerald-300 transition-colors"
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Eye size={11} /> View
                              </a>
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[key]?.click()}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-300 transition-colors"
                                title={`Replace ${label}`}
                              >
                                <Upload size={11} /> Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSlotRemove(key)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 transition-colors"
                                title={`Remove ${label}`}
                              >
                                <Trash2 size={11} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : !isBusy ? (
                        <div className="mt-1">
                          <div 
                            onClick={() => fileInputRefs.current[key]?.click()}
                            className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-lg p-3 text-center cursor-pointer transition-all group"
                          >
                            <div className="flex items-center justify-center gap-1.5 text-blue-600 group-hover:text-blue-700 font-bold text-xs mb-0.5">
                              <Upload size={14} />
                              <span>Click to Upload {label}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 m-0">
                              Select or drag PDF / Image (auto-compressed to ≤ 150 KB)
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Status Update Audit Trail */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('auditTrail')}
            className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer select-none text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <History size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Status Update Audit Trail
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {(shipment.statusHistory || []).length} update(s)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Chronological history of status updates, answers, and audit details
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[11px] font-medium hidden sm:inline">
                {sectionsOpen.auditTrail ? 'Collapse' : 'Expand'}
              </span>
              {sectionsOpen.auditTrail ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </button>

          {sectionsOpen.auditTrail && (
            <div className="p-4 border-t border-slate-100 bg-white">
              {(shipment.statusHistory || []).length === 0 ? (
                <p className="text-xs text-slate-500 m-0 py-2">
                  No status audit records logged yet. Progress the status above to create audit entries.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {[...(shipment.statusHistory || [])].reverse().map((entry, idx) => {
                    const isPresentStatus = entry.status === shipment.customsStatus;

                    return (
                      <div key={`${entry.at}-${idx}`} className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-bold text-blue-900">{entry.stageLabel || entry.status}</strong>
                            {isPresentStatus ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                Current Active
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Passed Milestone
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-500">{formatDateTime(entry.at)}</span>
                            <button
                              type="button"
                              onClick={() => handleEditAuditTrailEntry(entry)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-blue-800 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-300 px-2 py-0.5 rounded transition-all cursor-pointer shadow-2xs"
                              title="Edit recorded details for this stage (Password: abcd)"
                            >
                              <Edit3 size={11} className="text-blue-600" />
                              <span>Edit Details</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 mt-1">
                          Updated by <strong>{entry.by}</strong>
                          {entry.byRole ? ` (${entry.byRole})` : ''}
                          {entry.containerNo ? ` • Container ${entry.containerNo}` : ''}
                          {entry.lastEditedAt && (
                            <span className="text-[10px] text-purple-700 block mt-0.5 font-medium">
                              (Edited on {formatDateTime(entry.lastEditedAt)} by {entry.lastEditedBy})
                            </span>
                          )}
                        </div>

                        {(entry.details || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(entry.details || []).map((detail) => (
                              <span
                                key={detail.key}
                                className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700"
                              >
                                {detail.label}: <strong>{detail.value}</strong>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Demurrage & Port Storage Shield Status */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('shieldStatus')}
            className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer select-none text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                metrics.overallRisk === 'SAFE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                <ShieldAlert size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Demurrage & Port Storage Shield Status
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    metrics.overallRisk === 'SAFE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {metrics.overallRisk}
                  </span>
                  {metrics.totalIncurredPenalty > 0 && (
                    <span className="text-[10px] font-extrabold bg-red-600 text-white px-2 py-0.5 rounded-full">
                      Penalties: {formatCurrency(metrics.totalIncurredPenalty)}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500">
                  {metrics.riskMessage}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[11px] font-medium hidden sm:inline">
                {sectionsOpen.shieldStatus ? 'Collapse' : 'Expand'}
              </span>
              {sectionsOpen.shieldStatus ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </button>

          {sectionsOpen.shieldStatus && (
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className={`p-3.5 rounded-xl border mb-3 ${
                metrics.overallRisk === 'OVERDUE'
                  ? 'bg-red-50 border-red-300 text-red-900'
                  : metrics.overallRisk === 'CRITICAL'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : metrics.overallRisk === 'APPROACHING'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}>
                <p className="text-xs font-medium m-0">{metrics.riskMessage}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Port Free Storage</span>
                  <strong className="text-sm text-slate-800">{shipment.portFreeDays || 5} Days</strong>
                  <div className="text-[11px] text-slate-600 mt-0.5">Expires: {formatDate(metrics.portExpiryDate)}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Port Days Remaining</span>
                  <strong className={`text-sm ${metrics.portDaysLeft <= 2 ? 'text-red-700 font-extrabold' : 'text-slate-800'}`}>
                    {metrics.portDaysLeft !== null ? `${metrics.portDaysLeft} Days` : '—'}
                  </strong>
                  <div className="text-[11px] text-slate-600 mt-0.5">Discharge: {formatDate(shipment.dischargeDate)}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Line D&D Free Time</span>
                  <strong className="text-sm text-slate-800">{shipment.lineFreeDays || 14} Days</strong>
                  <div className="text-[11px] text-slate-600 mt-0.5">Cutoff: {formatDate(metrics.lineExpiryDate)}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">DO Validity Expiry</span>
                  <strong className={`text-sm ${metrics.isDoExpiringSoon ? 'text-red-600 font-extrabold' : 'text-slate-800'}`}>
                    {shipment.doValidityDate ? formatDate(shipment.doValidityDate) : 'Not specified'}
                  </strong>
                  <div className="text-[11px] text-slate-600 mt-0.5">DO No: {shipment.doNumber || '—'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Customs Assessment, Duty & Security Deposit Reconciliation */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('customsRecon')}
            className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer select-none text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <DollarSign size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Customs Assessment, Duty & Security Deposit Reconciliation
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    BOE: {shipment.customsDeclarationNo || 'Pending'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Bill of Entry declaration, HS tariff code, customs duties & container deposit
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[11px] font-medium hidden sm:inline">
                {sectionsOpen.customsRecon ? 'Collapse' : 'Expand'}
              </span>
              {sectionsOpen.customsRecon ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </button>

          {sectionsOpen.customsRecon && (
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Customs Declaration (BOE)</span>
                  <strong className="font-mono text-sm text-blue-900">{shipment.customsDeclarationNo || 'Unfiled'}</strong>
                  <div className="text-[11px] text-slate-500 mt-0.5">Filed: {formatDate(shipment.customsDeclarationDate)}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">HS Tariff Code</span>
                  <strong className="font-mono text-sm text-slate-800">{shipment.hsCode || '—'}</strong>
                  <div className="text-[11px] text-slate-500 mt-0.5">Inspection: {shipment.inspectionType || 'Standard'}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assessed Customs Duty</span>
                  <strong className="text-sm font-bold text-slate-900">{formatCurrency(shipment.customsDutyAmount)}</strong>
                  <div className="text-[11px] text-slate-500 mt-0.5">+ VAT: {formatCurrency(shipment.customsVatAmount)}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Shipping Line Container Deposit</span>
                  <strong className="text-sm font-bold text-slate-900">
                    {formatCurrency(shipment.doSecurityDeposit?.amount)}
                  </strong>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      shipment.doSecurityDeposit?.status === 'Refunded'
                        ? 'bg-green-100 text-green-800'
                        : shipment.doSecurityDeposit?.status === 'Claimed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {shipment.doSecurityDeposit?.status || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Container Equipment & Empty Return Audit */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('containerAudit')}
            className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer select-none text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Box size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Container Equipment & Empty Return Audit ({shipment.containers?.length || 0} Units)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Depot: {shipment.containers?.[0]?.emptyReturnDepot || 'Designated Yard'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Unit tracking, seal audit, port discharge, delivery gate-out & EIR safe return
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[11px] font-medium hidden sm:inline">
                {sectionsOpen.containerAudit ? 'Collapse' : 'Expand'}
              </span>
              {sectionsOpen.containerAudit ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </button>

          {sectionsOpen.containerAudit && (
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="p-2 font-bold">Container No</th>
                      <th className="p-2 font-bold">Type</th>
                      <th className="p-2 font-bold">Seal No</th>
                      <th className="p-2 font-bold">Discharge Date</th>
                      <th className="p-2 font-bold">Gate Out</th>
                      <th className="p-2 font-bold">Empty Returned</th>
                      <th className="p-2 font-bold">EIR Receipt</th>
                      <th className="p-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(shipment.containers || []).map((cont, i) => (
                      <tr key={cont.id || i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-2 font-mono font-bold text-blue-900">{cont.containerNo}</td>
                        <td className="p-2 font-semibold">{cont.sizeType || '40HC'}</td>
                        <td className="p-2 font-mono text-slate-500">{cont.sealNo || '—'}</td>
                        <td className="p-2">{formatDate(cont.dischargeDate || shipment.dischargeDate)}</td>
                        <td className="p-2">
                          {cont.gateOutDate ? (
                            <span className="text-emerald-700 font-medium">{formatDate(cont.gateOutDate)}</span>
                          ) : (
                            <span className="text-amber-700">At Port Yard</span>
                          )}
                        </td>
                        <td className="p-2">
                          {cont.emptyReturnDate ? (
                            <span className="text-emerald-700 font-bold">{formatDate(cont.emptyReturnDate)}</span>
                          ) : (
                            <span className="text-rose-700 font-medium">Unreturned</span>
                          )}
                        </td>
                        <td className="p-2 font-mono font-bold">{cont.eirNumber || '—'}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cont.status === 'Empty Returned (Safe)'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {cont.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 6. Verified Shipping & Customs Documents */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('verifiedDocs')}
            className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer select-none text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <FileCheck2 size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Verified Shipping & Customs Documents
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {verifiedDocsCount} / {totalVerifiedDocs} Verified
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Verification checklist for Commercial Invoice, Packing List, CO, and permits
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[11px] font-medium hidden sm:inline">
                {sectionsOpen.verifiedDocs ? 'Collapse' : 'Expand'}
              </span>
              {sectionsOpen.verifiedDocs ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </button>

          {sectionsOpen.verifiedDocs && (
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                {Object.entries(shipment.documents || {}).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      val ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      {val ? '✓' : '✗'}
                    </span>
                    <span className={val ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 7. Operational Notes (If Present) */}
        {shipment.notes && (
          <div className="border border-amber-200 rounded-xl overflow-hidden bg-amber-50/60 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('notes')}
              className="w-full flex items-center justify-between p-3.5 bg-amber-50/60 hover:bg-amber-100/50 transition-colors cursor-pointer select-none text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-200/70 text-amber-900 flex items-center justify-center font-bold">
                  <FileText size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Operational Notes
                  </span>
                  <span className="text-[11px] text-amber-800 block">
                    Special consignment clearance directives and staff instructions
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-amber-700">
                <span className="text-[11px] font-medium hidden sm:inline">
                  {sectionsOpen.notes ? 'Collapse' : 'Expand'}
                </span>
                {sectionsOpen.notes ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
            </button>

            {sectionsOpen.notes && (
              <div className="p-4 border-t border-amber-200/60 bg-amber-50/30 text-xs text-amber-950">
                <p className="m-0 leading-relaxed font-medium">{shipment.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stage Details Edit Modal (For Active Blue Point or Completed Green Stages) */}
      {stageEditModal && (
        <StageDetailsModal
          isOpen={!!stageEditModal}
          stageId={stageEditModal.stageId}
          stageLabel={stageEditModal.stageLabel}
          shipment={shipment}
          initialAnswers={stageEditModal.initialAnswers}
          isCurrentStatus={stageEditModal.isCurrent}
          currentUser={currentUser}
          onClose={() => setStageEditModal(null)}
          onSave={handleSaveStageDetails}
        />
      )}
    </div>
  );
};

export default DossierDrawer;
