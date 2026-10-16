import type { KeyboardEvent, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { DataRow, DataTable, HeadCell } from '@/components/ui/DataTable';
import { EditGateActions } from '@/components/ui/EditGateActions';
import { EditingBadge } from '@/components/ui/EditingBadge';
import { Pill } from '@/components/ui/Pill';
import { TabBar } from '@/components/ui/Tabs';
import { Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { ROUTES } from '@/constants/routes';
import { useEditGate } from '@/hooks/useEditGate';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { COUNTRIES, MODULES, PLATFORM_SETTINGS, ROLES } from '@/services/settings';
import styles from '../Settings.module.css';
import layout from '@/styles/layout.module.css';

export function SettingsShell() {
  return (
    <div className={layout.page}>
      <TabBar
        label="Settings sections"
        tabs={[
          { label: 'Role management', to: ROUTES.settings },
          { label: 'Platform configuration', to: ROUTES.settingsPlatform },
          { label: 'Bitcoin payments', to: ROUTES.settingsBtc },
        ]}
      />
      <Outlet />
    </div>
  );
}

function Legend({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--ink2)' }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} aria-hidden="true" />
      {children}
    </span>
  );
}

const LEVEL_LABEL = ['NONE', 'VIEW', 'EDIT'];
const LEVEL_TEXT = ['no access', 'view only', 'edit'];

/** Role × module permission matrix; cells cycle none → view → edit while editing. */
export function RolesPage() {
  const gate = useEditGate('roles', 'Role permissions saved — change written to the audit log');
  const access = useConsole((s) => s.access);

  return (
    <Card clip>
      <div className={styles.head}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Text as="h2" font="display" size={14.5} weight={700} tone="ink" style={{ margin: 0 }}>
            Role management · per-module access
          </Text>
          <EditingBadge show={gate.on} />
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Legend color="#16A34A">Edit</Legend>
          <Legend color="var(--line4)">View only</Legend>
          <Legend color="var(--surf3)">No access</Legend>
          <EditGateActions on={gate.on} onEdit={gate.edit} onCancel={gate.cancel} onSave={gate.save} editLabel="Edit permissions" />
        </span>
      </div>
      <DataTable
        label="Role permissions"
        cols="250px repeat(9,minmax(0,1fr))"
        gap={8}
        minWidth={980}
        headFs={9.5}
        headLs={0.8}
        header={
          <>
            <HeadCell>ROLE</HeadCell>
            {MODULES.map((m) => (
              <HeadCell key={m} align="center">
                {m}
              </HeadCell>
            ))}
          </>
        }
      >
        {ROLES.map((r) => (
          <DataRow key={r.name}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <Text size={12.5} weight={700} tone="ink">
                {r.name}
              </Text>
              <Text size={10.5} weight={600} tone="ink3">
                {r.desc} · {r.seats} seats
              </Text>
            </span>
            {r.access.map((l0, i) => {
              const key = `acc|${r.name}|${MODULES[i]}`;
              const l = access[key] === undefined ? l0 : access[key];
              const cycle = () => {
                if (!gate.on) {
                  consoleActions.notify('Click “Edit permissions” first to change access');
                  return;
                }
                const next = (l + 1) % 3;
                consoleActions.set((s) => ({ access: { ...s.access, [key]: next } }));
                consoleActions.notify(`${r.name} · ${MODULES[i]} set to ${LEVEL_TEXT[next]}`);
              };
              return (
                <span
                  key={key}
                  role="button"
                  tabIndex={0}
                  aria-label={`${r.name}, ${MODULES[i]}: ${LEVEL_TEXT[l]}`}
                  aria-disabled={!gate.on}
                  className={styles.cell}
                  data-level={l}
                  style={{ opacity: gate.on ? 1 : 0.72, cursor: gate.on ? 'pointer' : 'default' }}
                  onClick={cycle}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      cycle();
                    }
                  }}
                >
                  {LEVEL_LABEL[l]}
                </span>
              );
            })}
          </DataRow>
        ))}
      </DataTable>
    </Card>
  );
}

