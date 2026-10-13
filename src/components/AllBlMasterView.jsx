import React, { useState, useMemo } from 'react';
import { Search, Briefcase } from 'lucide-react';

export const AllBlMasterView = ({ 
  shipments = [], 
  onViewDossier, 
  onEditShipment 
}) => {
  const [search, setSearch] = useState('');

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
  const filteredShipments = shipments.filter(s => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
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

  // Aggregate counters for the top bar (record, container and weight sums)
  const totals = useMemo(() => {
    const toNumber = (value) => {
      const parsed = parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return filteredShipments.reduce((acc, s) => {
      acc.containers += (s.containers || []).length;
      acc.netWeight += toNumber(s.netWeight ?? s.grossWeightKg);
      return acc;
    }, { containers: 0, netWeight: 0 });
  }, [filteredShipments]);

  const counterStyle = {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '6px',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap'
  };

  const thStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    background: '#0d172c',
    padding: '10px 12px',
    textAlign: 'left',
    boxShadow: 'inset 0 -2px 0 #1e293b'
  };

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
      {/* Page Title Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px 16px 12px',
        borderBottom: '1px solid #1e293b',
        background: '#0b1329',
        flexShrink: 0
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '1.15rem',
          fontWeight: 800,
          letterSpacing: '0.14em',
          color: '#f8fafc',
          textTransform: 'uppercase'
        }}>
          ABC TRACKING
        </h1>

        {/* Aggregate counters for the filtered set */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
          <span style={counterStyle}>
            <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{filteredShipments.length}</strong> BLs
          </span>
          <span style={counterStyle}>
            <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>{totals.containers}</strong> Containers
          </span>
          <span style={counterStyle}>
            <strong style={{ color: '#fbbf24', fontSize: '0.95rem' }}>{totals.netWeight.toLocaleString('en-US')}</strong> KG Net Weight
          </span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 16px',
        borderBottom: '1px solid #1e293b',
        background: '#070c18',
        flexShrink: 0
      }}>
        <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '440px' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '14px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#64748b' 
            }} 
          />
          <input
            type="text"
            placeholder="Search bls across all clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: '#0b1329',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '9px 14px 9px 40px',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
              transition: 'border-color 150ms'
            }}
            onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
            onBlur={(e) => e.target.style.borderColor = '#1e293b'}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            color: '#64748b', 
            fontSize: '0.72rem', 
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ 
              display: 'inline-block', 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              background: '#38bdf8' 
            }} />
            Click any row to open BL details & documents
          </span>
        </div>
      </div>

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
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {filteredShipments.length === 0 ? (
              <tr>
                <td colSpan="13" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                  No BL consignments found matching "{search}".
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
