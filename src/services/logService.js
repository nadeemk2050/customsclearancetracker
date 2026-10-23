// Permanent, Immutable Audit Log Service for CustomsTrack PRO
// Tracks every CRUD action (Create/Add, Update/Modify, Delete/Remove)
// Saved permanently in LocalStorage, IndexedDB (Dexie), and Firestore Cloud Vault.
// CANNOT BE DELETED OR ALTERED FROM THE UI.

import { db, doc, getDoc, setDoc } from '../firebase/config';
import { getLocalDB } from '../localDB';

const LOG_STORAGE_KEY_PREFIX = 'cct_pro_audit_logs_';
const getStorageKey = (companyId = 'cha_al_mumtaz') => `${LOG_STORAGE_KEY_PREFIX}${companyId}`;

// Seed initial historical logs if storage is fresh so the log history view immediately reflects
// past operations on the existing consignment vouchers.
export const getInitialSeedLogs = (companyId = 'cha_al_mumtaz') => [
  {
    id: 'log_seed_001',
    action: 'CREATE',
    actionLabel: 'BL Voucher Added',
    timestamp: '2026-10-20T09:15:30.000Z',
    blNo: 'TRHUB988789',
    cctRefNo: 'CCT-2026-002',
    dealerName: 'GLOBAL METALS & COMMODITIES INDENTORS',
    lotNo: '2134G',
    staffName: 'Nadeem Khan',
    staffRole: 'Customs Clearance Specialist',
    dateAdded: '2026-10-20',
    dateModified: '2026-10-20',
    timesModified: 0,
    summary: 'New Bill of Lading voucher created with 1 Unit container',
    changes: [
      { field: 'blNo', label: 'BL Number', oldVal: '—', newVal: 'TRHUB988789' },
      { field: 'dealerName', label: 'Dealer Name', oldVal: '—', newVal: 'GLOBAL METALS & COMMODITIES INDENTORS' },
      { field: 'lotNo', label: 'Lot No.', oldVal: '—', newVal: '2134G' },
      { field: 'vessel', label: 'Vessel', oldVal: '—', newVal: 'DFG' },
      { field: 'consignee', label: 'Customer', oldVal: '—', newVal: 'AL QARYAN INDUSTRIES' },
      { field: 'customsStatus', label: 'Status', oldVal: '—', newVal: 'Pre-Arrival' }
    ],
    snapshot: {
      blNo: 'TRHUB988789',
      cctRefNo: 'CCT-2026-002',
      dealerName: 'GLOBAL METALS & COMMODITIES INDENTORS',
      lotNo: '2134G',
      vessel: 'DFG',
      consignee: 'AL QARYAN INDUSTRIES',
      netWeight: 25667
    }
  },
  {
    id: 'log_seed_002',
    action: 'UPDATE',
    actionLabel: 'BL Voucher Modified',
    timestamp: '2026-10-21T11:42:15.000Z',
    blNo: 'TRHUB988789',
    cctRefNo: 'CCT-2026-002',
    dealerName: 'GLOBAL METALS & COMMODITIES INDENTORS',
    lotNo: '2134G',
    staffName: 'Nadeem Khan',
    staffRole: 'Customs Clearance Specialist',
    dateAdded: '2026-10-20',
    dateModified: '2026-10-21',
    timesModified: 1,
    summary: 'Updated Customs Status from "Pre-Arrival" to "Declaration Filed"',
    changes: [
      { field: 'customsStatus', label: 'Customs Status', oldVal: 'Pre-Arrival', newVal: 'Declaration Filed' },
      { field: 'customsDeclarationNo', label: 'Declaration No', oldVal: '—', newVal: 'DXB-CUST-883921' }
    ],
    snapshot: {
      blNo: 'TRHUB988789',
      cctRefNo: 'CCT-2026-002'
    }
  },
  {
    id: 'log_seed_003',
    action: 'CREATE',
    actionLabel: 'BL Voucher Added',
    timestamp: '2026-10-01T08:30:00.000Z',
    blNo: 'BAXU1234567',
    cctRefNo: 'CCT-2026-001',
    dealerName: 'SAHAM SPVC',
    lotNo: 'LOTSPVC009',
    staffName: 'Tariq Al-Mansoor',
    staffRole: 'Senior Customs Broker',
    dateAdded: '2026-10-01',
    dateModified: '2026-10-01',
    timesModified: 0,
    summary: 'New Bill of Lading voucher created with 1 Unit container',
    changes: [
      { field: 'blNo', label: 'BL Number', oldVal: '—', newVal: 'BAXU1234567' },
      { field: 'dealerName', label: 'Dealer Name', oldVal: '—', newVal: 'SAHAM SPVC' },
      { field: 'lotNo', label: 'Lot No.', oldVal: '—', newVal: 'LOTSPVC009' },
      { field: 'vessel', label: 'Vessel', oldVal: '—', newVal: 'fsdf2424' },
      { field: 'consignee', label: 'Customer', oldVal: '—', newVal: 'AL-FALAH GENERAL TRADING EST' },
      { field: 'customsStatus', label: 'Status', oldVal: '—', newVal: 'Pre-Arrival' }
    ],
    snapshot: {
      blNo: 'BAXU1234567',
      cctRefNo: 'CCT-2026-001',
      dealerName: 'SAHAM SPVC',
      lotNo: 'LOTSPVC009'
    }
  },
  {
    id: 'log_seed_004',
    action: 'UPDATE',
    actionLabel: 'BL Voucher Modified',
    timestamp: '2026-10-03T14:20:10.000Z',
    blNo: 'BAXU1234567',
    cctRefNo: 'CCT-2026-001',
    dealerName: 'SAHAM SPVC',
    lotNo: 'LOTSPVC009',
    staffName: 'Suresh Kumar',
    staffRole: 'Port Terminal Runner',
    dateAdded: '2026-10-01',
    dateModified: '2026-10-03',
    timesModified: 1,
    summary: 'Updated Customs Status from "Customs Cleared" to "Empties Returned"',
    changes: [
      { field: 'customsStatus', label: 'Customs Status', oldVal: 'Customs Cleared', newVal: 'Empties Returned' }
    ],
    snapshot: {
      blNo: 'BAXU1234567',
      cctRefNo: 'CCT-2026-001'
    }
  }
];

