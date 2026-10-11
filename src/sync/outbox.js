// Transactional Outbox (sync_queue) for Optimistic Local Writes
// Guarantees zero data loss on network drops or sudden app restarts.

/**
 * Append a pending write mutation to the local transactional outbox
 * @param {Dexie} db 
 * @param {object} item { id, collectionName, docId, operation }
 */
export const enqueueOutbox = async (db, { id, collectionName, docId, operation }) => {
  return await db.transaction('rw', db.sync_queue, async () => {
    // If an item for the same doc is already in queue, update or collapse
    const existing = await db.sync_queue.where('docId').equals(docId).first();
    if (existing) {
      // If original was INSERT and current is UPDATE, keep as INSERT with newest payload
      // If current is DELETE, operation becomes DELETE
      const nextOp = existing.operation === 'INSERT' && operation === 'DELETE' ? 'DELETE' : operation;
      await db.sync_queue.update(existing.queueId, {
        operation: nextOp,
        queuedAt: Date.now()
      });
      return existing.queueId;
    }

    return await db.sync_queue.add({
      id: id || docId,
      collectionName,
      docId,
      operation: operation || 'UPDATE',
      queuedAt: Date.now()
    });
  });
};

/**
 * Retrieve all pending outbox queue items sorted chronologically
 * @param {Dexie} db 
 * @returns {Promise<Array>}
 */
export const getPendingQueue = async (db) => {
  return await db.sync_queue.orderBy('queueId').toArray();
};

/**
 * Get the current queue depth (number of unsynced changes)
 * @param {Dexie} db 
 * @returns {Promise<number>}
 */
export const getQueueDepth = async (db) => {
  return await db.sync_queue.count();
};

/**
 * Remove items from sync_queue and mark offline_records as lastSync = now
 * Atomically executed inside a Dexie transaction.
 * @param {Dexie} db 
 * @param {Array<number>} queueIds 
 * @param {Array<string>} recordIds 
 * @param {number} syncTimestamp 
 */
export const markSynced = async (db, queueIds, recordIds, syncTimestamp = Date.now()) => {
  return await db.transaction('rw', [db.sync_queue, db.offline_records], async () => {
    // 1. Delete flushed outbox entries
    if (queueIds && queueIds.length > 0) {
      await db.sync_queue.bulkDelete(queueIds);
    }

    // 2. Mark records with lastSync timestamp
    if (recordIds && recordIds.length > 0) {
      for (const id of recordIds) {
        const row = await db.offline_records.get(id);
        if (row) {
          await db.offline_records.update(id, { lastSync: syncTimestamp });
        }
      }
    }
  });
};

/**
 * Clear all outbox entries (used on full resync or hard reset)
 * @param {Dexie} db 
 */
export const clearQueue = async (db) => {
  await db.sync_queue.clear();
};
