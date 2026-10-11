import React from 'react';
import { 
  Package, 
  Anchor, 
  Clock, 
  AlertOctagon, 
  Receipt, 
  CheckCircle2, 
  Coins 
} from 'lucide-react';
import { formatCurrency } from '../utils/dateUtils';

export const KpiMetrics = ({ fleetMetrics, onPresetFilter }) => {
  return (
    <section className="kpi-strip-bar" aria-label="Key Performance Indicators">
      {/* 1. Active Operations */}
      <div 
        className="kpi-chip blue cursor-pointer"
        onClick={() => onPresetFilter('all')}
        title="Click to view all shipments"
      >
        <span className="chip-accent blue"></span>
        <div className="flex items-center gap-1.5 min-w-0">
          <Package size={14} className="text-blue-600 shrink-0" />
          <span className="chip-label">Active Shipments</span>
        </div>
        <span className="chip-value">
          {fleetMetrics.activeShipments} <span className="text-slate-400 font-normal text-xs">/ {fleetMetrics.totalShipments}</span>
        </span>
      </div>

      {/* 2. Containers In Port Yard */}
      <div 
        className="kpi-chip amber cursor-pointer"
        onClick={() => onPresetFilter('in-port')}
        title="Click to view containers still inside port terminal"
      >
        <span className="chip-accent amber"></span>
        <div className="flex items-center gap-1.5 min-w-0">
          <Anchor size={14} className="text-amber-600 shrink-0" />
          <span className="chip-label">Port Yard Holdings</span>
        </div>
        <span className="chip-value">
          {fleetMetrics.containersInPort} <span className="text-slate-400 font-normal text-xs">TEU</span>
        </span>
      </div>

      {/* 3. Imminent Demurrage / Storage Risk */}
      <div 
        className="kpi-chip red cursor-pointer"
        onClick={() => onPresetFilter('urgent')}
        title="Click to view critical shipments expiring in < 48 hours"
      >
        <span className="chip-accent red"></span>
        <div className="flex items-center gap-1.5 min-w-0">
          <AlertOctagon size={14} className="text-rose-600 shrink-0" />
          <span className="chip-label">Critical Loss Threat</span>
        </div>
        <span className="chip-value text-rose-600">
          {fleetMetrics.totalAtRiskContainers}
        </span>
      </div>

      {/* 4. Customs Inspection / Laboratory Holds */}
      <div 
        className="kpi-chip purple cursor-pointer"
        onClick={() => onPresetFilter('inspection')}
        title="Click to view shipments undergoing customs inspection"
      >
        <span className="chip-accent purple"></span>
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock size={14} className="text-purple-600 shrink-0" />
          <span className="chip-label">Customs Inspections</span>
        </div>
        <span className="chip-value text-purple-700">
          {fleetMetrics.urgentInspectionCount}
        </span>
      </div>

      {/* 5. Security Deposit Claims */}
      <div 
        className="kpi-chip emerald cursor-pointer"
        onClick={() => onPresetFilter('deposit')}
        title="Click to view pending container security deposit refunds"
      >
        <span className="chip-accent emerald"></span>
        <div className="flex items-center gap-1.5 min-w-0">
          <Coins size={14} className="text-emerald-600 shrink-0" />
          <span className="chip-label">Security Deposits</span>
        </div>
        <span className="chip-value text-emerald-700">
          {formatCurrency(fleetMetrics.depositTotalDueAmount)}
        </span>
      </div>
    </section>
  );
};
