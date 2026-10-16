import type { CSSProperties, ReactNode } from 'react';
import styles from './Misc.module.css';
import { Icon } from './Icon';
import { Text, type TextTone } from './Text';

/** Striped photo placeholder with a monospace caption tag (design's image slots). */
export function PhotoSlot({
  label,
  height,
  radius = 12,
  pad = 8,
  tagFs = 9.5,
  tagRadius = 7,
  tagPad = '2px 7px',
  style,
}: {
  label: string;
  height: number;
  radius?: number;
  pad?: number;
  tagFs?: number;
  tagRadius?: number;
  tagPad?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={styles.placeholder} style={{ height, borderRadius: radius, paddingBottom: pad, ...style }} role="img" aria-label={`${label} (placeholder)`}>
      <span className={styles.placeholderTag} style={{ fontSize: tagFs, borderRadius: tagRadius, padding: tagPad }}>
        {label}
      </span>
    </div>
  );
}

/** Horizontal progress bar. `fill` is any CSS background. */
export function Bar({
  pct,
  height,
  radius,
  fill,
  trackBg,
  fillRadius,
  style,
  delay,
  origin,
}: {
  pct: number | string;
  height: number;
  radius: number;
  fill: string;
  trackBg?: string;
  fillRadius?: number;
  style?: CSSProperties;
  delay?: string;
  origin?: string;
}) {
  return (
    <span className={styles.track} style={{ height, borderRadius: radius, background: trackBg, ...style }}>
      <span
        className={styles.fill}
        style={{
          width: typeof pct === 'number' ? `${pct}%` : pct,
          borderRadius: fillRadius ?? radius,
          background: fill,
          animationDelay: delay,
          transformOrigin: origin,
        }}
      />
    </span>
  );
}

/** Square initials avatar. */
export function Initials({
  text,
  size,
  radius,
  fs,
  style,
}: {
  text: string;
  size: number;
  radius: number;
  fs: number;
  style?: CSSProperties;
}) {
  return (
    <span className={styles.avatar} style={{ width: size, height: size, borderRadius: radius, fontSize: fs, ...style }} aria-hidden="true">
      {text}
    </span>
  );
}

/** "Label ........ value" row. */
export function KeyValue({
  k,
  v,
  fs = 12,
  kTone = 'ink2',
  vTone = 'ink',
  vWeight = 700,
  kColor,
  style,
}: {
  k: ReactNode;
  v: ReactNode;
  fs?: number;
  kTone?: TextTone;
  vTone?: TextTone;
  vWeight?: 600 | 700 | 800;
  kColor?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={styles.kv} style={{ fontSize: fs, ...style }}>
      <Text weight={600} tone={kColor ? undefined : kTone} style={kColor ? { color: kColor } : undefined}>
        {k}
      </Text>
      <Text weight={vWeight} tone={vTone} style={{ textAlign: 'right' }}>
        {v}
      </Text>
    </div>
  );
}

/** Document line item (icon tile, name + reference, trailing slot). */
export function DocRow({ name, sub, trailing, ellipsis }: { name: ReactNode; sub: ReactNode; trailing?: ReactNode; ellipsis?: boolean }) {
  return (
    <div className={styles.docRow}>
      <span className={styles.docIcon}>
        <Icon name="doc" size={14} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Text size={12} weight={700} tone="ink" ellipsis={ellipsis}>
          {name}
        </Text>
        <Text size={10.5} weight={600} tone="ink3">
          {sub}
        </Text>
      </span>
      {trailing}
    </div>
  );
}

/** Small bordered metric tile (COST BASIS / REALISABLE …). */
export function MetricBox({
  label,
  value,
  sub,
  valueSize = 20,
  valueTone = 'ink',
  valueStyle,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  valueSize?: number;
  valueTone?: TextTone;
  valueStyle?: CSSProperties;
}) {
  return (
    <div className={styles.metricBox}>
      <Text as="div" size={10} weight={800} ls={1} tone="ink3">
        {label}
      </Text>
      <Text as="div" font="display" size={valueSize} weight={700} tone={valueTone} style={{ marginTop: 5, ...valueStyle }}>
        {value}
      </Text>
      {sub !== undefined && (
        <Text as="div" size={11} weight={600} tone="ink2" style={{ marginTop: 2 }}>
          {sub}
        </Text>
      )}
    </div>
  );
}

export function PulseDot({ style }: { style?: CSSProperties }) {
  return <span className={styles.pulseDot} style={style} aria-hidden="true" />;
}

/** Bordered full-width button used for "linked record" rows. */
export function ListButton({
  onClick,
  children,
  style,
  label,
}: {
  onClick: () => void;
  children: ReactNode;
  style?: CSSProperties;
  label?: string;
}) {
  return (
    <button type="button" className={styles.listButton} style={style} onClick={onClick} aria-label={label}>
      {children}
    </button>
  );
}

/** Dashed "queue clear" empty-state card. */
export function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ background: 'var(--surf)', border: '1px dashed var(--line3)', borderRadius: 20, padding: 40, textAlign: 'center' }}>
      <Text as="div" font="display" size={15} weight={700} tone="ink">
        {title}
      </Text>
      <Text as="div" size={12.5} weight={600} tone="ink3" style={{ marginTop: 6 }}>
        {body}
      </Text>
    </div>
  );
}