export function PlatformPage() {
  const gate = useEditGate('platform', 'Platform configuration saved');
  return (
    <Card clip>
      <div className={styles.head} style={{ padding: '15px 22px', borderBottom: '1px solid var(--line)', background: 'var(--surf2)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Text as="h2" font="display" size={14.5} weight={700} tone="ink" style={{ margin: 0 }}>
            Platform thresholds
          </Text>
          <EditingBadge show={gate.on} />
        </span>
        <span style={{ display: 'flex', gap: 8 }}>
          <EditGateActions on={gate.on} onEdit={gate.edit} onCancel={gate.cancel} onSave={gate.save} editLabel="Edit configuration" />
        </span>
      </div>
      {PLATFORM_SETTINGS.map((s) => (
        <div key={s.label} className={styles.setting}>
          <label htmlFor={`cfg-${s.label}`} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Text size={13} weight={700} tone="ink">
              {s.label}
            </Text>
            <Text size={11.5} weight={600} tone="ink3">
              {s.desc}
            </Text>
          </label>
          <input id={`cfg-${s.label}`} className="mb-field" defaultValue={s.value} readOnly={gate.readOnly} style={{ ...gate.small, outline: 'none' }} />
        </div>
      ))}
    </Card>
  );
}

export function BitcoinPage() {
  const gate = useEditGate('btc', 'Bitcoin payment settings saved — change written to the audit log');
  const btcOn = useConsole((s) => s.btcOn);
  const rows = COUNTRIES.map((c) => {
    const blocked = c.reg === 'Prohibited';
    const v = blocked ? false : btcOn[c.code] === undefined ? c.enabled : btcOn[c.code];
    return { ...c, blocked, v };
  });
  const enabledCount = rows.filter((r) => !r.blocked && r.v).length;
  const regTone = (reg: string) => (reg.indexOf('Permitted') === 0 ? 'green' : reg === 'Prohibited' ? 'red' : reg === 'Restricted' ? 'amber' : 'blue');

  return (
    <Card clip>
      <div className={styles.head} style={{ padding: '15px 22px', borderBottom: '1px solid var(--line)', background: 'var(--surf2)' }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Text as="h2" font="display" size={14.5} weight={700} tone="ink" style={{ margin: 0 }}>
              Bitcoin payments by country
            </Text>
            <EditingBadge show={gate.on} />
          </span>
          <Text size={11.5} weight={600} tone="ink3">
            {enabledCount} of {COUNTRIES.length} countries enabled for Bitcoin settlement · settlement only runs where the counterparty's country is enabled
          </Text>
        </span>
        <span style={{ display: 'flex', gap: 8 }}>
          <EditGateActions on={gate.on} onEdit={gate.edit} onCancel={gate.cancel} onSave={gate.save} editLabel="Edit" h={36} variantEdit="outlineLift" />
        </span>
      </div>
      <DataTable
        label="Bitcoin payments by country"
        cols="1.6fr 1.7fr 1.4fr 1fr 1.1fr"
        minWidth={820}
        headPad="12px 22px"
        rowPad="12px 22px"
        header={
          <>
            <HeadCell>COUNTRY</HeadCell>
            <HeadCell>REGULATORY STATUS</HeadCell>
            <HeadCell>SETTLEMENT RAIL</HeadCell>
            <HeadCell>LIMIT PER TRADE</HeadCell>
            <HeadCell align="right">BITCOIN PAYMENTS</HeadCell>
          </>
        }
      >
        {rows.map((c) => (
          <DataRow key={c.code} noHover>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 30, height: 22, borderRadius: 6, background: 'var(--surf3)', color: 'var(--ink2)', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
                {c.code}
              </span>
              <Text size={12.5} weight={700} tone="ink">
                {c.name}
              </Text>
            </span>
            <Pill tone={regTone(c.reg)}>{c.reg}</Pill>
            <Text size={12} weight={600} tone="ink2">
              {c.rail}
            </Text>
            <Text size={12.5} weight={700} tone="ink">
              {c.limit}
            </Text>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
              <Text size={11.5} weight={700} tone={!c.blocked && c.v ? 'ok' : 'ink2'}>
                {c.blocked ? 'Unavailable' : c.v ? 'Enabled' : 'Disabled'}
              </Text>
              <Toggle
                on={c.v}
                onColor="#16A34A"
                whiteKnob
                disabled={!(gate.on && !c.blocked)}
                label={`Bitcoin payments in ${c.name}`}
                onClick={() => {
                  if (c.blocked) return consoleActions.notify(`Bitcoin payments are prohibited in ${c.name}`);
                  if (!gate.on) return consoleActions.notify('Click Edit to change Bitcoin payment settings');
                  consoleActions.set((s) => ({ btcOn: { ...s.btcOn, [c.code]: !c.v } }));
                }}
              />
            </span>
          </DataRow>
        ))}
      </DataTable>
    </Card>
  );
}
