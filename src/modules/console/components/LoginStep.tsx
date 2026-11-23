import { sx } from '../../../lib/sx';
import type { SignInVM } from '../../../types/console';
import styles from './SignIn.module.css';

/** Step 1: choose email or WhatsApp and enter the admin's work identity. */
export function LoginStep({ lg }: { lg: SignInVM['lg'] }) {
  return (
    <>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>ADMIN SIGN IN</span>
        <h1 className={styles.title}>Welcome back</h1>
        <span className={styles.lede}>{lg.showPassword ? 'Sign in with your work email and password. Some accounts also require a 4-digit verification code.' : 'Staff sign-in uses your work email and password — choose Email to continue.'}</span>
      </div>
      <div className={styles.segments}>
        <button type="button" onClick={lg.viaEmail} style={sx(lg.tabE)}>Email</button>
        <button type="button" onClick={lg.viaWa} style={sx(lg.tabW)}>WhatsApp</button>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{lg.fieldLabel}</span>
        <input value={lg.id} onChange={lg.setId} placeholder={lg.placeholder} className={styles.input} autoComplete="username" />
      </label>
      {lg.showPassword && (
        <label className={styles.field}>
          <span className={styles.fieldLabel}>PASSWORD</span>
          <input value={lg.password} onChange={lg.setPassword} type="password" placeholder="Your password" className={styles.input} autoComplete="current-password" />
        </label>
      )}
      <span style={sx(lg.errStyle)}>{lg.err}</span>
      {lg.showPassword ? (
        <button type="button" onClick={lg.go} className={styles.primary}>{lg.submit}</button>
      ) : (
        <p className={styles.lede}>Open the <strong>Email</strong> tab and enter your work email and password.</p>
      )}
    </>
  );
}
