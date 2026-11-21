import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { DataRow, DataTable, HeadCell, TableEmpty } from '@/components/ui/DataTable';
import { KeyValue, PulseDot } from '@/components/ui/Misc';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { useQueryMatch } from '@/hooks/useConsoleData';
import { useJump } from '@/hooks/useJump';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { useLiveList, useRemoteValue } from '@/hooks/useLiveList';
import { EVENTS, EVENT_FILTERS, EVENT_FILTER_TYPE, NET_STATUS, PASSPORT_WEEKS, getChainEvents, getNetworkStatus, getPassportWeeks } from '@/services/chain';
import styles from '../Chain.module.css';
import layout from '@/styles/layout.module.css';

const COLS = '1.25fr 1.1fr 2.3fr 1.1fr .8fr .85fr';
const KV_K = 'rgba(255,255,255,.6)';

export default function ChainPage() {
  const match = useQueryMatch();
  const jump = useJump();
  const filter = useConsole((s) => s.filters.bcFilter);
  const live = useLiveList(getChainEvents, EVENTS);
  const network = useRemoteValue(getNetworkStatus);
  const weeksRemote = useRemoteValue(getPassportWeeks);
  const weeks = weeksRemote.demoMode ? PASSPORT_WEEKS : (weeksRemote.data ?? []);
  const rows = live.rows.filter((e) => (filter === 'All events' || e.type === EVENT_FILTER_TYPE[filter]) && match([e.type, e.ref, e.desc, e.hash]));

  return (
    <div className={layout.page}>
      <div className={layout.stats4}>
        {(network.demoMode ? NET_STATUS : (network.data ?? [])).map((n) => (
          <Card key={n.name} lift padding="16px 18px" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span
                style={{ width: 9, height: 9, borderRadius: 5, flexShrink: 0, background: n.ok ? '#16A34A' : '#B45309', animation: `${n.ok ? 'mbPulse 2.2s' : 'mbPulse 1.2s'} ease-out infinite` }}
                aria-hidden="true"
              />
              <Text size={12.5} weight={700} tone="ink">
                {n.name}
              </Text>
            </span>
            <Text size={11} weight={800} ls={0.6} tone={n.ok ? 'ok' : 'warn'}>
              {n.state}
            </Text>
            <Text size={11} weight={600} tone="ink3" lh={1.5}>
              {n.meta}
            </Text>
          </Card>
        ))}
      </div>

      <div className={styles.split}>
        <div className={styles.anchor}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <Text size={10.5} weight={800} ls={1.2} style={{ color: 'rgba(255,255,255,.6)' }}>
              LATEST BITCOIN ANCHOR
            </Text>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(22,163,74,.2)', color: '#7FE3A1', fontSize: 10, fontWeight: 800, letterSpacing: '.7px' }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#7FE3A1', animation: 'mbPulse 2s ease-out infinite' }} aria-hidden="true" />3 CONFIRMATIONS
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <Text font="display" size={30} weight={700} ls={-0.8} tone="gold">
              Block 969,412
            </Text>
            <Text size={12} weight={600} tone="white60">
              14 min ago
            </Text>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
            <KeyValue fs={11.5} kColor={KV_K} vTone="inherit" vWeight={600} k="Merkle root" v={<span style={{ fontFamily: 'var(--font-mono)' }}>7c9e…41b0d3</span>} />
            <KeyValue fs={11.5} kColor={KV_K} vTone="inherit" vWeight={600} k="Anchor transaction" v={<span style={{ fontFamily: 'var(--font-mono)' }}>b3f1…e82a</span>} />
            <KeyValue fs={11.5} kColor={KV_K} vTone="inherit" k="Batch contents" v="412 passports · 186 custody events" />
            <KeyValue fs={11.5} kColor={KV_K} vTone="inherit" k="Next batch closes" v="in 6 min" />
          </div>
          <div className={styles.anchorActions}>
            <Button
              variant="gold"
              noHover
              h={42}
              r={13}
              fs={12.5}
              style={{ flex: 1 }}
              onClick={() =>
                consoleActions.openDrawer({
                  title: 'Verify a mineral passport',
                  sub: 'Checks the passport hash against the latest Bitcoin anchor.',
                  fields: [{ label: 'PASSPORT ID', value: 'MBP-2026-1284' }, { label: 'OR SCAN QR / PASTE HASH' }],
                  cta: 'Verify passport',
                  done: 'MBP-2026-1284 verified — anchored in block 969,412',
                  draft: 'Saved',
                })
              }
            >
              Verify a passport
            </Button>
            <Button variant="glass" h={42} r={13} fs={12.5} style={{ flex: 1 }} onClick={() => consoleActions.notify('Opening anchor tx b3f1…e82a in block explorer')}>
              View in explorer
            </Button>
            <Button variant="glass" h={42} r={13} fs={12.5} style={{ flex: 1 }} onClick={() => consoleActions.notify('Manual anchor queued — next batch closes in 6 min')}>
              Anchor now
            </Button>
          </div>
        </div>

        <Card padding="20px 24px" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Text as="h2" font="display" size={14.5} weight={700} tone="ink" style={{ margin: 0 }}>
                Passports minted
              </Text>
              <Text size={11.5} weight={600} tone="ink3">
                Per week · one passport per vault lot or custody split
              </Text>
            </div>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <Text font="display" size={24} weight={700} tone="ink" lh={1}>
                1,284
              </Text>
              <Text size={11} weight={700} tone="ok">
                46 this week
              </Text>
            </span>
          </div>
          <div className={styles.bars} role="img" aria-label="Passports minted per week: 28 to 46">
            {weeks.map(([label, v], i) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
                <Text size={10.5} weight={800} tone="ink2">
                  {v}
                </Text>
                <span style={{ display: 'flex', alignItems: 'flex-end', width: '100%', height: 110 }}>
                  <span
                    style={{
                      display: 'block',
                      width: '100%',
                      height: `${((v / 46) * 100).toFixed(0)}%`,
                      borderRadius: '7px 7px 3px 3px',
                      background: i === weeks.length - 1 ? 'linear-gradient(180deg,#F7DD8E,#C8962F)' : 'var(--line3)',
                      transformOrigin: 'bottom',
                      animation: `mbFadeUp .5s ${(i * 0.05).toFixed(2)}s backwards ease`,
                    }}
                  />
                </span>
                <Text size={10} weight={700} tone="ink3" nowrap>
                  {label}
                </Text>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className={layout.toolbar}>
        <FilterChips filterKey="bcFilter" options={EVENT_FILTERS} label="Filter on-chain events" />
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 800, letterSpacing: '.6px', color: 'var(--okInk)' }}>
          <PulseDot />
          LIVE FEED
        </span>
      </div>

      <Card clip>
        <DataTable
          label="On-chain events"
          cols={COLS}
          minWidth={900}
          rowPad="12px 20px"
          header={
            <>
              <HeadCell>EVENT</HeadCell>
              <HeadCell>RECORD</HeadCell>
              <HeadCell>DETAIL</HeadCell>
              <HeadCell>TX HASH</HeadCell>
              <HeadCell>TIME</HeadCell>
              <HeadCell>STATUS</HeadCell>
            </>
          }
        >
          {rows.map((e, i) => (
            <DataRow key={e.ref + e.type} onClick={() => jump(e.ref)} label={`Open ${e.ref}`} style={{ animation: `mbFadeUp .4s ${(i * 0.04).toFixed(2)}s backwards ease` }}>
              <Pill tone={e.tone} fontSize={9.5}>
                {e.type}
              </Pill>
              <Text size={12} weight={800} tone="brand">
                {e.ref}
              </Text>
              <Text size={12} weight={600} tone="ink">
                {e.desc}
              </Text>
              <Text font="mono" size={11} weight={600} tone="ink2">
                {e.hash}
              </Text>
              <Text size={11.5} weight={700} tone="ink2">
                {e.time}
              </Text>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: e.status === 'Confirmed' ? 'var(--okInk)' : 'var(--warnInk)' }}>
                <span
                  style={{ width: 7, height: 7, borderRadius: 4, background: e.status === 'Confirmed' ? '#16A34A' : '#B45309', animation: e.status === 'Pending' ? 'mbPulse 1.6s ease-out infinite' : undefined }}
                  aria-hidden="true"
                />
                {e.status}
              </span>
            </DataRow>
          ))}
        </DataTable>
        {rows.length === 0 && <TableEmpty>No on-chain events match this filter or search.</TableEmpty>}
      </Card>
    </div>
  );
}
