import type { Tone } from '@/constants/tones';
import type { ActivityItem, InkKey, QueueTarget } from '@/types/overview';

export const STAGE_BAR = [
  { label: 'Verification', count: 38, color: '#2563EB', short: 'VER' },
  { label: 'Pricing', count: 31, color: '#3B82F6', short: 'PRC' },
  { label: 'Agent visit', count: 27, color: '#8B5CF6', short: 'VIS' },
  { label: 'Approval', count: 24, color: '#B45309', short: 'APR' },
  { label: 'Payment', count: 41, color: '#16A34A', short: 'PAY' },
  { label: 'Transfer', count: 23, color: '#1E2A5A', short: 'CUS' },
];

export const VAULT_BY_MINERAL = [
  { name: 'Gold Concentrate', value: '$18.42M', qty: '412 kg', lots: '86 lots', pct: 100 },
  { name: 'Silver Bullion', value: '$9.86M', qty: '11,240 kg', lots: '54 lots', pct: 54 },
  { name: 'Platinum Sponge', value: '$7.91M', qty: '138 kg', lots: '31 lots', pct: 43 },
  { name: 'Copper Cathode', value: '$5.62M', qty: '624 t', lots: '78 lots', pct: 31 },
  { name: 'Tantalite (Coltan)', value: '$4.50M', qty: '96 t', lots: '63 lots', pct: 24 },
];

export const ACTIVITY: ActivityItem[] = [
  { text: 'Order MB-SELL-41982 moved to Inspection & approval', meta: 'Rift Valley Minerals Ltd · 18.4 kg Gold Concentrate · agent F. Wanjiru on site', time: '9 min ago', icon: 'box', tone: 'amber' },
  { text: 'New Tier 3 KYC submitted', meta: 'Athi River Refinery Ltd · KYB + export permit attached', time: '24 min ago', icon: 'shield', tone: 'violet' },
  { text: 'Firm offer approved at $1.94M', meta: 'MB-SELL-41877 · adjusted −1.2% from suggested rate by G. Kioko', time: '41 min ago', icon: 'check', tone: 'green' },
  { text: 'Auction AUC-2026-0219 flagged for review', meta: '11 sequential bids from two linked accounts', time: '52 min ago', icon: 'flag', tone: 'red' },
  { text: 'Lot MBV-2026-0417 listed in Buy catalog', meta: '138 kg Platinum Sponge · 99.95% assay · $7.42M ask', time: '1 h ago', icon: 'vault', tone: 'gold' },
  { text: 'Export permit expiring in 21 days', meta: 'Mombasa Metals Exchange · EP-KE-88412 · escalated to compliance', time: '1 h ago', icon: 'clock', tone: 'amber' },
  { text: 'Payment released to seller', meta: 'MB-SELL-41889 · $317,900 to Machakos Mining SME before pickup', time: '2 h ago', icon: 'financial', tone: 'green' },
  { text: 'Order MB-BUY-38904 stage advanced to Agent visit', meta: 'Collection booked at Nairobi Zone 0', time: '2 h ago', icon: 'box', tone: 'violet' },
  { text: 'Dispute DSP-2026-0071 opened', meta: 'MB-SELL-41640 · assay result contested by seller', time: '3 h ago', icon: 'dispute', tone: 'red' },
  { text: 'Tier change request approved', meta: 'Kakamega Artisanal Group · Tier 1 → Tier 2', time: '3 h ago', icon: 'users', tone: 'green' },
  { text: 'Manual rate override applied', meta: 'Cobalt Hydroxide 20.5% · buy rate $31,400/t by G. Kioko', time: '4 h ago', icon: 'pricing', tone: 'navy' },
  { text: 'Bulk consignment submitted', meta: 'Nyanza Smelting Ltd · 64 t Copper Cathode · 3 licences filed', time: '5 h ago', icon: 'doc', tone: 'violet' },
  { text: 'Parcel sealed and handed to carrier', meta: 'MB-SELL-41889 · seal #KE-44098 · Sentinel Bonded Logistics', time: '6 h ago', icon: 'box', tone: 'navy' },
  { text: 'KYC rejected — document mismatch', meta: 'Applicant ID name differs from group registration', time: '7 h ago', icon: 'x', tone: 'red' },
  { text: 'Lot MBV-2026-0388 held in reserve', meta: '96 t Tantalite · awaiting rate recovery', time: '8 h ago', icon: 'vault', tone: 'gray' },
  { text: 'Carrier assignment changed', meta: 'MB-SELL-41903 · Sentinel Bonded Logistics → Zawadi Secure Freight', time: '9 h ago', icon: 'partners', tone: 'navy' },
  { text: 'Academy lesson published', meta: 'Quality & Grading · "Reading an assay certificate"', time: '11 h ago', icon: 'academy', tone: 'gold' },
  { text: 'Ticket TKT-5514 escalated to trading desk', meta: 'Buyer asking for pre-auction assay copy', time: '12 h ago', icon: 'support', tone: 'amber' },
  { text: 'Weekly settlement batch reconciled', meta: '12 settlements · $8.92M · no exceptions', time: '14 h ago', icon: 'check', tone: 'green' },
  { text: 'Inspection hub capacity updated', meta: 'Nairobi Zone 0 · 14 of 20 bays in use', time: '16 h ago', icon: 'partners', tone: 'gray' },
];

