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

  // ── Emergency Conditions ──
  if (severityGrade >= 8) { // Hypertensive Retinopathy - Crisis
    return {
      level: TRIAGE_LEVELS.EMERGENCY,
      action: 'CRITICAL: Severe vascular changes. Check blood pressure and refer to Emergency Care.',
      timeframe: 'Immediate',
      color: 'red',
    };
  }

  if (severityGrade >= 4 || (severityGrade >= 3 && confidence > 0.8)) {
    return {
      level: TRIAGE_LEVELS.EMERGENCY,
      action: 'Immediate ophthalmology referral required (Vision Loss Risk)',
      timeframe: 'Within 24 hours',
      color: 'red',
    };
  }

  // ── Urgent Conditions ──
  if (severityGrade === 6 || severityGrade === 7) { // Glaucoma / AMD
    return {
      level: TRIAGE_LEVELS.URGENT,
      action: 'Specialist consultation for neurological or macular changes.',
      timeframe: 'Within 72 hours',
      color: 'magenta',
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

  // ── Priority Conditions ──
  if (severityGrade === 5) { // Cataract
    return {
      level: TRIAGE_LEVELS.PRIORITY,
      action: 'Routine referral for surgical consultation.',
      timeframe: 'Within 1-2 months',
      color: 'yellow',
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
