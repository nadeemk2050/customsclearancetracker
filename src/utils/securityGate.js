// Central authorization gate for destructive actions.
// Nothing in the app deletes, removes or overwrites data without passing this check.

export const ACTION_PASSWORD = 'abcd';

/**
 * Ask for the authorization password before a destructive action.
 * Fails closed: if the check cannot be shown, the action is refused.
 *
 * @param {string} actionName short description used in the prompt,
 *   e.g. 'permanently delete this BL shipment'
 * @returns {boolean} true only when the correct password was entered
 */
export const requestActionPassword = (actionName = 'proceed with this operation') => {
  let entered = null;

  try {
    entered = window.prompt(`🔒 Security Verification:\nEnter authorization password to ${actionName}:`);
  } catch {
    // Browsers/embedded webviews that block native prompts must not silently allow the action
    window.alert('❌ This browser blocks the security prompt, so the action was cancelled for safety.');
    return false;
  }

  if (entered === ACTION_PASSWORD) return true;

  if (entered !== null) {
    window.alert('❌ Access Denied: Incorrect password. You must enter "abcd" to proceed.');
  }
  return false;
};

/**
 * Gate for a view that is temporarily under maintenance.
 * Shows a maintenance notice with the password hint so users do not waste time.
 *
 * @param {string} pageLabel name of the page, e.g. 'Loss Prevention Radar'
 * @returns {boolean} true only when the correct password was entered
 */
export const requestMaintenanceAccess = (pageLabel = 'This page') => {
  let entered = null;

  try {
    entered = window.prompt(
      `🛠️  UNDER MAINTENANCE\n\n` +
      `${pageLabel} is under maintenance at the moment, so please don't waste your time here.\n\n` +
      `If you really need it now, enter the password "abcd" to continue:`
    );
  } catch {
    window.alert(`🛠️ ${pageLabel} is under maintenance. Please try again later.`);
    return false;
  }

  if (entered === ACTION_PASSWORD) return true;

  if (entered !== null) {
    window.alert(`🛠️ ${pageLabel} is under maintenance. Please try again later.`);
  }
  return false;
};
