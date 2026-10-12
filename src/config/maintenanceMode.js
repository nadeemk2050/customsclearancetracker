// Temporary maintenance lock for individual workspace views.
//
// Set `locked: false` to reopen a view for everyone. While a view is locked it stays
// hidden behind the maintenance password prompt, and its menu entry is badged.

export const MAINTENANCE_VIEWS = {
  radar: { locked: true, label: 'Loss Prevention Radar' },
  portal: { locked: true, label: 'Public Tracking Portal' }
};

const SESSION_PREFIX = 'cct_maintenance_unlocked_';

export const isViewLocked = (viewId) => !!MAINTENANCE_VIEWS[viewId]?.locked;

export const getMaintenanceLabel = (viewId) => MAINTENANCE_VIEWS[viewId]?.label || 'This page';

/** Once unlocked, the view stays open for the rest of the browser session. */
export const isViewUnlockedThisSession = (viewId) => {
  try {
    return sessionStorage.getItem(SESSION_PREFIX + viewId) === '1';
  } catch {
    return false;
  }
};

export const unlockViewForSession = (viewId) => {
  try {
    sessionStorage.setItem(SESSION_PREFIX + viewId, '1');
  } catch {
    // Session storage unavailable: the prompt simply appears again next time
  }
};
