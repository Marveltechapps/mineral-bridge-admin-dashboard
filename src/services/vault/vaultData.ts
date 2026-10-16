import type { Lot, LotStatus } from '@/types/vault';

export const LOTS: Lot[] = [
  { id: 'MBV-2026-0417', mineral: 'Platinum Sponge', qty: '138 kg', grade: '99.95% Pt', src: 'MB-SELL-41702', status: 'Listed', tone: 'blue', days: 12 },
  { id: 'MBV-2026-0412', mineral: 'Gold Concentrate', qty: '86.4 kg', grade: '92.1% Au', src: 'MB-SELL-41688', status: 'In vault', tone: 'navy', days: 18 },
  { id: 'MBV-2026-0408', mineral: 'Silver Bullion', qty: '11,240 kg', grade: '99.9% Ag', src: 'MB-SELL-41654', status: 'In auction', tone: 'violet', days: 24 },
  { id: 'MBV-2026-0402', mineral: 'Copper Cathode', qty: '624 t', grade: '99.99% Cu', src: 'MB-SELL-41601', status: 'Reserved', tone: 'amber', days: 31 },
  { id: 'MBV-2026-0388', mineral: 'Tantalite (Coltan)', qty: '96 t', grade: '31.4% Ta2O5', src: 'MB-SELL-41540', status: 'In vault', tone: 'navy', days: 46 },
  { id: 'MBV-2026-0381', mineral: 'Gold Concentrate', qty: '42.8 kg', grade: '88.6% Au', src: 'MB-SELL-41498', status: 'Shipped', tone: 'gray', days: 52 },
  { id: 'MBV-2026-0374', mineral: 'Cobalt Hydroxide', qty: '210 t', grade: '20.5% Co', src: 'MB-SELL-41455', status: 'Listed', tone: 'blue', days: 58 },
  { id: 'MBV-2026-0366', mineral: 'Lithium Spodumene', qty: '480 t', grade: '5.8% Li2O', src: 'MB-SELL-41402', status: 'In vault', tone: 'navy', days: 64 },
  { id: 'MBV-2026-0359', mineral: 'Tin Ingot', qty: '88 t', grade: '99.85% Sn', src: 'MB-SELL-41377', status: 'In auction', tone: 'violet', days: 71 },
  { id: 'MBV-2026-0344', mineral: 'Rhodium Sponge', qty: '6.2 kg', grade: '99.9% Rh', src: 'MB-SELL-41310', status: 'Reserved', tone: 'amber', days: 88 },
];

/** [cost rate, live sell rate, unit, location, certificate, lab, assay date, net quantity] */
export const LOT_EXTRA: Record<string, [number, number, string, string, string, string, string, number]> = {
  'MBV-2026-0417': [28900, 31240, 'kg', 'Vault A bay 12', 'SAL-2026-8841', 'Sarova Assay Labs', '22 Aug 2026', 138],
  'MBV-2026-0412': [63800, 68450, 'kg', 'Vault A bay 04', 'SAL-2026-8829', 'Sarova Assay Labs', '19 Aug 2026', 86.4],
  'MBV-2026-0408': [1046, 1128, 'kg', 'Vault A bay 18', 'SAL-2026-8811', 'Sarova Assay Labs', '14 Aug 2026', 11240],
  'MBV-2026-0402': [9180, 9840, 't', 'Vault B bay 02', 'RAS-2026-4471', 'Rift Analytical Services', '08 Aug 2026', 624],
  'MBV-2026-0388': [46900, 51200, 't', 'Vault B bay 09', 'RAS-2026-4402', 'Rift Analytical Services', '25 Jul 2026', 96],
  'MBV-2026-0381': [59200, 63900, 'kg', 'Shipped out', 'SAL-2026-8702', 'Sarova Assay Labs', '19 Jul 2026', 42.8],
  'MBV-2026-0374': [31400, 34100, 't', 'Vault B bay 14', 'CML-2026-2218', 'Coastal Metals Lab', '13 Jul 2026', 210],
  'MBV-2026-0366': [1140, 1268, 't', 'Vault B bay 21', 'RAS-2026-4318', 'Rift Analytical Services', '07 Jul 2026', 480],
  'MBV-2026-0359': [30240, 32600, 't', 'Vault A bay 07', 'SAL-2026-8611', 'Sarova Assay Labs', '30 Jun 2026', 88],
  'MBV-2026-0344': [148000, 159400, 'kg', 'Vault A bay 01', 'SAL-2026-8540', 'Sarova Assay Labs', '13 Jun 2026', 6.2],
};

export const CUSTODY: Array<{ title: string; desc: string; time: string; agent: string; state: 'done' | 'current' | 'upcoming' }> = [
  { title: 'Approved and paid on site', desc: 'Agent field check passed · seller paid before pickup', time: '20 Aug 2026 · 11:05', agent: 'F. Wanjiru', state: 'done' },
  { title: 'Sealed, packed and collected', desc: 'Seal #KE-43980 · Sentinel Bonded Logistics', time: '21 Aug 2026 · 07:40', agent: 'F. Wanjiru', state: 'done' },
  { title: 'Booked into vault', desc: 'Vault A · bay 12 · re-weighed 138.04 kg', time: '22 Aug 2026 · 14:20', agent: 'D. Kimani', state: 'done' },
  { title: 'Lab assay certificate filed', desc: 'Sarova Assay Labs · cert SAL-2026-8841', time: '23 Aug 2026 · 09:05', agent: 'F. Wanjiru', state: 'done' },
  { title: 'Allocated to Buy catalog', desc: 'Listed at $7.42M · fixed price', time: '02 Sep 2026 · 10:14', agent: 'G. Kioko', state: 'current' },
];

export const ALLOC_HISTORY = [
  { title: 'Sold from catalog', sub: 'MB-BUY-38511 · 24 kg drawn down', date: '28 Aug 2026', amt: '$742,000' },
  { title: 'Partial reserve released', sub: '12 kg returned to available', date: '30 Aug 2026', amt: '—' },
  { title: 'Relisted at revised ask', sub: 'Ask moved $31,000 → $31,240 / kg', date: '02 Sep 2026', amt: '$7.42M' },
];

export const VAULT_STATS = [
  { label: 'LOTS IN CUSTODY', value: '312', sub: '9 unallocated >7 days' },
  { label: 'COST BASIS', value: '$42.84M', sub: 'Weighted acquisition cost' },
  { label: 'REALISABLE', value: '$46.31M', sub: 'At live sell rates' },
  { label: 'AVG DAYS HELD', value: '37', sub: 'Target under 45' },
];

export const VAULT_FILTERS = ['All lots', 'In vault', 'Listed', 'In auction', 'Reserved', 'Shipped'] as const;

/** Default allocation panel for a lot opened from the list (design's lotRows go()). */
export function defaultAllocMode(status: LotStatus) {
  return status === 'In auction' ? 'auction' : status === 'Reserved' ? 'reserve' : 'catalog';
}
