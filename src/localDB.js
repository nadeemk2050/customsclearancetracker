// Local Reactive Database via Dexie / IndexedDB Engine
// Multi-Tenant Isolation: One database per tenant (myapp_tenant_{tenantId})
// Plus master database (myapp_master_db) for tenant registry & licensing.

import Dexie from 'dexie';

// In-memory cache of tenant database instances
const tenantDbCache = new Map();
let masterDbInstance = null;

// Reactive event subscribers map: tenantId -> Set of callback listeners
const reactiveSubscribers = new Map();

/**
 * Master Database for Tenant List and Licensing Discovery
 */
export const getMasterDB = () => {
  if (!masterDbInstance) {
    masterDbInstance = new Dexie('myapp_master_db');
    masterDbInstance.version(1).stores({
      tenants: '&id, name, ownerEmail, createdAt, isLive',
      licenses: '&tenantId, plan, status, expiresAt'
    });
  }
  return masterDbInstance;
};

/**
 * Get or initialize a dedicated local reactive database for a tenant
 * @param {string} tenantId 
 * @returns {Dexie} Tenant DB instance
 */
export const getLocalDB = (tenantId = 'default') => {
  if (!tenantId) tenantId = 'default';

  if (tenantDbCache.has(tenantId)) {
    return tenantDbCache.get(tenantId);
  }

  const dbName = `myapp_tenant_${tenantId}`;
  const db = new Dexie(dbName);

  // Schema: Polymorphic single-table document store + transactional outbox queue
  db.version(1).stores({
    // offline_records: id is client UUID, indexed by collectionName, timestamp, lastSync, deleted
    offline_records: '&id, collectionName, timestamp, lastSync, deleted, [collectionName+deleted]',
    // sync_queue: transactional outbox
    sync_queue: '++queueId, id, collectionName, docId, operation, queuedAt'
  });

  tenantDbCache.set(tenantId, db);
  return db;
};

/**
 * Close and evict a tenant DB from memory (used on tenant switch)
 * @param {string} tenantId 
 */
export const closeTenantDB = async (tenantId) => {
  if (tenantDbCache.has(tenantId)) {
    const db = tenantDbCache.get(tenantId);
    await db.close();
    tenantDbCache.delete(tenantId);
  }
  reactiveSubscribers.delete(tenantId);
};

/**
 * Notify all reactive subscribers for a tenant
 * @param {string} tenantId 
 * @param {object} changeEvent { collectionName, docId, operation, record }
 */
export const notifyLocalSubscribers = (tenantId, changeEvent) => {
  const subscribers = reactiveSubscribers.get(tenantId);
  if (subscribers && subscribers.size > 0) {
    subscribers.forEach((cb) => {
      try {
        cb(changeEvent);
      } catch (err) {
        console.error('[ReactiveDB] Subscriber error:', err);
      }
    });
  }
};

/**
 * Subscribe to local database changes for a tenant
 * @param {string} tenantId 
 * @param {Function} callback 
 * @returns {Function} Unsubscribe function
 */
export const subscribeLocalChanges = (tenantId, callback) => {
  if (!reactiveSubscribers.has(tenantId)) {
    reactiveSubscribers.set(tenantId, new Set());
  }
  const set = reactiveSubscribers.get(tenantId);
  set.add(callback);

  return () => {
    set.delete(callback);
    if (set.size === 0) {
      reactiveSubscribers.delete(tenantId);
    }
  };
};

/**
 * Generate a client-side stable UUID v4
 * @returns {string} UUID
 */
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
