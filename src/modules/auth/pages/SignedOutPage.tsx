import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { consoleActions } from '@/store/consoleStore';
import { sessionActions, useCurrentAccount } from '../hooks/useSession';
import styles from './Auth.module.css';

export default function SignedOutPage() {
  const navigate = useNavigate();
  const { account } = useCurrentAccount();

  return (
    <div className={`${styles.center} ${styles.centerLight}`}>
      <div className={styles.outCard}>
        <span style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--tGreen)', color: 'var(--okInk)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ margin: 0, fontFamily: "'Poppins'", fontSize: 22, fontWeight: 700, letterSpacing: '-.5px', color: 'var(--ink)' }}>You're signed out</h1>
          <Text size={12.5} weight={600} tone="ink2" lh={1.65}>
            Session ended for {account.name}. Unsaved drafts were discarded and the session close is recorded in the audit log.
          </Text>
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 9 }}>
          <Button
            variant="primary"
            h={46}
            r={14}
            fs={13.5}
            onClick={() => {
              consoleActions.resetSession();
              sessionActions.signInAgain();
              navigate(ROUTES.login, { replace: true });
            }}
          >
            Sign in again
          </Button>
          <Text size={11} weight={600} tone="ink3" lh={1.6}>
            For security, close this tab if you're on a shared workstation.
          </Text>
        </div>
      </div>
    </div>
  );
}
