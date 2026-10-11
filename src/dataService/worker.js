// Web Worker & SQLite-WASM Read-Model Adapter
// Offloads compute-heavy typed aggregations and analytical queries from the main UI thread.

export const createReadWorker = () => {
  if (typeof Worker === 'undefined') {
    return null;
  }

  // Fallback inline worker blob for universal browser compatibility
  const workerBlob = new Blob([`
    self.onmessage = function(e) {
      const { type, tenantId, records } = e.data;
      if (type === 'COMPUTE_METRICS') {
        let total = 0;
        let critical = 0;
        for (let i = 0; i < records.length; i++) {
          total++;
          if (records[i].overallRisk === 'CRITICAL') critical++;
        }
        self.postMessage({ type: 'METRICS_RESULT', total, critical, tenantId });
      }
    };
  `], { type: 'application/javascript' });

  return new Worker(URL.createObjectURL(workerBlob));
};
