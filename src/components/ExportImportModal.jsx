import React, { useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { exportToJsonFile, exportToCsvFile, INITIAL_CCT_DATA } from '../services/storageService';
import { requestActionPassword } from '../utils/securityGate';

export const ExportImportModal = ({ 
  isOpen, 
  onClose, 
  shipments, 
  onRestoreData 
}) => {
  const [importStatus, setImportStatus] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    setError('');
    setImportStatus('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) {
          throw new Error('Imported JSON file must contain an array of shipment records.');
        }
        // Restoring replaces every current record, so it needs the authorization password
        if (!requestActionPassword('restore the database from this backup file (current records will be replaced)')) return;
        onRestoreData(parsed);
        setImportStatus(`Successfully restored ${parsed.length} shipment records!`);
      } catch (err) {
        setError(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetSampleData = () => {
    if (!requestActionPassword('reset the database to the demonstration records (current records will be replaced)')) return;
    if (window.confirm('Reset database to the standard demonstration records?')) {
      onRestoreData(INITIAL_CCT_DATA);
      setImportStatus('Database reset to demonstration records.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Long-Term Data Archival & Backups</h2>
            <p className="text-xs text-slate-500">
              Retain your customs clearance records for years with JSON and CSV offline backups.
            </p>
          </div>
          <button onClick={onClose} className="btn-icon-only text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body space-y-5">
          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{importStatus}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Backup Options */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Download size={16} className="text-blue-600" />
              1. Download Complete Database Backup
            </h3>
            <p className="text-xs text-slate-600">
              Downloads all shipment records, multi-container equipment manifests, and customs notes into a portable JSON file.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => exportToJsonFile(shipments)}
                className="btn btn-primary btn-sm"
              >
                <Download size={15} />
                <span>Export JSON Backup ({shipments.length} Records)</span>
              </button>
              <button
                onClick={() => exportToCsvFile(shipments)}
                className="btn btn-outline btn-sm"
              >
                <FileSpreadsheet size={15} />
                <span>Export CSV Spreadsheet</span>
              </button>
            </div>
          </div>

          {/* Restore Option */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Upload size={16} className="text-emerald-600" />
              2. Restore Database from JSON Backup
            </h3>
            <p className="text-xs text-slate-600">
              Upload a previously exported JSON backup file to restore historical shipment dossiers.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          {/* Reset Demo Option */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-700">Sample Records Library</h4>
              <p className="text-[11px] text-slate-500">Restore default international trade demo shipments</p>
            </div>
            <button
              onClick={handleResetSampleData}
              className="btn btn-outline btn-sm text-xs"
            >
              <RefreshCw size={13} />
              <span>Reset Samples</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-outline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
