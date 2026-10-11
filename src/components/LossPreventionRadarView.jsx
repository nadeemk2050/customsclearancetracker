import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Anchor, 
  Truck, 
  Box, 
  CheckCircle,
  FileWarning,
  ExternalLink 
} from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/dateUtils';
import { calculateDetentionMetrics } from '../utils/detentionEngine';

export const LossPreventionRadarView = ({ 
  shipments = [], 
  onViewDossier, 
  onEditShipment 
}) => {
  // Analyze all shipments and sort by urgency
  const urgentShipments = shipments.map(s => ({
    ...s,
    metrics: calculateDetentionMetrics(s)
  })).filter(s => s.metrics.overallRisk === 'OVERDUE' || s.metrics.overallRisk === 'CRITICAL' || s.metrics.overallRisk === 'APPROACHING')
    .sort((a, b) => (a.metrics.portDaysLeft ?? 99) - (b.metrics.portDaysLeft ?? 99));

  const totalIncurred = urgentShipments.reduce((sum, s) => sum + s.metrics.totalIncurredPenalty, 0);
  const totalProjected = urgentShipments.reduce((sum, s) => sum + s.metrics.totalProjectedExposure, 0);

  return (
    <div className="space-y-6">
      {/* Top Threat Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-lg border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-rose-300 text-xs font-bold mb-2 border border-red-500/30">
              <ShieldAlert size={14} className="text-red-400" /> Executive Demurrage & Storage Loss Mitigation Radar
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Container Risk & Financial Exposure Watchdog
            </h2>
            <p className="text-slate-300 text-xs max-w-2xl mt-1">
              Active predictive loss prevention monitoring dual free time countdown clocks, terminal storage slabs, line detention cutoff dates, and delivery order expiry windows.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Incurred Losses</span>
              <strong className="text-2xl font-black text-rose-400 font-mono">
                {formatCurrency(totalIncurred)}
              </strong>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">48h Projected Exposure</span>
              <strong className="text-2xl font-black text-amber-400 font-mono">
                {formatCurrency(totalProjected)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Action List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-rose-600" />
          Urgent Action Matrix ({urgentShipments.length} Shipments Requiring Immediate Intervention)
        </h3>

        {urgentShipments.length === 0 ? (
          <div className="text-center py-10 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle size={36} className="text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-emerald-900 text-sm">All Containers Operating in Safe Free Window!</h4>
            <p className="text-xs text-emerald-700 mt-1">
              Zero containers approaching demurrage or port storage expiration in the next 48 hours.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {urgentShipments.map((s) => {
              const { metrics } = s;

              return (
                <div
                  key={s.id}
                  className={`p-5 rounded-xl border transition ${
                    metrics.overallRisk === 'OVERDUE'
                      ? 'bg-rose-50/70 border-rose-300'
                      : metrics.overallRisk === 'CRITICAL'
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-base font-extrabold text-blue-900">
                          BL: {s.blNo}
                        </strong>
                        <span className="carrier-tag text-xs font-bold">
                          {s.shippingLine}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-white border border-slate-300 text-slate-700">
                          {s.customsStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Consignee: <strong>{s.consignee}</strong> • POD: {s.pod} • Vessel: {s.vessel || 'Nominated'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewDossier(s)}
                        className="btn btn-outline btn-sm bg-white"
                      >
                        <span>View Dossier</span>
                      </button>
                      <button
                        onClick={() => onEditShipment(s)}
                        className="btn btn-primary btn-sm"
                      >
                        <span>Take Action</span>
                      </button>
                    </div>
                  </div>

                  {/* Warning Pill */}
                  <div className="mt-3 p-2.5 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle size={15} className={metrics.overallRisk === 'OVERDUE' ? 'text-rose-600' : 'text-amber-600'} />
                      <span className={metrics.overallRisk === 'OVERDUE' ? 'text-rose-900' : 'text-amber-900'}>
                        {metrics.riskMessage}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] font-mono text-slate-600">
                      <span>Port Days Left: <strong>{metrics.portDaysLeft ?? '—'}</strong></span>
                      <span>Line D&D Days Left: <strong>{metrics.lineDaysLeft ?? '—'}</strong></span>
                      {s.doValidityDate && (
                        <span>DO Expiry: <strong>{formatDate(s.doValidityDate)}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Container List Preview */}
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Containers:</span>
                    {(s.containers || []).map((cont, i) => (
                      <span key={cont.id || i} className="font-mono text-xs px-2 py-0.5 bg-white border rounded text-slate-700">
                        {cont.containerNo} ({cont.sizeType}) — {cont.status}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
