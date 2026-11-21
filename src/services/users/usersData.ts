import type { Tone } from '@/constants/tones';
import type { Account } from '@/types/users';

export const ACCOUNTS: Account[] = [
  { name: 'Joseph Kiptoo', org: 'Rift Valley Minerals Ltd', email: 'jkiptoo@riftvalleyminerals.co.ke', tier: 2, status: 'Verified', tone: 'green', orders: 14, joined: '12 Feb 2026' },
  { name: 'Amina Hassan', org: 'Coast Bullion Partners', email: 'a.hassan@coastbullion.com', tier: 3, status: 'Verified', tone: 'green', orders: 38, joined: '04 Nov 2025' },
  { name: 'Peter Mutiso', org: 'Kilimapesa Mining Co-op', email: 'p.mutiso@kilimapesa.coop', tier: 2, status: 'In review', tone: 'blue', orders: 6, joined: '21 Jun 2026' },
  { name: 'Sarah Ochieng', org: 'Athi River Refinery Ltd', email: 's.ochieng@athirefinery.co.ke', tier: 3, status: 'Verified', tone: 'green', orders: 51, joined: '17 Aug 2025' },
  { name: 'Daniel Lokorio', org: 'Turkana Gold SACCO', email: 'd.lokorio@turkanagold.co.ke', tier: 2, status: 'Expiring', tone: 'amber', orders: 9, joined: '30 Mar 2026' },
  { name: 'Mary Wekesa', org: 'Kakamega Artisanal Group', email: 'm.wekesa@kakamega-ag.org', tier: 1, status: 'Verified', tone: 'green', orders: 3, joined: '02 Aug 2026' },
  { name: 'Ibrahim Noor', org: 'Mombasa Metals Exchange', email: 'i.noor@mmex.co.ke', tier: 3, status: 'Expiring', tone: 'amber', orders: 27, joined: '09 Jan 2026' },
  { name: 'Grace Cheruiyot', org: 'Individual seller', email: 'g.cheruiyot@gmail.com', tier: 1, status: 'Rejected', tone: 'red', orders: 0, joined: '28 Aug 2026' },
  { name: 'Victor Barasa', org: 'Nyanza Smelting Ltd', email: 'v.barasa@nyanzasmelt.co.ke', tier: 3, status: 'Verified', tone: 'green', orders: 22, joined: '14 Dec 2025' },
  { name: 'Esther Njeri', org: 'Machakos Mining SME', email: 'e.njeri@machakosmining.co.ke', tier: 2, status: 'In review', tone: 'blue', orders: 11, joined: '05 May 2026' },
];

export const TIER_TONE: Record<number, Tone> = { 1: 'gray', 2: 'navy', 3: 'gold' };

export const USER_FILTERS = ['All tiers', 'Tier 1', 'Tier 2', 'Tier 3', 'Verified', 'In review', 'Expiring', 'Rejected'] as const;

export const TIER_REQUESTS = [
  { name: 'Mary Wekesa', org: 'Kakamega Artisanal Group', from: 'Tier 1', to: 'Tier 2', reason: 'Group now registered as a co-operative with 24 members', age: '2 days' },
  { name: 'Grace Cheruiyot', org: 'Individual seller', from: 'Tier 1', to: 'Tier 2', reason: 'Joined a mining group in Kakamega, needs group paperwork depth', age: '4 days' },
  { name: 'Peter Mutiso', org: 'Kilimapesa Mining Co-op', from: 'Tier 2', to: 'Tier 3', reason: 'Co-op incorporated as a limited company, export permit filed', age: '1 day' },
  { name: 'Daniel Lokorio', org: 'Turkana Gold SACCO', from: 'Tier 2', to: 'Tier 3', reason: 'Wants bulk consignment access for 2026 Q4 volumes', age: '6 days' },
];

export const USER_ORDERS = [
  { id: 'MB-SELL-41982', mineral: 'Gold Concentrate', qty: '18.4 kg', stage: 'Inspection & approval', tone: 'amber' as Tone, date: '04 Sep 2026' },
  { id: 'MB-SELL-41688', mineral: 'Platinum Sponge', qty: '138 kg', stage: 'Completed', tone: 'green' as Tone, date: '18 Aug 2026' },
  { id: 'MB-BUY-38511', mineral: 'Platinum Sponge', qty: '24 kg', stage: 'Completed', tone: 'green' as Tone, date: '28 Aug 2026' },
  { id: 'MB-SELL-41540', mineral: 'Tantalite (Coltan)', qty: '96 t', stage: 'Completed', tone: 'green' as Tone, date: '22 Jul 2026' },
  { id: 'MB-SELL-41310', mineral: 'Gold Concentrate', qty: '42.8 kg', stage: 'Completed', tone: 'green' as Tone, date: '11 Jun 2026' },
];

export const USER_TICKETS = [
  { id: 'TKT-5482', subject: 'Assay timing question on MB-SELL-41982', status: 'Resolved', date: '09 Sep 2026' },
  { id: 'TKT-5310', subject: 'Payout account change request', status: 'Resolved', date: '22 Aug 2026' },
  { id: 'TKT-5188', subject: 'Pickup window conflict, Kerio Valley site', status: 'Resolved', date: '04 Aug 2026' },
];

export const initialsOfName = (name: string) =>
  name
    .split(' ')
    .map((s) => s[0])
    .join('');

/** Documents on file for an account (design's userDocs). */
export function userDocuments(u: Account) {
  const docs: Array<{ name: string; status: string; tone: Tone; exp: string }> = [
    { name: 'National ID', status: 'VERIFIED', tone: 'green', exp: 'Expires 14 Mar 2031' },
    u.tier >= 2 ? { name: 'Group registration', status: 'VERIFIED', tone: 'green', exp: 'Expires 30 Jun 2027' } : { name: 'Proof of address', status: 'VERIFIED', tone: 'green', exp: 'Expires 12 Apr 2027' },
    u.tier >= 3
      ? {
          name: 'Import/export permit',
          status: u.status === 'Expiring' ? 'EXPIRING' : 'VERIFIED',
          tone: u.status === 'Expiring' ? 'amber' : 'green',
          exp: u.status === 'Expiring' ? 'Expires 02 Oct 2026 · 21 days' : 'Expires 18 May 2028',
        }
      : { name: 'Mining lease certificate', status: 'VERIFIED', tone: 'green', exp: 'Expires 01 Dec 2028' },
    {
      name: 'Proof of address',
      status: u.status === 'Rejected' ? 'REJECTED' : u.status === 'Expiring' ? 'EXPIRING' : 'VERIFIED',
      tone: u.status === 'Rejected' ? 'red' : u.status === 'Expiring' ? 'amber' : 'green',
      exp: u.status === 'Rejected' ? 'Name mismatch · resubmission required' : 'Expires 02 Oct 2026 · 21 days',
    },
  ];
  return docs;
}
