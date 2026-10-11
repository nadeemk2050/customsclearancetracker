import React from 'react';
import { AlertTriangle, Clock, DollarSign, ShieldAlert, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/dateUtils';

export const LossPreventionBanner = ({ fleetMetrics, onFilterUrgent }) => {
  const hasIncurredLoss = fleetMetrics.totalIncurredLoss > 0;
  const hasCriticalRisk = fleetMetrics.totalAtRiskContainers > 0 || fleetMetrics.doExpiringCount > 0;

  return (
    <aside className="prevention-banner" aria-label="Demurrage Loss Prevention Alert">
      <div className="banner-content" style={{ justifyContent: 'flex-start', gap: '12px' }}>
        <div className="radar-indicator">
          <span className="pulse-dot"></span>
        </div>

        <div className="radar-pill-group">
          {hasIncurredLoss ? (
            <div className="radar-pill danger" title="Actual demurrage or storage penalties accumulating today!">
              <DollarSign size={13} />
              <span>Incurred Charges: <strong>{formatCurrency(fleetMetrics.totalIncurredLoss)}</strong></span>
            </div>
          ) : (
            <div className="radar-pill success">
              <span>Zero Incurred Demurrage</span>
            </div>
          )}

          {fleetMetrics.totalAtRiskContainers > 0 && (
            <button 
              onClick={onFilterUrgent}
              className="radar-pill danger cursor-pointer hover:opacity-90 transition"
              title="Click to view containers expiring in less than 48 hours"
            >
              <AlertTriangle size={13} />
              <span>{fleetMetrics.totalAtRiskContainers} Containers &lt; 48h to Expiry</span>
            </button>
          )}

          {fleetMetrics.doExpiringCount > 0 && (
            <div className="radar-pill warning" title="Delivery order validity expiring! Revalidation fees apply if not gated out.">
              <Clock size={13} />
              <span>{fleetMetrics.doExpiringCount} DO Expiring Soon</span>
            </div>
          )}

          {fleetMetrics.unreturnedContainers > 0 && (
            <div className="radar-pill" title="Containers delivered to warehouse but empty box not yet returned to container depot.">
              <AlertCircle size={13} className="text-sky-400" />
              <span>{fleetMetrics.unreturnedContainers} Empties In Field</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
