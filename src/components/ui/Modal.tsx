import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';
import { Text } from './Text';
import styles from './Modal.module.css';

export function CloseButton({ onClick, label = 'Close', className }: { onClick: () => void; label?: string; className?: string }) {
  return (
    <button type="button" className={[styles.close, className].filter(Boolean).join(' ')} onClick={onClick} aria-label={label}>
      <Icon name="x" size={14} />
    </button>
  );
}

/**
 * Right-hand slide-over dialog (the design's drawer). Traps nothing but moves
 * focus into the panel, closes on Escape and on scrim click, and restores focus.
 */
export function Modal({
  title,
  sub,
  onClose,
  footer,
  children,
}: {
  title: string;
  sub: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = panelRef.current?.querySelector<HTMLElement>('input, textarea, button');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className={styles.overlay}>
      <button type="button" className={styles.scrim} onClick={onClose} aria-label="Close panel" tabIndex={-1} />
      <div className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef}>
        <div className={styles.head}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Text id={titleId} font="display" size={17} weight={700} tone="ink">
              {title}
            </Text>
            <Text size={11.5} weight={600} tone="ink3" lh={1.5}>
              {sub}
            </Text>
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <div className={styles.body}>{children}</div>
        <div className={styles.foot}>{footer}</div>
      </div>
    </div>
  );
}
