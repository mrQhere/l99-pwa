import { HF_SPACES_URL } from '../utils/constants';

/**
 * Federated Learning Client.
 * Sends encrypted weight deltas to HuggingFace Spaces aggregator.
 * Raw images never leave the device.
 */

/**
 * Submit local weight updates to the federated aggregator.
 * @param {Object} weightDelta - Encrypted weight delta object
 * @returns {Promise<Object>} Server response
 */
export async function submitWeightDelta(weightDelta) {
  try {
    const response = await fetch(`${HF_SPACES_URL}/api/federated/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        delta: weightDelta,
        timestamp: new Date().toISOString(),
        client_id: getClientId(),
      }),
    });
    return await response.json();
  } catch (err) {
    console.warn('Federated submit failed:', err);
    return { status: 'failed', error: err.message };
  }
}

/**
 * Check aggregation status.
 */
export async function checkAggregation() {
  try {
    const response = await fetch(`${HF_SPACES_URL}/api/federated/aggregate`);
    return await response.json();
  } catch {
    return { status: 'unreachable' };
  }
}

/**
 * Get or create a persistent client ID for this device.
 */
function getClientId() {
  let id = localStorage.getItem('l99_client_id');
  if (!id) {
    id = 'client_' + crypto.randomUUID();
    localStorage.setItem('l99_client_id', id);
  }
  return id;
}
