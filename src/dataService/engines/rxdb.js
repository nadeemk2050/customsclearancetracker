// High-Performance Indexed Read-Model Engine
// Computes fast typed aggregations directly from local IndexedDB without blocking the main React render thread.

import { getLocalDB } from '../../localDB';

/**
 * Compute fleet risk summary directly from local IndexedDB
 * @param {string} tenantId 
 */
export const getAggregatedFleetMetrics = async (tenantId = 'default') => {
  const db = getLocalDB(tenantId);
  const rows = await db.offline_records
    .where('collectionName')
    .equals('shipments')
    .filter((r) => !r.deleted)
    .toArray();

  let totalActive = 0;
  let totalContainers = 0;
  let criticalCount = 0;
  let overdueCount = 0;
  let portRiskCount = 0;

  for (const row of rows) {
    const s = row.data || {};
    totalActive++;
    const containerCount = Array.isArray(s.containers) ? s.containers.length : 1;
    totalContainers += containerCount;

    if (s.overallRisk === 'CRITICAL') criticalCount++;
    if (s.overallRisk === 'OVERDUE') overdueCount++;
    if (s.portDaysLeft !== null && s.portDaysLeft <= 3 && s.portDaysLeft >= 0) portRiskCount++;
  }

  return {
    totalActive,
    totalContainers,
    criticalCount,
    overdueCount,
    portRiskCount,
    generatedAt: Date.now()
  };
};

/**
 * Fast paginated / capped read query for large datasets (prevents UI freeze > 500 rows)
 * @param {string} tenantId 
 * @param {string} collectionName 
 * @param {number} limit 
 * @param {number} offset 
 */
export const getCappedCollectionRecords = async (tenantId = 'default', collectionName = 'shipments', limit = 200, offset = 0) => {
  const db = getLocalDB(tenantId);
  const rows = await db.offline_records
    .where('collectionName')
    .equals(collectionName)
    .filter((r) => !r.deleted)
    .offset(offset)
    .limit(limit)
    .toArray();

  return rows.map((r) => ({ ...r.data, id: r.id }));
};
