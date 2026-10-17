import { describe, expect, it } from 'vitest';
import { staffOtpCopy } from '@/services/auth';

describe('staff OTP copy', () => {
  it('does not claim the message was delivered', () => {
    const sms = staffOtpCopy('+254 722 •• 4419', 'sms', 'Grace');
    const email = staffOtpCopy('g•••@mineralbridge.co.ke', 'email', 'Grace');
    expect(sms).toContain('+254 722 •• 4419');
    expect(sms.toLowerCase()).not.toContain('delivered');
    expect(email).toContain('email');
    expect(email).toContain('confirmed only when it arrives');
  });
});
