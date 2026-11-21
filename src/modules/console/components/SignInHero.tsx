import { BrandMark, BrandWords } from './BrandMark';
import styles from './SignIn.module.css';

/** Left half of the sign-in screen. */
export function SignInHero() {
  return (
    <div className={styles.hero}>
      <div className={styles.brand}>
        <BrandMark size="large" />
        <BrandWords size="large" tag="ADMIN CONSOLE · V4" />
      </div>
      <div className={styles.pitch}>
        <h2 className={styles.pitchTitle}>Run every order the app creates.</h2>
        <p className={styles.pitchText}>Buy orders, sell requests, auctions, KYC, payments, payouts and refunds — each step shows who owns it next. Every action is logged against your account.</p>
      </div>
      <span className={styles.address}>Mineral Bridge Ltd · 14 Creek Road, Apapa, Lagos</span>
    </div>
  );
}
