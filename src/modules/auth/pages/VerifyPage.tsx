import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Toasts } from '@/layouts/AdminLayout/Toasts';
import { ROUTES } from '@/constants/routes';
import { consoleActions } from '@/store/consoleStore';
import { BrandMark } from '../components/BrandMark';
import { formatAuthError, isDemoMode, resendStaffOtp, staffOtpCopy, verifyDevLogin, verifyStaffOtp } from '@/services/auth';
import { sessionActions, useCurrentAccount, useSessionState } from '../hooks/useSession';
import styles from './Auth.module.css';

/** Two-factor step. The demo accepts the pre-filled code (no SMS backend). */
export default function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routedCode =
    location.state && typeof location.state === 'object' && 'developmentOtp' in location.state
      ? String((location.state as { developmentOtp?: unknown }).developmentOtp ?? '')
      : '';
  const [shownCode, setShownCode] = useState(routedCode);
  const developmentOtp = /^\d{6}$/.test(shownCode) ? shownCode : '';
  const developmentLogin = useSessionState((s) => s.developmentLogin);
  const { account } = useCurrentAccount();
  const codeRef = useRef<HTMLInputElement>(null);
  const challengeId = useSessionState((s) => s.challengeId);
  const authError = useSessionState((s) => s.authError);
  const maskedDestination = useSessionState((s) => s.maskedDestination);
  const otpChannel = useSessionState((s) => s.otpChannel);
  const otpExpiresAt = useSessionState((s) => s.otpExpiresAt);
  const resendAvailableAt = useSessionState((s) => s.resendAvailableAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isDemoMode()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const secondsUntil = (iso: string | null) => (iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 1000)) : 0);
  const expiryLeft = secondsUntil(otpExpiresAt);
  const resendLeft = secondsUntil(resendAvailableAt);
  const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  const verify = (e?: FormEvent) => {
    e?.preventDefault();
    if (!isDemoMode()) {
      const code = codeRef.current?.value ?? '';
      if (!challengeId) return sessionActions.setError('Request a code again');
      const verify = developmentLogin ? verifyDevLogin : verifyStaffOtp;
      void verify(challengeId, code)
        .then((me) => {
          sessionActions.verify();
          consoleActions.notify(`Signed in as ${me.name} · ${me.role}`);
          navigate(ROUTES.overview);
        })
        .catch((error: unknown) => sessionActions.setError(formatAuthError(error, 'That code was not accepted')));
      return;
    }
    sessionActions.verify();
    consoleActions.notify(`Signed in as ${account.name} · ${account.role}`);
    navigate(ROUTES.overview);
  };

  return (
    <div className={styles.center}>
      <form className={styles.otpCard} onSubmit={verify} aria-labelledby="otp-title">
        <BrandMark variant="card" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <h1 id="otp-title" style={{ margin: 0, fontFamily: "'Poppins'", fontSize: 22, fontWeight: 700, letterSpacing: '-.5px', color: 'var(--ink)' }}>
            Verify it's you
          </h1>
          <Text size={12.5} weight={600} tone="ink2" lh={1.6}>
            {developmentOtp
              ? 'Development-only code. It was not sent by email or SMS. Type it below.'
              : developmentLogin
              ? 'Enter the development code shown below. It is not sent by email or SMS.'
              : isDemoMode()
                ? `We sent a 6-digit code to the phone on file for ${account.name} — +254 722 •• 4419.`
                : staffOtpCopy(maskedDestination, otpChannel, account.name)}
          </Text>
          {developmentOtp ? (
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--surf4)', border: '1px solid var(--line2)' }}>
              <Text size={10} weight={800} ls={1} tone="ink2">
                DEVELOPMENT CODE
              </Text>
              <Text size={22} weight={800} tone="ink" style={{ letterSpacing: 3 }}>
                {developmentOtp}
              </Text>
            </div>
          ) : null}
        </div>
        <div style={{ padding: '13px 15px', borderRadius: 14, background: 'var(--surf4)', border: '1px solid var(--line2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text size={10} weight={800} ls={1} tone="ink2">
            SIGNING IN AS
          </Text>
          <Text size={12.5} weight={700} tone="ink">
            {account.role}
          </Text>
          <Text size={11} weight={600} tone="ink3" lh={1.5}>
            {account.scope}
          </Text>
        </div>
        {authError ? (
          <Text size={12.5} weight={700} tone="ink" style={{ color: 'var(--bad, #9b2335)' }}>
            {authError}
          </Text>
        ) : null}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <Text size={11} weight={800} ls={0.7} tone="ink2">
            VERIFICATION CODE
          </Text>
          <input ref={codeRef} className={styles.codeInput} defaultValue={isDemoMode() ? '418 206' : ''} inputMode="numeric" autoComplete="one-time-code" />
        </label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Text size={11.5} weight={600} tone="ink3">
            {isDemoMode() ? 'Code expires in 4:52' : expiryLeft > 0 ? `Code expires in ${clock(expiryLeft)}` : 'Code expired'}
          </Text>
          {developmentLogin ? (
            <Text size={11.5} weight={700} tone="ink3">
              Request a new code from sign in
            </Text>
          ) : (
          <Button
            variant="link"
            fs={12}
            onClick={() => {
              if (isDemoMode()) {
                consoleActions.notify('New code sent to +254 722 •• 4419');
                return;
              }
              if (!challengeId || resendLeft > 0) return;
              void resendStaffOtp(challengeId)
                .then((info) => {
                  sessionActions.noteResend(info);
                  if (info.developmentOtp && /^\d{6}$/.test(info.developmentOtp)) {
                    setShownCode(info.developmentOtp);
                    consoleActions.notify('A new development-only code is on this screen.');
                    return;
                  }
                  consoleActions.notify(
                    info.maskedDestination
                      ? `A new code was submitted to ${info.maskedDestination}. Delivery is not confirmed yet.`
                      : 'A new code was submitted. Delivery is not confirmed yet.',
                  );
                })
                .catch(() => consoleActions.notify('Could not resend the code'));
            }}
          >
            Resend code
          </Button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <Button type="submit" variant="primary" h={48} r={14} fs={14}>
            Verify and open console
          </Button>
          <Button
            variant="secondary"
            h={42}
            r={13}
            fs={12.5}
            onClick={() => {
              sessionActions.backToLogin();
              navigate(ROUTES.login);
            }}
          >
            Back to sign in
          </Button>
        </div>
      </form>
      <Toasts />
    </div>
  );
}
