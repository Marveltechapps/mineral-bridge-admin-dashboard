import type { Offer, Rate } from '@/types/pricing';

export const RATES: Rate[] = [
  { mineral: 'Gold Concentrate', grade: '92% Au · flotation', buy: '$63,800 / kg', sell: '$68,450 / kg', source: 'Market feed', updated: '2 min ago', trend: 1.4 },
  { mineral: 'Gold Concentrate', grade: '88% Au · flotation', buy: '$59,200 / kg', sell: '$63,900 / kg', source: 'Market feed', updated: '2 min ago', trend: 1.1 },
  { mineral: 'Silver Bullion', grade: '99.9% Ag · 1 kg bar', buy: '$1,046 / kg', sell: '$1,128 / kg', source: 'Market feed', updated: '2 min ago', trend: -0.6 },
  { mineral: 'Platinum Sponge', grade: '99.9% Pt · sponge', buy: '$28,900 / kg', sell: '$31,240 / kg', source: 'Market feed', updated: '5 min ago', trend: 0.8 },
  { mineral: 'Copper Cathode', grade: 'Grade A · 99.99% Cu', buy: '$9,180 / t', sell: '$9,840 / t', source: 'Manual override', updated: '1 h ago', trend: -0.3 },
  { mineral: 'Cobalt Hydroxide', grade: '20.5% Co content', buy: '$31,400 / t', sell: '$34,100 / t', source: 'Manual override', updated: '4 h ago', trend: 2.6 },
  { mineral: 'Tantalite (Coltan)', grade: '30%+ Ta2O5', buy: '$46,900 / t', sell: '$51,200 / t', source: 'Market feed', updated: '11 min ago', trend: 0.4 },
  { mineral: 'Lithium Spodumene', grade: '5.8% Li2O', buy: '$1,140 / t', sell: '$1,268 / t', source: 'Market feed', updated: '11 min ago', trend: -1.8 },
  { mineral: 'Tin Ingot', grade: '99.85% Sn', buy: '$30,240 / t', sell: '$32,600 / t', source: 'Market feed', updated: '18 min ago', trend: 0.2 },
  { mineral: 'Rhodium Sponge', grade: '99.9% Rh', buy: '$148,000 / kg', sell: '$159,400 / kg', source: 'Manual override', updated: '2 h ago', trend: 3.1 },
];

export const rateKey = (r: Rate) => `${r.mineral}|${r.grade}`;

export const OFFERS: Offer[] = [
  { id: 'MB-SELL-41982', party: 'Rift Valley Minerals Ltd', mineral: 'Gold Concentrate', weights: '18.4 kg declared · 18.21 kg assayed', assay: '92.4% Au · SAL-2026-8907', rate: '$63,800 / kg', suggested: '$1,161,798', note: 'Assay 0.2 kg under declared weight' },
  { id: 'MB-SELL-41903', party: 'Nyanza Smelting Ltd', mineral: 'Copper Cathode', weights: '64 t declared · 64 t assayed', assay: 'Grade A · 99.99% Cu · SAL-2026-8901', rate: '$9,180 / t', suggested: '$587,520', note: 'Manual override rate in force since 04 Sep' },
  { id: 'MB-SELL-41877', party: 'Kilimapesa Mining Co-op', mineral: 'Gold Concentrate', weights: '7.2 kg declared · 6.94 kg assayed', assay: '88.1% Au · SAL-2026-8894', rate: '$59,200 / kg', suggested: '$410,848', note: 'Weight variance 3.6% — flag threshold is 3%' },
  { id: 'MB-SELL-41940', party: 'Turkana Gold SACCO', mineral: 'Silver Bullion', weights: '640 kg declared · 640 kg assayed', assay: '99.9% Ag · SAL-2026-8888', rate: '$1,046 / kg', suggested: '$669,440', note: 'Clean — within tolerance' },
];

export const RANGE_LABEL = { '12W': '12 weeks', '6M': '6 months', '1Y': '12 months' } as const;
export const RANGE_AXIS = {
  '12W': ['Jun 22', 'Jul 13', 'Aug 03', 'Aug 24', 'Sep 12'],
  '6M': ['Mar', 'May', 'Jun', 'Aug', 'Sep'],
  '1Y': ['Oct 25', 'Jan 26', 'Apr 26', 'Jul 26', 'Sep 26'],
} as const;

/** 12-point synthetic history derived from the focused buy rate (design's hist). */
export function rateHistory(baseRate: number, seed: number): number[] {
  return [0.972, 0.981, 0.969, 0.977, 0.985, 0.983, 0.991, 0.988, 0.996, 0.992, 1.002, 1].map((f, i) => Math.round(baseRate * (f + Math.sin((i + seed) * 1.7) * 0.004)));
}
