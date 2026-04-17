import { TRIAGE_LEVELS } from '../utils/constants';

/**
 * Auto-triage based on severity grade and confidence.
 * Runs entirely client-side after receiving diagnosis.
 *
 * @param {number} severityGrade - 0 to 4
 * @param {number} confidence - 0.0 to 1.0
 * @param {number} uncertainty - epistemic uncertainty from MC Dropout
 * @returns {{level: string, action: string, timeframe: string, color: string}}
 */
export function computeTriage(severityGrade, confidence, uncertainty = 0) {
  // High uncertainty → escalate
  const highUncertainty = uncertainty > 0.15;

  if (severityGrade >= 4 || (severityGrade >= 3 && confidence > 0.8)) {
    return {
      level: TRIAGE_LEVELS.EMERGENCY,
      action: 'Immediate ophthalmology referral required',
      timeframe: 'Within 24 hours',
      color: 'red',
    };
  }

  if (severityGrade === 3 || (severityGrade === 2 && highUncertainty)) {
    return {
      level: TRIAGE_LEVELS.URGENT,
      action: 'Refer to ophthalmologist for detailed examination',
      timeframe: 'Within 1 week',
      color: 'magenta',
    };
  }

  if (severityGrade === 2 || (severityGrade === 1 && confidence < 0.6)) {
    return {
      level: TRIAGE_LEVELS.PRIORITY,
      action: 'Schedule follow-up examination',
      timeframe: 'Within 1 month',
      color: 'yellow',
    };
  }

  return {
    level: TRIAGE_LEVELS.ROUTINE,
    action: 'Routine annual screening recommended',
    timeframe: 'Annual check-up',
    color: 'green',
  };
}
