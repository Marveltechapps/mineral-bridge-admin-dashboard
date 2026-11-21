import { sx } from '../../../lib/sx';
import type { SettingsVM } from '../../../types/console';
import { ActionButton } from './ActionButton';
import styles from './ListSections.module.css';

/** Platform rules grouped in cards, plus the payment methods offered in the customer app. */
export function SettingsPanel({ settings }: { settings: SettingsVM }) {
  return (
    <div className={styles.settings}>
      {settings.groups.map((g, gi) => (
        <div key={gi} className={`${styles.card} ${styles.settingsCard}`}>
          <span className={styles.cardTitle}>{g.title}</span>
          {g.items.map((f, fi) => (
            <label key={fi} className={styles.settingsField}>
              <span className={styles.settingsLabel}>{f.label}</span>
              <input defaultValue={f.value} onChange={f.set} readOnly={f.ro} className={styles.settingsInput} />
            </label>
          ))}
        </div>
      ))}
      <div className={`${styles.card} ${styles.settingsCard}`}>
        <span className={styles.cardTitle}>Payment methods in the app</span>
        <div className={styles.methods}>
          {settings.methods.map((m, i) => <button type="button" key={i} onClick={m.go} style={sx(m.style)}>{m.label} · {m.on}</button>)}
        </div>
        <span className={styles.settingsNote}>{settings.note}</span>
        <div className={styles.settingsActions}>
          <ActionButton action={settings.save} />
          <ActionButton action={settings.reset} />
        </div>
      </div>
    </div>
  );
}
