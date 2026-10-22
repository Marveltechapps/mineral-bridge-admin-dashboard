import { describe, expect, it } from 'vitest';
import { reviewDecisionBody } from '@/services/verification/verificationService';

describe('reviewDecisionBody', () => {
  it('approves without a reason', () => {
    expect(reviewDecisionBody('Verified', '')).toEqual({ decision: 'approve' });
  });

  it('refuses an empty rejection or resubmission reason', () => {
    expect(reviewDecisionBody('Rejected', '  ')).toHaveProperty('error');
    expect(reviewDecisionBody('Awaiting resubmission', 'no')).toHaveProperty('error');
  });

  it('sends the trimmed reason the customer will see', () => {
    expect(reviewDecisionBody('Rejected', '  The photo is cut off.  ')).toEqual({
      decision: 'reject',
      reason: 'The photo is cut off.',
    });
    expect(reviewDecisionBody('Awaiting resubmission', 'Retake the back of the card.')).toEqual({
      decision: 'request_resubmission',
      reason: 'Retake the back of the card.',
    });
  });
});
