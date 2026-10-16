import { forwardRef, type CSSProperties, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Text } from './Text';
import styles from './Input.module.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style'> {
  h?: number;
  r?: number;
  px?: number;
  fs?: number;
  bg?: string;
  border?: string;
  style?: CSSProperties;
}

/** Text input with the design's filled style; dimensions are passed in exact px. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { h = 44, r = 12, px = 14, fs = 13.5, bg, border, style, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={[styles.input, className].filter(Boolean).join(' ')}
      style={{ height: h, borderRadius: r, padding: `0 ${px}px`, fontSize: fs, background: bg, borderColor: border, ...style }}
      {...rest}
    />
  );
});

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  fs?: number;
  fw?: number;
  style?: CSSProperties;
}

export function TextArea({ fs = 13, fw = 500, style, className, rows = 4, ...rest }: TextAreaProps) {
  return (
    <textarea
      rows={rows}
      className={[styles.input, styles.area, className].filter(Boolean).join(' ')}
      style={{ padding: '11px 14px', fontSize: fs, fontWeight: fw, ...style }}
      {...rest}
    />
  );
}

/** Label + control wrapper ("WORK EMAIL" style uppercase or sentence-case label). */
export function Field({
  label,
  children,
  hint,
  caps = true,
  gap = 6,
  style,
}: {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  /** Uppercase label (11px/800/.7px) vs. sentence-case label (11px/700). */
  caps?: boolean;
  gap?: number;
  style?: CSSProperties;
}) {
  return (
    <label className={styles.label} style={{ gap, ...style }}>
      {caps ? (
        <Text size={11} weight={800} ls={0.7} tone="ink2">
          {label}
        </Text>
      ) : (
        <Text size={11} weight={700} tone="ink2">
          {label}
        </Text>
      )}
      {children}
      {hint}
    </label>
  );
}

/** Input with a "$" prefix inside a bordered box. */
export function MoneyInput({
  placeholder,
  h = 42,
  px = 13,
  r = 12,
  bg = 'var(--surf)',
  border = 'var(--line3)',
  fs = 13.5,
  prefixFs = 13,
  label,
}: {
  placeholder: string;
  h?: number;
  px?: number;
  r?: number;
  bg?: string;
  border?: string;
  fs?: number;
  prefixFs?: number;
  label: string;
}) {
  return (
    <span className={styles.inline} style={{ height: h, padding: `0 ${px}px`, ['--bd' as string]: border, borderRadius: r, background: bg }}>
      <span aria-hidden="true" style={{ fontSize: prefixFs, fontWeight: 800, color: 'var(--ink3)' }}>
        $
      </span>
      <input className={styles.inlineInput} placeholder={placeholder} aria-label={label} inputMode="decimal" style={{ fontSize: fs }} />
    </span>
  );
}
