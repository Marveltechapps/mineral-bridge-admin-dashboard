import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';
import { consoleActions } from '@/store/consoleStore';
import { sessionActions, useCurrentAccount } from '../hooks/useSession';
import styles from './Auth.module.css';

export default function LockedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.overview;
  const { account, lockedAt } = useCurrentAccount();

  const unlock = (e?: FormEvent) => {
    e?.preventDefault();
    consoleActions.set({ avatarOpen: false });
    sessionActions.unlock();
    navigate(from, { replace: true });
  };

  return (
    <div className={styles.center}>
      <form className={styles.locked} onSubmit={unlock} aria-labelledby="locked-title">
        <span
          style={{
            width: 74,
            height: 74,
            borderRadius: 24,
            background: 'rgba(247,221,142,.14)',
            border: '1px solid rgba(247,221,142,.34)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Poppins'",
            fontSize: 22,
            fontWeight: 700,
            color: '#F3D27A',
          }}
          aria-hidden="true"
        >
          {account.initials}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 id="locked-title" style={{ margin: 0, fontFamily: "'Poppins'", fontSize: 24, fontWeight: 700, letterSpacing: '-.5px' }}>
            Console locked
          </h1>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.62)', lineHeight: 1.65 }}>
            {account.name} · {account.role}
            <br />
            Locked at {lockedAt}. Your place in the console is kept.
          </span>
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="password" className={styles.lockInput} defaultValue="desk-access-2026" placeholder="Password" aria-label="Password" autoComplete="current-password" />
          <Button type="submit" variant="gold" h={46} r={14} fs={13.5}>
            Unlock console
          </Button>
          <Button
            variant="glassSubtle"
            h={42}
            r={13}
            fs={12.5}
            onClick={() => {
              consoleActions.notify('Session close is recorded in the audit log');
              sessionActions.signOut();
              navigate(ROUTES.signedOut, { replace: true });
            }}
          >
            Sign out instead
          </Button>
        </div>
      </form>
    </div>
  );
}
