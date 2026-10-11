// Observable Sync-State & Metrics Store (Module-Level Store)
// Keeps sync state outside React state to avoid root re-renders.

const listeners = new Set();

let currentState = {
  status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'connected', // offline | connecting | syncing | connected | error
  progress: 0,
  total: 0,
  errorMessage: null,
  tenantId: null,
  metrics: {
    rowsPushed: 0,
    rowsPulled: 0,
    queueDepth: 0,
    lastSyncTime: null
  }
};

/**
 * Get a snapshot of the current sync state
 */
export const getSyncStatus = () => {
  return { ...currentState, metrics: { ...currentState.metrics } };
};

/**
 * Update the sync status
 * @param {string} status 
 * @param {object} details 
 */
export const setSyncStatus = (status, details = {}) => {
  currentState = {
    ...currentState,
    status,
    progress: details.progress !== undefined ? details.progress : currentState.progress,
    total: details.total !== undefined ? details.total : currentState.total,
    errorMessage: details.errorMessage || null,
    tenantId: details.tenantId || currentState.tenantId,
    metrics: {
      ...currentState.metrics,
      ...(details.metrics || {})
    }
  };

  notifyListeners();
};

/**
 * Update specific sync metrics (rows pushed, pulled, queue depth)
 * @param {object} partialMetrics 
 */
export const updateSyncMetrics = (partialMetrics = {}) => {
  currentState.metrics = {
    ...currentState.metrics,
    ...partialMetrics
  };
  notifyListeners();
};

/**
 * Subscribe to sync state changes (UI components can observe without polling)
 * @param {Function} callback 
 * @returns {Function} Unsubscribe
 */
export const subscribeSyncStatus = (callback) => {
  listeners.add(callback);
  // Emit immediately on subscription
  try {
    callback(getSyncStatus());
  } catch (err) {
    console.error('[SyncStatus] Initial callback error:', err);
  }

  return () => {
    listeners.delete(callback);
  };
};

const notifyListeners = () => {
  const snapshot = getSyncStatus();
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (err) {
      console.error('[SyncStatus] Listener notification error:', err);
    }
  });
};

// Automatic Network Online/Offline Listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setSyncStatus('connecting', { errorMessage: null });
  });

  window.addEventListener('offline', () => {
    setSyncStatus('offline', { errorMessage: 'Device is offline' });
  });
}
