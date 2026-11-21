import { Navigate } from 'react-router-dom';
import { useConsole } from '../hooks/useConsole';
import { signInView } from '../engine/shell';
import { SignInHero } from '../components/SignInHero';
import { LoginStep } from '../components/LoginStep';
import { CodeStep } from '../components/CodeStep';
import { CONSOLE_HOME } from '../../../constants/nav';
import styles from '../components/SignIn.module.css';

/** Admin sign-in: work email or WhatsApp, then a 4-digit code. */
export function SignInPage() {
  const c = useConsole();
  if (c.state.auth === 'app') return <Navigate to={CONSOLE_HOME} replace />;
  const v = signInView(c);
  return (
    <div className={styles.screen}>
      <SignInHero />
      <div className={styles.panel}>
        {v.loginStep && <LoginStep lg={v.lg} />}
        {v.codeStep && <CodeStep cd={v.cd} />}
      </div>
    </div>
  );
}
