import styles from '../pages/Auth.module.css';

/** "MB" gold tile + wordmark used on the auth screens. */
export function BrandMark({ variant }: { variant: 'login' | 'card' }) {
  if (variant === 'login') {
    return (
      <div className={styles.brandRow}>
        <span className={styles.logoLg}>MB</span>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{ fontFamily: "'Poppins'", fontSize: 13, fontWeight: 800, letterSpacing: '1.4px', color: '#F3D27A' }}>MINERAL BRIDGE</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', color: 'rgba(255,255,255,.5)' }}>OPERATIONS CONSOLE</span>
        </span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: 'var(--goldGrad)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Poppins'",
          fontSize: 14,
          fontWeight: 800,
          color: '#1A1F36',
        }}
      >
        MB
      </span>
      <span style={{ fontFamily: "'Poppins'", fontSize: 12.5, fontWeight: 800, letterSpacing: '1.3px', color: 'var(--brandInk)' }}>MINERAL BRIDGE</span>
    </div>
  );
}
