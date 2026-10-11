import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ArrowRight, 
  SlidersHorizontal, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  PlusCircle,
  FileText,
  Ship,
  Box,
  CheckCircle2
} from 'lucide-react';

export const AllBlMasterView = ({ 
  shipments = [], 
  onViewDossier, 
  onEditShipment, 
  onAddNewShipment 
}) => {
  const [search, setSearch] = useState('');
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);
  const isSyncingTop = useRef(false);
  const isSyncingBottom = useRef(false);

  // Filter across all fields
  const filteredShipments = shipments.filter(s => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const bl = String(s.blNo || '').toLowerCase();
    const vessel = String(s.vessel || '').toLowerCase();
    const cust = String(s.consignee || '').toLowerCase();
    const pol = String(s.pol || '').toLowerCase();
    const pod = String(s.pod || '').toLowerCase();
    const status = String(s.customsStatus || '').toLowerCase();
    const containers = (s.containers || []).map(c => String(c.containerNumber || c.containerNo || '')).join(' ').toLowerCase();

    return bl.includes(q) || 
           vessel.includes(q) || 
           cust.includes(q) || 
           pol.includes(q) || 
           pod.includes(q) || 
           status.includes(q) || 
           containers.includes(q);
  });

  // Synchronize top and bottom horizontal scrollbars
  const handleTopScroll = () => {
    if (isSyncingTop.current) {
      isSyncingTop.current = false;
      return;
    }
    if (bottomScrollRef.current && topScrollRef.current) {
      isSyncingBottom.current = true;
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleBottomScroll = () => {
    if (isSyncingBottom.current) {
      isSyncingBottom.current = false;
      return;
    }
    if (topScrollRef.current && bottomScrollRef.current) {
      isSyncingTop.current = true;
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

  // Helper buttons to scroll left / right
  const scrollHorizontally = (amount) => {
    if (bottomScrollRef.current) {
      bottomScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Keep top scrollbar spacer width in sync with table width
  const [tableWidth, setTableWidth] = useState(1600);
  useEffect(() => {
    if (bottomScrollRef.current) {
      setTableWidth(bottomScrollRef.current.scrollWidth);
    }
  }, [filteredShipments]);

  return (
    <div style={{
      background: '#070c18',
      color: '#f8fafc',
      minHeight: '85vh',
      padding: '1.25rem',
      borderRadius: '16px',
      border: '1px solid #1e293b',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      {/* Top Header Bar: Search & Record Counter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Search Bar matching screenshot */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
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

        {/* Right Action & Stats Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onAddNewShipment && (
            <button
              onClick={onAddNewShipment}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
              }}
            >
              <PlusCircle size={14} />
              <span>Add New BL</span>
            </button>
          )}

          {/* Slider Step Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#0b1329', border: '1px solid #1e293b', borderRadius: '8px', padding: '2px 4px' }}>
            <button
              onClick={() => scrollHorizontally(-300)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              title="Slide Left"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Slide</span>
            <button
              onClick={() => scrollHorizontally(300)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              title="Slide Right"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Showing Records Badge matching screenshot */}
          <div style={{
            background: '#172554',
            border: '1px solid #1e40af',
            color: '#93c5fd',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}>
            Showing: <strong>{filteredShipments.length}</strong> records
          </div>
        </div>
      </div>

      {/* TOP Horizontal Sliding Bar */}
      <div 
        ref={topScrollRef}
        onScroll={handleTopScroll}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          height: '14px',
          background: '#0b1329',
          borderRadius: '6px',
          border: '1px solid #1e293b'
        }}
        title="Slide horizontal bar to navigate columns"
      >
        <div style={{ width: `${tableWidth}px`, height: '14px' }} />
      </div>

      {/* Main Table Container with Bottom Horizontal Scroll */}
      <div 
        ref={bottomScrollRef}
        onScroll={handleBottomScroll}
        style={{
          overflowX: 'auto',
          borderRadius: '10px',
          border: '1px solid #1e293b',
          background: '#090e1c'
        }}
      >
        <table style={{
          width: '100%',
          minWidth: '1500px',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.78rem'
        }}>
          {/* Table Header */}
          <thead>
            <tr style={{
              background: '#0d172c',
              borderBottom: '2px solid #1e293b',
              color: '#94a3b8',
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <th style={{ padding: '12px 14px', width: '40px' }}>#</th>
              <th style={{ padding: '12px 14px', minWidth: '160px' }}>BL NUMBER</th>
              <th style={{ padding: '12px 14px', minWidth: '180px' }}>VESSEL</th>
              <th style={{ padding: '12px 14px', minWidth: '170px' }}>CUSTOMER</th>
              <th style={{ padding: '12px 14px', minWidth: '160px' }}>CONTAINER NUMBER(S)</th>
              <th style={{ padding: '12px 14px', minWidth: '100px' }}>NET WEIGHT</th>
              <th style={{ padding: '12px 14px', minWidth: '130px' }}>PORT OF LOADING</th>
              <th style={{ padding: '12px 14px', minWidth: '120px' }}>ETD (DEPARTURE)</th>
              <th style={{ padding: '12px 14px', minWidth: '110px' }}>ETA (ARRIVAL)</th>
              <th style={{ padding: '12px 14px', minWidth: '110px' }}>DATE</th>
              <th style={{ padding: '12px 14px', minWidth: '110px' }}>DATE ADDED</th>
              <th style={{ padding: '12px 14px', minWidth: '130px' }}>STATUS</th>
              <th style={{ padding: '12px 14px', minWidth: '90px', textAlign: 'center' }}>ACTION</th>
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
                const etdDisplay = s.etd || s.departureDate || '—';
                const etaDisplay = s.eta || s.ata || '—';
                const dateDisplay = s.dischargeDate || s.customsDeclarationDate || s.eta || '—';
                const dateAddedDisplay = (s.createdAt ? s.createdAt.substring(0, 10) : '') || s.dischargeDate || '—';

                return (
                  <tr 
                    key={s.id || s.blNo || idx}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      background: idx % 2 === 0 ? '#0b1120' : '#070c18',
                      transition: 'background 120ms'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#111c35'}
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#0b1120' : '#070c18'}
                  >
                    {/* 1. Row Index */}
                    <td style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600 }}>
                      {idx + 1}
                    </td>

                    {/* 2. BL NUMBER in Gold / Amber */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ 
                        color: '#fbbf24', 
                        fontWeight: 800, 
                        fontFamily: 'monospace',
                        fontSize: '0.825rem',
                        letterSpacing: '0.02em'
                      }}>
                        {s.blNo || 'BL-PENDING'}
                      </span>
                    </td>

                    {/* 3. VESSEL */}
                    <td style={{ padding: '12px 14px', color: '#cbd5e1', fontWeight: 500 }}>
                      {vesselDisplay}
                    </td>

                    {/* 4. CUSTOMER in Bold White */}
                    <td style={{ padding: '12px 14px', color: '#ffffff', fontWeight: 800, textTransform: 'uppercase' }}>
                      {s.consignee || '—'}
                    </td>

                    {/* 5. CONTAINER NUMBER(S) in Bright Cyan */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ 
                        color: '#38bdf8', 
                        fontFamily: 'monospace', 
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}>
                        {containerDisplay}
                      </span>
                    </td>

                    {/* 6. NET WEIGHT */}
                    <td style={{ padding: '12px 14px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                      {netWeightDisplay}
                    </td>

                    {/* 7. PORT OF LOADING */}
                    <td style={{ padding: '12px 14px', color: '#94a3b8' }}>
                      {polDisplay}
                    </td>

                    {/* 8. ETD (DEPARTURE) */}
                    <td style={{ padding: '12px 14px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {etdDisplay}
                    </td>

                    {/* 9. ETA (ARRIVAL) */}
                    <td style={{ padding: '12px 14px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {etaDisplay}
                    </td>

                    {/* 10. DATE */}
                    <td style={{ padding: '12px 14px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {dateDisplay}
                    </td>

                    {/* 11. DATE ADDED */}
                    <td style={{ padding: '12px 14px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {dateAddedDisplay}
                    </td>

                    {/* 12. STATUS */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                        ...statusBadgeStyle
                      }}>
                        {rawStatus}
                      </span>
                    </td>

                    {/* 13. ACTION: Open -> Button */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        onClick={() => onViewDossier ? onViewDossier(s) : onEditShipment(s)}
                        style={{
                          background: '#15203b',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 120ms'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2563eb';
                          e.currentTarget.style.borderColor = '#38bdf8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#15203b';
                          e.currentTarget.style.borderColor = '#334155';
                        }}
                        title="Open BL Consignment Details"
                      >
                        <span>Open</span>
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* BOTTOM Horizontal Sliding Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 4px',
          color: '#64748b',
          fontSize: '0.72rem'
        }}
      >
        <span>
          Showing all {filteredShipments.length} active and cleared BL records. Use top/bottom sliders to view all columns.
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => scrollHorizontally(-300)}
            style={{ background: '#0b1329', border: '1px solid #1e293b', color: '#94a3b8', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ChevronLeft size={13} /> Left
          </button>
          <button
            onClick={() => scrollHorizontally(300)}
            style={{ background: '#0b1329', border: '1px solid #1e293b', color: '#94a3b8', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Right <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
