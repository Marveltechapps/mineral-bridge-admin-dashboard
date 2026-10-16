import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { TONE_INK_FIXED } from '@/constants/tones';
import { sessionActions, useCurrentAccount } from '@/modules/auth/hooks/useSession';
import { useJump } from '@/hooks/useJump';
import { consoleActions, useConsole } from '@/store/consoleStore';
import type { Theme } from '@/types/console';
import styles from './Header.module.css';
import { BELL_ITEMS } from './notifications';

/** Sticky top bar: page title, global search, theme toggle, notifications and account menu. */
export function Header({ title, sub }: { title: string; sub: string }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const jump = useJump();
  const theme = useConsole((s) => s.theme);
  const query = useConsole((s) => s.query);
  const avatarOpen = useConsole((s) => s.avatarOpen);
  const bellOpen = useConsole((s) => s.bellOpen);
  const { account, first } = useCurrentAccount();
  const dark = theme === 'dark';

  const signOut = () => {
    consoleActions.set({ avatarOpen: false, drawer: null, bellOpen: false, editing: {}, query: '' });
    sessionActions.signOut();
    navigate(ROUTES.signedOut);
  };
  const lock = () => {
    consoleActions.set({ avatarOpen: false, drawer: null, bellOpen: false });
    sessionActions.lock();
    navigate(ROUTES.locked, { state: { from: pathname } });
  };
  const pickTheme = (t: Theme) => {
    if (t !== theme) consoleActions.setTheme(t);
  };

  return (
    <>
      {(avatarOpen || bellOpen) && <button type="button" className={styles.menuScrim} aria-label="Close menu" tabIndex={-1} onClick={consoleActions.closeMenus} />}
      <header className={styles.header}>
        <div className={styles.inner}>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.menuBtn}`}
            aria-label="Open navigation"
            onClick={() => consoleActions.set({ navOpen: true, avatarOpen: false, bellOpen: false })}
          >
            <Icon name="menu" size={18} />
          </button>
          <div className={styles.titles}>
            <h1 className={styles.title}>{title}</h1>
            <span className={styles.sub}>{sub}</span>
          </div>
          <div className={styles.right}>
            <div className={styles.search} role="search">
              <span className={styles.searchIcon}>
                <Icon name="search" size={16} />
              </span>
              <input
                className={styles.searchInput}
                value={query}
                onChange={(e) => consoleActions.setQuery(e.target.value)}
                placeholder="Search orders, lots, users, documents…"
                aria-label="Search orders, lots, users, documents"
                type="text"
              />
              {query.trim() && (
                <button type="button" className={styles.clear} onClick={consoleActions.clearQuery} aria-label="Clear search">
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>
            <button
              type="button"
              className={`${styles.iconBtn} ${styles.themeBtn}`}
              title={dark ? 'Switch to light' : 'Switch to dark'}
              aria-label={dark ? 'Switch to light' : 'Switch to dark'}
              onClick={consoleActions.toggleTheme}
            >
              <Icon name={dark ? 'sun' : 'moon'} size={17} />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Notifications, 9 need attention"
              aria-expanded={bellOpen}
              onClick={() => consoleActions.set({ bellOpen: !bellOpen, avatarOpen: false })}
            >
              <Icon name="bell" size={18} />
              <span className={styles.bellCount}>9</span>
            </button>
            <div className={styles.avatarWrap}>
              <button
                type="button"
                className={styles.avatarBtn}
                aria-haspopup="menu"
                aria-expanded={avatarOpen}
                aria-label={`Account menu for ${account.name}`}
                onClick={() => consoleActions.set({ avatarOpen: !avatarOpen, bellOpen: false })}
              >
                <span className={styles.avatarSm}>{account.initials}</span>
                <span className={styles.avatarName}>{first}</span>
                <span className={styles.caret}>
                  <Icon name="down" size={12} />
                </span>
              </button>
              {avatarOpen && (
                <div className={styles.menu} role="menu" aria-label="Account">
                  <div className={styles.menuHead}>
                    <span className={styles.avatarMd}>{account.initials}</span>
                    <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Text size={12.5} weight={700} tone="ink">
                        {account.name}
                      </Text>
                      <Text size={10.5} weight={600} tone="ink3">
                        {account.role}
                      </Text>
                    </span>
                  </div>
                  <div className={styles.appearance}>
                    <Text size={9.5} weight={800} ls={1.1} tone="ink3">
                      APPEARANCE
                    </Text>
                    <div className={styles.segment} role="radiogroup" aria-label="Appearance">
                      {(
                        [
                          ['light', 'Light', 'sun'],
                          ['dark', 'Dark', 'moon'],
                        ] as const
                      ).map(([value, label, icon]) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={theme === value}
                          className={`${styles.segBtn} ${theme === value ? styles.segOn : ''}`}
                          onClick={() => pickTheme(value)}
                        >
                          <Icon name={icon} size={14} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.menuItem}
                    onClick={() => {
                      consoleActions.set({ avatarOpen: false });
                      navigate(ROUTES.profile);
                    }}
                  >
                    {/* The design's icon slot here is empty (it references an icon its map lacks); kept empty for fidelity. */}
                    <span className={styles.menuIcon} aria-hidden="true" />
                    My profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={`${styles.menuItem} ${styles.divider}`}
                    onClick={() => {
                      consoleActions.set({ avatarOpen: false, bellOpen: false });
                      navigate(ROUTES.settings);
                    }}
                  >
                    <span className={styles.menuIcon} aria-hidden="true" />
                    Settings &amp; roles
                  </button>
                  <button type="button" role="menuitem" className={styles.menuItem} onClick={lock}>
                    <span className={styles.menuIcon}>
                      <Icon name="clock" size={13} />
                    </span>
                    Lock console
                  </button>
                  <button type="button" role="menuitem" className={`${styles.menuItem} ${styles.danger}`} onClick={signOut}>
                    <span style={{ display: 'flex' }}>
                      <Icon name="x" size={14} />
                    </span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {bellOpen && (
          <div className={styles.bellPanel} role="dialog" aria-label="Needs attention">
            <div className={styles.bellHead}>
              <Text size={10.5} weight={800} ls={1.1} tone="ink3">
                NEEDS ATTENTION
              </Text>
              <button type="button" className={styles.bellClose} onClick={() => consoleActions.set({ bellOpen: false })} aria-label="Close notifications">
                <Icon name="x" size={14} />
              </button>
            </div>
            {BELL_ITEMS.map((n) => (
              <button
                key={n.text}
                type="button"
                className={styles.bellItem}
                onClick={() => {
                  consoleActions.set({ bellOpen: false });
                  jump(n.target);
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 5, flexShrink: 0, marginTop: 5, background: TONE_INK_FIXED[n.tone] }} aria-hidden="true" />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Text size={12.5} weight={700} tone="ink">
                    {n.text}
                  </Text>
                  <Text size={11} weight={600} tone="ink3">
                    {n.meta}
                  </Text>
                </span>
              </button>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
