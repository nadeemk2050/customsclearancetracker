import React, { useEffect, useRef } from 'react';
import { Search, Filter, RotateCcw, ShieldAlert, Clock, AlertTriangle, PackageCheck, Coins, X } from 'lucide-react';

export const FilterToolbar = ({
  searchQuery,
  setSearchQuery,
  selectedLine,
  setSelectedLine,
  selectedStatus,
  setSelectedStatus,
  selectedRisk,
  setSelectedRisk,
  activePreset,
  setActivePreset,
  shippingLines = [],
  onResetFilters,
  shipments = []
}) => {
  const searchInputRef = useRef(null);

  // Keyboard shortcut: Press "/" to focus search box anywhere on dashboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute live count badges for each quick preset pill
  const counts = React.useMemo(() => {
    let all = shipments.length;
    let urgent = 0;
    let portRisk = 0;
    let inspection = 0;
    let unreturned = 0;
    let deposit = 0;
    let completed = 0;

    shipments.forEach(s => {
      const containers = s.containers || [];
      const containersAtPort = containers.filter(c => !c.gateOutDate).length;
      const unreturnedCount = containers.filter(c => !c.emptyReturnDate).length;

      // Approximate check matching App.jsx logic
      if (s.customsStatus === 'Under Inspection') inspection++;
      if (unreturnedCount > 0) unreturned++;
      if (s.doSecurityDeposit && s.doSecurityDeposit.status === 'Deposited') deposit++;
      if (s.customsStatus === 'Empties Returned' || s.customsStatus === 'Delivered') completed++;
    });

    return { all, inspection, unreturned, deposit, completed };
  }, [shipments]);

  return (
    <div className="control-panel">
      {/* Search and Main Filters Row */}
      <div className="search-filter-row">
        {/* Universal Search Input with Instant Clear and Hotkey */}
        <div className="search-input-wrap">
          <Search size={17} className="text-slate-400" />
          <input
            ref={searchInputRef}
            id="search-input"
            type="text"
            className="search-input font-medium"
            placeholder="Search BL, Container, Consignee, Vessel, HS Code... (Press / to focus)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center transition"
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Shipping Line Filter */}
        <select
          id="filter-shipping-line"
          className="filter-select font-semibold"
          value={selectedLine}
          onChange={(e) => {
            setSelectedLine(e.target.value);
            setActivePreset('custom');
          }}
        >
          <option value="ALL">All Shipping Lines ({shippingLines.length})</option>
          {shippingLines.map((line) => (
            <option key={line} value={line}>{line}</option>
          ))}
        </select>

        {/* Customs Status Filter */}
        <select
          id="filter-customs-status"
          className="filter-select font-semibold"
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setActivePreset('custom');
          }}
        >
          <option value="ALL">All Customs Milestones</option>
          <option value="Pre-Arrival">Pre-Arrival</option>
          <option value="DO Taken">DO Taken / Issued</option>
          <option value="Declaration Filed">Customs Declaration Filed</option>
          <option value="Under Inspection">Under Inspection / Lab Test</option>
          <option value="Duty Paid">Duty Paid</option>
          <option value="Customs Cleared">Customs Cleared (OOC)</option>
          <option value="Gate Out">Gate Out / Dispatched</option>
          <option value="Delivered">Delivered at Warehouse</option>
          <option value="Empties Returned">Empties Returned (Closed)</option>
        </select>

        {/* Demurrage Risk Level Filter */}
        <select
          id="filter-risk-level"
          className="filter-select font-semibold"
          value={selectedRisk}
          onChange={(e) => {
            setSelectedRisk(e.target.value);
            setActivePreset('custom');
          }}
        >
          <option value="ALL">All Risk Levels</option>
          <option value="OVERDUE">🚨 Overdue / In Demurrage</option>
          <option value="CRITICAL">⚠️ Critical (&lt; 48 Hours)</option>
          <option value="APPROACHING">⏳ Approaching (3-4 Days)</option>
          <option value="SAFE">✅ Safe (&gt; 4 Days)</option>
          <option value="COMPLETED">🎉 Fully Completed</option>
        </select>

        {/* Reset Filters */}
        <button
          onClick={onResetFilters}
          className="btn btn-outline btn-sm text-slate-600 font-semibold"
          title="Reset all filters to default"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      {/* Quick Action Preset Pills with Live Counters */}
      <div className="preset-pills-row">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Views:</span>

        <button
          onClick={() => setActivePreset('all')}
          className={`preset-pill ${activePreset === 'all' ? 'active' : ''}`}
        >
          <span>All Shipments</span>
          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold ml-1">
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setActivePreset('urgent')}
          className={`preset-pill danger ${activePreset === 'urgent' ? 'active' : ''}`}
        >
          <ShieldAlert size={13} className="text-red-500" />
          <span>Demurrage Alert (&lt; 48h)</span>
        </button>

        <button
          onClick={() => setActivePreset('port-risk')}
          className={`preset-pill warning ${activePreset === 'port-risk' ? 'active' : ''}`}
        >
          <Clock size={13} className="text-amber-500" />
          <span>Port Storage Imminent</span>
        </button>

        <button
          onClick={() => setActivePreset('inspection')}
          className={`preset-pill ${activePreset === 'inspection' ? 'active' : ''}`}
        >
          <AlertTriangle size={13} className="text-purple-500" />
          <span>Customs Inspection Hold</span>
          {counts.inspection > 0 && (
            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-bold ml-1">
              {counts.inspection}
            </span>
          )}
        </button>

        <button
          onClick={() => setActivePreset('unreturned')}
          className={`preset-pill ${activePreset === 'unreturned' ? 'active' : ''}`}
        >
          <Clock size={13} className="text-blue-500" />
          <span>Unreturned Empties</span>
          {counts.unreturned > 0 && (
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold ml-1">
              {counts.unreturned}
            </span>
          )}
        </button>

        <button
          onClick={() => setActivePreset('deposit')}
          className={`preset-pill ${activePreset === 'deposit' ? 'active' : ''}`}
        >
          <Coins size={13} className="text-emerald-500" />
          <span>Deposit Refunds Due</span>
          {counts.deposit > 0 && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold ml-1">
              {counts.deposit}
            </span>
          )}
        </button>

        <button
          onClick={() => setActivePreset('completed')}
          className={`preset-pill ${activePreset === 'completed' ? 'active' : ''}`}
        >
          <PackageCheck size={13} className="text-emerald-600" />
          <span>Completed</span>
        </button>
      </div>
    </div>
  );
};
