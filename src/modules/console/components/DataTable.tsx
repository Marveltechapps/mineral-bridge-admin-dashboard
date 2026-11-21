import { sx } from '../../../lib/sx';
import type { CellVM, TableVM } from '../../../types/console';
import styles from './ListSections.module.css';

function Cell({ cell }: { cell: CellVM }) {
  return (
    <span style={sx(cell.wrapStyle)}>
      {cell.hasBtns && (
        <span className={styles.rowButtons}>
          {cell.btns.map((b, i) => <button type="button" key={i} onClick={b.go} style={sx(b.style)}>{b.label}</button>)}
        </span>
      )}
      <span style={sx(cell.style)}>{cell.text}</span>
      <span style={sx(cell.subStyle)}>{cell.sub}</span>
    </span>
  );
}

/** Sortable record table; a row opens its record, row buttons act on it directly. */
export function DataTable({ table }: { table: TableVM }) {
  return (
    <div className={`${styles.card} ${styles.table}`}>
      {table.hasTitle && <div className={`${styles.tableTitle} ${styles.cardTitle}`}>{table.title}</div>}
      <div style={sx(table.head)}>
        {/* Label and arrow are separate flex items (3px gap), as in the design. */}
        {table.cols.map((h, i) => <button type="button" key={i} onClick={h.go} style={sx(h.style)}><span>{h.label}</span><span>{h.arrow}</span></button>)}
      </div>
      {table.rows.map((r, ri) => (
        <div key={ri} onClick={r.go} style={sx(r.style)} className={styles.row}>
          {r.cells.map((x, ci) => <Cell key={ci} cell={x} />)}
        </div>
      ))}
      {table.empty && <div className={styles.empty}>{table.emptyText}</div>}
      <div className={styles.count}>
        <span>{table.count}</span>
        {table.hasPager && (
          <span className={styles.pager}>
            <button type="button" onClick={table.pagerPrev}>Previous</button>
            <button type="button" onClick={table.pagerNext}>Next</button>
          </span>
        )}
      </div>
    </div>
  );
}
