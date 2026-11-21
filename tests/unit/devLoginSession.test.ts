import { describe, expect, it } from 'vitest';
import { STAFF_ACCOUNTS } from '@/services/auth';
import { sessionActions } from '@/modules/auth/hooks/useSession';

describe('development login session', () => {
  it('does not write the development code into session storage', () => {
    sessionActions.toLiveOtp(
      'chl_dev',
      STAFF_ACCOUNTS[0]!,
      { maskedDestination: 'Shown on this screen', channel: 'development' },
      { developmentLogin: true },
    );
    const raw = window.sessionStorage.getItem('mb-session') ?? '';
    expect(raw).toContain('"developmentLogin":true');
    expect(raw).not.toContain('847291');
    expect(raw).not.toContain('developmentOtp');
    sessionActions.backToLogin();
  });
});
