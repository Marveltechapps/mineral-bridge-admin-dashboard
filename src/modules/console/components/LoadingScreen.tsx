import styles from './LoadingScreen.module.css';

/** Shown while the console's data set loads; offers a retry if it could not load. */
export function LoadingScreen({ failed, onRetry }: { failed?: boolean; onRetry?: () => void }) {
  if (failed) {
    return <div className={styles.screen} role="alert">COULD NOT LOAD CONSOLE<button type="button" className={styles.retry} onClick={onRetry}>RETRY</button></div>;
  }
  return <div className={styles.screen} role="status">LOADING CONSOLE…</div>;
}
