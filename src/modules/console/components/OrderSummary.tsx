import { sx } from '../../../lib/sx';
import type { OrderDetailVM } from '../../../types/console';
import { Icon } from './Icon';
import styles from './OrderDetail.module.css';

/** Back link, the order header (kind, status, value) and the phase tracker. */
export function OrderSummary({ od }: { od: OrderDetailVM }) {
  return (
    <>
      <button type="button" onClick={od.back} className={styles.back}><Icon name="arrowL" size={15} />{od.backLabel}</button>
      <div className={`${styles.card} ${styles.summary}`}>
        <div className={styles.summaryMain}>
          <div className={styles.pills}><span style={sx(od.kindStyle)}>{od.kind}</span><span style={sx(od.statusStyle)}>{od.status}</span></div>
          <span className={styles.id}>{od.id}</span>
          <span className={styles.sub}>{od.sub}</span>
        </div>
        <div className={styles.value}>
          <span className={styles.valueLabel}>ORDER VALUE</span>
          <span className={styles.valueAmount}>{od.value}</span>
          <span className={styles.valueStep}>{od.stepCount}</span>
        </div>
      </div>
      <div className={`${styles.card} ${styles.phases}`}>
        <div style={sx(od.phaseGrid)}>
          {od.phases.map((p, i) => (
            <div key={i} className={styles.phase}>
              <div className={styles.phaseTrack}><span style={sx(p.dotStyle)}>{p.mark}</span><span style={sx(p.lineStyle)} /></div>
              <span style={sx(p.labelStyle)}>{p.label}</span>
              <span className={styles.phaseSub}>{p.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
