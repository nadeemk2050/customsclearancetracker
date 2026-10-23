import React, { useMemo, useState, useEffect } from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight
} from 'lucide-react';
import { SwipeableRow } from './SwipeableRow';
import { COMPLETED_STATUS, getStepsRemaining } from '../utils/statusStages';

export const AllBlMasterView = ({ 
  shipments = [], 
  searchQuery = '',
  onViewDossier, 
  onEditShipment,
  onDeleteShipment 
}) => {
  // Client-Side Pagination: strictly 50 BL consignments per page
  const PAGE_SIZE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const [activeOpenRowId, setActiveOpenRowId] = useState(null);

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

  // Reset to page 1 whenever search query changes
  useEffect(() => {
    setCurrentPage(1);
    setActiveOpenRowId(null);
  }, [searchQuery]);

  // Pagination bounds calculation
  const totalItems = filteredShipments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const paginatedShipments = filteredShipments.slice(startIndex, endIndex);

  // BLs still moving through the 9 stages
  const inFieldCount = useMemo(
    () => filteredShipments.filter((s) => s.customsStatus !== COMPLETED_STATUS).length,
    [filteredShipments]
  );

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
    <div className="flex-1 min-h-0 w-full flex flex-col bg-[#070c18] text-slate-100">
      {/* Main Table Scroll Container */}
      <div className="flex-1 min-h-0 overflow-auto bg-[#090e1c]">
        <table className="w-full text-left text-[0.78rem]" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          {/* Table Header: Pure clean column titles */}
          <thead>
            <tr className="bg-[#0d172c] text-slate-400 text-[0.68rem] font-extrabold uppercase tracking-wider">
              <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>#</th>
              <th style={{ ...thStyle, minWidth: '125px' }}>CCT REF NO.</th>
              <th style={{ ...thStyle, minWidth: '134px' }}>BL NUMBER</th>
              <th style={{ ...thStyle, minWidth: '150px' }}>DEALER NAME</th>
              <th style={{ ...thStyle, minWidth: '110px' }}>LOT NO.</th>
              <th style={{ ...thStyle, minWidth: '112px' }}>VESSEL</th>
              <th style={{ ...thStyle, minWidth: '130px' }}>CUSTOMER</th>
              <th style={{ ...thStyle, minWidth: '104px' }}>CONTAINERS</th>
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

          {/* Table Body with Gesture-Based Swipeable Rows */}
          <tbody>
            {paginatedShipments.length === 0 ? (
              <tr>
                <td colSpan="14" className="py-16 text-center text-slate-500 font-medium">
                  No BL consignments found matching "{searchQuery}".
                </td>
              </tr>
            ) : (
              paginatedShipments.map((s, idx) => {
                const globalIndex = startIndex + idx + 1;
                const containerNumbers = (s.containers || [])
                  .map(c => c.containerNumber || c.containerNo)
                  .filter(Boolean);
                const containerCount = (s.containers || []).length || containerNumbers.length;

                const vesselDisplay = s.vessel 
                  ? `${s.vessel} ${s.voyage || ''}`.trim() 
                  : (s.shippingLine || '—');

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
                  <SwipeableRow
                    key={s.id || s.blNo || idx}
                    rowId={s.id}
                    isOpen={activeOpenRowId === s.id}
                    onOpenChange={(id) => setActiveOpenRowId(id)}
                    className={idx % 2 === 0 ? 'bg-[#0b1120]' : 'bg-[#070c18]'}
                    onClick={() => {
                      if (onViewDossier) onViewDossier(s);
                      else if (onEditShipment) onEditShipment(s);
                    }}
                    onRemove={() => {
                      if (onDeleteShipment) {
                        onDeleteShipment(s.id, true);
                      }
                    }}
                    onEditView={() => {
                      if (onViewDossier) onViewDossier(s);
                      else if (onEditShipment) onEditShipment(s);
                    }}
                  >
                    {/* 1. Row Index (# only, clean number) */}
                    <td className="px-3 py-2 text-slate-500 font-semibold text-center select-none border-b border-slate-800/80">
                      {globalIndex}
                    </td>

                    {/* 2. CCT REF NO */}
                    <td className="px-3 py-2 border-b border-slate-800/80">
                      <span className="text-emerald-400 font-extrabold font-mono text-[0.76rem] tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 inline-block">
                        {s.cctRefNo || s.id || 'CCT-PENDING'}
                      </span>
                    </td>

                    {/* 3. BL NUMBER */}
                    <td className="px-3 py-2 border-b border-slate-800/80">
                      <span className="text-amber-400 font-extrabold font-mono text-[0.78rem] tracking-wide underline decoration-amber-400/40">
                        {s.blNo || 'BL-PENDING'}
                      </span>
                    </td>

                    {/* 4. DEALER NAME */}
                    <td className="px-3 py-2 border-b border-slate-800/80">
                      {s.dealerName ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Briefcase size={13} className="text-sky-400 shrink-0" />
                          <span className="text-sky-400 font-bold text-[0.78rem] tracking-tight">
                            {s.dealerName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* 5. LOT NO */}
                    <td className="px-3 py-2 border-b border-slate-800/80">
                      {s.lotNo ? (
                        <span className="text-purple-400 font-mono font-extrabold text-[0.75rem] bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30 tracking-wide inline-block">
                          {s.lotNo}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* 6. VESSEL */}
                    <td className="px-3 py-2 text-slate-300 font-medium border-b border-slate-800/80">
                      {vesselDisplay}
                    </td>

                    {/* 7. CUSTOMER */}
                    <td className="px-3 py-2 text-white font-extrabold uppercase border-b border-slate-800/80">
                      {s.consignee || '—'}
                    </td>

                    {/* 8. CONTAINERS */}
                    <td className="px-3 py-2 border-b border-slate-800/80">
                      <span
                        className={'container-count-chip' + (containerCount === 0 ? ' is-empty' : '')}
                        title={containerNumbers.length > 0 ? containerNumbers.join(', ') : 'No containers recorded'}
                      >
                        <strong>{containerCount}</strong>
                        <span>{containerCount === 1 ? 'Unit' : 'Units'}</span>
                      </span>
                    </td>

                    {/* 9. NET WEIGHT */}
                    <td className="px-3 py-2 text-slate-300 font-mono border-b border-slate-800/80">
                      {netWeightDisplay}
                    </td>

                    {/* 10. PORT OF LOADING */}
                    <td className="px-3 py-2 text-slate-400 border-b border-slate-800/80">
                      {polDisplay}
                    </td>

                    {/* 11. ETA (ARRIVAL) */}
                    <td className="px-3 py-2 text-slate-400 font-mono border-b border-slate-800/80">
                      {etaDisplay}
                    </td>

                    {/* 12. DATE ADDED */}
                    <td className="px-3 py-2 text-slate-400 font-mono border-b border-slate-800/80">
                      {dateAddedDisplay}
                    </td>

                    {/* 13. STATUS */}
                    <td className="px-3 py-2 border-b border-slate-800/80">
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          letterSpacing: '0.02em',
                          whiteSpace: 'nowrap',
                          ...statusBadgeStyle
                        }}
                      >
                        {rawStatus}
                      </span>
                    </td>

                    {/* 14. STEPS REMAINING */}
                    <td className="px-3 py-2 border-b border-slate-800/80">
                      <div
                        className="steps-cell"
                        title={`Phase ${progress.completed} of ${progress.total}${progress.nextStage ? ' — next: ' + progress.nextStage.label : ' — Progression complete'}`}
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
                  </SwipeableRow>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Control Bar: Exactly 50 BLs per page */}
      <div className="bg-[#0d172c] border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        {/* Left: Professional Count Label */}
        <div>
          Showing <span className="text-white font-bold">{totalItems === 0 ? 0 : startIndex + 1}</span>–<span className="text-white font-bold">{endIndex}</span> of <span className="text-white font-extrabold">{totalItems}</span> BL Consignments <span className="text-slate-500 font-medium">(50 BLs per page)</span>
        </div>

        {/* Right: Pagination Controls */}
        <div className="flex items-center gap-1.5">
          <span className="mr-2 text-slate-400 text-xs">
            Page <strong className="text-sky-400">{currentPage}</strong> of <strong className="text-slate-200">{totalPages}</strong>
          </span>

          {/* First Page */}
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={`p-1.5 rounded border ${currentPage === 1 ? 'bg-slate-900/60 text-slate-600 border-slate-800 cursor-not-allowed' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'}`}
            title="First Page"
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border ${currentPage === 1 ? 'bg-slate-900/60 text-slate-600 border-slate-800 cursor-not-allowed' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'}`}
          >
            <ChevronLeft size={14} />
            <span>Prev</span>
          </button>

          {/* Page Number Chips */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              return (
                <React.Fragment key={p}>
                  {prev && p - prev > 1 && (
                    <span className="text-slate-600 px-1 text-xs">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${currentPage === p ? 'bg-sky-600 text-white border-sky-400 shadow-sm' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'}`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}

          {/* Next Page */}
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border ${currentPage === totalPages ? 'bg-slate-900/60 text-slate-600 border-slate-800 cursor-not-allowed' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'}`}
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={`p-1.5 rounded border ${currentPage === totalPages ? 'bg-slate-900/60 text-slate-600 border-slate-800 cursor-not-allowed' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'}`}
            title="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllBlMasterView;
