import { useEffect, useMemo, useState } from 'react';
import { STAGES, AGENT_NAMES } from '@/constants/tones';
import { useConsole } from '@/store/consoleStore';
import { isDemoMode } from '@/lib/apiClient';
import { getOrders, ORDERS, ORDER_EXTRA, STAGE_DESC } from '@/services/orders';
import type { OrderRow } from '@/types/orders';

export interface LiveOrder extends Omit<OrderRow, 'stage'> {
  /** Index into STAGES after any stage advances made in this session. */
  idx: number;
}

export interface OrderFeed {
  orders: LiveOrder[];
  /** True while an API-mode list request is still in flight. */
  loading: boolean;
}

/** Orders with the desk's in-session stage advances applied (design: stageAdv). */
export function useOrderFeed(): OrderFeed {
  const adv = useConsole((s) => s.stageAdv);
  const [remote, setRemote] = useState<OrderRow[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  useEffect(() => {
    if (isDemoMode()) return;
    const ac = new AbortController();
    setLoadError(null);
    getOrders(ac.signal)
      .then((rows) => {
        if (!ac.signal.aborted) setRemote(rows);
      })
      .catch((error: unknown) => {
        if (ac.signal.aborted) return;
        setLoadError(error instanceof Error ? error : new Error('Could not load orders'));
      });
    return () => ac.abort();
  }, [adv]);
  if (loadError) throw loadError;
  const loading = !isDemoMode() && remote === null;
  const source = isDemoMode() ? ORDERS : (remote ?? []);
  const orders = useMemo(
    () =>
      source.map((r) => {
        const base = STAGES.indexOf(r.stage);
        const bump = adv[r.id] || 0;
        return { ...r, idx: Math.min(5, base + bump), days: bump ? 0 : r.days };
      }),
    [adv, source],
  );
  return { orders, loading };
}

export function useLiveOrders(): LiveOrder[] {
  return useOrderFeed().orders;
}

function initialsOf(party: string): string {
  return party
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Live orders have no design narrative. Show only fields stored on the order. */
function liveOrderDetail(sel: LiveOrder) {
  const isSell = sel.side === 'Sell';
  const tracker = STAGES.map((name, i) => {
    const state: 'done' | 'current' | 'upcoming' = i < sel.idx ? 'done' : i === sel.idx ? 'current' : 'upcoming';
    return { title: name, desc: state === 'current' ? 'Current stage' : state === 'done' ? 'Completed' : 'Not reached', time: '—', agent: '—', state };
  });
  return {
    ex: undefined,
    isSell,
    agentName: '—',
    tracker,
    routeStep: -1,
    routeStops: [] as Array<{ name: string; place: string; time: string; state: 'done' | 'current' | 'upcoming' }>,
    facts: [
      ['Order ID', sel.id],
      ['Side', isSell ? 'Sell — MB buys into vault' : 'Buy — draws down from vault'],
      ['Mineral', sel.mineral],
      ['Declared quantity', sel.qty],
      ['Counterparty', sel.party],
      ['Stage', STAGES[sel.idx] ?? '—'],
      ['Days in stage', String(sel.days)],
    ] as Array<[string, string]>,
    timeline: [] as Array<{ text: string; meta: string }>,
    docs: [] as Array<{ name: string; ref: string; status: string; tone: 'green' | 'blue' }>,
    stageLine: `Stage ${sel.idx + 1} of 6 · ${sel.days} days in the current stage`,
    routeLabel: isSell ? 'CUSTODY TRANSFER · SELLER → VAULT' : 'CUSTODY TRANSFER · VAULT → BUYER',
    routeEta: 'This order record does not include a custody route.',
    initials: initialsOf(sel.party),
    tierLine: `TIER ${sel.tier}`,
    rateLine: 'No locked rate is stored on this order summary.',
    qtyLine: `${sel.qty} ${sel.mineral}`.toUpperCase(),
  };
}

/** Derived detail model for one order (stage timestamps, route, documents…). */
export function orderDetail(sel: LiveOrder) {
  if (!isDemoMode()) return liveOrderDetail(sel);
  const ex = ORDER_EXTRA[sel.id];
  const isSell = sel.side === 'Sell';
  const openDay = parseInt((ex?.opened || '04 Sep 2026').split(' ')[0], 10);
  const stampFor = (i: number) => {
    const d = openDay + Math.round(i * 1.4);
    const mon = d > 30 ? 'Oct' : 'Sep';
    return `${d > 30 ? d - 30 : d} ${mon} 2026 · ${String(8 + (i % 9)).padStart(2, '0')}:${String(12 + i * 7).padStart(2, '0')}`;
  };
  const agentName = AGENT_NAMES[sel.agent] || 'F. Wanjiru';
  const stageAgents = ['L. Achieng', 'G. Kioko', 'D. Kimani', agentName, 'G. Kioko', agentName];
  const carrierShort = (ex?.carrier || 'carrier unassigned').split(' · ')[0];

  const descFor = (i: number) => {
    if (i === 1) return `Desk locked rate at ${ex?.rate || '—'}`;
    if (i === 2) return `Agent ${agentName} visited ${ex?.origin || 'the site'}`;
    if (i === 3) return sel.idx === 3 ? 'Weighing and field test in progress' : `Approved · ${sel.qty} confirmed against declaration`;
    if (i === 4) return `${sel.idx >= 4 ? 'Paid ' : 'Pays '}${ex?.value || '—'} to the seller`;
    if (i === 5) return `Sealed #${ex?.seal || '—'} · ${carrierShort} → ${ex?.dest || 'MB vault'}`;
    return STAGE_DESC[i][0];
  };

  const tracker = STAGES.map((name, i) => {
    const state: 'done' | 'current' | 'upcoming' = i < sel.idx ? 'done' : i === sel.idx ? 'current' : 'upcoming';
    return {
      title: name,
      desc: descFor(i),
      time: i < sel.idx ? stampFor(i) : i === sel.idx ? `Started ${stampFor(i)}` : `Projected ${stampFor(i)}`,
      agent: i <= sel.idx ? stageAgents[i] : 'Unassigned',
      state,
    };
  });

  const routeStep = sel.idx < 5 ? -1 : sel.id.charCodeAt(sel.id.length - 1) % 4;
  const routeState = (i: number): 'done' | 'current' | 'upcoming' => (routeStep > i ? 'done' : routeStep === i ? 'current' : 'upcoming');
  const stops = isSell
    ? [
        ['Seller site', ex?.origin || '—', routeStep >= 0 ? `Sealed & packed ${stampFor(5)}` : 'Awaiting approval'],
        ['Inspection hub', ex?.hub || 'Nairobi Zone 0', routeStep >= 1 ? `Re-weighed ${stampFor(5)}` : 'Not yet arrived'],
        ['Bonded carrier', ex?.carrier || 'Unassigned', routeStep >= 2 ? 'In transit' : 'Not yet dispatched'],
        ['MB vault', ex?.dest || '—', routeStep >= 3 ? 'Booked into custody' : `Expected ${stampFor(5)}`],
      ]
    : [
        ['MB vault', ex?.origin || '—', routeStep >= 0 ? 'Released from custody' : 'Awaiting payment'],
        ['Inspection hub', ex?.hub || 'Nairobi Zone 0', routeStep >= 1 ? 'Outbound check done' : 'Not yet arrived'],
        ['Bonded carrier', ex?.carrier || 'Unassigned', routeStep >= 2 ? 'In transit' : 'Not yet dispatched'],
        ['Buyer site', ex?.dest || '—', routeStep >= 3 ? 'Delivered' : `Expected ${stampFor(5)}`],
      ];
  const routeStops = stops.map(([name, place, time], i) => ({ name, place, time, state: routeState(i) }));

  const facts: Array<[string, string]> = [
    ['Order ID', sel.id],
    ['Side', isSell ? 'Sell — MB buys into vault' : 'Buy — draws down from vault'],
    ['Mineral', sel.mineral],
    ['Declared quantity', sel.qty],
    [isSell ? 'Instant estimate' : 'Order value', ex?.value || '—'],
    [isSell ? 'Locked buy rate' : 'Locked sell rate', ex?.rate || '—'],
    ['Assay status', `${sel.idx > 3 ? 'Approved on site · agent ' : sel.idx === 3 ? 'Field check in progress · agent ' : 'Not yet inspected · agent '}${agentName}`],
    ['Payment status', sel.idx >= 4 ? `Released ${ex?.value || ''}` : 'Due on approval'],
    ['Opened', ex?.opened || '—'],
  ];

  const tlAll: Array<[string, string, number]> = [
    [`Parcel sealed #${ex?.seal || '—'} and handed to ${(ex?.carrier || 'carrier').split(' · ')[0]}`, stageAgents[5], 5],
    ['Packing photographs uploaded', stageAgents[5], 5],
    [`Payment of ${ex?.value || '—'} released to ${isSell ? 'seller' : 'escrow'}`, stageAgents[4], 4],
    ['Agent approved the consignment on site', stageAgents[3], 3],
    ['Field weight and purity test recorded', stageAgents[3], 3],
    [`Agent visit completed at ${ex?.origin || 'site'}`, stageAgents[2], 2],
    ['Visit window confirmed with counterparty', stageAgents[2], 2],
    [`Rate locked at ${ex?.rate || '—'}`, stageAgents[1], 1],
    [`Tier ${sel.tier} documents verified`, stageAgents[0], 0],
  ];
  const timeline = tlAll.filter((t) => t[2] <= sel.idx).map((t) => ({ text: t[0], meta: `${t[1]} · ${stampFor(t[2])}` }));

  const tierNum = sel.tier;
  const docs: Array<{ name: string; ref: string; status: string; tone: 'green' | 'blue' }> = [
    { name: `National ID — ${ex?.contact || ''}`, ref: `ID ${2000000 + sel.id.length * 91821}`, status: 'VERIFIED', tone: 'green' },
    tierNum >= 2
      ? { name: 'Group registration', ref: `GRP-${sel.id.slice(-4)}`, status: 'VERIFIED', tone: 'green' }
      : { name: 'Proof of address', ref: `UTIL-${sel.id.slice(-4)}`, status: 'VERIFIED', tone: 'green' },
    tierNum >= 3
      ? { name: 'Import/export permit', ref: `EP-KE-${sel.id.slice(-5)}`, status: 'VERIFIED', tone: 'green' }
      : { name: 'Mining lease certificate', ref: `ML-KE-${sel.id.slice(-5)}`, status: 'VERIFIED', tone: 'green' },
    { name: 'Chain-of-custody form', ref: `COC-${sel.id.slice(-5)}`, status: sel.idx >= 3 ? 'VERIFIED' : 'IN REVIEW', tone: sel.idx >= 3 ? 'green' : 'blue' },
  ];

  return {
    ex,
    isSell,
    agentName,
    tracker,
    routeStep,
    routeStops,
    facts,
    timeline,
    docs,
    stageLine: `Stage ${sel.idx + 1} of 6 · ${sel.days} days in current stage · opened ${ex?.opened || '—'}`,
    routeLabel: isSell ? 'CUSTODY TRANSFER · SELLER → VAULT' : 'CUSTODY TRANSFER · VAULT → BUYER',
    routeEta: sel.idx < 5 ? 'Not released — goods stay on site until payment clears' : routeStep >= 3 ? 'Delivered · custody complete' : `In transit · ETA ${stampFor(5).split(' · ')[0]}`,
    initials: initialsOf(sel.party),
    tierLine: `TIER ${sel.tier}${tierNum === 1 ? ' · INDIVIDUAL' : tierNum === 2 ? ' · SMALL GROUP / SME' : ' · REGISTERED COMPANY'}`,
    rateLine: `Locked at ${ex?.rate || '—'}${sel.idx < 5 ? ' · subject to assay' : ' · settled'}`,
    qtyLine: `${sel.qty} ${sel.mineral}`.toUpperCase(),
  };
}
