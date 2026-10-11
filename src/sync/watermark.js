// Per-Tenant Watermark Cursor Persistence
// Tracks the highest syncTimestamp successfully pulled from the cloud.

const WATERMARK_PREFIX = 'last_pull_';

/**
 * Get the current watermark cursor for a tenant
 * @param {string} tenantId 
 * @returns {number} Timestamp in ms (defaults to 0)
 */
export const getWatermark = (tenantId = 'default') => {
  try {
    const raw = localStorage.getItem(`${WATERMARK_PREFIX}${tenantId}`);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch {
    // Non-blocking fallback
  }
  return 0;
};

/**
 * Advance the watermark cursor for a tenant
 * @param {string} tenantId 
 * @param {number} timestamp 
 */
export const setWatermark = (tenantId = 'default', timestamp = 0) => {
  try {
    const current = getWatermark(tenantId);
    if (timestamp > current) {
      localStorage.setItem(`${WATERMARK_PREFIX}${tenantId}`, timestamp.toString());
    }
  } catch {
    // Non-blocking fallback
  }
};

/**
 * Reset the watermark to 0 (forces complete re-pull on next cycle)
 * @param {string} tenantId 
 */
export const resetWatermark = (tenantId = 'default') => {
  try {
    localStorage.removeItem(`${WATERMARK_PREFIX}${tenantId}`);
  } catch {
    // Non-blocking fallback
  }
};
