import type { ShellVM } from '../../../types/console';
import { Icon } from './Icon';
import styles from './Header.module.css';

/** Sticky top bar: screen title, page search, theme switch and the account menu. */
export function Header({ hd, me }: Pick<ShellVM, 'hd' | 'me'>) {
  return (
    <header className={styles.header}>
      <div className={styles.titles}>
        <h1 className={styles.title}>{hd.title}</h1>
        <span className={styles.sub}>{hd.sub}</span>
      </div>
      <div className={styles.search}>
        <span className={styles.searchIcon}><Icon name="search" size={15} /></span>
        <input value={hd.q} onChange={hd.setQ} placeholder="Search this page" aria-label="Search this page" className={styles.searchInput} />
      </div>
      <button type="button" onClick={hd.theme} title={hd.themeLabel} className={styles.theme}><Icon name={hd.themeIcon} size={15} />{hd.themeText}</button>
      <div className={styles.account}>
        <button type="button" onClick={hd.toggleMenu} aria-expanded={hd.menu} className={styles.accountButton}>
          <span className={styles.avatar}>{me.initials}</span>
          <span className={styles.first}>{me.first}</span>
        </button>
        {hd.menu && (
          <div className={styles.menu}>
            <div className={styles.menuWho}>
              <span className={styles.menuName}>{me.name}</span>
              <span className={styles.menuMeta}>{me.label} · {me.email}</span>
            </div>
            <button type="button" onClick={hd.signOut} className={styles.signOut}><Icon name="logout" size={15} />Sign out</button>
          </div>
        )}
      </div>
    </header>
  );
}
