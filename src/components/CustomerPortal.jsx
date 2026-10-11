import React, { useState } from 'react';
import { 
  Search, 
  Ship, 
  MapPin, 
  Box, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  Truck,
  ArrowRight
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const PUBLIC_STEPS = [
  'Pre-Arrival',
  'DO Taken',
  'Declaration Filed',
  'Customs Cleared',
  'Gate Out',
  'Delivered'
];

export const CustomerPortal = ({ shipments = [] }) => {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanQuery = query.trim().toUpperCase();
    if (!cleanQuery) return;

    setSearched(true);

    // Search by BL number OR by any container number inside the shipment!
    const found = shipments.find(s => {
      if (s.blNo && s.blNo.toUpperCase() === cleanQuery) return true;
      if (s.containers && s.containers.some(c => c.containerNo && c.containerNo.toUpperCase() === cleanQuery)) return true;
      return false;
    });

    setSearchResult(found || null);
  };

  const getStepProgressIndex = (status) => {
    const idx = PUBLIC_STEPS.indexOf(status);
    if (idx !== -1) return idx;
    if (status === 'Under Inspection' || status === 'Duty Paid') return 2; // During customs
    if (status === 'Empties Returned') return 5;
    return 0;
  };

  return (
    <div>
      {/* Hero Search Section */}
      <section className="portal-hero">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-sky-300 text-xs font-semibold mb-4 border border-blue-400/30">
            <ShieldCheck size={14} /> Real-Time Cargo Tracking & Milestone Assurance
          </div>
          <h2>Track Your Consignment</h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Enter your Bill of Lading (BL) number or Container Number to check customs clearance progression, port discharge, and delivery status.
          </p>

          <form onSubmit={handleSearch} className="portal-search-box">
            <input
              type="text"
              className="portal-search-input"
              placeholder="Enter BL or Container No (e.g. HLCUTOR260620111, FSCU8083274...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary px-6">
              <Search size={18} />
              <span>Track Cargo</span>
            </button>
          </form>

          {/* Quick Clickable Suggestions */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-300 flex-wrap">
            <span className="text-slate-400">Try sample:</span>
            {shipments.slice(0, 3).map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setQuery(s.blNo);
                  setSearched(true);
                  setSearchResult(s);
                }}
                className="underline hover:text-white font-mono"
              >
                {s.blNo}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results View */}
      <div className="app-container py-10">
        {searched && !searchResult && (
          <div className="max-w-xl mx-auto p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
            <AlertCircle size={44} className="text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Shipment Found</h3>
            <p className="text-slate-500 text-xs mt-1">
              We couldn't locate any record matching "<strong>{query}</strong>". Please verify the BL or Container number.
            </p>
          </div>
        )}

        {searchResult && (
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-sky-400 font-bold block mb-1">
                  Bill of Lading Consignment
                </span>
                <h3 className="text-2xl font-black font-mono tracking-tight">{searchResult.blNo}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-300 mt-1 font-mono">
                  <span>Carrier: {searchResult.shippingLine}</span>
                  <span>•</span>
                  <span>Vessel: {searchResult.vessel || 'Vessel Nominated'}</span>
                </div>
              </div>

              <div className="bg-sky-500/10 border border-sky-400/30 rounded-xl px-4 py-2">
                <span className="text-[10px] uppercase text-sky-300 font-bold block">Current Stage</span>
                <strong className="text-sm text-white font-bold">{searchResult.customsStatus}</strong>
              </div>
            </div>

            {/* Stepper */}
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <div className="milestone-stepper mb-2">
                <div className="stepper-progress-track">
                  <div 
                    className="stepper-progress-fill"
                    style={{ width: `${(getStepProgressIndex(searchResult.customsStatus) / (PUBLIC_STEPS.length - 1)) * 100}%` }}
                  ></div>
                </div>

                {PUBLIC_STEPS.map((step, idx) => {
                  const currentIdx = getStepProgressIndex(searchResult.customsStatus);
                  const isCompleted = idx <= currentIdx;
                  const isActive = idx === currentIdx;

                  return (
                    <div
                      key={step}
                      className={`milestone-step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                    >
                      <div className="step-node">
                        {isCompleted ? <CheckCircle size={15} /> : idx + 1}
                      </div>
                      <span className="step-label">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipment Summary Details */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-100">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Consignee (Receiver)
                </span>
                <p className="font-semibold text-slate-800 text-sm">{searchResult.consignee}</p>
                <p className="text-xs text-slate-500 mt-1">Delivery: {searchResult.finalDestination || 'Destination CFS'}</p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Port Routing
                </span>
                <p className="font-semibold text-slate-800 text-sm flex items-center gap-1">
                  <MapPin size={14} className="text-blue-600" />
                  {searchResult.pod}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Discharge Date: {formatDate(searchResult.dischargeDate)}
                </p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Cargo Description
                </span>
                <p className="font-semibold text-slate-800 text-sm">{searchResult.cargoDescription || 'General Cargo'}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {searchResult.totalPackages || 'Packages as per BL'}
                </p>
              </div>
            </div>

            {/* Containers List */}
            <div className="p-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <Box size={16} className="text-blue-600" />
                Container Equipment Units ({searchResult.containers?.length || 0})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(searchResult.containers || []).map((cont, idx) => (
                  <div key={cont.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <strong className="font-mono text-sm text-slate-800 block">
                        {cont.containerNo}
                      </strong>
                      <span className="text-xs text-slate-500">
                        {cont.sizeType || '40HC'} • Seal: {cont.sealNo || '—'}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      cont.status === 'Empty Returned (Safe)'
                        ? 'bg-emerald-100 text-emerald-800'
                        : cont.status === 'Gate Out (In Transit)'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {cont.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
