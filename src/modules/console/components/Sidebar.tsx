import { sx } from '../../../lib/sx';
import type { ShellVM } from '../../../types/console';
import { BrandMark, BrandWords } from './BrandMark';
import { Icon } from './Icon';
import styles from './Sidebar.module.css';

/** Navy sidebar with grouped screens and open-work badges; collapses to icons below 1280px. */
export function Sidebar({ sd, me }: Pick<ShellVM, 'sd' | 'me'>) {
  return (
    <aside style={sx(sd.style)}>
      <div className={styles.brand}>
        <BrandMark size="small" />
        {sd.wide && <BrandWords size="small" tag="ADMIN · V4" />}
      </div>
      <nav className={styles.nav} aria-label="Console">
        {sd.groups.map(g => (
          <div key={g.label} className={styles.group}>
            {sd.wide && <span className={styles.groupLabel}>{g.label}</span>}
            {g.items.map(i => (
              <button type="button" key={i.key} onClick={i.go} title={i.label} style={sx(i.style)}>
                <span className={styles.icon}><Icon name={i.icon} size={17} /></span>
                {sd.wide && <span className={styles.label}>{i.label}</span>}
                <span style={sx(i.badgeStyle)}>{i.badge}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className={styles.me}>
        <span className={styles.initials}>{me.initials}</span>
        {sd.wide && (
          <span className={styles.who}>
            <span className={styles.name}>{me.name}</span>
            <span className={styles.role}>{me.label}</span>
          </span>
        )}
      </div>
    </aside>
  );
}
