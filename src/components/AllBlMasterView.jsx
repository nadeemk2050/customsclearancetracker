import React, { useMemo } from 'react';
import { Briefcase, CheckCircle2 } from 'lucide-react';
import { COMPLETED_STATUS, getStepsRemaining, TOTAL_STATUS_STAGES } from '../utils/statusStages';

export const AllBlMasterView = ({ 
  shipments = [], 
  searchQuery = '',
  onViewDossier, 
  onEditShipment 
}) => {
  const handleRowClick = (e, s) => {
    // If user is selecting text, avoid accidental drawer opening
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return;
    }
    if (onViewDossier) {
      onViewDossier(s);
    } else if (onEditShipment) {
      onEditShipment(s);
    }
  };

  // Filter across all fields
  const filteredShipments = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return shipments;
    return shipments.filter(s => {
      const cct = String(s.cctRefNo || s.id || '').toLowerCase();
      const bl = String(s.blNo || '').toLowerCase();
      const dealer = String(s.dealerName || '').toLowerCase();
      const lot = String(s.lotNo || '').toLowerCase();
      const vessel = String(s.vessel || '').toLowerCase();
      const cust = String(s.consignee || '').toLowerCase();
      const pol = String(s.pol || '').toLowerCase();
      const pod = String(s.pod || '').toLowerCase();
      const status = String(s.customsStatus || '').toLowerCase();
      const containers = (s.containers || []).map(c => String(c.containerNumber || c.containerNo || '')).join(' ').toLowerCase();

      return cct.includes(q) ||
             bl.includes(q) || 
             dealer.includes(q) ||
             lot.includes(q) ||
             vessel.includes(q) || 
             cust.includes(q) || 
             pol.includes(q) || 
             pod.includes(q) || 
             status.includes(q) || 
             containers.includes(q);
    });
  }, [shipments, searchQuery]);

  const thStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    background: '#0d172c',
    padding: '10px 12px',
    textAlign: 'left',
    boxShadow: 'inset 0 -2px 0 #1e293b'
  };

  // BLs still moving through the 9 stages = every BL minus the ones already returned
  const inFieldCount = useMemo(
    () => filteredShipments.filter((s) => s.customsStatus !== COMPLETED_STATUS).length,
    [filteredShipments]
  );

  return (
    <div style={{
      background: '#070c18',
      color: '#f8fafc',
      flex: 1,
      minHeight: 0,
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Table fills the remaining height and scrolls internally */}
      <div 
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          background: '#090e1c'
        }}
      >
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.78rem'
        }}>
          {/* Table Header */}
          <thead>
            <tr style={{
              background: '#0d172c',
              color: '#94a3b8',
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <th style={{ ...thStyle, width: '32px' }}>#</th>
              <th style={{ ...thStyle, minWidth: '125px' }}>CCT REF NO.</th>
              <th style={{ ...thStyle, minWidth: '134px' }}>BL NUMBER</th>
              <th style={{ ...thStyle, minWidth: '150px' }}>DEALER NAME</th>
              <th style={{ ...thStyle, minWidth: '110px' }}>LOT NO.</th>
              <th style={{ ...thStyle, minWidth: '112px' }}>VESSEL</th>
              <th style={{ ...thStyle, minWidth: '130px' }}>CUSTOMER</th>
              <th style={{ ...thStyle, minWidth: '118px' }}>CONTAINER NUMBER(S)</th>
              <th style={{ ...thStyle, minWidth: '80px' }}>NET WEIGHT</th>
              <th style={{ ...thStyle, minWidth: '100px' }}>PORT OF LOADING</th>
              <th style={{ ...thStyle, minWidth: '80px' }}>ETA (ARRIVAL)</th>
              <th style={{ ...thStyle, minWidth: '80px' }}>DATE ADDED</th>
              <th style={{ ...thStyle, minWidth: '120px' }}>STATUS</th>
              <th style={{ ...thStyle, minWidth: '150px' }}>
                <span className="steps-th">
                  <span>STEPS REMAINING</span>
                  <span
                    className={'steps-field-badge' + (inFieldCount === 0 ? ' is-empty' : '')}
                    title={`${filteredShipments.length} BL records minus ${filteredShipments.length - inFieldCount} with Empties Returned`}
                  >
                    <span className="steps-field-dot" />
                    {inFieldCount} in field
                  </span>
                </span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {filteredShipments.length === 0 ? (
              <tr>
                <td colSpan="14" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                  No BL consignments found matching "{searchQuery}".
                </td>
              </tr>
            ) : (
              filteredShipments.map((s, idx) => {
                const containerNumbers = (s.containers || [])
                  .map(c => c.containerNumber || c.containerNo)
                  .filter(Boolean);

                const containerDisplay = containerNumbers.length > 0 
                  ? containerNumbers.join(', ') 
                  : '—';

                const vesselDisplay = s.vessel 
                  ? `${s.vessel} ${s.voyage || ''}`.trim() 
                  : (s.shippingLine || '—');

                // Determine display status and color style
                const rawStatus = s.customsStatus || 'Active';
                const isCleared = rawStatus === 'Customs Cleared' || rawStatus === 'Delivered' || rawStatus === 'Empties Returned';
                const isDelivered = rawStatus === 'Delivery Taken' || rawStatus === 'Gate Out';
                
                let statusBadgeStyle = {
                  background: 'rgba(217, 119, 6, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  color: '#fbbf24'
                };

                if (isCleared) {
                  statusBadgeStyle = {
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    color: '#34d399'
                  };
                } else if (isDelivered) {
                  statusBadgeStyle = {
                    background: 'rgba(245, 158, 11, 0.25)',
                    border: '1px solid #f59e0b',
                    color: '#fef08a'
                  };
                }

                const netWeightDisplay = s.netWeight || s.grossWeightKg || s.totalPackages || '—';

                const progress = getStepsRemaining(rawStatus);
                const polDisplay = s.pol || '—';
                const etaDisplay = s.eta || s.ata || '—';
                const dateAddedDisplay = (s.createdAt ? s.createdAt.substring(0, 10) : '') || s.dischargeDate || '—';

                return (
                  <tr 
                    key={s.id || s.blNo || idx}
                    onClick={(e) => handleRowClick(e, s)}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      background: idx % 2 === 0 ? '#0b1120' : '#070c18',
                      cursor: 'pointer',
                      transition: 'background 120ms'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#111c35'}
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#0b1120' : '#070c18'}
                    title={`Click to open BL details (${s.blNo || s.cctRefNo || ''})`}
                  >
                    {/* 1. Row Index */}
                    <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 600 }}>
                      {idx + 1}
                    </td>

                    {/* 2. CCT REF NO in Mint / Emerald Monospace Chip */}
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ 
                        color: '#34d399', 
                        fontWeight: 800, 
                        fontFamily: 'monospace',
                        fontSize: '0.76rem',
                        letterSpacing: '0.03em',
                        background: 'rgba(16, 185, 129, 0.12)',
                        padding: '2px 7px',
                        borderRadius: '5px',
                        border: '1px solid rgba(16, 185, 129, 0.28)',
                        display: 'inline-block'
                      }}>
                        {s.cctRefNo || s.id || 'CCT-PENDING'}
                      </span>
                    </td>

                    {/* 3. BL NUMBER in Gold / Amber */}
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ 
                        color: '#fbbf24', 
                        fontWeight: 800, 
                        fontFamily: 'monospace', 
                        fontSize: '0.78rem',
                        letterSpacing: '0.02em',
                        textDecoration: 'underline',
                        textDecorationColor: 'rgba(251, 191, 36, 0.4)'
                      }}>
                        {s.blNo || 'BL-PENDING'}
                      </span>
                    </td>

                    {/* 4. DEALER NAME in Sky Blue */}
                    <td style={{ padding: '8px 10px' }}>
                      {s.dealerName ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Briefcase size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
                          <span style={{ 
                            color: '#38bdf8', 
                            fontWeight: 700, 
                            fontSize: '0.78rem',
                            letterSpacing: '0.01em'
                          }}>
                            {s.dealerName}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: '#475569' }}>—</span>
                      )}
                    </td>

                    {/* 5. LOT NO in Purple Badge */}
                    <td style={{ padding: '8px 10px' }}>
                      {s.lotNo ? (
                        <span style={{ 
                          color: '#c084fc', 
                          fontFamily: 'monospace', 
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          background: 'rgba(192, 132, 252, 0.12)',
                          padding: '2px 8px',
                          borderRadius: '5px',
                          border: '1px solid rgba(192, 132, 252, 0.3)',
                          letterSpacing: '0.02em',
                          display: 'inline-block'
                        }}>
                          {s.lotNo}
                        </span>
                      ) : (
                        <span style={{ color: '#475569' }}>—</span>
                      )}
                    </td>

                    {/* 6. VESSEL */}
                    <td style={{ padding: '8px 10px', color: '#cbd5e1', fontWeight: 500 }}>
                      {vesselDisplay}
                    </td>

                    {/* 7. CUSTOMER in Bold White */}
                    <td style={{ padding: '8px 10px', color: '#ffffff', fontWeight: 800, textTransform: 'uppercase' }}>
                      {s.consignee || '—'}
                    </td>

                    {/* 8. CONTAINER NUMBER(S) in Bright Cyan */}
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ 
                        color: '#38bdf8', 
                        fontFamily: 'monospace', 
                        fontWeight: 700,
                        fontSize: '0.76rem'
                      }}>
                        {containerDisplay}
                      </span>
                    </td>

                    {/* 9. NET WEIGHT */}
                    <td style={{ padding: '8px 10px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                      {netWeightDisplay}
                    </td>

                    {/* 10. PORT OF LOADING */}
                    <td style={{ padding: '8px 10px', color: '#94a3b8' }}>
                      {polDisplay}
                    </td>

                    {/* 11. ETA (ARRIVAL) */}
                    <td style={{ padding: '8px 10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {etaDisplay}
                    </td>

                    {/* 12. DATE ADDED */}
                    <td style={{ padding: '8px 10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {dateAddedDisplay}
                    </td>

                    {/* 13. STATUS */}
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                        ...statusBadgeStyle
                      }}>
                        {rawStatus}
                      </span>
                    </td>

                    {/* 14. STEPS REMAINING */}
                    <td style={{ padding: '8px 10px' }}>
                      <div
                        className="steps-cell"
                        title={`Phase ${progress.completed} of ${progress.total}${progress.nextStage ? ' — next: ' + progress.nextStage.label : ' — End-to-End Customs & Logistics Progression complete'}`}
                      >
                        {progress.isComplete ? (
                          <span className="steps-chip is-done">
                            <CheckCircle2 size={11} />
                            Completed
                          </span>
                        ) : (
                          <span className={'steps-chip' + (progress.remaining <= 3 ? ' is-critical' : '')}>
                            <strong>{progress.remaining}</strong>
                            <span className="steps-chip-total">/{progress.total}</span>
                            <span className="steps-chip-text">
                              {progress.remaining === 1 ? 'step left' : 'steps left'}
                            </span>
                          </span>
                        )}
                        <span className="steps-track">
                          <span
                            className={'steps-track-fill' + (progress.isComplete ? ' is-done' : '')}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
