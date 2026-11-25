import type { EndedAuction, LiveAuction } from '@/types/auctions';

export const LIVE: LiveAuction[] = [
  { id: 'AUC-2026-0219', mineral: 'Gold Concentrate', lot: 'MBV-2026-0412', qty: '86.4 kg', bid: '$5,940,000', bids: 34, left: '4 h 12 m', flagged: true, leader: 'Coast Bullion Partners' },
  { id: 'AUC-2026-0221', mineral: 'Silver Bullion', lot: 'MBV-2026-0408', qty: '11,240 kg', bid: '$1,428,500', bids: 21, left: '11 h 40 m', flagged: false, leader: 'Mombasa Metals Exchange' },
  { id: 'AUC-2026-0223', mineral: 'Tin Ingot', lot: 'MBV-2026-0359', qty: '88 t', bid: '$2,904,000', bids: 17, left: '1 d 3 h', flagged: false, leader: 'Eldoret Assay Holdings' },
  { id: 'AUC-2026-0226', mineral: 'Tantalite (Coltan)', lot: 'MBV-2026-0388', qty: '96 t', bid: '$4,742,000', bids: 29, left: '1 d 19 h', flagged: false, leader: 'Nyanza Smelting Ltd' },
  { id: 'AUC-2026-0228', mineral: 'Cobalt Hydroxide', lot: 'MBV-2026-0374', qty: '210 t', bid: '$7,161,000', bids: 12, left: '2 d 6 h', flagged: true, leader: 'Athi River Refinery Ltd' },
  { id: 'AUC-2026-0230', mineral: 'Platinum Sponge', lot: 'MBV-2026-0417', qty: '42 kg', bid: '$1,312,080', bids: 19, left: '3 d 2 h', flagged: false, leader: 'Baringo Trading Co' },
  { id: 'AUC-2026-0231', mineral: 'Rhodium Sponge', lot: 'MBV-2026-0344', qty: '6.2 kg', bid: '$986,400', bids: 10, left: '4 d 8 h', flagged: false, leader: 'Coast Bullion Partners' },
];

export const UPCOMING = [
  { id: 'AUC-2026-0233', mineral: 'Copper Cathode', lot: 'MBV-2026-0402', qty: '624 t', start: '$5,730,000', reserve: '$6,120,000', opens: 'Opens 13 Sep · 09:00', access: 'Tier 3 only' },
  { id: 'AUC-2026-0234', mineral: 'Gold Concentrate', lot: 'MBV-2026-0381', qty: '42.8 kg', start: '$2,420,000', reserve: '$2,610,000', opens: 'Opens 14 Sep · 09:00', access: 'All verified' },
  { id: 'AUC-2026-0236', mineral: 'Lithium Spodumene', lot: 'MBV-2026-0366', qty: '480 t', start: '$520,000', reserve: 'No reserve', opens: 'Opens 16 Sep · 12:00', access: 'All verified' },
  { id: 'AUC-2026-0237', mineral: 'Silver Bullion', lot: 'MBV-2026-0408', qty: '4,000 kg', start: '$4,180,000', reserve: '$4,400,000', opens: 'Opens 18 Sep · 09:00', access: 'Tier 3 only' },
];

export const ENDED: EndedAuction[] = [
  { id: 'AUC-2026-0214', mineral: 'Silver Bullion', final: '$1,420,000', reserve: '$1,350,000', bids: 34, outcome: 'Reserve met', tone: 'green', winner: 'Coast Bullion Partners' },
  { id: 'AUC-2026-0211', mineral: 'Copper Cathode', final: '$5,840,000', reserve: '$6,100,000', bids: 18, outcome: 'Reserve not met', tone: 'red', winner: '—' },
  { id: 'AUC-2026-0208', mineral: 'Gold Concentrate', final: '$3,268,000', reserve: '$3,100,000', bids: 41, outcome: 'Reserve met', tone: 'green', winner: 'Athi River Refinery Ltd' },
  { id: 'AUC-2026-0204', mineral: 'Lithium Spodumene', final: '$486,000', reserve: '$520,000', bids: 9, outcome: 'Reserve not met', tone: 'red', winner: '—' },
];

