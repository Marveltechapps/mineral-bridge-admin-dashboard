import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataRow, DataTable } from '@/components/ui/DataTable';
import { EditingBadge } from '@/components/ui/EditingBadge';
import { Field } from '@/components/ui/Input';
import { Eyebrow, Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { ROUTES } from '@/constants/routes';
import { useCurrentAccount } from '@/modules/auth/hooks/useSession';
import { useEditGate } from '@/hooks/useEditGate';
import { consoleActions, useConsole } from '@/store/consoleStore';
import styles from '../Profile.module.css';

const SESSIONS = [
  { device: 'Chrome · macOS', place: 'Nairobi, KE · 41.90.x.x', when: 'Current session' },
  { device: 'Safari · iPhone 16', place: 'Nairobi, KE · 41.90.x.x', when: '2 days ago' },
  { device: 'Chrome · Windows', place: 'Mombasa, KE · 197.232.x.x', when: '11 days ago' },
];

const NOTIFICATIONS: Array<[string, boolean]> = [
  ['Firm offers awaiting my approval', true],
  ['Auction flagged for review', true],
  ['Daily settlement digest', false],
  ['Vault lot held over 45 days', true],
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const gate = useEditGate('profile', 'Profile saved');
  const toggles = useConsole((s) => s.toggles);
  const { account } = useCurrentAccount();
  const fields: Array<[string, string]> = [
    ['Full name', account.name],
    ['Work email', account.email],
    ['Phone', '+254 722 118 004'],
    ['Desk', 'Nairobi trading desk'],
  ];

  return (
    <div className={styles.grid}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <Card radius={20} padding={24}>
          <div className={styles.identity}>
            <span
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: 'linear-gradient(135deg,#3B4A87,#1E2A5A)',
                border: '1px solid rgba(247,221,142,.4)',
                color: '#F3D27A',
                fontFamily: "'Poppins'",
                fontSize: 19,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              {account.initials}
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Text as="h2" font="display" size={19} weight={700} tone="ink" style={{ margin: 0 }}>
                  {account.name}
                </Text>
                <EditingBadge show={gate.on} />
              </span>
              <Text size={12.5} weight={600} tone="ink2" style={{ overflowWrap: 'anywhere' }}>
                {account.email} · +254 722 118 004
              </Text>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 999, background: 'var(--line)', color: 'var(--brandInk)', fontSize: 10, fontWeight: 800, letterSpacing: '.7px' }}>
                {account.role.toUpperCase()}
              </span>
            </span>
            {gate.off && (
              <Button variant="outline" h={36} px={15} r={12} icon="edit" style={{ flexShrink: 0 }} onClick={gate.edit}>
                Edit profile
              </Button>
            )}
          </div>
          <div className={styles.fields} key={account.email}>
            {fields.map(([label, value]) => (
              <Field key={label} label={label} caps={false}>
                <input className="mb-field" defaultValue={value} readOnly={gate.readOnly} style={{ ...gate.field, outline: 'none' }} />
              </Field>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            {gate.on && (
              <>
                <Button variant="success" h={42} px={20} r={13} fs={13} icon="check" onClick={gate.save}>
                  Save profile
                </Button>
                <Button variant="secondary" h={42} px={20} r={13} fs={13} onClick={gate.cancel}>
                  Cancel
                </Button>
              </>
            )}
            <Button variant="secondary" h={42} px={20} r={13} fs={13} onClick={() => consoleActions.notify('Password reset link sent to your work email')}>
              Change password
            </Button>
          </div>
        </Card>

        <Card radius={20} clip>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--surf3)' }}>
            <Text as="h2" font="display" size={14.5} weight={700} tone="ink" style={{ margin: 0, display: 'inline' }}>
              Active sessions
            </Text>
          </div>
          <DataTable label="Active sessions" cols="minmax(0,1fr) minmax(0,1fr) 140px 100px" gap={14} minWidth={560} rowPad="13px 22px" header={null}>
            {SESSIONS.map((s) => (
              <DataRow key={s.device} noHover>
                <Text size={12.5} weight={700} tone="ink">
                  {s.device}
                </Text>
                <Text size={12} weight={600} tone="ink2">
                  {s.place}
                </Text>
                <Text size={12} weight={700} tone="ink2">
                  {s.when}
                </Text>
                <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="dangerSoft" h={30} px={12} r={11} fs={11.5} onClick={() => consoleActions.notify(`${s.device} session revoked`)}>
                    Revoke
                  </Button>
                </span>
              </DataRow>
            ))}
          </DataTable>
        </Card>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <Card variant="dark" radius={20} padding={22}>
          <Eyebrow tone="white58">YOUR ACCESS</Eyebrow>
          <Text as="div" font="display" size={16} weight={700} style={{ marginTop: 10 }}>
            {account.role}
          </Text>
          <Text as="div" size={11.5} weight={600} tone="white62" lh={1.55} style={{ marginTop: 6 }}>
            {account.scope === 'Orders, vault, pricing and auctions. Read-only on compliance.'
              ? 'Edit on Orders, Vault & Inventory, Pricing & Rates and Auctions. View-only on Users and Compliance. No access to Settings.'
              : account.scope}
          </Text>
          <Button variant="glass" block h={40} r={13} style={{ marginTop: 18 }} onClick={() => navigate(ROUTES.settings)}>
            View role matrix
          </Button>
        </Card>

        <Card radius={20} padding="20px 22px" style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <Eyebrow>NOTIFICATIONS</Eyebrow>
          {NOTIFICATIONS.map(([label, def]) => {
            const key = `notif|${label}`;
            const on = toggles[key] === undefined ? def : toggles[key];
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <Toggle on={on} flat label={label} onClick={() => consoleActions.set((s) => ({ toggles: { ...s.toggles, [key]: !on } }))} />
                <Text size={12.5} weight={600} tone="ink">
                  {label}
                </Text>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
