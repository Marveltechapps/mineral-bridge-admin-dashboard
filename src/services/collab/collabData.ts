import type { Negotiation } from '@/types/collab';

export const NEGOTIATIONS: Negotiation[] = [
  { id: 'NEG-2026-0233', miner: 'Rift Valley Minerals Ltd', trader: 'Coast Bullion Partners', goods: 'Gold Concentrate · 24 kg', ask: 69200, offer: 67400, rounds: 4, status: 'Awaiting miner', tone: 'blue', last: '18 min ago', history: [['Trader', 66000], ['Miner', 69200], ['Trader', 66900], ['Miner', 68400], ['Trader', 67400]] },
  { id: 'NEG-2026-0231', miner: 'Turkana Gold SACCO', trader: 'Athi River Refinery Ltd', goods: 'Silver Bullion · 1,200 kg', ask: 1140, offer: 1128, rounds: 3, status: 'Terms agreed', tone: 'green', last: '1 h ago', history: [['Trader', 1102], ['Miner', 1140], ['Trader', 1120], ['Miner', 1128], ['Trader', 1128]] },
  { id: 'NEG-2026-0228', miner: 'Nyanza Smelting Ltd', trader: 'Mombasa Metals Exchange', goods: 'Copper Cathode · 120 t', ask: 9920, offer: 9610, rounds: 5, status: 'Awaiting trader', tone: 'violet', last: '2 h ago', history: [['Trader', 9400], ['Miner', 9920], ['Trader', 9520], ['Miner', 9780], ['Trader', 9580], ['Miner', 9610]] },
  { id: 'NEG-2026-0224', miner: 'Kakamega Artisanal Group', trader: 'Baringo Trading Co', goods: 'Tantalite (Coltan) · 4 t', ask: 52800, offer: 48100, rounds: 6, status: 'Stalled', tone: 'red', last: '4 days ago', history: [['Trader', 46000], ['Miner', 52800], ['Trader', 47200], ['Miner', 51900], ['Trader', 48100]] },
  { id: 'NEG-2026-0221', miner: 'Samburu Aggregates', trader: 'Eldoret Assay Holdings', goods: 'Lithium Spodumene · 300 t', ask: 1290, offer: 1262, rounds: 2, status: 'Awaiting miner', tone: 'blue', last: '5 h ago', history: [['Trader', 1240], ['Miner', 1290], ['Trader', 1262]] },
  { id: 'NEG-2026-0217', miner: 'Machakos Mining SME', trader: 'Coast Bullion Partners', goods: 'Platinum Sponge · 18 kg', ask: 31600, offer: 31240, rounds: 3, status: 'Terms agreed', tone: 'green', last: '1 day ago', history: [['Trader', 30800], ['Miner', 31600], ['Trader', 31240], ['Miner', 31240]] },
];

export const CONTRACTS = [
  { id: 'CTR-2026-0188', parties: 'Turkana Gold SACCO → Coast Bullion Partners', goods: 'Silver Bullion · 640 kg', value: '$721,920', date: '24 Sep 2026', lc: 'LC-2026-0405' },
  { id: 'CTR-2026-0186', parties: 'Rift Valley Minerals Ltd → Coast Bullion Partners', goods: 'Gold Concentrate · 18.4 kg', value: '$1,174,000', date: '22 Sep 2026', lc: 'LC-2026-0418' },
  { id: 'CTR-2026-0183', parties: 'Machakos Mining SME → Athi River Refinery Ltd', goods: 'Platinum Sponge · 42 kg', value: '$1,312,080', date: '19 Sep 2026', lc: 'LC-2026-0415' },
  { id: 'CTR-2026-0180', parties: 'Nyanza Smelting Ltd → Mombasa Metals Exchange', goods: 'Copper Cathode · 64 t', value: '$629,760', date: '16 Sep 2026', lc: 'LC-2026-0412' },
];

export const TOP_MINERS = [
  { name: 'Rift Valley Minerals Ltd', rating: 4.9, deals: 14, ontime: '100% on time' },
  { name: 'Turkana Gold SACCO', rating: 4.8, deals: 9, ontime: '98% on time' },
  { name: 'Machakos Mining SME', rating: 4.7, deals: 11, ontime: '96% on time' },
  { name: 'Nyanza Smelting Ltd', rating: 4.6, deals: 22, ontime: '95% on time' },
  { name: 'Samburu Aggregates', rating: 4.4, deals: 7, ontime: '91% on time' },
];

export const TOP_TRADERS = [
  { name: 'Coast Bullion Partners', rating: 4.9, deals: 38, ontime: '100% paid on time' },
  { name: 'Athi River Refinery Ltd', rating: 4.8, deals: 51, ontime: '99% paid on time' },
  { name: 'Mombasa Metals Exchange', rating: 4.6, deals: 27, ontime: '96% paid on time' },
  { name: 'Eldoret Assay Holdings', rating: 4.5, deals: 12, ontime: '94% paid on time' },
  { name: 'Baringo Trading Co', rating: 4.2, deals: 8, ontime: '88% paid on time' },
];

export const COLLAB_STATS = [
  { label: 'ACTIVE NEGOTIATIONS', value: '23', sub: '8 awaiting a counter-offer' },
  { label: 'CONTRACTS SIGNED · QTD', value: '41', sub: '$18.6M contracted value' },
  { label: 'AVG TIME TO AGREEMENT', value: '4.3 days', sub: '0.8 days faster than Q2' },
  { label: 'OFFER ACCEPTANCE RATE', value: '68%', sub: '3 pts up vs Q2' },
];

export const NEG_FILTERS = ['All negotiations', 'Awaiting miner', 'Awaiting trader', 'Terms agreed', 'Stalled'] as const;
