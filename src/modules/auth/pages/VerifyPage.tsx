import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Toasts } from '@/layouts/AdminLayout/Toasts';
import { ROUTES } from '@/constants/routes';
import { consoleActions } from '@/store/consoleStore';
import { BrandMark } from '../components/BrandMark';
import { sessionActions, useCurrentAccount } from '../hooks/useSession';
import styles from './Auth.module.css';

/** Two-factor step. The demo accepts the pre-filled code (no SMS backend). */
export default function VerifyPage() {
  const navigate = useNavigate();
  const { account } = useCurrentAccount();

  const verify = (e?: FormEvent) => {
    e?.preventDefault();
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
            We sent a 6-digit code to the phone on file for {account.name} — +254 722 •• 4419.
          </Text>
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
        <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <Text size={11} weight={800} ls={0.7} tone="ink2">
            VERIFICATION CODE
          </Text>
          <input className={styles.codeInput} defaultValue="418 206" inputMode="numeric" autoComplete="one-time-code" />
        </label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Text size={11.5} weight={600} tone="ink3">
            Code expires in 4:52
          </Text>
          <Button variant="link" fs={12} onClick={() => consoleActions.notify('New code sent to +254 722 •• 4419')}>
            Resend code
          </Button>
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
