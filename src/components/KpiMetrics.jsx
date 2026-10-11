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
    <section className="kpi-grid" aria-label="Key Performance Indicators">
      {/* 1. Active Operations */}
      <div 
        className="kpi-card blue cursor-pointer"
        onClick={() => onPresetFilter('all')}
        title="Click to view all shipments"
      >
        <div className="kpi-info">
          <p>Active Shipments</p>
          <h3>{fleetMetrics.activeShipments} <span className="text-sm font-normal text-slate-400">/ {fleetMetrics.totalShipments}</span></h3>
          <div className="kpi-subtext font-mono">
            {fleetMetrics.totalContainers} total containers in pipeline
          </div>
        </div>
        <div className="kpi-icon-box">
          <Package size={24} />
        </div>
      </div>

      {/* 2. Containers In Port Yard */}
      <div 
        className="kpi-card amber cursor-pointer"
        onClick={() => onPresetFilter('in-port')}
        title="Click to view containers still inside port terminal"
      >
        <div className="kpi-info">
          <p>Port Yard Holdings</p>
          <h3>{fleetMetrics.containersInPort} <span className="text-sm font-normal text-slate-400">TEU</span></h3>
          <div className="kpi-subtext">
            Under customs or awaiting gate-out
          </div>
        </div>
        <div className="kpi-icon-box">
          <Anchor size={24} />
        </div>
      </div>

      {/* 3. Imminent Demurrage / Storage Risk */}
      <div 
        className="kpi-card red cursor-pointer"
        onClick={() => onPresetFilter('urgent')}
        title="Click to view critical shipments expiring in < 48 hours"
      >
        <div className="kpi-info">
          <p>Critical Loss Threat</p>
          <h3 className="text-rose-600">{fleetMetrics.totalAtRiskContainers}</h3>
          <div className="kpi-subtext text-rose-600 font-medium">
            Expiring in &lt; 48h or in penalty
          </div>
        </div>
        <div className="kpi-icon-box">
          <AlertOctagon size={24} />
        </div>
      </div>

      {/* 4. Customs Inspection / Laboratory Holds */}
      <div 
        className="kpi-card purple cursor-pointer"
        onClick={() => onPresetFilter('inspection')}
        title="Click to view shipments undergoing customs inspection or sampling"
      >
        <div className="kpi-info">
          <p>Customs Inspections</p>
          <h3>{fleetMetrics.urgentInspectionCount}</h3>
          <div className="kpi-subtext">
            Physical exam, scanning or lab tests
          </div>
        </div>
        <div className="kpi-icon-box">
          <Clock size={24} />
        </div>
      </div>

      {/* 5. Security Deposit Claims */}
      <div 
        className="kpi-card emerald cursor-pointer"
        onClick={() => onPresetFilter('deposit')}
        title="Click to view pending container security deposit refunds"
      >
        <div className="kpi-info">
          <p>Security Deposits</p>
          <h3>{formatCurrency(fleetMetrics.depositTotalDueAmount)}</h3>
          <div className="kpi-subtext">
            {fleetMetrics.depositRefundsDue} refunds eligible to claim
          </div>
        </div>
        <div className="kpi-icon-box">
          <Coins size={24} />
        </div>
      </div>
    </section>
  );
};
