import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Ship, 
  MapPin, 
  Box, 
  Truck, 
  Calendar,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/dateUtils';
import { calculateDetentionMetrics } from '../utils/detentionEngine';

const NEXT_STAGE_MAP = {
  'Pre-Arrival': { next: 'DO Taken', label: 'Take DO' },
  'DO Taken': { next: 'Declaration Filed', label: 'File BOE' },
  'Declaration Filed': { next: 'Duty Paid', label: 'Duty Paid' },
  'Under Inspection': { next: 'Duty Paid', label: 'Duty Paid' },
  'Duty Paid': { next: 'Customs Cleared', label: 'Clear OOC' },
  'Customs Cleared': { next: 'Gate Out', label: 'Gate Out' },
  'Gate Out': { next: 'Delivered', label: 'Delivered' },
  'Delivered': { next: 'Empties Returned', label: 'Empties Returned' }
};

export const ShipmentTable = ({ 
  shipments = [], 
  onViewDossier, 
  onEditShipment, 
  onDeleteShipment,
  onQuickUpdateStatus,
  onQuickContainerReturn
}) => {
  const [expandedRows, setExpandedRows] = useState({});
  const [copiedId, setCopiedId] = useState('');

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pre-Arrival': return 'status-badge pre-arrival';
      case 'DO Taken': return 'status-badge do-issued';
      case 'Declaration Filed': return 'status-badge customs-filed';
      case 'Under Inspection': return 'status-badge inspection';
      case 'Duty Paid': return 'status-badge duty-paid';
      case 'Customs Cleared': return 'status-badge customs-cleared';
      case 'Gate Out': return 'status-badge gate-out';
      case 'Delivered': return 'status-badge delivered';
      case 'Empties Returned': return 'status-badge empty-returned';
      default: return 'status-badge pre-arrival';
    }
  };

  const renderRiskBadge = (daysLeft, isIncurred, penaltyAmount, label) => {
    if (isIncurred) {
      return (
        <span className="risk-badge overdue" title={`Penalty accumulating: ${formatCurrency(penaltyAmount)}`}>
          <AlertTriangle size={12} />
          {label}: {daysLeft}d ({formatCurrency(penaltyAmount)})
        </span>
      );
    }
    if (daysLeft === null) {
      return <span className="text-slate-400 text-xs">—</span>;
    }
    if (daysLeft <= 1) {
      return (
        <span className="risk-badge critical" title="Less than 24-48 hours remaining!">
          <AlertTriangle size={12} />
          {label}: {daysLeft === 0 ? 'Expires TODAY' : '1 Day Left'}
        </span>
      );
    }
    if (daysLeft <= 3) {
      return (
        <span className="risk-badge approaching" title="Action required to prevent demurrage">
          <Clock size={12} />
          {label}: {daysLeft} Days Left
        </span>
      );
    }
    return (
      <span className="risk-badge safe">
        <CheckCircle size={12} />
        {label}: {daysLeft} Days
      </span>
    );
  };

  return (
    <>
    <div className="table-card hidden-on-mobile">
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>BL & Carrier</th>
              <th>Routing & Cargo</th>
              <th>Consignee</th>
              <th>Containers</th>
              <th>Port Storage Clock</th>
              <th>Demurrage Clock</th>
              <th>Customs Stage</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shipments.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Box size={36} className="text-slate-300" />
                    <p className="font-semibold text-slate-600">No shipments matched your search criteria.</p>
                    <p className="text-xs text-slate-400">Try clearing your filters or add a new Bill of Lading.</p>
                  </div>
                </td>
              </tr>
            ) : (
              shipments.map((shipment) => {
                const metrics = calculateDetentionMetrics(shipment);
                const isExpanded = !!expandedRows[shipment.id];
                const containers = shipment.containers || [];
                const nextStage = NEXT_STAGE_MAP[shipment.customsStatus];

                return (
                  <React.Fragment key={shipment.id}>
                    <tr className={isExpanded ? 'expanded-parent' : ''}>
                      {/* Chevron Toggle */}
                      <td>
                        <button
                          onClick={() => toggleRow(shipment.id)}
                          className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
                          title="Expand / collapse containers"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>

                      {/* BL & Carrier */}
                      <td>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span 
                            className="bl-badge cursor-pointer hover:underline"
                            onClick={() => onViewDossier(shipment)}
                            title="Click to view full dossier"
                          >
                            {shipment.blNo}
                          </span>
                          <span 
                            className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                            title="CCT Universal Reference Number"
                          >
                            {shipment.cctRefNo || shipment.id}
                          </span>
                          <button
                            onClick={() => handleCopy(shipment.blNo, shipment.id)}
                            className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition"
                            title="Copy BL Number"
                          >
                            {copiedId === shipment.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                        <div className="carrier-tag">
                          <Ship size={11} />
                          <span>{shipment.shippingLine || 'Carrier TBD'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {shipment.vessel ? `${shipment.vessel} / ${shipment.voyage || ''}` : 'Vessel TBD'}
                        </div>
                        {(shipment.dealerName || shipment.lotNo) && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {shipment.dealerName && (
                              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200" title={`Dealer: ${shipment.dealerName}`}>
                                {shipment.dealerName}
                              </span>
                            )}
                            {shipment.lotNo && (
                              <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200" title={`Lot: ${shipment.lotNo}`}>
                                #{shipment.lotNo}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Routing & Cargo */}
                      <td>
                        <div className="text-xs text-slate-800 font-medium flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          <span>{shipment.pod || 'Discharge Port'}</span>
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5" title={shipment.cargoDescription}>
                          {shipment.cargoDescription || 'General Cargo'}
                        </div>
                        {shipment.hsCode && (
                          <div className="text-[11px] font-mono text-slate-400">
                            HS: {shipment.hsCode}
                          </div>
                        )}
                      </td>

                      {/* Consignee */}
                      <td>
                        <div className="text-xs font-semibold text-slate-800 max-w-xs truncate" title={shipment.consignee}>
                          {shipment.consignee || 'Consignee TBD'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Discharged: {formatDate(shipment.dischargeDate)}
                        </div>
                      </td>

                      {/* Containers Count */}
                      <td>
                        <span 
                          onClick={() => toggleRow(shipment.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 cursor-pointer font-bold text-xs text-slate-700 transition"
                        >
                          <Box size={13} className="text-blue-600" />
                          <span>{containers.length} {containers.length === 1 ? 'Box' : 'Boxes'}</span>
                        </span>
                        {metrics.containersAtPort > 0 ? (
                          <div className="text-[11px] text-amber-700 font-medium mt-1">
                            {metrics.containersAtPort} in port yard
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-700 font-medium mt-1">
                            Gated out of port
                          </div>
                        )}
                      </td>

                      {/* Port Storage Clock */}
                      <td>
                        {renderRiskBadge(
                          metrics.portDaysLeft,
                          metrics.portStorageIncurred > 0,
                          metrics.portStorageIncurred,
                          'Port'
                        )}
                        <div className="text-[11px] text-slate-400 mt-1">
                          Free till: {formatDate(metrics.portExpiryDate)}
                        </div>
                      </td>

                      {/* Shipping Line Demurrage Clock */}
                      <td>
                        {renderRiskBadge(
                          metrics.lineDaysLeft,
                          metrics.lineDetentionIncurred > 0,
                          metrics.lineDetentionIncurred,
                          'Line D&D'
                        )}
                        <div className="text-[11px] text-slate-400 mt-1">
                          Free till: {formatDate(metrics.lineExpiryDate)}
                        </div>
                      </td>

                      {/* Customs Milestone with 1-Click Fast Forward Button */}
                      <td>
                        <div className="flex flex-col gap-1 items-start">
                          <select
                            className={`text-xs font-bold rounded-full px-2.5 py-1 border cursor-pointer outline-none ${getStatusBadgeClass(shipment.customsStatus)}`}
                            value={shipment.customsStatus}
                            onChange={(e) => onQuickUpdateStatus(shipment, e.target.value)}
                          >
                            <option value="Pre-Arrival">Pre-Arrival</option>
                            <option value="DO Taken">DO Taken</option>
                            <option value="Declaration Filed">Declaration Filed</option>
                            <option value="Under Inspection">Under Inspection</option>
                            <option value="Duty Paid">Duty Paid</option>
                            <option value="Customs Cleared">Customs Cleared</option>
                            <option value="Gate Out">Gate Out</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Empties Returned">Empties Returned</option>
                          </select>

                          {/* 1-Click Fast Forward Milestone Button */}
                          {nextStage && (
                            <button
                              onClick={() => onQuickUpdateStatus(shipment, nextStage.next)}
                              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
                              title={`One-click advance to ${nextStage.next}`}
                            >
                              <span>Next: {nextStage.label}</span>
                              <ArrowRight size={11} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onViewDossier(shipment)}
                            className="btn-icon-only text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Open Full Customs Dossier"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => onEditShipment(shipment)}
                            className="btn-icon-only text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition"
                            title="Edit Shipment Details"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => onDeleteShipment(shipment.id)}
                            className="btn-icon-only text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Shipment"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Multi-Container Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="9" className="p-0">
                          <div className="nested-container-panel">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                <Box size={14} className="text-blue-600" />
                                Container Equipment Manifest & Empty Return Status ({containers.length} Units)
                              </h3>
                              <span className="text-xs text-slate-400">
                                Designated Depot: {shipment.containers?.[0]?.emptyReturnDepot || 'Depot Specified on DO'}
                              </span>
                            </div>

                            <div className="container-card-grid">
                              {containers.map((cont, idx) => {
                                const isGatedOut = !!cont.gateOutDate;
                                const isReturned = !!cont.emptyReturnDate;

                                return (
                                  <div key={cont.id || idx} className="container-subcard">
                                    <div className="flex items-center justify-between border-b pb-2 mb-2">
                                      <div className="flex items-center gap-1.5">
                                        <strong className="font-mono text-blue-900 text-sm">
                                          {cont.containerNo}
                                        </strong>
                                        <button
                                          onClick={() => handleCopy(cont.containerNo, cont.id)}
                                          className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                                          title="Copy Container Number"
                                        >
                                          {copiedId === cont.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                        </button>
                                      </div>
                                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                                        {cont.sizeType || '40HC'}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                                      <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Seal Number:</span>
                                        <span className="font-mono">{cont.sealNo || '—'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Discharged:</span>
                                        <span>{formatDate(cont.dischargeDate || shipment.dischargeDate)}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Port Gate-Out:</span>
                                        <span className={isGatedOut ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                                          {isGatedOut ? formatDate(cont.gateOutDate) : 'Still in Port Yard'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Empty Returned:</span>
                                        <span className={isReturned ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-medium'}>
                                          {isReturned ? formatDate(cont.emptyReturnDate) : 'Pending Return'}
                                        </span>
                                      </div>
                                      {cont.eirNumber && (
                                        <div className="col-span-2">
                                          <span className="text-slate-400 block text-[10px] uppercase font-bold">EIR Receipt:</span>
                                          <span className="font-mono font-bold text-slate-800">{cont.eirNumber}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Shortcuts */}
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                      {!isGatedOut && (
                                        <button
                                          onClick={() => onQuickContainerReturn(shipment, cont.id, 'gateOut')}
                                          className="btn btn-outline btn-sm text-xs py-1"
                                          title="Mark container departed from port terminal"
                                        >
                                          <Truck size={12} />
                                          <span>Gate Out</span>
                                        </button>
                                      )}
                                      {!isReturned && (
                                        <button
                                          onClick={() => onQuickContainerReturn(shipment, cont.id, 'emptyReturned')}
                                          className="btn btn-primary btn-sm text-xs py-1"
                                          title="Mark empty box returned to depot with EIR"
                                        >
                                          <CheckCircle size={12} />
                                          <span>Mark Empty Returned</span>
                                        </button>
                                      )}
                                      {isReturned && (
                                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                          <ShieldCheck size={14} /> Safe / Closed
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Mobile card list (shown instead of the table on small screens) */}
    <div className="shipment-card-list">
      {shipments.length === 0 ? (
        <div className="shipment-card-empty">
          <Box size={32} className="text-slate-300" />
          <p className="font-semibold text-slate-600">No shipments matched your search criteria.</p>
          <p className="text-xs text-slate-400">Try clearing your filters or add a new Bill of Lading.</p>
        </div>
      ) : (
        shipments.map((shipment) => {
          const metrics = calculateDetentionMetrics(shipment);
          const containers = shipment.containers || [];
          const nextStage = NEXT_STAGE_MAP[shipment.customsStatus];

          return (
            <article key={shipment.id} className="shipment-card">
              <div className="shipment-card-top">
                <div style={{ minWidth: 0 }}>
                  <div className="flex items-center gap-1.5">
                    <span className="bl-badge" onClick={() => onViewDossier(shipment)}>{shipment.blNo}</span>
                    <button
                      onClick={() => handleCopy(shipment.blNo, shipment.id)}
                      className="text-slate-400 p-0.5"
                      title="Copy BL Number"
                    >
                      {copiedId === shipment.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                  <div className="carrier-tag">
                    <Ship size={11} />
                    <span>{shipment.shippingLine || 'Carrier TBD'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {shipment.vessel ? `${shipment.vessel} / ${shipment.voyage || ''}` : 'Vessel TBD'}
                  </div>
                </div>

                <select
                  className={`text-xs font-bold rounded-full px-2.5 py-1 border cursor-pointer outline-none ${getStatusBadgeClass(shipment.customsStatus)}`}
                  value={shipment.customsStatus}
                  onChange={(e) => onQuickUpdateStatus(shipment, e.target.value)}
                  aria-label="Customs stage"
                >
                  <option value="Pre-Arrival">Pre-Arrival</option>
                  <option value="DO Taken">DO Taken</option>
                  <option value="Declaration Filed">Declaration Filed</option>
                  <option value="Under Inspection">Under Inspection</option>
                  <option value="Duty Paid">Duty Paid</option>
                  <option value="Customs Cleared">Customs Cleared</option>
                  <option value="Gate Out">Gate Out</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Empties Returned">Empties Returned</option>
                </select>
              </div>

              <div className="shipment-card-facts">
                <div>
                  <span>Consignee</span>
                  <strong>{shipment.consignee || '—'}</strong>
                </div>
                <div>
                  <span>Port of discharge</span>
                  <strong>{shipment.pod || '—'}</strong>
                </div>
                <div>
                  <span>Cargo</span>
                  <strong>
                    {shipment.cargoDescription || '—'}
                    {shipment.hsCode ? <em>HS {shipment.hsCode}</em> : null}
                  </strong>
                </div>
                <div>
                  <span>Containers</span>
                  <strong>
                    {containers.length} unit(s) · {metrics.containersAtPort} in port
                  </strong>
                </div>
              </div>

              <div className="shipment-card-clocks">
                <div>
                  <span className="lbl">Port storage</span>
                  {renderRiskBadge(metrics.portDaysLeft, metrics.portStorageIncurred > 0, metrics.portStorageIncurred, 'Port')}
                </div>
                <div>
                  <span className="lbl">Line D&amp;D</span>
                  {renderRiskBadge(metrics.lineDaysLeft, metrics.lineDetentionIncurred > 0, metrics.lineDetentionIncurred, 'Line')}
                </div>
              </div>

              {containers.length > 0 && (
                <div className="shipment-card-containers">
                  {containers.map((cont, idx) => {
                    const isGatedOut = !!cont.gateOutDate;
                    const isReturned = !!cont.emptyReturnDate;

                    return (
                      <div key={cont.id || idx} className="shipment-card-container">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="font-mono text-xs text-blue-900">{cont.containerNo}</strong>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {cont.sizeType || '40HC'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {isGatedOut ? `Gate out ${formatDate(cont.gateOutDate)}` : 'Still in port yard'}
                          {' · '}
                          {isReturned ? `Returned ${formatDate(cont.emptyReturnDate)}` : 'Empty pending'}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {!isGatedOut && (
                            <button
                              onClick={() => onQuickContainerReturn(shipment, cont.id, 'gateOut')}
                              className="btn btn-outline btn-sm"
                            >
                              <Truck size={12} />
                              <span>Gate Out</span>
                            </button>
                          )}
                          {!isReturned && (
                            <button
                              onClick={() => onQuickContainerReturn(shipment, cont.id, 'emptyReturned')}
                              className="btn btn-primary btn-sm"
                            >
                              <CheckCircle size={12} />
                              <span>Empty Returned</span>
                            </button>
                          )}
                          {isReturned && (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              <ShieldCheck size={13} /> Safe / Closed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="shipment-card-actions">
                {nextStage && (
                  <button
                    onClick={() => onQuickUpdateStatus(shipment, nextStage.next)}
                    className="btn btn-outline btn-sm flex-1"
                  >
                    <span>Next: {nextStage.label}</span>
                    <ArrowRight size={12} />
                  </button>
                )}
                <button onClick={() => onViewDossier(shipment)} className="btn btn-primary btn-sm flex-1">
                  <FileText size={13} />
                  <span>Dossier</span>
                </button>
                <button onClick={() => onEditShipment(shipment)} className="btn btn-outline btn-sm btn-icon-only" title="Edit shipment">
                  <Edit3 size={15} />
                </button>
                <button onClick={() => onDeleteShipment(shipment.id)} className="btn btn-danger btn-sm btn-icon-only" title="Delete shipment">
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          );
        })
      )}
    </div>
    </>
  );
};