// Helper to retrieve local logs
export const getLocalLogs = (companyId = 'cha_al_mumtaz') => {
  try {
    const raw = localStorage.getItem(getStorageKey(companyId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading local logs:', err);
  }

  // Fallback to seed logs for demonstration company
  const initial = getInitialSeedLogs(companyId);
  saveLocalLogs(initial, companyId);
  return initial;
};

// Save logs locally and notify listeners
const saveLocalLogs = (logs, companyId = 'cha_al_mumtaz') => {
  try {
    localStorage.setItem(getStorageKey(companyId), JSON.stringify(logs));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cct_log_history_updated', { detail: { companyId, count: logs.length } }));
    }
  } catch (err) {
    console.error('Failed to save audit logs to localStorage:', err);
  }
};

// Asynchronously sync logs to IndexedDB (Dexie)
const persistToIndexedDB = async (companyId, logEntry) => {
  try {
    const localDb = getLocalDB(companyId);
    if (localDb?.offline_records) {
      await localDb.offline_records.put({
        id: logEntry.id,
        collectionName: 'audit_logs',
        timestamp: new Date(logEntry.timestamp).getTime(),
        lastSync: 0,
        deleted: 0,
        data: logEntry
      });
    }
  } catch (err) {
    // Non-blocking fallback
    console.warn('IndexedDB log save warning:', err);
  }
};

// Push permanent log update to Firestore cloud vault
let cloudSyncTimer = null;
const scheduleCloudLogSync = (companyId, logs) => {
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(async () => {
    try {
      if (!companyId) return;
      const logDocRef = doc(db, 'cct_shipments', `logs_${companyId}`);
      await setDoc(logDocRef, {
        companyId,
        logsCount: logs.length,
        logs: logs.slice(0, 5000), // preserve large permanent audit trail
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore cloud log sync warning:', err);
    }
  }, 1200);
};

// Pull logs from cloud and merge with local logs (union by ID, never deleting)
export const pullLogsFromCloud = async (companyId = 'cha_al_mumtaz') => {
  try {
    const logDocRef = doc(db, 'cct_shipments', `logs_${companyId}`);
    const snap = await getDoc(logDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const remoteLogs = Array.isArray(data?.logs) ? data.logs : [];
      if (remoteLogs.length > 0) {
        const localLogs = getLocalLogs(companyId);
        const map = new Map();
        // Preserve all local logs first
        localLogs.forEach(l => { if (l?.id) map.set(l.id, l); });
        // Add remote logs if missing
        remoteLogs.forEach(l => {
          if (l?.id && !map.has(l.id)) {
            map.set(l.id, l);
          }
        });
        const merged = Array.from(map.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        saveLocalLogs(merged, companyId);
        return merged;
      }
    }
  } catch (err) {
    console.warn('Pulling cloud logs error:', err);
  }
  return getLocalLogs(companyId);
};

/**
 * Record a new CRUD action in the permanent, immutable log history.
 *
 * @param {string} companyId - Active company ID
 * @param {object} params
 * @param {'CREATE'|'UPDATE'|'DELETE'} params.action - CRUD action
 * @param {string} params.blNo - BL number
 * @param {string} params.cctRefNo - CCT reference number
 * @param {string} params.dealerName - Dealer / trader name
 * @param {string} params.lotNo - Consignment lot number
 * @param {string} params.staffName - User/Staff who performed the action
 * @param {string} [params.staffRole] - Role of staff
 * @param {string} [params.dateAdded] - Date the BL was originally added
 * @param {number} [params.timesModified] - Count of times modified
 * @param {string} params.summary - High-level summary of action
 * @param {Array<{field: string, label: string, oldVal: string, newVal: string}>} [params.changes] - Field-by-field diff
 * @param {object} [params.snapshot] - Context snapshot of BL
 * @returns {Promise<Array>} Updated logs list
 */
export const recordLogEntry = async (companyId = 'cha_al_mumtaz', {
  action = 'UPDATE',
  blNo = '—',
  cctRefNo = '—',
  dealerName = '—',
  lotNo = '—',
  staffName = 'Staff',
  staffRole = 'Team Member',
  dateAdded = null,
  timesModified = 0,
  summary = '',
  changes = [],
  snapshot = null
}) => {
  const currentLogs = getLocalLogs(companyId);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  let actionLabel = 'BL Voucher Modified';
  if (action === 'CREATE') actionLabel = 'BL Voucher Added';
  if (action === 'DELETE') actionLabel = 'BL Voucher Removed';

  const newLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action,
    actionLabel,
    timestamp: now.toISOString(),
    blNo: blNo || '—',
    cctRefNo: cctRefNo || '—',
    dealerName: dealerName || '—',
    lotNo: lotNo || '—',
    staffName: staffName || 'Staff Member',
    staffRole: staffRole || 'Customs Operations',
    dateAdded: dateAdded || dateStr,
    dateModified: dateStr,
    timesModified: Number.isFinite(timesModified) ? timesModified : 0,
    summary: summary || `${actionLabel} by ${staffName}`,
    changes: Array.isArray(changes) ? changes : [],
    snapshot: snapshot ? JSON.parse(JSON.stringify(snapshot)) : null
  };

  // Prepend to list (most recent first)
  const updatedLogs = [newLogEntry, ...currentLogs];
  saveLocalLogs(updatedLogs, companyId);

  // Background persistence to Dexie and Firestore Cloud
  persistToIndexedDB(companyId, newLogEntry);
  scheduleCloudLogSync(companyId, updatedLogs);

  return updatedLogs;
};

/**
 * Compare two shipment versions and produce an explicit diff of modified fields
 * to record "from which it was modified to what".
 */
export const calculateShipmentDiff = (oldShipment = {}, newShipment = {}) => {
  if (!oldShipment) return [];

  const fieldsToCheck = [
    { key: 'customsStatus', label: 'Customs Status' },
    { key: 'dealerName', label: 'Dealer Name' },
    { key: 'lotNo', label: 'Lot No.' },
    { key: 'blNo', label: 'BL Number' },
    { key: 'cctRefNo', label: 'CCT Reference No.' },
    { key: 'consignee', label: 'Customer (Consignee)' },
    { key: 'shipper', label: 'Shipper' },
    { key: 'vessel', label: 'Vessel' },
    { key: 'voyage', label: 'Voyage' },
    { key: 'shippingLine', label: 'Shipping Line' },
    { key: 'pol', label: 'Port of Loading' },
    { key: 'pod', label: 'Port of Discharge' },
    { key: 'eta', label: 'ETA (Arrival)' },
    { key: 'ata', label: 'ATA (Actual Arrival)' },
    { key: 'dischargeDate', label: 'Discharge Date' },
    { key: 'netWeight', label: 'Net Weight' },
    { key: 'grossWeightKg', label: 'Gross Weight (KG)' },
    { key: 'cargoDescription', label: 'Cargo Description' },
    { key: 'totalPackages', label: 'Total Packages' },
    { key: 'customsDeclarationNo', label: 'Declaration No.' },
    { key: 'customsDutyAmount', label: 'Duty Amount' },
    { key: 'customsVatAmount', label: 'VAT Amount' },
    { key: 'inspectionType', label: 'Inspection Type' },
    { key: 'doValidityDate', label: 'DO Validity Date' },
    { key: 'portFreeDays', label: 'Port Free Days' },
    { key: 'lineFreeDays', label: 'Line Free Days' },
    { key: 'notes', label: 'Operational Notes' }
  ];

  const changes = [];

  const normalize = (v) => {
    if (v === null || v === undefined) return '';
    return String(v).trim();
  };

  fieldsToCheck.forEach(({ key, label }) => {
    const oldVal = normalize(oldShipment[key]);
    const newVal = normalize(newShipment[key]);
    if (oldVal !== newVal) {
      changes.push({
        field: key,
        label,
        oldVal: oldVal || '—',
        newVal: newVal || '—'
      });
    }
  });

  // Check Container Count or changes
  const oldContainers = oldShipment.containers || [];
  const newContainers = newShipment.containers || [];
  if (oldContainers.length !== newContainers.length) {
    changes.push({
      field: 'containers',
      label: 'Containers Count',
      oldVal: `${oldContainers.length} Unit(s)`,
      newVal: `${newContainers.length} Unit(s)`
    });
  }

  // Check Deposit Status
  const oldDep = oldShipment.doSecurityDeposit?.status || '';
  const newDep = newShipment.doSecurityDeposit?.status || '';
  if (oldDep !== newDep && (oldDep || newDep)) {
    changes.push({
      field: 'depositStatus',
      label: 'DO Deposit Status',
      oldVal: oldDep || '—',
      newVal: newDep || '—'
    });
  }

  return changes;
};
