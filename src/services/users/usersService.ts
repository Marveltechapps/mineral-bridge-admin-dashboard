import { isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, fetchAllPages, formatDay, statusLabel, textOf } from '@/lib/wire';
import type { Tone } from '@/constants/tones';
import type { Account } from '@/types/users';
import { ACCOUNTS, TIER_REQUESTS } from './usersData';

const ACCOUNT_TONE: Record<string, Tone> = { Verified: 'green', 'In review': 'blue', Expiring: 'amber', Rejected: 'red', Suspended: 'gray' };

function mapAccount(raw: unknown): Account {
  const row = asRecord(raw) ?? {};
  const status = statusLabel(row.status) as Account['status'];
  const tier = Number(row.tier ?? 1);
  return {
    id: textOf(row.id),
    name: textOf(row.name),
    org: textOf(row.org),
    email: textOf(row.email),
    tier: (tier === 2 || tier === 3 ? tier : 1) as 1 | 2 | 3,
    status: ACCOUNT_TONE[status] ? status : 'In review',
    tone: ACCOUNT_TONE[status] ?? 'blue',
    orders: Number(row.orderCount ?? row.orders ?? 0),
    joined: formatDay(row.joinedAt ?? row.joined),
  };
}

export async function getAccounts(signal?: AbortSignal): Promise<Account[]> {
  if (isDemoMode()) return ACCOUNTS;
  return (await fetchAllPages(ENDPOINTS.users.list, signal)).map(mapAccount);
}

export async function getTierRequests(signal?: AbortSignal): Promise<Array<(typeof TIER_REQUESTS)[number] & { id?: string }>> {
  if (isDemoMode()) return TIER_REQUESTS;
  const rows = await fetchAllPages<Record<string, unknown>>(ENDPOINTS.users.tierRequests, signal);
  return rows.map((row) => {
    const user = asRecord(row.user);
    return {
      id: textOf(row.id),
      name: textOf(user?.name),
      org: textOf(user?.org),
      from: `Tier ${textOf(row.from)}`,
      to: `Tier ${textOf(row.to)}`,
      reason: textOf(row.reason),
      age: formatDay(row.openedAt),
    };
  });
}
