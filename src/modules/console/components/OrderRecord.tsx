import { sx } from '../../../lib/sx';
import type { InfoCardVM, StepVM } from '../../../types/console';
import styles from './OrderDetail.module.css';

/** Record cards: items, quotation, payment, shipment, documents… */
export function OrderInfoCards({ cards }: { cards: InfoCardVM[] }) {
  return (
    <div className={styles.infoGrid}>
      {cards.map((k, ki) => (
        <div key={ki} className={`${styles.card} ${styles.info}`}>
          <span className={`${styles.eyebrow} ${styles.infoTitle}`}>{k.title}</span>
          {k.rows.map((r, ri) => (
            <div key={ri} className={styles.infoRow}>
              <span className={styles.infoKey}>{r.k}</span>
              <span className={styles.infoVal}>{r.v}</span>
            </div>
          ))}
          {k.list.map((i, ii) => (
            <div key={ii} onClick={i.go} style={sx(i.style)}>
              <span className={styles.infoItemText}><span className={styles.infoItemT}>{i.t}</span><span className={styles.infoItemS}>{i.s}</span></span>
              <span className={styles.infoItemR}>{i.r}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Every step of the order's flow with who did it, when, and any note. */
export function OrderSteps({ steps }: { steps: StepVM[] }) {
  return (
    <div className={`${styles.card} ${styles.steps}`}>
      <span className={styles.eyebrow}>ALL STEPS</span>
      <div className={styles.stepList}>
        {steps.map((s, i) => (
          <div key={i} className={styles.step}>
            <span style={sx(s.dotStyle)} />
            <span className={styles.stepBody}>
              <span className={styles.stepHead}><span style={sx(s.labelStyle)}>{s.label}</span><span className={styles.stepOwner}>{s.owner}</span></span>
              <span className={styles.stepMeta}>{s.meta}</span>
              {s.hasNote && <span className={styles.stepNote}>{s.note}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
