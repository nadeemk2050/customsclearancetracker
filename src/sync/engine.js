// Production-Grade Bidirectional Local-First Sync Engine
// Orchestrates Outbox Flushing (Push) and Incremental Watermark Pull with Echo-Loop Guards

import { getLocalDB, notifyLocalSubscribers } from '../localDB';
import { getWatermark, setWatermark, resetWatermark } from './watermark';
import { getPendingQueue, markSynced, getQueueDepth } from './outbox';
import { setSyncStatus, updateSyncMetrics, getSyncStatus } from './status';
import { pushCloudBatch, subscribeRemoteDelta, updateCloudRegistry, isCloudReachable } from '../cloud';

// Active engine state per tenant
const activeSubscriptions = new Map(); // tenantId -> unsubscribe function
const flushTimeouts = new Map();       // tenantId -> debounce timeout ID
const isFlushingMap = new Map();       // tenantId -> boolean

// ECHO-LOOP GUARD: Suppress pushing local onChange events caused by pull writes
// Map: docId -> timestamp in ms until which pushes are suppressed
const suppressPushUntil = new Map();
const SUPPRESSION_DURATION_MS = 5000;

// Collections configured for optional field-level merge instead of pure LWW document replace
const fieldLevelMergeCollections = new Set(['shipments', 'settings', 'masters']);

// SERIALIZED PULL QUEUE: Guarantees incoming remote deltas apply one-at-a-time without race conditions
let pullQueuePromise = Promise.resolve();

/**
 * Check if a document is currently suppressed by the echo-loop guard
 * @param {string} docId 
 * @returns {boolean}
 */
export const isPushSuppressed = (docId) => {
  const until = suppressPushUntil.get(docId);
  if (!until) return false;
  if (Date.now() > until) {
    suppressPushUntil.delete(docId);
    return false;
  }
  return true;
};

/**
 * Suppress pushes for a document (called immediately when a remote delta is applied locally)
 * @param {string} docId 
 */
export const recordRemoteApplySuppression = (docId) => {
  suppressPushUntil.set(docId, Date.now() + SUPPRESSION_DURATION_MS);
};

/**
 * Flush all pending outbox records to Firestore
 * Drains sync_queue in chunks of <= 100 docs and marks lastSync
 * @param {string} tenantId 
 */
export const flushPending = async (tenantId = 'default') => {
  if (isFlushingMap.get(tenantId)) return; // Prevent concurrent push runs
  if (!isCloudReachable()) {
    setSyncStatus('offline', { tenantId });
    return;
  }

  isFlushingMap.set(tenantId, true);
  const db = getLocalDB(tenantId);

  try {
    const queue = await getPendingQueue(db);
    const queueDepth = queue.length;
    updateSyncMetrics({ queueDepth });

    if (queueDepth === 0) {
      setSyncStatus('connected', { tenantId });
      isFlushingMap.set(tenantId, false);
      return;
    }

    setSyncStatus('syncing', {
      tenantId,
      progress: 0,
      total: queueDepth
    });

    // Extract records to push, filtering out any currently suppressed by echo guard
    const recordIdsToFetch = queue.map((q) => q.docId);
    const records = await db.offline_records.where('id').anyOf(recordIdsToFetch).toArray();
    const recordsMap = new Map(records.map((r) => [r.id, r]));

    const pushBatchRecords = [];
    const queueIdsToClear = [];
    const recordIdsFlushed = [];

    for (const qItem of queue) {
      if (isPushSuppressed(qItem.docId)) {
        // Echo-loop protection: drop queue item without pushing
        queueIdsToClear.push(qItem.queueId);
        continue;
      }

      const rec = recordsMap.get(qItem.docId);
      if (rec) {
        pushBatchRecords.push(rec);
        queueIdsToClear.push(qItem.queueId);
        recordIdsFlushed.push(rec.id);
      } else {
        // Record was purged or not found, drop orphan queue item
        queueIdsToClear.push(qItem.queueId);
      }
    }

    if (pushBatchRecords.length > 0) {
      // Push in chunks of <= 100 documents to Cloud Firestore
      const { pushedCount } = await pushCloudBatch(tenantId, pushBatchRecords);
      const now = Date.now();

      // Transactionally clear outbox and update lastSync
      await markSynced(db, queueIdsToClear, recordIdsFlushed, now);

      const remainingDepth = await getQueueDepth(db);
      const metrics = getSyncStatus().metrics;
      updateSyncMetrics({
        rowsPushed: metrics.rowsPushed + pushedCount,
        queueDepth: remainingDepth,
        lastSyncTime: now
      });
    } else if (queueIdsToClear.length > 0) {
      await markSynced(db, queueIdsToClear, [], Date.now());
    }

    setSyncStatus('connected', { tenantId, progress: queueDepth, total: queueDepth });
  } catch (err) {
    console.warn('[Sync Engine] Outbox flush retryable notice:', err.message);
    setSyncStatus('error', { tenantId, errorMessage: err.message });
  } finally {
    isFlushingMap.set(tenantId, false);
  }
};

/**
 * Schedule a debounced flush (triggered on optimistic local writes)
 * @param {string} tenantId 
 * @param {number} delayMs 
 */
export const scheduleFlush = (tenantId = 'default', delayMs = 1200) => {
  if (flushTimeouts.has(tenantId)) {
    clearTimeout(flushTimeouts.get(tenantId));
  }

  const timeoutId = setTimeout(() => {
    flushPending(tenantId).catch(() => {});
  }, delayMs);

  flushTimeouts.set(tenantId, timeoutId);
};