/** [title, sub, cost, realisable, starting bid, reserve, increment] for the create form. */
export const CREATE_LOTS: Record<string, [string, string, string, string, string, string, string]> = {
  'MBV-2026-0412': ['Gold Concentrate · 86.4 kg', '92.1% Au · Vault A bay 04', '$5,512,000', '$5,914,000', '$5,400,000', '$5,900,000', '$60,000'],
  'MBV-2026-0402': ['Copper Cathode · 624 t', '99.99% Cu · Vault B bay 02', '$5,728,320', '$6,140,160', '$5,730,000', '$6,120,000', '$60,000'],
  'MBV-2026-0417': ['Platinum Sponge · 138 kg', '99.95% Pt · Vault A bay 12', '$3,988,200', '$4,311,120', '$3,990,000', '$4,300,000', '$40,000'],
  'MBV-2026-0366': ['Lithium Spodumene · 480 t', '5.8% Li2O · Vault B bay 21', '$547,200', '$608,640', '$520,000', 'No reserve', '$6,000'],
};

export const LOT_OPTIONS = [
  { id: 'MBV-2026-0412', desc: 'Gold Concentrate · 86.4 kg · 92.1% Au', cost: '$5.51M cost' },
  { id: 'MBV-2026-0402', desc: 'Copper Cathode · 624 t · 99.99% Cu', cost: '$5.73M cost' },
  { id: 'MBV-2026-0417', desc: 'Platinum Sponge · 138 kg · 99.95% Pt', cost: '$3.99M cost' },
  { id: 'MBV-2026-0366', desc: 'Lithium Spodumene · 480 t · 5.8% Li2O', cost: '$547K cost' },
];

const TOWNS: Record<string, string> = {
  'Coast Bullion Partners': 'Mombasa',
  'Athi River Refinery Ltd': 'Nairobi',
  'Njoro Metals Ltd': 'Nakuru',
  'Baringo Trading Co': 'Kabarnet',
  'Turkana Gold SACCO': 'Lodwar',
  'Mombasa Metals Exchange': 'Mombasa',
  'Eldoret Assay Holdings': 'Eldoret',
  'Nyanza Smelting Ltd': 'Kisumu',
};

const AGES = ['2 s ago', '48 s ago', '1 m ago', '1 m ago', '2 m ago', '4 m ago', '9 m ago', '14 m ago', '22 m ago', '31 m ago'];

/** Synthetic bid ladder for the monitor screen (design's bids/bidFeed). */
export function bidFeed(a: LiveAuction) {
  const topBid = parseFloat(a.bid.replace(/[^0-9.]/g, ''));
  const step = Math.round((topBid * 0.01) / 1000) * 1000;
  const others: Array<[string, string]> = [
    [a.leader, 'Tier 3'],
    ['Athi River Refinery Ltd', 'Tier 3'],
    ['Njoro Metals Ltd', 'Tier 2'],
    ['Baringo Trading Co', 'Tier 2'],
    ['Turkana Gold SACCO', 'Tier 2'],
  ];
  const bids = AGES.map((age, i) => {
    const who = others[i % others.length];
    const name = i === 0 ? a.leader : (who?.[0] ?? a.leader);
    const tier = i === 0 ? 'Tier 3' : (who?.[1] ?? 'Tier 2');
    return {
      amount: `$${Math.round(topBid - step * i).toLocaleString('en-US')}`,
      bidder: name,
      meta: `${tier} · ${TOWNS[name] || 'Nairobi'}`,
      time: age,
      leading: i === 0,
      linked: name === 'Njoro Metals Ltd',
    };
  });
  return { bids, reserve: `$${Math.round(topBid - step * 0.7).toLocaleString('en-US')}` };
}

export const AUCTION_FILTERS = ['All auctions', 'Flagged', 'Unflagged', 'Closing today'] as const;
