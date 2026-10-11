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
