import styles from './Toggle.module.css';

interface ToggleProps {
  on: boolean;
  /** Track colour when on (design uses navy, gold, or green depending on context). */
  onColor?: string;
  onClick?: () => void;
  /** Rendered dimmed with a not-allowed cursor (still clickable to show the reason). */
  disabled?: boolean;
  label: string;
  /** White knob regardless of theme (BTC country toggles). */
  whiteKnob?: boolean;
  /** Knob without drop shadow (matches the design's preference switches). */
  flat?: boolean;
}

/** Interactive switch. */
export function Toggle({ on, onColor = '#1E2A5A', onClick, disabled, label, whiteKnob, flat }: ToggleProps) {
  const cls = [styles.track, on && styles.on, disabled && styles.disabled, flat && styles.static].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cls}
      style={{ background: on ? onColor : 'var(--track)' }}
      onClick={onClick}
    >
      <span className={styles.knob} style={whiteKnob ? { background: '#fff' } : undefined} />
    </button>
  );
}

/** Non-interactive switch graphic (the design shows these as fixed preferences). */
export function StaticToggle({ on }: { on: boolean }) {
  return (
    <span
      className={[styles.track, styles.static, on && styles.on].filter(Boolean).join(' ')}
      style={{ background: on ? '#1E2A5A' : 'var(--track)', cursor: 'inherit' }}
      aria-hidden="true"
    >
      <span className={styles.knob} />
    </span>
  );
}
