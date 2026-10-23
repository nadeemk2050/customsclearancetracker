import React, { useState, useMemo, useEffect } from 'react';
import { 
  History, 
  Search, 
  ArrowLeft, 
  ShieldCheck, 
  Briefcase, 
  User, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowRight,
  PlusCircle,
  Edit3,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { getLocalLogs, pullLogsFromCloud } from '../services/logService';

export const LogHistoryView = ({ 
  companyId = 'cha_al_mumtaz',
  onBackToAbcTracker 
}) => {
  const [logs, setLogs] = useState(() => getLocalLogs(companyId));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL'); // ALL | CREATE | UPDATE | DELETE
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const PAGE_SIZE = 50; // Strictly limited to 50 logs per page

  // Load and subscribe to permanent log updates
  useEffect(() => {
    // 1. Initial local load
    setLogs(getLocalLogs(companyId));

    // 2. Background pull from cloud vault
    pullLogsFromCloud(companyId).then((merged) => {
      if (Array.isArray(merged) && merged.length > 0) {
        setLogs(merged);
      }
    });

    // 3. Listen to local update events
    const handleLogUpdate = (e) => {
      if (!e.detail || e.detail.companyId === companyId) {
        setLogs(getLocalLogs(companyId));
      }
    };

    window.addEventListener('cct_log_history_updated', handleLogUpdate);
    return () => window.removeEventListener('cct_log_history_updated', handleLogUpdate);
  }, [companyId]);

  // Reset to page 1 if search query or action filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAction]);

  // Filter logs based on search query and action
  const filteredLogs = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return logs.filter((log) => {
      if (selectedAction !== 'ALL' && log.action !== selectedAction) {
        return false;
      }

      if (q) {
        const bl = String(log.blNo || '').toLowerCase();
        const cct = String(log.cctRefNo || '').toLowerCase();
        const dealer = String(log.dealerName || '').toLowerCase();
        const lot = String(log.lotNo || '').toLowerCase();
        const staff = String(log.staffName || '').toLowerCase();
        const summary = String(log.summary || '').toLowerCase();
        const changesText = (log.changes || []).map(c => `${c.label} ${c.oldVal} ${c.newVal}`).join(' ').toLowerCase();

        if (
          !bl.includes(q) &&
          !cct.includes(q) &&
          !dealer.includes(q) &&
          !lot.includes(q) &&
          !staff.includes(q) &&
          !summary.includes(q) &&
          !changesText.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, selectedAction]);

  // Action count stats
  const stats = useMemo(() => {
    const counts = { ALL: logs.length, CREATE: 0, UPDATE: 0, DELETE: 0 };
    logs.forEach(l => {
      if (counts[l.action] !== undefined) counts[l.action]++;
    });
    return counts;
  }, [logs]);

  // Pagination calculation
  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  // Formatter for timestamp
  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    } catch {
      return isoString;
    }
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
    <div className="flex-1 min-h-0 w-full flex flex-col bg-[#070c18] text-slate-100">
      {/* 1. Header Toolbar */}
      <div className="bg-[#0b1329] border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title & Return Button */}
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBackToAbcTracker}
            className="inline-flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/35 text-sky-400 rounded-md px-3 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Return to ABC Consignment Tracking"
          >
            <ArrowLeft size={14} />
            <span>Back to ABC Tracking</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="bg-sky-500/20 border border-sky-400/40 w-8 h-8 rounded-lg flex items-center justify-center text-sky-400">
              <History size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white tracking-tight">
                  Permanent System Log History
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full tracking-wider">
                  <ShieldCheck size={12} />
                  IMMUTABLE AUDIT TRAIL
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Permanent, un-deletable audit trail of every CRUD action (Create, Update, Delete) with staff name & timestamp.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Action Filters & Search Input */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Action Filter Pills */}
          <div className="inline-flex bg-[#090e1c] border border-slate-800 rounded-lg p-0.5 gap-0.5">
            {[
              { id: 'ALL', label: 'All Actions', count: stats.ALL },
              { id: 'CREATE', label: 'Created', count: stats.CREATE, color: 'text-emerald-400' },
              { id: 'UPDATE', label: 'Updated', count: stats.UPDATE, color: 'text-amber-400' },
              { id: 'DELETE', label: 'Deleted', count: stats.DELETE, color: 'text-rose-400' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedAction(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${selectedAction === tab.id ? 'bg-slate-800 font-bold ' + (tab.color || 'text-sky-400') : 'text-slate-400 hover:text-slate-200 font-medium'}`}
              >
                <span>{tab.label}</span>
                <span className="bg-white/10 px-1.5 py-0.2 rounded text-[10px] font-extrabold">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex items-center w-64">
            <Search size={14} className="absolute left-2.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search BL, staff, dealer, changes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#090e1c] border border-slate-800 text-slate-100 rounded-md pl-8 pr-7 py-1.5 text-xs outline-none focus:border-sky-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Log Table (fills available space) */}
      <div className="flex-1 min-h-0 overflow-auto bg-[#090e1c]">
        <table className="w-full border-collapse text-left text-[0.76rem]">
          {/* Table Header: Columns aligned to user request */}
          <thead>
            <tr className="bg-[#0d172c] text-slate-400 text-[0.68rem] font-extrabold uppercase tracking-wider">
              <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>#</th>
              <th style={{ ...thStyle, minWidth: '145px' }}>TIMESTAMP</th>
              <th style={{ ...thStyle, minWidth: '130px' }}>DATE ADDED / MODIFIED</th>
              <th style={{ ...thStyle, minWidth: '110px' }}>TIMES MODIFIED</th>
              <th style={{ ...thStyle, minWidth: '150px' }}>STAFF NAME (WHO DID IT)</th>
              <th style={{ ...thStyle, minWidth: '110px' }}>ACTION TYPE</th>
              <th style={{ ...thStyle, minWidth: '130px' }}>BL NUMBER</th>
              <th style={{ ...thStyle, minWidth: '150px' }}>DEALER NAME</th>
              <th style={{ ...thStyle, minWidth: '110px' }}>LOT NO</th>
              <th style={{ ...thStyle, minWidth: '340px' }}>CHANGES (FROM VALUE ➔ TO VALUE)</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {currentLogs.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-16 text-center text-slate-500 font-medium">
                  No audit log records found matching "{searchQuery}".
                </td>
              </tr>
            ) : (
              currentLogs.map((log, idx) => {
                const globalIndex = startIndex + idx + 1;
                const isExpanded = expandedLogId === log.id;

                // Color-coded Action Pill
                let actionBadgeClass = 'bg-sky-500/15 border-sky-500/40 text-sky-400';
                let ActionIcon = Edit3;

                if (log.action === 'CREATE') {
                  actionBadgeClass = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400';
                  ActionIcon = PlusCircle;
                } else if (log.action === 'UPDATE') {
                  actionBadgeClass = 'bg-amber-500/15 border-amber-500/40 text-amber-400';
                  ActionIcon = Edit3;
                } else if (log.action === 'DELETE') {
                  actionBadgeClass = 'bg-rose-500/20 border-rose-500/50 text-rose-400';
                  ActionIcon = Trash2;
                }

                return (
                  <tr
                    key={log.id || idx}
                    className={`border-b border-slate-800 transition-colors hover:bg-slate-800/40 ${idx % 2 === 0 ? 'bg-[#0b1120]' : 'bg-[#070c18]'}`}
                  >
                    {/* 1. Row Index */}
                    <td className="px-3 py-2 text-slate-500 font-semibold text-center select-none">
                      {globalIndex}
                    </td>

                    {/* 2. Timestamp */}
                    <td className="px-3 py-2 font-mono text-slate-300 text-[0.74rem] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-sky-400" />
                        <span>{formatDateTime(log.timestamp)}</span>
                      </div>
                    </td>

                    {/* 3. Date Added/Modified */}
                    <td className="px-3 py-2 text-[0.74rem]">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-slate-300">
                          <span className="text-slate-500 text-[10px]">Added:</span>
                          <span className="font-mono">{log.dateAdded || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-300">
                          <span className="text-slate-500 text-[10px]">Modified:</span>
                          <span className="font-mono text-slate-400">{log.dateModified || '—'}</span>
                        </div>
                      </div>
                    </td>

                    {/* 4. Times Modified */}
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold border ${log.timesModified > 0 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {log.timesModified === 0 ? 'Initial (0)' : `${log.timesModified} time${log.timesModified > 1 ? 's' : ''}`}
                      </span>
                    </td>

                    {/* 5. Staff Name (who did it) */}
                    <td className="px-3 py-2">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-extrabold shrink-0">
                          {(log.staffName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-slate-100 font-bold text-[0.76rem]">
                            {log.staffName || 'Staff Member'}
                          </div>
                          {log.staffRole && (
                            <div className="text-slate-500 text-[10px]">
                              {log.staffRole}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 6. Action Type */}
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold border tracking-wide whitespace-nowrap ${actionBadgeClass}`}>
                        <ActionIcon size={12} />
                        {log.action === 'CREATE' ? 'BL ADDED' : log.action === 'UPDATE' ? 'BL MODIFIED' : 'BL REMOVED'}
                      </span>
                    </td>

                    {/* 7. BL Number */}
                    <td className="px-3 py-2">
                      <span className="text-amber-400 font-extrabold font-mono text-[0.78rem] tracking-wide">
                        {log.blNo || '—'}
                      </span>
                    </td>

                    {/* 8. Dealer Name */}
                    <td className="px-3 py-2">
                      {log.dealerName && log.dealerName !== '—' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Briefcase size={12} className="text-sky-400 shrink-0" />
                          <span className="text-sky-400 font-bold text-[0.76rem]">
                            {log.dealerName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* 9. Lot No */}
                    <td className="px-3 py-2">
                      {log.lotNo && log.lotNo !== '—' ? (
                        <span className="text-purple-400 font-mono font-extrabold text-[0.74rem] bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30 tracking-wide inline-block">
                          {log.lotNo}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* 10. Changes (From Value ➔ To Value) */}
                    <td className="px-3 py-2">
                      {log.changes && log.changes.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {log.changes.slice(0, isExpanded ? log.changes.length : 2).map((chg, cIdx) => (
                            <div 
                              key={cIdx} 
                              className="inline-flex items-center flex-wrap gap-1.5 bg-slate-800/70 border border-slate-700/70 px-2 py-1 rounded text-[0.72rem]"
                            >
                              <span className="text-slate-400 font-semibold">{chg.label}:</span>
                              <span className="text-rose-400 line-through bg-rose-500/10 px-1 py-0.5 rounded font-mono">
                                {chg.oldVal}
                              </span>
                              <ArrowRight size={11} className="text-sky-400" />
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded font-mono">
                                {chg.newVal}
                              </span>
                            </div>
                          ))}

                          {log.changes.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-sky-400 hover:text-sky-300 text-[11px] font-bold text-left pt-0.5 cursor-pointer"
                            >
                              {isExpanded ? '▲ Show fewer changes' : `▼ +${log.changes.length - 2} more modified fields...`}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs italic">
                          {log.summary || 'Initial record creation / deletion executed.'}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Pagination Footer: strictly limited to 50 logs per page */}
      <div className="bg-[#0d172c] border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        {/* Left: Summary Count */}
        <div>
          Showing <span className="text-white font-bold">{totalItems === 0 ? 0 : startIndex + 1}</span>–<span className="text-white font-bold">{endIndex}</span> of <span className="text-white font-extrabold">{totalItems}</span> Log Entries <span className="text-slate-500 font-medium">(50 logs per page)</span>
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

export default LogHistoryView;
