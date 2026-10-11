// Firestore-Shaped Optimistic Local Database API
// The UI interacts with this API as if calling Cloud Firestore directly.
// Local writes return in 0ms without waiting for network.

import { getLocalDB, generateUUID, notifyLocalSubscribers, subscribeLocalChanges } from './localDB';
import { enqueueOutbox } from './sync/outbox';
import { scheduleFlush } from './sync/engine';

/**
 * Clean data to guarantee plain JSON only (strip non-serializable objects)
 * Converts Firestore Timestamps or Dates into plain seconds/ms
 */
export const sanitizePlainJSON = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'function' || typeof obj === 'symbol') return undefined;

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle Firestore Timestamp objects
  if (typeof obj === 'object' && typeof obj.toDate === 'function') {
    return {
      seconds: obj.seconds,
      nanoseconds: obj.nanoseconds
    };
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizePlainJSON);
  }

  if (typeof obj === 'object') {
    const copy = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        copy[key] = sanitizePlainJSON(value);
      }
    }
    return copy;
  }

  return obj;
};

/**
 * Collection reference builder
 */
export const collection = (dbOrTenantId, collectionName) => {
  const tenantId = typeof dbOrTenantId === 'string' 
    ? dbOrTenantId 
    : (dbOrTenantId?.name?.replace('myapp_tenant_', '') || 'default');
  return {
    type: 'collection',
    tenantId,
    collectionName
  };
};

/**
 * Document reference builder
 */
export const doc = (dbOrCollection, ...pathSegments) => {
  if (dbOrCollection && dbOrCollection.type === 'collection') {
    const docId = pathSegments[0] || generateUUID();
    return {
      type: 'doc',
      tenantId: dbOrCollection.tenantId,
      collectionName: dbOrCollection.collectionName,
      id: docId
    };
  }

  const tenantId = typeof dbOrCollection === 'string'
    ? dbOrCollection
    : (dbOrCollection?.name?.replace('myapp_tenant_', '') || 'default');

  const [colName, docId] = pathSegments;
  return {
    type: 'doc',
    tenantId,
    collectionName: colName,
    id: docId || generateUUID()
  };
};

/**
 * Optimistic addDoc: saves to local DB immediately, queues outbox write, schedules push
 */
export const addDoc = async (colRef, rawData) => {
  const db = getLocalDB(colRef.tenantId);
  const docId = generateUUID();
  const cleanData = sanitizePlainJSON(rawData);
  const now = Date.now();

  const record = {
    id: docId,
    collectionName: colRef.collectionName,
    data: cleanData,
    timestamp: now,
    lastSync: null,
    deleted: false
  };

  // 1. Write to local reactive DB (0ms latency)
  await db.offline_records.put(record);

  // 2. Append to transactional outbox
  await enqueueOutbox(db, {
    id: docId,
    collectionName: colRef.collectionName,
    docId,
    operation: 'INSERT'
  });

  // 3. Notify local reactive subscribers
  notifyLocalSubscribers(colRef.tenantId, {
    collectionName: colRef.collectionName,
    docId,
    operation: 'INSERT',
    record
  });

  // 4. Schedule background push
  scheduleFlush(colRef.tenantId);

  return doc(colRef, docId);
};

/**
 * Optimistic setDoc: overwrites or merges document locally
 */
export const setDoc = async (docRef, rawData, options = {}) => {
  const db = getLocalDB(docRef.tenantId);
  const cleanData = sanitizePlainJSON(rawData);
  const now = Date.now();

  let finalData = cleanData;
  if (options.merge) {
    const existing = await db.offline_records.get(docRef.id);
    if (existing && existing.data) {
      finalData = { ...existing.data, ...cleanData };
    }
  }

  const record = {
    id: docRef.id,
    collectionName: docRef.collectionName,
    data: finalData,
    timestamp: now,
    lastSync: null,
    deleted: false
  };

  await db.offline_records.put(record);

  await enqueueOutbox(db, {
    id: docRef.id,
    collectionName: docRef.collectionName,
    docId: docRef.id,
    operation: 'UPDATE'
  });

  notifyLocalSubscribers(docRef.tenantId, {
    collectionName: docRef.collectionName,
    docId: docRef.id,
    operation: 'UPDATE',
    record
  });

  scheduleFlush(docRef.tenantId);
};

/**
 * Optimistic updateDoc: updates specific fields locally
 */
export const updateDoc = async (docRef, partialData) => {
  return setDoc(docRef, partialData, { merge: true });
};

/**
 * Optimistic deleteDoc: Soft-delete only (sets deleted: true + tombstone)
 */
