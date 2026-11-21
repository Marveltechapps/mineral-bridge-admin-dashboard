import type { Tone } from '@/constants/tones';
import type { Listing } from '@/types/listings';

export const LISTINGS: Listing[] = [
  { id: 'MBL-2026-0112', lot: 'MBV-2026-0417', mineral: 'Platinum Sponge', grade: '99.95% Pt', qtyTotal: '138 kg', qtyLeft: '126 kg', price: '$31,240', value: '$4,311,120', status: 'Live', tone: 'green', access: 'All verified', views: 412, enquiries: 7, listed: '02 Sep 2026', featured: true },
  { id: 'MBL-2026-0109', lot: 'MBV-2026-0374', mineral: 'Cobalt Hydroxide', grade: '20.5% Co', qtyTotal: '210 t', qtyLeft: '210 t', price: '$34,100', value: '$7,161,000', status: 'Live', tone: 'green', access: 'Tier 3 only', views: 288, enquiries: 4, listed: '29 Aug 2026', featured: true },
  { id: 'MBL-2026-0107', lot: 'MBV-2026-0412', mineral: 'Gold Concentrate', grade: '92.1% Au', qtyTotal: '86.4 kg', qtyLeft: '54 kg', price: '$68,450', value: '$3,696,300', status: 'Live', tone: 'green', access: 'All verified', views: 964, enquiries: 18, listed: '26 Aug 2026', featured: false },
  { id: 'MBL-2026-0104', lot: 'MBV-2026-0408', mineral: 'Silver Bullion', grade: '99.9% Ag', qtyTotal: '11,240 kg', qtyLeft: '7,240 kg', price: '$1,128', value: '$8,166,720', status: 'Live', tone: 'green', access: 'All verified', views: 640, enquiries: 11, listed: '24 Aug 2026', featured: false },
  { id: 'MBL-2026-0101', lot: 'MBV-2026-0366', mineral: 'Lithium Spodumene', grade: '5.8% Li2O', qtyTotal: '480 t', qtyLeft: '480 t', price: '$1,268', value: '$608,640', status: 'Paused', tone: 'amber', access: 'Tier 3 only', views: 118, enquiries: 2, listed: '21 Aug 2026', featured: false },
  { id: 'MBL-2026-0098', lot: 'MBV-2026-0359', mineral: 'Tin Ingot', grade: '99.85% Sn', qtyTotal: '88 t', qtyLeft: '31 t', price: '$32,600', value: '$1,010,600', status: 'Live', tone: 'green', access: 'All verified', views: 342, enquiries: 6, listed: '18 Aug 2026', featured: false },
  { id: 'MBL-2026-0094', lot: 'MBV-2026-0344', mineral: 'Rhodium Sponge', grade: '99.9% Rh', qtyTotal: '6.2 kg', qtyLeft: '6.2 kg', price: '$159,400', value: '$988,280', status: 'Scheduled', tone: 'blue', access: 'Tier 3 only', views: 0, enquiries: 0, listed: 'Opens 15 Sep 2026', featured: true },
  { id: 'MBL-2026-0091', lot: 'MBV-2026-0402', mineral: 'Copper Cathode', grade: '99.99% Cu', qtyTotal: '624 t', qtyLeft: '0 t', price: '$9,840', value: '$0', status: 'Sold out', tone: 'gray', access: 'All verified', views: 1204, enquiries: 27, listed: '12 Aug 2026', featured: false },
  { id: 'MBL-2026-0088', lot: 'MBV-2026-0388', mineral: 'Tantalite (Coltan)', grade: '31.4% Ta2O5', qtyTotal: '96 t', qtyLeft: '96 t', price: '$51,200', value: '$4,915,200', status: 'Draft', tone: 'gray', access: 'Not published', views: 0, enquiries: 0, listed: 'Created 09 Aug 2026', featured: false },
];

export const LISTING_STATS = [
  { label: 'LIVE LISTINGS', value: '6', sub: '3 paused, scheduled or draft' },
  { label: 'CATALOG VALUE', value: '$25.66M', sub: 'At current ask prices' },
  { label: 'SOLD THIS MONTH', value: '$9.84M', sub: '38% of listed volume' },
  { label: 'AVG DAYS TO SELL', value: '19', sub: 'Target under 30' },
];

export const LISTING_FILTERS = ['All listings', 'Live', 'Paused', 'Scheduled', 'Sold out', 'Draft'] as const;

export const accessTone = (access: string): Tone => (access === 'Tier 3 only' ? 'gold' : access === 'Not published' ? 'gray' : 'navy');
export const unitOf = (l: Listing) => l.qtyTotal.split(' ')[1];
