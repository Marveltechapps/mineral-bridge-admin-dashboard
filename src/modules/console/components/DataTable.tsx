import type { ChangeEvent, MouseEvent } from 'react';
import { sx } from '../../../lib/sx';
import type { CellVM, ColVM, TableVM } from '../../../types/console';
import styles from './ListSections.module.css';

function HeadCheck({ col }: { col: ColVM }) {
  return (
    <span style={sx(col.style)}>
      <input
        className={styles.check}
        type="checkbox"
        checked={!!col.checked}
        ref={(el) => { if (el) el.indeterminate = !!col.indeterminate && !col.checked; }}
        onClick={(e) => e.stopPropagation()}
        onChange={() => col.go()}
        aria-label="Select all minerals in this view"
      />
    </span>
  );
}

function Cell({ cell }: { cell: CellVM }) {
  if (cell.check) {
    return (
      <span style={sx(cell.wrapStyle)} onClick={(e) => e.stopPropagation()}>
        <input
          className={styles.check}
          type="checkbox"
          checked={!!cell.checked}
          onChange={(e: ChangeEvent<HTMLInputElement>) => { e.stopPropagation(); cell.toggle?.(); }}
          aria-label="Select mineral"
        />
      </span>
    );
  }
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

function openRow(event: MouseEvent<HTMLDivElement>, go: TableVM['rows'][number]['go']) {
  const target = event.target as HTMLElement | null;
  if (target?.closest('input,button,a')) return;
  go();
}

/** Sortable record table; a row opens its record, row buttons act on it directly. */
export function DataTable({ table }: { table: TableVM }) {
  return (
    <div className={`${styles.card} ${styles.table}`}>
      {table.hasTitle && <div className={`${styles.tableTitle} ${styles.cardTitle}`}>{table.title}</div>}
      <div style={sx(table.head)}>
        {/* Label and arrow are separate flex items (3px gap), as in the design. */}
        {table.cols.map((h, i) => h.check
          ? <HeadCheck key={i} col={h} />
          : <button type="button" key={i} onClick={h.go} style={sx(h.style)}><span>{h.label}</span><span>{h.arrow}</span></button>)}
      </div>
      {table.rows.map((r, ri) => (
        <div key={ri} onClick={(e) => openRow(e, r.go)} style={sx(r.style)} className={styles.row}>
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