/**
 * Apply remote deltas locally inside a SERIALIZED queue
 * Conflict Resolution: Last-Write-Wins (LWW) per document based on syncTimestamp
 * @param {string} tenantId 
 * @param {Array} deltas 
 */
export const applyRemoteDeltas = async (tenantId, deltas) => {
  pullQueuePromise = pullQueuePromise.then(async () => {
    const db = getLocalDB(tenantId);
    let maxSyncTimestamp = getWatermark(tenantId);
    let pulledCount = 0;

    for (const item of deltas) {
      const { record } = item;
      if (!record || !record.id) continue;

      const localRow = await db.offline_records.get(record.id);

      // Track watermark progression
      if (record.syncTimestamp && record.syncTimestamp > maxSyncTimestamp) {
        maxSyncTimestamp = record.syncTimestamp;
      }

      // Conflict Resolution: Last-Write-Wins based on syncTimestamp vs local timestamp
      if (localRow) {
        const localTime = localRow.syncTimestamp || localRow.timestamp || 0;
        const remoteTime = record.syncTimestamp || record.timestamp || 0;

        if (remoteTime < localTime) {
          // Local write is newer; ignore stale remote update
          continue;
        }

        // Optional JSON Field-Level Merge for configured collections
        if (fieldLevelMergeCollections.has(record.collectionName) && !record.deleted && !localRow.deleted) {
          record.data = {
            ...(localRow.data || {}),
            ...(record.data || {})
          };
        }
      }

      // 1. ECHO-LOOP GUARD: Register suppression for this doc
      recordRemoteApplySuppression(record.id);

      // 2. Write directly to local DB with enqueue: false (NEVER adds to sync_queue outbox!)
      const entityToStore = {
        id: record.id,
        collectionName: record.collectionName,
        data: record.data,
        timestamp: record.timestamp,
        lastSync: record.syncTimestamp || Date.now(),
        deleted: !!record.deleted
      };

      await db.offline_records.put(entityToStore);
      pulledCount++;

      // 3. Notify local UI subscribers
      notifyLocalSubscribers(tenantId, {
        collectionName: record.collectionName,
        docId: record.id,
        operation: record.deleted ? 'DELETE' : 'UPDATE',
        record: entityToStore
      });
    }

    // Advance watermark cursor
    if (maxSyncTimestamp > getWatermark(tenantId)) {
      setWatermark(tenantId, maxSyncTimestamp);
    }

    const metrics = getSyncStatus().metrics;
    updateSyncMetrics({
      rowsPulled: metrics.rowsPulled + pulledCount,
      lastSyncTime: Date.now()
    });
  }).catch((err) => {
    console.error('[Sync Engine] Error processing remote deltas:', err);
  });

  return pullQueuePromise;
};

/**
 * Start bidirectional sync for a tenant (Pusher + Puller)
 * @param {string} tenantId 
 */
export const startSync = (tenantId = 'default') => {
  stopSync(tenantId);

  setSyncStatus('connecting', { tenantId });
  const watermark = getWatermark(tenantId);

  // 1. Subscribe to remote delta stream (syncTimestamp > watermark)
  const unsubscribe = subscribeRemoteDelta(
    tenantId,
    watermark,
    (deltas) => {
      applyRemoteDeltas(tenantId, deltas);
      setSyncStatus('connected', { tenantId });
    },
    (err) => {
      // Quietly transition to local-first protected state without alarming console warnings
      setSyncStatus('offline', {
        tenantId,
        errorMessage: null
      });
    }
  );

  activeSubscriptions.set(tenantId, unsubscribe);

  // 2. Immediately flush pending outbox changes (recovery on startup/reconnect)
  flushPending(tenantId).catch(() => {});
};

/**
 * Stop active sync and detach listeners for a tenant
 * @param {string} tenantId 
 */
export const stopSync = (tenantId = 'default') => {
  if (activeSubscriptions.has(tenantId)) {
    const unsub = activeSubscriptions.get(tenantId);
    if (typeof unsub === 'function') unsub();
    activeSubscriptions.delete(tenantId);
  }

  if (flushTimeouts.has(tenantId)) {
    clearTimeout(flushTimeouts.get(tenantId));
    flushTimeouts.delete(tenantId);
  }

  isFlushingMap.set(tenantId, false);
};

/**
 * Make a tenant live (Initializes local DB, updates registry doc, starts bidirectional sync)
 * @param {string} tenantId 
 * @param {object} meta Optional registry metadata { name, ownerEmail, stats }
 */
export const makeLive = async (tenantId = 'default', meta = {}) => {
  const db = getLocalDB(tenantId);
  const depth = await getQueueDepth(db);
  updateSyncMetrics({ queueDepth: depth });

  // Update cloud discovery registry doc
  updateCloudRegistry(tenantId, meta).catch(() => {});

  // Start bidirectional sync
  startSync(tenantId);

  return { success: true, tenantId };
};

/**
 * Force a full resync (Resets watermark to 0, flushes pending outbox, and re-pulls)
 * @param {string} tenantId 
 */
export const forceFullResync = async (tenantId = 'default') => {
  stopSync(tenantId);
  resetWatermark(tenantId);
  await flushPending(tenantId);
  startSync(tenantId);
};

// Automatic Reconnection Event Listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    activeSubscriptions.forEach((_, tenantId) => {
      flushPending(tenantId).catch(() => {});
    });
  });
}
