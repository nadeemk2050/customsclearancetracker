import React from 'react';
import { 
  X, 
  Printer, 
  Edit3, 
  ShieldAlert, 
  Calendar, 
  MapPin, 
  Ship, 
  FileCheck2, 
  Clock, 
  Box, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  History,
  Paperclip,
  FileText,
  Eye,
  Truck
} from 'lucide-react';
import { formatDate, formatDateTime, formatCurrency } from '../utils/dateUtils';
import { calculateDetentionMetrics } from '../utils/detentionEngine';
import { BL_ATTACHMENT_SLOTS, formatFileSize } from '../services/attachmentService';

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
  onUpdateStatus 
}) => {
  if (!isOpen || !shipment) return null;

  const metrics = calculateDetentionMetrics(shipment);
  const currentStageIndex = STAGES.findIndex(s => s.id === shipment.customsStatus);
  const progressPercent = Math.max(0, Math.min(100, (currentStageIndex / (STAGES.length - 1)) * 100));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '1050px', maxHeight: '92vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold">
              <Ship size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-800 font-mono tracking-tight">
                  BL: {shipment.blNo}
                </h2>
                <span className="carrier-tag text-xs font-bold bg-blue-100 text-blue-900">
                  {shipment.shippingLine}
                </span>
                <span className={`status-badge text-xs`}>
                  {shipment.customsStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full Customs Dossier • Created/Updated: {formatDateTime(shipment.updatedAt)}
                {shipment.updatedBy ? ` • Last update by ${shipment.updatedBy}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handlePrint}
              className="btn btn-outline btn-sm"
              title="Print official customs tracking dossier"
            >
              <Printer size={15} />
              <span>Print Dossier</span>
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
            <button onClick={onClose} className="btn-icon-only text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body space-y-6">
          {/* Visual Milestone Stepper */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                End-to-End Customs & Logistics Progression
              </span>
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
                const isCompleted = idx <= currentStageIndex;
                const isActive = idx === currentStageIndex;

                return (
                  <div
                    key={stage.id}
                    onClick={() => onUpdateStatus(shipment, stage.id)}
                    className={`milestone-step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                    title={`Click to set status to ${stage.label}`}
                  >
                    <div className="step-node">
                      {isCompleted ? <CheckCircle size={16} /> : idx + 1}
                    </div>
                    <span className="step-label">{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BL Consignment Documents — BL Draft / Original BL received */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Paperclip size={14} className="text-blue-700" /> BL Consignment Documents
              </span>
              <span className="text-[11px] font-mono text-slate-500">Compressed to ≤ 150 KB</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BL_ATTACHMENT_SLOTS.map(({ key, label }) => {
                const doc = (shipment.blDocuments || {})[key];
                const isImage = (doc?.type || '').startsWith('image/') || doc?.kind === 'image';

                return (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border ${doc ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{label}</strong>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          doc ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {doc ? 'RECEIVED' : 'PENDING'}
                      </span>
                    </div>

                    {doc ? (
                      <div className="flex items-center gap-3 mt-2">
                        {isImage ? (
                          <a href={doc.url} target="_blank" rel="noreferrer" title="Open full size">
                            <img
                              src={doc.url}
                              alt={`${label} preview`}
                              className="w-14 h-14 object-cover rounded border border-emerald-200 bg-white"
                            />
                          </a>
                        ) : (
                          <span className="w-14 h-14 rounded border border-emerald-200 bg-white flex items-center justify-center shrink-0">
                            <FileText size={22} className="text-emerald-700" />
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-emerald-900 break-words">{doc.name}</div>
                          <div className="text-[10px] text-emerald-700">
                            {formatFileSize(doc.size)}
                            {doc.originalSize > doc.size ? ` (from ${formatFileSize(doc.originalSize)})` : ''}
                            {doc.pages ? ` · ${doc.pages} page(s)` : ''}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {doc.uploadedBy} · {formatDateTime(doc.uploadedAt)}
                          </div>
                        </div>

                        <a className="bl-attach-link no-print" href={doc.url} target="_blank" rel="noreferrer">
                          <Eye size={12} /> View
                        </a>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-2">Not uploaded yet.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit Trail: who changed the status, when, and the answers given */}
          {(shipment.statusHistory || []).length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <History size={14} className="text-blue-700" /> Status Update Audit Trail
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {(shipment.statusHistory || []).length} update(s)
                </span>
              </div>

              <div className="space-y-2">
                {[...(shipment.statusHistory || [])].reverse().map((entry, idx) => (
                  <div key={`${entry.at}-${idx}`} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <strong className="text-xs font-bold text-blue-900">{entry.stageLabel || entry.status}</strong>
                      <span className="text-[11px] font-mono text-slate-500">{formatDateTime(entry.at)}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Updated by <strong>{entry.by}</strong>
                      {entry.byRole ? ` (${entry.byRole})` : ''}
                      {entry.containerNo ? ` • Container ${entry.containerNo}` : ''}
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
                ))}
              </div>
            </div>
          )}

          {/* D&D Loss Prevention Watchdog Alert */}
          <div className={`p-4 rounded-xl border ${
            metrics.overallRisk === 'OVERDUE'
              ? 'bg-red-50 border-red-300 text-red-900'
              : metrics.overallRisk === 'CRITICAL'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : metrics.overallRisk === 'APPROACHING'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className={metrics.overallRisk === 'SAFE' ? 'text-emerald-600' : 'text-red-600'} />
                <strong className="text-sm font-bold uppercase tracking-wide">
                  Demurrage & Port Storage Shield Status: {metrics.overallRisk}
                </strong>
              </div>
              {metrics.totalIncurredPenalty > 0 && (
                <span className="text-sm font-extrabold bg-red-600 text-white px-3 py-1 rounded-full">
                  Accrued Penalties: {formatCurrency(metrics.totalIncurredPenalty)}
                </span>
              )}
            </div>
            <p className="text-xs mt-1 font-medium">{metrics.riskMessage}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-black/10 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Port Free Storage</span>
                <strong>{shipment.portFreeDays || 5} Days</strong>
                <div className="text-[11px] text-slate-600">Expires: {formatDate(metrics.portExpiryDate)}</div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Port Days Remaining</span>
                <strong className={metrics.portDaysLeft <= 2 ? 'text-red-700 text-sm' : 'text-slate-800'}>
                  {metrics.portDaysLeft !== null ? `${metrics.portDaysLeft} Days` : '—'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Line D&D Free Time</span>
                <strong>{shipment.lineFreeDays || 14} Days</strong>
                <div className="text-[11px] text-slate-600">Cutoff: {formatDate(metrics.lineExpiryDate)}</div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">DO Validity Expiry</span>
                <strong className={metrics.isDoExpiringSoon ? 'text-red-600' : 'text-slate-800'}>
                  {shipment.doValidityDate ? formatDate(shipment.doValidityDate) : 'Not specified'}
                </strong>
              </div>
            </div>
          </div>

          {/* Dossier Specifications Grid */}
          <div className="dossier-grid">
            <div className="dossier-item">
              <span>Consignee (Importer)</span>
              <strong>{shipment.consignee || '—'}</strong>
            </div>
            <div className="dossier-item">
              <span>Shipper (Exporter)</span>
              <strong>{shipment.shipper || '—'}</strong>
            </div>
            <div className="dossier-item">
              <span>Vessel / Voyage</span>
              <strong>{shipment.vessel || '—'} {shipment.voyage ? `(${shipment.voyage})` : ''}</strong>
            </div>
            <div className="dossier-item">
              <span>Port of Discharge (POD)</span>
              <strong>{shipment.pod || '—'}</strong>
            </div>
            <div className="dossier-item">
              <span>Port of Loading (POL)</span>
              <strong>{shipment.pol || '—'}</strong>
            </div>
            <div className="dossier-item">
              <span>Final Delivery Destination</span>
              <strong>{shipment.finalDestination || '—'}</strong>
            </div>
            <div className="dossier-item">
              <span>Cargo Description</span>
              <strong>{shipment.cargoDescription || '—'}</strong>
            </div>
            <div className="dossier-item">
              <span>Packages & Quantity</span>
              <strong>{shipment.totalPackages || '—'}</strong>
            </div>
            <div className="dossier-item">
              <span>Gross Weight / Volume</span>
              <strong>
                {shipment.grossWeightKg ? `${shipment.grossWeightKg} KG` : '—'} 
                {shipment.volumeCbm ? ` / ${shipment.volumeCbm} CBM` : ''}
              </strong>
            </div>
          </div>

          {/* Customs Clearance & Finance Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-600" />
              Customs Assessment, Duty & Security Deposit Reconciliation
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Customs Declaration (BOE)</span>
                <strong className="font-mono text-sm text-blue-900">{shipment.customsDeclarationNo || 'Unfiled'}</strong>
                <div className="text-[11px] text-slate-500">Filed: {formatDate(shipment.customsDeclarationDate)}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">HS Tariff Code</span>
                <strong className="font-mono text-sm">{shipment.hsCode || '—'}</strong>
                <div className="text-[11px] text-slate-500">Inspection: {shipment.inspectionType || 'Standard'}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assessed Customs Duty</span>
                <strong className="text-sm font-bold text-slate-900">{formatCurrency(shipment.customsDutyAmount)}</strong>
                <div className="text-[11px] text-slate-500">+ VAT: {formatCurrency(shipment.customsVatAmount)}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Shipping Line Container Deposit</span>
                <strong className="text-sm font-bold text-slate-900">
                  {formatCurrency(shipment.doSecurityDeposit?.amount)}
                </strong>
                <div className="mt-0.5">
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

          {/* Containers Equipment Manifest */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Box size={16} className="text-blue-600" />
                Container Equipment & Empty Return Audit ({shipment.containers?.length || 0} Units)
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Line Depot: {shipment.containers?.[0]?.emptyReturnDepot || 'Designated Yard'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b">
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
                    <tr key={cont.id || i} className="border-b hover:bg-slate-50">
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

          {/* Document Checklist Summary */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <FileCheck2 size={15} />
              Verified Shipping & Customs Documents
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {Object.entries(shipment.documents || {}).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
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

          {/* Operational Notes */}
          {shipment.notes && (
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900">
              <strong className="block mb-0.5 font-bold">Operational Notes:</strong>
              <p>{shipment.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer no-print">
          <button onClick={onClose} className="btn btn-outline">
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
