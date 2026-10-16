import { useNavigate, useParams } from 'react-router-dom';
import { BackButton, Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Field, MoneyInput, TextArea } from '@/components/ui/Input';
import { ListButton } from '@/components/ui/Misc';
import { Pill } from '@/components/ui/Pill';
import { Eyebrow, Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { useJump } from '@/hooks/useJump';
import { consoleActions } from '@/store/consoleStore';
import { DISPUTES, OUTCOMES, THREAD } from '@/services/disputes';
import styles from '../Disputes.module.css';
import layout from '@/styles/layout.module.css';

const ATTACHMENTS = [
  { name: 'Site test certificate.pdf', meta: 'Uploaded by seller · 08 Sep' },
  { name: 'SAL-2026-8862 worksheet.pdf', meta: 'Uploaded by F. Wanjiru · 08 Sep' },
];

export default function DisputeDetailPage() {
  const { disputeId } = useParams();
  const navigate = useNavigate();
  const jump = useJump();
  const sd = DISPUTES.find((d) => d.id === disputeId) ?? DISPUTES[0];

  return (
    <div className={layout.stack16}>
      <BackButton onClick={() => navigate(ROUTES.disputes)}>Back to dispute queue</BackButton>
      <div className={layout.detail}>
        <Card radius={20} clip>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--surf3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <Text as="h2" font="display" size={16} weight={700} tone="ink" style={{ margin: 0 }}>
                {sd.id} · {sd.type.toLowerCase()}
              </Text>
              <Text size={11.5} weight={600} tone="ink3">
                {sd.link} · {sd.party} · {sd.days} days open · {sd.value} at risk
              </Text>
            </div>
            <Pill tone={sd.tone} fontSize={10}>
              {sd.status.toUpperCase()}
            </Pill>
          </div>
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--surf2)' }}>
            <div role="log" aria-label="Dispute conversation" style={{ display: 'contents' }}>
              {THREAD.map((m) => {
                const admin = m.from === 'admin';
                return (
                  <span key={m.time} className={styles.message} style={{ alignSelf: admin ? 'flex-end' : 'flex-start' }}>
                    <span className={admin ? styles.bubbleAdmin : styles.bubbleSeller}>{m.text}</span>
                    <Text size={10.5} weight={700} tone="ink3" align={admin ? 'right' : 'left'}>
                      {m.who} · {m.time}
                    </Text>
                  </span>
                );
              })}
            </div>
            <form
              className={styles.reply}
              onSubmit={(e) => {
                e.preventDefault();
                consoleActions.notify(`Reply sent to ${sd.party}`);
                e.currentTarget.reset();
              }}
            >
              <input placeholder="Write a reply to the counterparty…" aria-label="Reply to the counterparty" className={styles.replyInput} />
              <Button type="submit" variant="primary" noHover h={36} px={14} r={12} gap={6} icon="send">
                Send
              </Button>
            </form>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {ATTACHMENTS.map((a) => (
                <span key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surf)' }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--surf3)', color: 'var(--brandInk)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
                    <Icon name="doc" size={14} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Text size={11.5} weight={700} tone="ink">
                      {a.name}
                    </Text>
                    <Text size={10} weight={600} tone="ink3">
                      {a.meta}
                    </Text>
                  </span>
                </span>
              ))}
            </div>
          </div>
        </Card>

        <div className={layout.rail}>
          <Card radius={20} padding="20px 22px">
            <Eyebrow>RESOLUTION OUTCOME</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
              <Field label="Outcome" caps={false}>
                <span className={styles.selectWrap}>
                  <select className={styles.select} defaultValue={OUTCOMES[0]}>
                    {OUTCOMES.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <span className={styles.selectIcon} aria-hidden="true">
                    <Icon name="down" size={12} />
                  </span>
                </span>
              </Field>
              <Field label="Adjustment to settlement" caps={false}>
                <MoneyInput placeholder="0.00" label="Adjustment to settlement" h={42} px={13} r={12} bg="var(--surf3)" border="var(--line2)" fs={13} />
              </Field>
              <Field label="Resolution note (visible to counterparty)" caps={false}>
                <TextArea rows={4} placeholder="Summarise the decision and next steps…" fs={12.5} style={{ padding: '11px 13px', borderRadius: 12 }} />
              </Field>
              <Button
                variant="primary"
                h={44}
                r={13}
                fs={13}
                onClick={() => {
                  consoleActions.notify(`Resolution recorded on ${sd.id} — counterparty notified`);
                  navigate(ROUTES.disputes);
                }}
              >
                Record resolution
              </Button>
              <Button variant="warnSoft" h={40} r={13} onClick={() => consoleActions.notify(`${sd.id} escalated to compliance`)}>
                Escalate to compliance
              </Button>
            </div>
          </Card>
          <Card radius={20} padding="18px 20px" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Eyebrow>LINKED RECORDS</Eyebrow>
            <ListButton
              onClick={() => {
                consoleActions.notify(`Opening ${sd.link}`);
                jump(sd.link);
              }}
              style={{ justifyContent: 'space-between', gap: 10, padding: '11px 13px', borderRadius: 13 }}
            >
              <Text size={12.5} weight={700} tone="brand">
                {sd.link}
              </Text>
              <Text size={11} weight={600} tone="ink3">
                Linked record
              </Text>
            </ListButton>
            <ListButton
              onClick={() => {
                consoleActions.notify('Opening the counterparty record');
                navigate(ROUTES.user('Joseph Kiptoo'));
              }}
              style={{ justifyContent: 'space-between', gap: 10, padding: '11px 13px', borderRadius: 13 }}
            >
              <Text size={12.5} weight={700} tone="brand">
                {sd.party}
              </Text>
              <Text size={11} weight={600} tone="ink3">
                Counterparty account
              </Text>
            </ListButton>
          </Card>
        </div>
      </div>
    </div>
  );
}