export const deleteDoc = async (docRef) => {
  const db = getLocalDB(docRef.tenantId);
  const existing = await db.offline_records.get(docRef.id);
  const now = Date.now();

  const record = {
    id: docRef.id,
    collectionName: docRef.collectionName,
    data: existing?.data || {},
    timestamp: now,
    lastSync: null,
    deleted: true
  };

  await db.offline_records.put(record);

  await enqueueOutbox(db, {
    id: docRef.id,
    collectionName: docRef.collectionName,
    docId: docRef.id,
    operation: 'DELETE'
  });

  notifyLocalSubscribers(docRef.tenantId, {
    collectionName: docRef.collectionName,
    docId: docRef.id,
    operation: 'DELETE',
    record
  });

  scheduleFlush(docRef.tenantId);
};

/**
 * Hard-delete / purge tombstone row (for privileged maintenance)
 */
export const purgeDoc = async (docRef) => {
  const db = getLocalDB(docRef.tenantId);
  await db.offline_records.delete(docRef.id);
  await db.sync_queue.where('docId').equals(docRef.id).delete();

  notifyLocalSubscribers(docRef.tenantId, {
    collectionName: docRef.collectionName,
    docId: docRef.id,
    operation: 'PURGE',
    record: { id: docRef.id }
  });
};

/**
 * Read single document from local DB (Instant)
 */
export const getDoc = async (docRef) => {
  const db = getLocalDB(docRef.tenantId);
  const row = await db.offline_records.get(docRef.id);

  const exists = !!row && !row.deleted;
  return {
    id: docRef.id,
    exists: () => exists,
    data: () => (exists ? { ...row.data, id: row.id } : undefined)
  };
};

/**
 * Query builder
 */
export const query = (colRef, ...constraints) => {
  return {
    type: 'query',
    tenantId: colRef.tenantId,
    collectionName: colRef.collectionName,
    constraints: constraints || []
  };
};

/**
 * Query constraint where()
 */
export const where = (fieldPath, opStr, value) => {
  return { type: 'where', fieldPath, opStr, value };
};

/**
 * Execute query against local DB
 */
export const getDocs = async (queryOrColRef) => {
  const tenantId = queryOrColRef.tenantId || 'default';
  const collectionName = queryOrColRef.collectionName;
  const db = getLocalDB(tenantId);

  // Read non-deleted records for this collection
  let rows = await db.offline_records
    .where('[collectionName+deleted]')
    .equals([collectionName, 0])
    .toArray();

  if (rows.length === 0) {
    // Fallback if composite index is matching false as boolean
    rows = await db.offline_records
      .where('collectionName')
      .equals(collectionName)
      .filter((r) => !r.deleted)
      .toArray();
  }

  // Apply in-memory constraints if any
  const constraints = queryOrColRef.constraints || [];
  for (const c of constraints) {
    if (c.type === 'where') {
      rows = rows.filter((r) => {
        const val = r.data?.[c.fieldPath];
        if (c.opStr === '==') return val === c.value;
        if (c.opStr === '!=') return val !== c.value;
        if (c.opStr === '>') return val > c.value;
        if (c.opStr === '>=') return val >= c.value;
        if (c.opStr === '<') return val < c.value;
        if (c.opStr === '<=') return val <= c.value;
        if (c.opStr === 'array-contains') return Array.isArray(val) && val.includes(c.value);
        return true;
      });
    }
  }

  // Sort by timestamp descending
  rows.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const docs = rows.map((r) => ({
    id: r.id,
    exists: () => true,
    data: () => ({ ...r.data, id: r.id })
  }));

  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (cb) => docs.forEach(cb)
  };
};

/**
 * Reactive onSnapshot listener over local DB + delta updates
 */
export const onSnapshot = (queryOrDocRef, onNext, onError) => {
  const tenantId = queryOrDocRef.tenantId || 'default';

  // Helper to re-query and emit current snapshot
  const emitCurrent = async () => {
    try {
      if (queryOrDocRef.type === 'doc') {
        const docSnap = await getDoc(queryOrDocRef);
        onNext(docSnap);
      } else {
        const querySnap = await getDocs(queryOrDocRef);
        onNext(querySnap);
      }
    } catch (err) {
      if (onError) onError(err);
    }
  };

  // 1. Initial instantaneous emission
  emitCurrent();

  // 2. Subscribe to reactive local changes
  const unsubscribe = subscribeLocalChanges(tenantId, (change) => {
    if (change.collectionName === queryOrDocRef.collectionName) {
      emitCurrent();
    }
  });

  return unsubscribe;
};
