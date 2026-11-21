import { sx } from '../../../lib/sx';
import type { KpiVM } from '../../../types/console';
import styles from './ListSections.module.css';

/** Clickable KPI tiles; each one opens the filtered list behind its number. */
export function KpiGrid({ kpis }: { kpis: KpiVM[] }) {
  return (
    <div className={styles.kpis}>
      {kpis.map((k, i) => (
        <button type="button" key={i} onClick={k.go} style={sx(k.style)}>
          <span className={styles.kpiLabel}>{k.label}</span>
          <span className={styles.kpiValue}>{k.value}</span>
          <span style={sx(k.subStyle)}>{k.sub}</span>
        </button>
      ))}
    </div>
  );
}
