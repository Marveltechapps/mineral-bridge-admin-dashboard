import type { ChainEvent } from '@/types/chain';

export const EVENTS: ChainEvent[] = [
  { type: 'PASSPORT MINT', ref: 'MBP-2026-1284', desc: 'Gold Concentrate · 18.21 kg · MBV-2026-0431', hash: '0x8f3a…c41e', time: '12 s ago', status: 'Confirmed', tone: 'gold' },
  { type: 'CUSTODY TRANSFER', ref: 'MBP-2026-1279', desc: 'Seller site → Nairobi Zone 0 · seal #KE-44219', hash: '0x51be…09d2', time: '48 s ago', status: 'Confirmed', tone: 'blue' },
  { type: 'LC EVENT', ref: 'LC-2026-0418', desc: 'Documents presented to KCB Bank Kenya', hash: '0xa7c0…3b19', time: '2 min ago', status: 'Confirmed', tone: 'violet' },
  { type: 'BTC SETTLEMENT', ref: 'STL-2026-4419', desc: '4.18 BTC to Turkana Gold SACCO · Lightning', hash: 'ln:7e2f…a90c', time: '3 min ago', status: 'Pending', tone: 'amber' },
  { type: 'PASSPORT MINT', ref: 'MBP-2026-1283', desc: 'Platinum Sponge · 42 kg · MBV-2026-0429', hash: '0x2dd9…7f60', time: '5 min ago', status: 'Confirmed', tone: 'gold' },
  { type: 'BITCOIN ANCHOR', ref: 'ANC-2026-0912', desc: 'Batch of 412 passports + 186 custody events', hash: 'btc:b3f1…e82a', time: '14 min ago', status: 'Confirmed', tone: 'green' },
  { type: 'CUSTODY TRANSFER', ref: 'MBP-2026-1270', desc: 'Bonded carrier → MB vault A · bay 12', hash: '0x99a4…1c73', time: '17 min ago', status: 'Confirmed', tone: 'blue' },
  { type: 'LC EVENT', ref: 'LC-2026-0405', desc: 'Payment confirmed by Absa Bank Kenya', hash: '0x4e08…d5a1', time: '22 min ago', status: 'Confirmed', tone: 'violet' },
  { type: 'BTC SETTLEMENT', ref: 'STL-2026-4412', desc: '2.06 BTC from Coast Bullion Partners · on-chain', hash: 'btc:0c7d…41f9', time: '31 min ago', status: 'Confirmed', tone: 'amber' },
  { type: 'PASSPORT MINT', ref: 'MBP-2026-1282', desc: 'Silver Bullion · 640 kg · MBV-2026-0426', hash: '0x63f2…aa08', time: '38 min ago', status: 'Confirmed', tone: 'gold' },
];

export const EVENT_FILTER_TYPE: Record<string, ChainEvent['type']> = {
  Passports: 'PASSPORT MINT',
  Custody: 'CUSTODY TRANSFER',
  'LC events': 'LC EVENT',
  'BTC settlements': 'BTC SETTLEMENT',
  Anchors: 'BITCOIN ANCHOR',
};

export const EVENT_FILTERS = ['All events', 'Passports', 'Custody', 'LC events', 'BTC settlements', 'Anchors'] as const;

export const PASSPORT_WEEKS: Array<[string, number]> = [
  ['Aug 17', 28],
  ['Aug 24', 31],
  ['Aug 31', 35],
  ['Sep 07', 33],
  ['Sep 14', 39],
  ['Sep 21', 41],
  ['Sep 28', 44],
  ['Oct 05', 46],
];

export const NET_STATUS: Array<{ name: string; state: string; meta: string; ok: boolean }> = [
  { name: 'Passport ledger', state: 'Healthy', meta: 'Block 2,418,906 · 1.2 s finality', ok: true },
  { name: 'Bitcoin anchoring', state: 'Healthy', meta: 'Last anchor block 969,412 · 3 confirmations', ok: true },
  { name: 'Lightning settlement node', state: 'Degraded', meta: '2 of 14 channels rebalancing · 98.9% uptime', ok: false },
  { name: 'Rate oracle', state: 'Healthy', meta: 'BTC/USD feed synced 41 s ago', ok: true },
];
