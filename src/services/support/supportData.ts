import type { Tone } from '@/constants/tones';

export const TICKETS: Array<{ id: string; subject: string; user: string; link: string; status: string; tone: Tone; owner: string; age: string }> = [
  { id: 'TKT-5514', subject: 'Buyer asking for pre-auction assay copy', user: 'Amina Hassan', link: 'AUC-2026-0219', status: 'Escalated', tone: 'amber', owner: 'Trading desk', age: '4 h' },
  { id: 'TKT-5511', subject: 'Pickup rescheduled twice, seller frustrated', user: 'Mary Wekesa', link: 'MB-SELL-41964', status: 'Open', tone: 'blue', owner: 'S. Barasa', age: '7 h' },
  { id: 'TKT-5508', subject: 'Payout account change verification', user: 'Victor Barasa', link: 'MB-SELL-41903', status: 'Open', tone: 'blue', owner: 'L. Achieng', age: '11 h' },
  { id: 'TKT-5503', subject: 'Cannot upload export permit — file size', user: 'Ibrahim Noor', link: '—', status: 'Waiting on user', tone: 'gray', owner: 'S. Barasa', age: '1 d' },
  { id: 'TKT-5497', subject: 'Question about Tier 3 bulk minimums', user: 'Sarah Ochieng', link: '—', status: 'Open', tone: 'blue', owner: 'R. Kariuki', age: '1 d' },
  { id: 'TKT-5482', subject: 'Assay timing question', user: 'Joseph Kiptoo', link: 'MB-SELL-41982', status: 'Resolved', tone: 'green', owner: 'F. Wanjiru', age: '2 d' },
];

export const CALLS = [
  { time: '11 Sep 2026 · 09:14', who: 'Joseph Kiptoo', phone: '+254 722 418 003', dir: 'Inbound', dur: '6 m 12 s', topic: 'Assay re-run timing', agent: 'F. Wanjiru' },
  { time: '11 Sep 2026 · 08:40', who: 'Amina Hassan', phone: '+254 720 118 447', dir: 'Outbound', dur: '11 m 03 s', topic: 'Auction terms walkthrough', agent: 'G. Kioko' },
  { time: '10 Sep 2026 · 16:22', who: 'Mary Wekesa', phone: '+254 715 990 221', dir: 'Inbound', dur: '4 m 48 s', topic: 'Pickup reschedule', agent: 'S. Barasa' },
  { time: '10 Sep 2026 · 14:05', who: 'Ibrahim Noor', phone: '+254 733 442 907', dir: 'Outbound', dur: '8 m 31 s', topic: 'Permit expiry reminder', agent: 'L. Achieng' },
  { time: '10 Sep 2026 · 11:47', who: 'Peter Mutiso', phone: '+254 701 338 664', dir: 'Inbound', dur: '3 m 09 s', topic: 'Tier upgrade question', agent: 'R. Kariuki' },
  { time: '09 Sep 2026 · 15:30', who: 'Victor Barasa', phone: '+254 727 811 550', dir: 'Inbound', dur: '9 m 55 s', topic: 'Payout account change', agent: 'L. Achieng' },
];
