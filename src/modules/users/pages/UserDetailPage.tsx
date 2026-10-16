import { useNavigate, useParams } from 'react-router-dom';
import { BackButton, Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataRow, DataTable, HeadCell } from '@/components/ui/DataTable';
import { DocRow, KeyValue } from '@/components/ui/Misc';
import { Pill } from '@/components/ui/Pill';
import { Eyebrow, Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { consoleActions } from '@/store/consoleStore';
import { ACCOUNTS, USER_ORDERS, USER_TICKETS, initialsOfName, userDocuments } from '@/services/users';
import styles from '../Users.module.css';
import layout from '@/styles/layout.module.css';

const KV_K = 'rgba(255,255,255,.6)';

export default function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const su = ACCOUNTS.find((u) => u.name === userId) ?? ACCOUNTS[0];
  const lifetime = (su.orders * 0.46).toFixed(2);
  const phone = `+254 7${10 + su.name.length} ${100 + su.orders} ${100 + su.org.length}`;
  const statusStyle = {
    bg: su.status === 'Verified' ? 'rgba(22,163,74,.18)' : su.status === 'Rejected' ? 'rgba(220,38,38,.2)' : 'rgba(255,255,255,.14)',
    color: su.status === 'Verified' ? '#7FE3A1' : su.status === 'Rejected' ? '#FFB4B4' : '#fff',
  };

  return (
    <div className={layout.stack16}>
      <BackButton onClick={() => navigate(ROUTES.users)}>Back to users</BackButton>
      <div className={layout.detail}>
        <div className={layout.stack16}>
          <Card radius={20} clip>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--surf3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <Text as="h2" font="display" size={14.5} weight={700} tone="ink" style={{ margin: 0 }}>
                Order history
              </Text>
              <Text size={11} weight={700} ls={0.8} tone="ink3">
                {su.orders} ORDERS · ${lifetime}M LIFETIME VALUE
              </Text>
            </div>
            <DataTable
              label="Order history"
              cols="1.2fr 1.3fr .9fr 1.1fr 1fr"
              minWidth={620}
              headPad="11px 22px"
              rowPad="12px 22px"
              header={
                <>
                  <HeadCell>ORDER ID</HeadCell>
                  <HeadCell>MINERAL</HeadCell>
                  <HeadCell>QUANTITY</HeadCell>
                  <HeadCell>STAGE</HeadCell>
                  <HeadCell>OPENED</HeadCell>
                </>
              }
            >
              {USER_ORDERS.map((o) => (
                <DataRow key={o.id}>
                  <Text size={12.5} weight={800} tone="brand">
                    {o.id}
                  </Text>
                  <Text size={12.5} weight={600} tone="ink">
                    {o.mineral}
                  </Text>
                  <Text size={12.5} weight={700} tone="ink">
                    {o.qty}
                  </Text>
                  <Pill tone={o.tone}>{o.stage}</Pill>
                  <Text size={12} weight={600} tone="ink2">
                    {o.date}
                  </Text>
                </DataRow>
              ))}
            </DataTable>
          </Card>

          <Card radius={20} clip>
            <div className={styles.cardHead}>
              <Text as="h2" font="display" size={14.5} weight={700} tone="ink" style={{ margin: 0, display: 'inline' }}>
                Support ticket history
              </Text>
            </div>
            <DataTable
              label="Support tickets"
              cols="1fr 3fr 1fr 1fr"
              minWidth={600}
              rowPad="12px 22px"
              header={null}
            >
              {USER_TICKETS.map((t) => (
                <DataRow key={t.id}>
                  <Text size={12.5} weight={800} tone="brand">
                    {t.id}
                  </Text>
                  <Text size={12.5} weight={600} tone="ink">
                    {t.subject}
                  </Text>
                  <Pill tone="green">{t.status}</Pill>
                  <Text size={12} weight={600} tone="ink2" align="right">
                    {t.date}
                  </Text>
                </DataRow>
              ))}
            </DataTable>
          </Card>
        </div>

        <div className={layout.rail}>
          <Card variant="dark" radius={20} padding={22}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  background: 'rgba(247,221,142,.16)',
                  border: '1px solid rgba(247,221,142,.35)',
                  color: '#F3D27A',
                  fontFamily: "'Poppins'",
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {initialsOfName(su.name)}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <Text font="display" size={15.5} weight={700}>
                  {su.name}
                </Text>
                <Text size={11.5} weight={600} tone="white60" style={{ overflowWrap: 'anywhere' }}>
                  {su.email}
                </Text>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 999, background: 'linear-gradient(135deg,#F7DD8E,#C8962F)', color: '#1A1F36', fontSize: 10, fontWeight: 800, letterSpacing: '.7px' }}>
                TIER {su.tier}
                {su.tier === 1 ? ' · INDIVIDUAL' : su.tier === 2 ? ' · SME' : ' · COMPANY'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '.7px', background: statusStyle.bg, color: statusStyle.color }}>
                {su.status.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.12)' }}>
              <KeyValue k="Organisation" v={su.org} kColor={KV_K} vTone="inherit" />
              <KeyValue k="Phone" v={phone} kColor={KV_K} vTone="inherit" />
              <KeyValue k="Joined" v={su.joined} kColor={KV_K} vTone="inherit" />
              <KeyValue k="Disputes" v={su.status === 'Rejected' ? '1 open' : 'None'} kColor={KV_K} vTone="inherit" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18 }}>
              <Button
                variant="glassGold"
                h={42}
                r={13}
                gap={8}
                onClick={() => {
                  consoleActions.notify(`Tier change sent to compliance for ${su.name}`);
                  navigate(ROUTES.verification);
                }}
              >
                Change tier · compliance review
              </Button>
              <Button
                variant="glass"
                h={40}
                r={13}
                onClick={() =>
                  consoleActions.openDrawer({
                    title: `Message ${su.name}`,
                    sub: `${su.org} · ${su.email}`,
                    fields: [{ label: 'SUBJECT' }, { label: 'MESSAGE', hint: 'Delivered in-app and by SMS', kind: 'area' }],
                    cta: 'Send message',
                    done: `Message sent to ${su.name}`,
                    draft: 'Message saved as a draft',
                  })
                }
              >
                Message user
              </Button>
            </div>
          </Card>

          <Card radius={20} padding="18px 20px">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <Eyebrow>LINKED DOCUMENTS</Eyebrow>
              <Button
                variant="link"
                fs={11.5}
                gap={5}
                iconEnd="arrowRight"
                onClick={() => {
                  consoleActions.set({ query: '' });
                  navigate(ROUTES.verification);
                }}
              >
                Open in compliance
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 13 }}>
              {userDocuments(su).map((d, i) => (
                <DocRow key={i} name={d.name} sub={d.exp} trailing={<Pill tone={d.tone}>{d.status}</Pill>} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
