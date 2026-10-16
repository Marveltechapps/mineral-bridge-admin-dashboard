import type { ReactNode } from 'react';
import { consoleActions, useConsole, type FilterKey } from '@/store/consoleStore';
import styles from './Chip.module.css';

interface ChipProps {
  active: boolean;
  onClick: () => void;
  count?: ReactNode;
  variant?: 'filter' | 'range';
  children: ReactNode;
}

/** Filter chip (pill-shaped toggle button). */
export function Chip({ active, onClick, count, variant = 'filter', children }: ChipProps) {
  const cls = [styles.chip, variant === 'range' && styles.range, active && styles.active].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} onClick={onClick} aria-pressed={active}>
      {children}
      {count !== undefined && (
        <>
          {' '}
          <span className={styles.count} style={active ? { color: 'var(--ink3)' } : undefined}>
            {count}
          </span>
        </>
      )}
    </button>
  );
}

export function ChipRow({ children, gap, label }: { children: ReactNode; gap?: number; label?: string }) {
  return (
    <div className={styles.row} style={gap !== undefined ? { gap } : undefined} role="group" aria-label={label}>
      {children}
    </div>
  );
}

export function ChipDivider() {
  return <span className={styles.divider} aria-hidden="true" />;
}

/** A row of chips bound to one filter key in the console store. */
export function FilterChips({
  filterKey,
  options,
  label,
  gap,
  onChange,
}: {
  filterKey: FilterKey;
  options: readonly string[];
  label: string;
  gap?: number;
  onChange?: (value: string) => void;
}) {
  const current = useConsole((s) => s.filters[filterKey]);
  return (
    <ChipRow gap={gap} label={label}>
      {options.map((o) => (
        <Chip
          key={o}
          active={current === o}
          onClick={() => {
            consoleActions.setFilter(filterKey, o);
            onChange?.(o);
          }}
        >
          {o}
        </Chip>
      ))}
    </ChipRow>
  );
}
