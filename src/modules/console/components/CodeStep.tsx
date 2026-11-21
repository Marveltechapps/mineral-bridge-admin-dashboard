import { sx } from '../../../lib/sx';
import type { SignInVM } from '../../../types/console';
import styles from './SignIn.module.css';

/** Step 2: enter the 4-digit code sent by email or WhatsApp. */
export function CodeStep({ cd }: { cd: SignInVM['cd'] }) {
  return (
    <>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>TWO-STEP SIGN IN</span>
        <h1 className={styles.title}>Enter your code</h1>
        <span className={styles.ledeTall}>{cd.sent}</span>
      </div>
      <div className={styles.who}>
        <span className={styles.whoLabel}>SIGNING IN AS</span>
        <span className={styles.whoName}>{cd.who}</span>
        <span className={styles.whoRole}>{cd.role}</span>
      </div>
      <input value={cd.code} onChange={cd.set} placeholder="0000" maxLength={4} className={styles.code} aria-label="4-digit code" />
      <span style={sx(cd.errStyle)}>{cd.err}</span>
      <div className={styles.hintRow}>
        <span>Code expires in 5 min · check your email</span>
        <button type="button" onClick={cd.resend} className={styles.link}>Resend code</button>
      </div>
      <button type="button" onClick={cd.verify} className={styles.primary}>Verify and open console</button>
      <button type="button" onClick={cd.back} className={styles.secondary}>Use a different account</button>
    </>
  );
}
