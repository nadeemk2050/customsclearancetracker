// Offline-First Data Storage & Cloud Synchronization Service
// Architecture: Local PC/Browser Storage First (zero latency, zero quota burn)
// Synchronizes batched snapshots to Firebase Firestore to eliminate unlimited read/writes.

import { 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from '../firebase/config';

// Realistic initial dataset for new/demo accounts
export const INITIAL_CCT_DATA = [
  {
    id: 'CCT-2026-001',
    cctRefNo: 'CCT-2026-001',
    blNo: 'HLCUTOR260620111',
    dealerName: 'AL-ZAHRA TRADING & INVESTMENTS',
    lotNo: 'LOT-2026-001',
    shippingLine: 'Hapag-Lloyd',
    vessel: 'AL ZUBARA',
    voyage: '2604E',
    pol: 'Hamburg, Germany',
    pod: 'Jebel Ali Port (AEJEA)',
    finalDestination: 'Dubai Industrial City Yard',
    consignee: 'MUMTAZ PLASTIC RECYCLING LLC',
    shipper: 'POLYMER GLOBAL GMBH',
    cargoDescription: 'POST INDUSTRIAL RECYCLED POLYPROPYLENE GRANULES',
    totalPackages: '960 Bags / 24 Pallets',
    grossWeightKg: 52140,
    volumeCbm: 68.5,
    customsDeclarationNo: 'DXB-CUST-883921',
    customsDeclarationDate: '2026-10-08',
    hsCode: '3902.10.00',
    customsDutyAmount: 2607,
    customsVatAmount: 2737,
    customsStatus: 'Under Inspection',
    inspectionType: 'Red (Physical & Customs Lab Sampling)',
    doValidityDate: '2026-10-14',
    doSecurityDeposit: {
      amount: 2000,
      currency: 'USD',
      status: 'Deposited',
      receiptNo: 'HL-DEP-99410'
    },
    eta: '2026-10-06',
    ata: '2026-10-07',
    dischargeDate: '2026-10-08',
    portFreeDays: 5,
    lineFreeDays: 14,
    portStorageDailyRate: 50,
    lineDetentionDailyRate: 90,
    notes: 'Customs sample sent to Dubai Central Lab for polymer purity test. DO collected from Hapag-Lloyd Deira office.',
    documents: {
      commercialInvoice: true,
      packingList: true,
      originalBL: true,
      certificateOfOrigin: true,
      formEFTA: false,
      deliveryOrder: true,
      customsDeclaration: true,
      dutyPaymentReceipt: false,
      portGatePass: false,
      emptyReturnEIR: false
    },
    containers: [
      {
        id: 'c1',
        containerNo: 'HLXU8291048',
        sizeType: '40HC',
        sealNo: 'HL773192',
        dischargeDate: '2026-10-08',
        gateOutDate: '',
        deliveryDate: '',
        emptyReturnDepot: 'Hapag-Lloyd Inland Depot 4',
        emptyReturnDate: '',
        eirNumber: '',
        status: 'At Port (Full)'
      },
      {
        id: 'c2',
        containerNo: 'FSCU8083274',
        sizeType: '40HC',
        sealNo: 'HL773193',
        dischargeDate: '2026-10-08',
        gateOutDate: '',
        deliveryDate: '',
        emptyReturnDepot: 'Hapag-Lloyd Inland Depot 4',
        emptyReturnDate: '',
        eirNumber: '',
        status: 'At Port (Full)'
      }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CCT-2026-002',
    cctRefNo: 'CCT-2026-002',
    blNo: 'MEDUX94820155',
    shippingLine: 'MSC',
    vessel: 'MSC GULSUN',
    voyage: '2411W',
    pol: 'Shanghai, China',
    pod: 'King Abdulaziz Port Dammam',
    finalDestination: 'Riyadh Dry Port CFS',
    consignee: 'AL-FALAH GENERAL TRADING EST',
    shipper: 'SHANGHAI ELECTRO-TECH CORP',
    cargoDescription: 'PRECISION AIR CONDITIONING SPARE COMPRESSORS',
    totalPackages: '120 Wooden Crates',
    grossWeightKg: 18450,
    volumeCbm: 38.0,
    customsDeclarationNo: 'DMM-BOE-55102',
    customsDeclarationDate: '2026-10-05',
    hsCode: '8414.30.00',
    customsDutyAmount: 3690,
    customsVatAmount: 11070,
    customsStatus: 'Duty Paid',
    inspectionType: 'Yellow (Documentary Assessment Passed)',
    doValidityDate: '2026-10-12',
    doSecurityDeposit: {
      amount: 1500,
      currency: 'USD',
      status: 'Deposited',
      receiptNo: 'MSC-DEP-4418'
    },
    eta: '2026-10-04',
    ata: '2026-10-04',
    dischargeDate: '2026-10-05',
    portFreeDays: 7,
    lineFreeDays: 21,
    portStorageDailyRate: 45,
    lineDetentionDailyRate: 75,
    notes: 'Customs Duty & VAT settled via SADAD portal. Port token booked for transport dispatch tomorrow morning.',
    documents: {
      commercialInvoice: true,
      packingList: true,
      originalBL: true,
      certificateOfOrigin: true,
      formEFTA: true,
      deliveryOrder: true,
      customsDeclaration: true,
      dutyPaymentReceipt: true,
      portGatePass: true,
      emptyReturnEIR: false
    },
    containers: [
      {
        id: 'c3',
        containerNo: 'MSCU7391054',
        sizeType: '40GP',
        sealNo: 'MSC99302',
        dischargeDate: '2026-10-05',
        gateOutDate: '',
        deliveryDate: '',
        emptyReturnDepot: 'MSC Al-Khafji Logistics Depot',
        emptyReturnDate: '',
        eirNumber: '',
        status: 'At Port (Full)'
      }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CCT-2026-003',
    cctRefNo: 'CCT-2026-003',
    blNo: 'MAEU284910482',
    shippingLine: 'Maersk Line',
    vessel: 'MAERSK MC-KINNEY MOLLER',
    voyage: '2408S',
    pol: 'Tanjung Pelepas, Malaysia',
    pod: 'Port of Rotterdam',
    finalDestination: 'Rotterdam Distripark Warehouse',
    consignee: 'EUROPEAN LOGISTICS HUB B.V.',
    shipper: 'ASEAN RUBBER EXPORTS PTE',
    cargoDescription: 'NATURAL RUBBER SHEETS TSR20',
    totalPackages: '80 Bales',
    grossWeightKg: 40200,
    volumeCbm: 54.0,
    customsDeclarationNo: 'NL-AGS-991823',
    customsDeclarationDate: '2026-09-28',
    hsCode: '4001.22.00',
    customsDutyAmount: 0,
    customsVatAmount: 8442,
    customsStatus: 'Gate Out',
    inspectionType: 'Green Channel (Direct Release)',
    doValidityDate: '2026-10-06',
    doSecurityDeposit: {
      amount: 1000,
      currency: 'USD',
      status: 'Deposited',
      receiptNo: 'ML-GRT-2201'
    },
    eta: '2026-09-26',
    ata: '2026-09-27',
    dischargeDate: '2026-09-28',
    portFreeDays: 5,
    lineFreeDays: 14,
    portStorageDailyRate: 60,
    lineDetentionDailyRate: 85,
    notes: 'Containers gated out on Sept 30. Delivery completed at customer warehouse Oct 2. 1 empty returned, 1 pending return.',
    documents: {
      commercialInvoice: true,
      packingList: true,
      originalBL: true,
      certificateOfOrigin: true,
      formEFTA: true,
      deliveryOrder: true,
      customsDeclaration: true,
      dutyPaymentReceipt: true,
      portGatePass: true,
      emptyReturnEIR: false
    },
    containers: [
      {
        id: 'c4',
        containerNo: 'MRKU3920194',
        sizeType: '40HC',
        sealNo: 'ML8812',
        dischargeDate: '2026-09-28',
        gateOutDate: '2026-09-30',
        deliveryDate: '2026-10-02',
        emptyReturnDepot: 'Maersk Maasvlakte Depot',
        emptyReturnDate: '2026-10-04',
        eirNumber: 'EIR-NL-849102',
        status: 'Empty Returned (Safe)'
      },
      {
        id: 'c5',
        containerNo: 'MRKU4910283',
        sizeType: '40HC',
        sealNo: 'ML8813',
        dischargeDate: '2026-09-28',
        gateOutDate: '2026-09-30',
        deliveryDate: '2026-10-02',
        emptyReturnDepot: 'Maersk Maasvlakte Depot',
        emptyReturnDate: '',
        eirNumber: '',
        status: 'At Consignee (Unloading)'
      }
    ],
    updatedAt: new Date().toISOString()
  }
];

// In-memory debounce timer for batching cloud synchronization
let syncDebounceTimer = null;
const SYNC_DEBOUNCE_DELAY_MS = 2500; // Wait 2.5s after user stops typing/editing before writing to Firebase

// Storage key helper per company
const getCompanyStorageKey = (companyId = 'default') => `cct_pro_shipments_${companyId}`;
const getCompanySyncMetaKey = (companyId = 'default') => `cct_sync_meta_${companyId}`;

// 1. OFFLINE-FIRST: Read instantly from local PC/Browser storage
export const getLocalShipments = (companyId = 'cha_al_mumtaz') => {
  try {
    const key = getCompanyStorageKey(companyId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Local storage read error:', err);
  }

  // Provide initial dataset for demo company or empty list for fresh company
  const initial = companyId === 'cha_al_mumtaz' ? INITIAL_CCT_DATA : [];
  saveLocalShipments(initial, companyId);
  return initial;
};

// 2. OFFLINE-FIRST: Write instantly to local PC/Browser storage
// `markPending: false` is used when applying a remote snapshot, so a pull does not
// look like unsynced local work.
export const saveLocalShipments = (shipments, companyId = 'cha_al_mumtaz', options = {}) => {
  try {
    const key = getCompanyStorageKey(companyId);
    localStorage.setItem(key, JSON.stringify(shipments));
    if (options.markPending !== false) {
      // Record that we have un-synced or pending changes
      setLocalSyncStatus(companyId, { pending: true, lastLocalSave: new Date().toISOString() });
    }
  } catch (err) {
    console.error('Failed writing to local PC storage:', err);
  }
};

const toTimestamp = (value) => {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Merge a local shipment list with the cloud snapshot, last-write-wins per record.
 * - Records in the cloud are kept, unless the local copy is newer (pending edit).
 * - Local records missing from the cloud are kept only when they are newer than the
 *   snapshot and were not deleted elsewhere, which preserves a brand-new local BL
 *   without resurrecting deleted ones.
 * - An empty cloud snapshot never discards local records unless it carries tombstones.
 */
export const mergeShipmentLists = (local = [], remote = [], remoteUpdatedAt = null, deletedIds = []) => {
  const localList = Array.isArray(local) ? local : [];
  const remoteList = Array.isArray(remote) ? remote : [];
  const tombstones = new Map(
    (Array.isArray(deletedIds) ? deletedIds : []).map((entry) => [entry?.id, toTimestamp(entry?.deletedAt)])
  );

  // Drop local copies of records that were deleted elsewhere more recently
  const aliveLocal = localList.filter((record) => {
    const deletedAt = tombstones.get(record?.id);
    if (deletedAt === undefined) return true;
    return toTimestamp(record?.updatedAt) > deletedAt;
  });

  if (remoteList.length === 0) {
    // An empty snapshot only clears local data when it carries deletions
    return tombstones.size > 0 ? [] : aliveLocal;
  }
  if (aliveLocal.length === 0) return [...remoteList];

  const remoteTs = toTimestamp(remoteUpdatedAt);
  const localById = new Map(aliveLocal.filter((r) => r?.id).map((r) => [r.id, r]));
  const merged = [];
  const seen = new Set();

  remoteList.forEach((remoteRecord) => {
    if (!remoteRecord?.id) return;
    const localRecord = localById.get(remoteRecord.id);
    if (localRecord && toTimestamp(localRecord.updatedAt) > toTimestamp(remoteRecord.updatedAt)) {
      merged.push(localRecord);
    } else {
      merged.push(remoteRecord);
    }
    seen.add(remoteRecord.id);
  });

  aliveLocal.forEach((localRecord) => {
    if (!localRecord?.id || seen.has(localRecord.id)) return;
    if (toTimestamp(localRecord.updatedAt) > remoteTs) merged.push(localRecord);
  });

  return merged;
};

// Helper for local sync status
export const getLocalSyncStatus = (companyId = 'cha_al_mumtaz') => {
  try {
    const raw = localStorage.getItem(getCompanySyncMetaKey(companyId));
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { pending: false, lastSyncedAt: null };
};

export const setLocalSyncStatus = (companyId, status) => {
  try {
    const current = getLocalSyncStatus(companyId);
    localStorage.setItem(getCompanySyncMetaKey(companyId), JSON.stringify({ ...current, ...status }));
  } catch {
    // ignore
  }
};

// 3. CLOUD BATCH SYNC: Debounced vault snapshot write (Prevents unlimited reads/writes)
export const scheduleCloudVaultSync = (companyId, shipments, options = {}) => {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  syncDebounceTimer = setTimeout(async () => {
    try {
      await pushCompanyVaultToCloud(companyId, shipments, options);
    } catch (err) {
      console.warn('Background cloud vault sync note:', err);
    }
  }, SYNC_DEBOUNCE_DELAY_MS);
};

// Direct manual or automatic push of company dataset to Firestore (1 single write!)
export const pushCompanyVaultToCloud = async (companyId, shipments, options = {}) => {
  if (!companyId) return { pushed: false, reason: 'no-company' };
  const list = Array.isArray(shipments) ? shipments : [];

  try {
    const docRef = doc(db, 'cct_shipments', `vault_${companyId}`);
    const snap = await getDoc(docRef);
    const remote = snap.exists() && Array.isArray(snap.data()?.shipments) ? snap.data().shipments : [];
    const remoteDeleted = snap.exists() && Array.isArray(snap.data()?.deletedIds) ? snap.data().deletedIds : [];

    // SAFETY GUARD: an empty local list must never erase records that exist in the
    // cloud (for example a freshly installed device that has not pulled yet).
    if (list.length === 0 && !options.allowEmpty) {
      if (remote.length > 0) {
        saveLocalShipments(remote, companyId, { markPending: false });
        console.warn(
          `[Cloud Sync] Blocked writing an empty list over ${remote.length} cloud record(s) for ${companyId}.`
        );
        return { pushed: false, reason: 'empty-guard', remote };
      }
    }

    // Merge tombstones so a deletion made here is not undone by another device
    const tombstones = new Map(remoteDeleted.map((entry) => [entry.id, entry]));
    (options.deletedIds || []).forEach((entry) => {
      if (entry?.id) tombstones.set(entry.id, entry);
    });

    // Keep the tombstone list small: drop entries older than 90 days
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const deletedIds = Array.from(tombstones.values()).filter(
      (entry) => toTimestamp(entry.deletedAt) >= cutoff
    );

    const payload = {
      companyId,
      shipmentsCount: list.length,
      shipments: list,
      deletedIds,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload);
    setLocalSyncStatus(companyId, { pending: false, lastSyncedAt: payload.updatedAt });
    console.log(`[Offline-First Cloud Sync] Vault updated for ${companyId} (${list.length} records).`);
    return { pushed: true, count: list.length };
  } catch (err) {
    console.warn('[Cloud Sync] Vault push failed:', err?.message || err);
    return { pushed: false, reason: 'error', error: err };
  }
};

// Pull company dataset from Firestore (merge, never destructive)
export const pullCompanyVaultFromCloud = async (companyId) => {
  if (!companyId) return null;
  try {
    const docRef = doc(db, 'cct_shipments', `vault_${companyId}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const remote = Array.isArray(data?.shipments) ? data.shipments : [];
      const merged = mergeShipmentLists(
        getLocalShipments(companyId),
        remote,
        data?.updatedAt,
        data?.deletedIds
      );
      saveLocalShipments(merged, companyId, { markPending: false });
      setLocalSyncStatus(companyId, { pending: false, lastSyncedAt: data?.updatedAt || new Date().toISOString() });
      return merged;
    }
  } catch (err) {
    console.warn('[Cloud Sync] Vault pull failed:', err?.message || err);
  }
  return null;
};

// 4. OFFLINE-FIRST: Subscribe to shipments — local first, then live cloud updates
// Every device logged into the same company receives changes in real time.
export const subscribeToShipments = (companyId = 'cha_al_mumtaz', onData, onSyncStatusChange) => {
  // 1. Immediately emit local data from PC/Browser storage (Instant 0ms load)
  const localData = getLocalShipments(companyId);
  onData(localData);

  let unsubscribe = () => {};

  // 2. Live listener: pushes and pulls for every team member of this company
  try {
    const docRef = doc(db, 'cct_shipments', `vault_${companyId}`);
    unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          // First device for this company: publish whatever we already hold
          if (localData.length > 0) pushCompanyVaultToCloud(companyId, localData);
          return;
        }

        const data = snap.data();
        const remote = Array.isArray(data?.shipments) ? data.shipments : [];
        const deletedIds = Array.isArray(data?.deletedIds) ? data.deletedIds : [];
        const merged = mergeShipmentLists(getLocalShipments(companyId), remote, data?.updatedAt, deletedIds);

        saveLocalShipments(merged, companyId, { markPending: false });
        onData(merged);
        setLocalSyncStatus(companyId, { pending: false, lastSyncedAt: data?.updatedAt || new Date().toISOString() });
        if (onSyncStatusChange) {
          onSyncStatusChange({ pending: false, lastSyncedAt: data?.updatedAt || new Date().toISOString() });
        }

        // If the cloud copy is empty without any deletion record but this device holds
        // records, republish them (protects against an accidental empty overwrite).
        if (remote.length === 0 && merged.length > 0 && deletedIds.length === 0) {
          pushCompanyVaultToCloud(companyId, merged);
        }
      },
      (err) => {
        console.warn('[Cloud Sync] Shipments listener:', err?.message || err);
      }
    );
  } catch (err) {
    console.warn('[Cloud Sync] Shipments listener unavailable:', err?.message || err);
  }

  // Cleanup
  return () => {
    try {
      unsubscribe();
    } catch {
      // ignore
    }
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  };
};

// 5. OFFLINE-FIRST: Persist shipment (Saves to local storage FIRST, then schedules cloud snapshot)
export const persistShipment = async (shipment, existingList, companyId = 'cha_al_mumtaz') => {
  const updatedShipment = {
    ...shipment,
    id: shipment.id || `CCT-${Date.now()}`,
    updatedAt: new Date().toISOString()
  };

  // Immediate Local PC Save
  let updatedList;
  const exists = existingList.some(item => item.id === updatedShipment.id);
  if (exists) {
    updatedList = existingList.map(item => item.id === updatedShipment.id ? updatedShipment : item);
  } else {
    updatedList = [updatedShipment, ...existingList];
  }
  saveLocalShipments(updatedList, companyId);

  // Schedule single batched cloud write in background
  scheduleCloudVaultSync(companyId, updatedList);

  return updatedList;
};

// 6. OFFLINE-FIRST: Remove shipment
export const removeShipment = async (id, existingList, companyId = 'cha_al_mumtaz') => {
  const updatedList = existingList.filter(item => item.id !== id);
  saveLocalShipments(updatedList, companyId);
  // Deleting the last record is an intentional action, so an empty list is allowed.
  // The tombstone tells every other device that this delete is deliberate.
  scheduleCloudVaultSync(companyId, updatedList, {
    allowEmpty: true,
    deletedIds: [{ id, deletedAt: new Date().toISOString() }]
  });
  return updatedList;
};

// 7. EXPORT DATA (JSON / CSV)
export const exportToJsonFile = (shipments, companyName = 'CustomsTrack_Pro') => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(shipments, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const cleanName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
  downloadAnchor.setAttribute('download', `${cleanName}_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const exportToCsvFile = (shipments, companyName = 'CustomsTrack_Pro') => {
  const headers = [
    'CCT Ref Number',
    'BL Number',
    'Dealer Name',
    'Lot No',
    'Shipping Line',
    'Vessel',
    'Voyage',
    'Port of Discharge',
    'Consignee',
    'Cargo Description',
    'Containers',
    'Customs Status',
    'Declaration No',
    'Discharge Date',
    'Port Free Days',
    'Port Storage Status',
    'Line Free Days',
    'Line Detention Status',
    'DO Validity Date',
    'Deposit Status'
  ];

  const rows = shipments.map(s => {
    const containerList = (s.containers || []).map(c => `${c.containerNo} (${c.sizeType})`).join('; ');
    return [
      `"${s.cctRefNo || s.id || ''}"`,
      `"${s.blNo || ''}"`,
      `"${s.dealerName || ''}"`,
      `"${s.lotNo || ''}"`,
      `"${s.shippingLine || ''}"`,
      `"${s.vessel || ''}"`,
      `"${s.voyage || ''}"`,
      `"${s.pod || ''}"`,
      `"${s.consignee || ''}"`,
      `"${(s.cargoDescription || '').replace(/"/g, '""')}"`,
      `"${containerList}"`,
      `"${s.customsStatus || ''}"`,
      `"${s.customsDeclarationNo || ''}"`,
      `"${s.dischargeDate || ''}"`,
      `"${s.portFreeDays || ''}"`,
      `"${s.portDaysLeft !== undefined ? s.portDaysLeft + ' days left' : ''}"`,
      `"${s.lineFreeDays || ''}"`,
      `"${s.lineDaysLeft !== undefined ? s.lineDaysLeft + ' days left' : ''}"`,
      `"${s.doValidityDate || ''}"`,
      `"${s.doSecurityDeposit ? s.doSecurityDeposit.status : ''}"`
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', encodedUri);
  const cleanName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
  downloadAnchor.setAttribute('download', `${cleanName}_Demurrage_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
