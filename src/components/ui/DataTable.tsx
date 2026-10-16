import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { consoleActions, useConsole } from '@/store/consoleStore';
import styles from './DataTable.module.css';
import { Icon } from './Icon';

interface TableProps {
  /** CSS grid-template-columns, copied from the design. */
  cols: string;
  gap?: number;
  /** Minimum width the grid keeps on narrow screens before scrolling horizontally. */
  minWidth?: number;
  headPad?: string;
  rowPad?: string;
  headFs?: number;
  headLs?: number;
  /** Column headers; pass null for header-less lists. */
  header: ReactNode;
  children: ReactNode;
  label: string;
}

/** List-card table body: sticky proportions + horizontal scroll on narrow screens. */
export function DataTable({ cols, gap, minWidth, headPad, rowPad, headFs, headLs, header, children, label }: TableProps) {
  const vars = {
    '--cols': cols,
    '--gap': gap !== undefined ? `${gap}px` : undefined,
    '--table-min': minWidth !== undefined ? `${minWidth}px` : undefined,
    '--head-pad': headPad,
    '--row-pad': rowPad,
    '--head-fs': headFs !== undefined ? `${headFs}px` : undefined,
    '--head-ls': headLs !== undefined ? `${headLs}px` : undefined,
  } as CSSProperties;
  return (
    <div className={styles.scroll} style={vars} role="table" aria-label={label}>
      <div className={styles.inner}>
        {header !== null && (
          <div className={styles.head} role="row">
            {header}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

interface RowProps {
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
  label?: string;
  /** Rows without a hover tint in the design (static settings rows). */
  noHover?: boolean;
}

/** A table row. Clickable rows are keyboard-operable (Enter / Space). */
export function DataRow({ onClick, style, className, children, label, noHover }: RowProps) {
  const onKeyDown = onClick
    ? (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;
  return (
    <div
      role="row"
      className={[styles.row, onClick && styles.clickable, noHover && styles.noHover, className].filter(Boolean).join(' ')}
      style={style}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
    >
      {children}
    </div>
  );
}

/** Sortable column header; reads/writes the shared sort state for a table. */
export function SortHead({ mod, k, children, align }: { mod: string; k: string; children: ReactNode; align?: 'end' }) {
  const cur = useConsole((s) => s.sorts[mod]);
  const on = cur?.k === k;
  const icon = on ? (cur?.d === 1 ? 'up' : 'down') : 'sort';
  return (
    <button
      type="button"
      role="columnheader"
      className={[styles.sort, on && styles.sortOn, align === 'end' && styles.end].filter(Boolean).join(' ')}
      onClick={() => consoleActions.toggleSort(mod, k)}
      aria-sort={on ? (cur?.d === 1 ? 'ascending' : 'descending') : 'none'}
    >
      {children} <Icon name={icon} size={11} />
    </button>
  );
}

export function HeadCell({ children, align }: { children?: ReactNode; align?: 'right' | 'center' }) {
  return (
    <span role="columnheader" style={align ? { textAlign: align } : undefined}>
      {children}
    </span>
  );
}

export function TableFooter({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={styles.footer} style={style}>
      {children}
    </div>
  );
}

export function TableEmpty({ children }: { children: ReactNode }) {
  return <div className={styles.empty}>{children}</div>;
}
