import type { MiniVM } from '../../../types/console';
import styles from './ListSections.module.css';

/** Short work queues (overview), each item with an open link and one quick action. */
export function MiniLists({ minis }: { minis: MiniVM[] }) {
  return (
    <div className={styles.minis}>
      {minis.map((m, mi) => (
        <div key={mi} className={`${styles.card} ${styles.mini}`}>
          <div className={`${styles.miniTitle} ${styles.cardTitle}`}>{m.title}</div>
          {m.items.map((i, ii) => (
            <div key={ii} className={styles.miniItem}>
              <button type="button" onClick={i.go} className={styles.miniOpen}>
                <span className={styles.miniT}>{i.t}</span>
                <span className={styles.miniS}>{i.s}</span>
              </button>
              <button type="button" onClick={i.act} className={styles.miniAct}>{i.btn}</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