export const QUEUES: Array<{ label: string; sub: string; count: string; tone: Tone; target: QueueTarget }> = [
  { label: 'KYC queue', sub: '4 overdue past 48 h SLA', count: '27', tone: 'amber', target: 'verification' },
  { label: 'Firm offers to approve', sub: 'Assay in, offer not sent', count: '6', tone: 'blue', target: 'pricing' },
  { label: 'Bulk intake to price', sub: 'Tier 3 consignments', count: '4', tone: 'violet', target: 'orders' },
  { label: 'Vault lots unallocated', sub: 'Sitting >7 days', count: '9', tone: 'gold', target: 'vault' },
  { label: 'Open disputes', sub: 'Median 3.2 days to close', count: '5', tone: 'red', target: 'disputes' },
];

export const TRADE_KPIS: Array<{ label: string; value: string; sub: string; ink: InkKey; target: 'collab' | 'lc' | 'chain'; bar?: number }> = [
  { label: 'ACTIVE NEGOTIATIONS', value: '23', sub: '8 awaiting a counter-offer', ink: 'info', target: 'collab' },
  { label: 'LC VALUE ISSUED VS PAID', value: '$31.4M', sub: '$22.9M paid · $8.5M outstanding', ink: 'ok', target: 'lc', bar: 73 },
  { label: 'AVG LC CYCLE TIME', value: '18.6 days', sub: '2.1 days faster than Q2', ink: 'ok', target: 'lc' },
  { label: 'DISCREPANCY RATE', value: '6.8%', sub: '4 of 59 presentations this month', ink: 'warn', target: 'lc' },
  { label: 'PASSPORTS ON BLOCKCHAIN', value: '1,284', sub: '46 minted this week', ink: 'ok', target: 'chain' },
  { label: 'BTC-SETTLED VOLUME', value: '$4.12M', sub: '62.4 BTC · 7% of settlements', ink: 'gold', target: 'chain' },
];

export const INK_VAR: Record<InkKey, string> = {
  ok: 'var(--okInk)',
  warn: 'var(--warnInk)',
  err: 'var(--errInk)',
  info: 'var(--infoInk)',
  mute: 'var(--ink2)',
  // The design maps "gold" to var(--warnInk, #8A6318): the variable always resolves.
  gold: 'var(--warnInk)',
};

export const LC_FUNNEL = [
  { label: 'Requested', count: 72, value: '$39.8M', color: '#2563EB' },
  { label: 'Issued', count: 59, value: '$31.4M', color: '#4F46E5' },
  { label: 'Shipped', count: 47, value: '$26.1M', color: '#8B5CF6' },
  { label: 'Docs presented', count: 41, value: '$23.7M', color: '#B45309' },
  { label: 'Paid', count: 34, value: '$22.9M', color: '#16A34A' },
];
