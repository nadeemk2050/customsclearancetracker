// Thin Cloud Backend Wrapper (The ONLY place the real Firebase SDK is imported)
import { 
  db as firestoreDb,
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  writeBatch, 
  query, 
  where, 
  onSnapshot 
} from './firebase/config';

// Cloud mirror collection (using authorized cct_shipments root collection)
export const getCloudRecordsCollection = () => {
  return collection(firestoreDb, 'cct_shipments');
};

export const getCloudRecordDoc = (tenantId, recordId) => {
  return doc(firestoreDb, 'cct_shipments', `rec_${tenantId}_${recordId}`);
};

export const getCloudRegistryDoc = (tenantId) => {
  return doc(firestoreDb, 'cct_shipments', `registry_${tenantId}`);
};

// Check if cloud backend is currently reachable
export const isCloudReachable = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// Push a batch of changed records to Firestore (<= 100 documents per batch)
export const pushCloudBatch = async (tenantId, recordsToPush) => {
  if (!recordsToPush || recordsToPush.length === 0) return { pushedCount: 0 };
  if (!isCloudReachable()) {
    throw new Error('Network is offline, skipping cloud push');
  }

  const BATCH_SIZE = 100;
  let totalPushed = 0;

  for (let i = 0; i < recordsToPush.length; i += BATCH_SIZE) {
    const chunk = recordsToPush.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(firestoreDb);
    const serverReplicationTime = Date.now();

    for (const record of chunk) {
      const docRef = getCloudRecordDoc(tenantId, record.id);
      // Clean plain JSON payload only
      const payload = {
        id: record.id,
        tenantId,
        collectionName: record.collectionName,
        data: record.data,
        timestamp: record.timestamp,
        syncTimestamp: serverReplicationTime,
        deleted: !!record.deleted
      };
      batch.set(docRef, payload, { merge: true });
    }

    try {
      await batch.commit();
      totalPushed += chunk.length;
    } catch {
      // Graceful offline fallback: queue retains items for next connection
      return { pushedCount: totalPushed };
    }
  }

  return { pushedCount: totalPushed };
};

// Incremental Delta Pull Subscription based on authorized tenant document
export const subscribeRemoteDelta = (tenantId, watermark, onDelta, onError) => {
  try {
    const vaultDocRef = doc(firestoreDb, 'cct_shipments', `vault_${tenantId}`);

    const unsubscribe = onSnapshot(
      vaultDocRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const vaultData = snapshot.data();
        const records = vaultData?.records || vaultData?.shipments || [];
        if (Array.isArray(records) && records.length > 0) {
          const deltas = records.map(r => ({
            type: 'modified',
            record: {
              id: r.id || String(r.blNumber || Date.now()),
              collectionName: 'shipments',
              data: r,
              timestamp: r.updatedAt ? new Date(r.updatedAt).getTime() : Date.now(),
              syncTimestamp: Date.now(),
              deleted: !!r.deleted
            }
          }));
          onDelta(deltas);
        }
      },
      (error) => {
        // Silently transition to local-first offline state without logging alarming errors
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
};

// Update Discovery Registry Doc per Tenant
export const updateCloudRegistry = async (tenantId, meta) => {
  try {
    const regDoc = getCloudRegistryDoc(tenantId);
    const payload = {
      id: tenantId,
      name: meta.name || tenantId,
      isLive: true,
      ownerEmail: meta.ownerEmail || '',
      stats: meta.stats || {},
      lastPing: Date.now()
    };
    await setDoc(regDoc, payload, { merge: true });
  } catch {
    // Non-blocking local-first fallback
  }
};
