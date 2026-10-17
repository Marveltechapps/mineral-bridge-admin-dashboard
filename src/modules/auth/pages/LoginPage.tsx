import { useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { StaticToggle } from '@/components/ui/Toggle';
import { Toasts } from '@/layouts/AdminLayout/Toasts';
import { ROUTES } from '@/constants/routes';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { BrandMark } from '../components/BrandMark';
import { sessionActions, useSessionState } from '../hooks/useSession';
import {
  STAFF_ACCOUNTS,
  authenticateDemo,
  formatAuthError,
  isDemoMode,
  requestStaffPasswordReset,
  resolveSso,
  signInStaff,
  startStaffSso,
} from '@/services/auth';
import styles from './Auth.module.css';

const PITCH_STATS = [
  ['$46.31M', 'IN VAULT CUSTODY'],
  ['184', 'ACTIVE ORDERS'],
  ['8,412', 'VERIFIED ACCOUNTS'],
] as const;

export default function LoginPage() {
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const error = useSessionState((s) => s.authError);
  const credsOpen = useSessionState((s) => s.credsOpen);
  const dark = useConsole((s) => s.theme === 'dark');

  const signIn = (e?: FormEvent) => {
    e?.preventDefault();
    const email = emailRef.current?.value ?? '';
    const password = passRef.current?.value ?? '';
    if (!isDemoMode()) {
      sessionActions.setError(null);
      void signInStaff(email, password)
        .then((challenge) => {
          sessionActions.toLiveOtp(
            challenge.challengeId,
            {
              name: email,
              role: 'Staff',
              initials: email.slice(0, 2).toUpperCase(),
              email,
              demoPassword: '',
              scope: 'Operations console',
            },
            challenge,
          );
          navigate(ROUTES.verify);
        })
        .catch((error: unknown) => sessionActions.setError(formatAuthError(error, 'Sign-in failed')));
      return;
    }
    const res = authenticateDemo(email, password);
    if (!res.ok) return sessionActions.setError(res.error);
    sessionActions.toOtp(res.index);
    navigate(ROUTES.verify);
  };

  const sso = () => {
    const email = emailRef.current?.value ?? '';
    if (!isDemoMode()) {
      sessionActions.setError(null);
      void startStaffSso(email)
        .then((result) => {
          window.location.assign(result.redirectUrl);
        })
        .catch((error: unknown) => sessionActions.setError(formatAuthError(error, 'Staff SSO is not available')));
      return;
    }
    const res = resolveSso(email);
    if (!res.ok) return sessionActions.setError(res.error);
    sessionActions.toOtp(res.index);
    navigate(ROUTES.verify);
  };

  const forgotPassword = () => {
    if (isDemoMode()) {
      consoleActions.notify('Password reset link sent to the work email on file');
      return;
    }
    const email = emailRef.current?.value ?? '';
    sessionActions.setError(null);
    void requestStaffPasswordReset(email)
      .then((result) => consoleActions.notify(result.message || 'If that account exists, a reset link is on its way.'))
      .catch((error: unknown) => sessionActions.setError(formatAuthError(error, 'Could not request a password reset')));
  };

  return (
    <div className={styles.split}>
      <section className={styles.brandPanel} aria-label="Mineral Bridge">
        <BrandMark variant="login" />
        <div className={styles.pitch}>
          <h2 className={styles.headline}>The desk behind every verified trade.</h2>
          <p style={{ margin: 0, fontSize: 14.5, fontWeight: 500, lineHeight: 1.7, color: 'rgba(255,255,255,.66)' }}>
            Custody, pricing, compliance and settlement in one console. Every action you take here is attributed to your account and written to the audit log.
          </p>
          <div className={styles.stats}>
            {PITCH_STATS.map(([v, k]) => (
              <span key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontFamily: "'Poppins'", fontSize: 22, fontWeight: 700, color: '#F3D27A' }}>{v}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '1px', color: 'rgba(255,255,255,.5)' }}>{k}</span>
              </span>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>Internal use only · Nairobi, Kenya · v4.2.0</span>
      </section>

      <form className={styles.formPanel} onSubmit={signIn} noValidate aria-labelledby="login-title">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Text size={10.5} weight={800} ls={1.3} tone="ink3">
              STAFF SIGN IN
            </Text>
            <button
              type="button"
              className={styles.themeBtn}
              onClick={consoleActions.toggleTheme}
              title={dark ? 'Switch to light' : 'Switch to dark'}
              aria-label={dark ? 'Switch to light' : 'Switch to dark'}
            >
              <Icon name={dark ? 'sun' : 'moon'} size={17} />
            </button>
          </span>
          <h1 id="login-title" style={{ margin: 0, fontFamily: "'Poppins'", fontSize: 26, fontWeight: 700, letterSpacing: '-.6px', color: 'var(--ink)' }}>
            Welcome back
          </h1>
          <Text size={12.5} weight={600} tone="ink2">
            Use your Mineral Bridge staff account. Access is scoped to your role.
          </Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {error && (
            <span className={styles.error} role="alert">
              <Icon name="x" size={14} />
              {error}
            </span>
          )}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text size={11} weight={800} ls={0.7} tone="ink2">
              WORK EMAIL
            </Text>
            <input ref={emailRef} className={styles.authInput} type="email" autoComplete="username" placeholder="firstname.lastname@mineralbridge.co.ke" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text size={11} weight={800} ls={0.7} tone="ink2">
              PASSWORD
            </Text>
            <input ref={passRef} className={styles.authInput} type="password" autoComplete="current-password" placeholder="Enter your password" />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <StaticToggle on />
              <Text size={12} weight={700} tone="ink">
                Trust this device for 14 days
              </Text>
            </span>
            <Button variant="link" fs={12} onClick={forgotPassword}>
              Forgot password?
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button type="submit" variant="primary" h={48} r={14} fs={14}>
            Sign in
          </Button>
          <Button variant="secondaryInk" h={44} r={13} fs={13} onClick={sso}>
            Continue with staff SSO
          </Button>
          <Button variant="quiet" h={34} r={11} fs={11.5} style={{ height: 34 }} onClick={sessionActions.toggleCreds} aria-expanded={credsOpen}>
            {credsOpen ? 'Hide staff test credentials' : 'Show staff test credentials'}
          </Button>
          {credsOpen && (
            <div className={styles.creds}>
              <div className={styles.credsHead}>STAFF TEST ACCOUNTS · CLICK TO FILL</div>
              {STAFF_ACCOUNTS.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  className={styles.cred}
                  onClick={() => {
                    if (emailRef.current) emailRef.current.value = c.email;
                    if (passRef.current) passRef.current.value = c.demoPassword;
                    sessionActions.setError(null);
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }}>
                    <Text size={11.5} weight={700} tone="ink">
                      {c.role}
                    </Text>
                    <Text font="mono" size={10.5} weight={600} tone="ink2">
                      {c.demoPassword}
                    </Text>
                  </span>
                  <Text font="mono" size={10} weight={600} tone="ink3">
                    {c.email}
                  </Text>
                </button>
              ))}
            </div>
          )}
          <Text size={11} weight={600} tone="ink3" align="center" lh={1.6} style={{ paddingTop: 4 }}>
            Two-factor verification is required for every role with edit access.
          </Text>
        </div>
      </form>
      <Toasts />
    </div>
  );
}
