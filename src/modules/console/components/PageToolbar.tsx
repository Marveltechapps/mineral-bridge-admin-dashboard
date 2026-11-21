import { sx } from '../../../lib/sx';
import type { ActionVM, TabVM } from '../../../types/console';
import { ActionButtons } from './ActionButton';
import styles from './ListSections.module.css';

/** Underlined tabs that switch a screen's sub-view. */
export function TabBar({ tabs }: { tabs: TabVM[] }) {
  return (
    <div className={styles.tabs}>
      {tabs.map((t, i) => <button type="button" key={i} onClick={t.go} style={sx(t.style)}>{t.label}</button>)}
    </div>
  );
}

/** Filter chips on the left, screen actions (New…, Export…) on the right. */
export function ChipToolbar({ chips, tools }: { chips: TabVM[]; tools: ActionVM[] }) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.chips}>
        {chips.map((c, i) => <button type="button" key={i} onClick={c.go} style={sx(c.style)}>{c.label}</button>)}
      </div>
      <div className={styles.tools}><ActionButtons actions={tools} /></div>
    </div>
  );
}
