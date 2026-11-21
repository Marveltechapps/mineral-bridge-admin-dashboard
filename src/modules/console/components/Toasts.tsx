import type { Toast } from '../../../types/console';
import styles from './Toasts.module.css';

/** Confirmation messages, newest at the bottom; each one clears itself after a few seconds. */
export function Toasts({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className={styles.stack} role="status" aria-live="polite">
      {toasts.map(t => <div key={t.id} className={styles.toast}>{t.text}</div>)}
    </div>
  );
}
