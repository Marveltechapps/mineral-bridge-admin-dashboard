import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, moneyLabel, textOf } from '@/lib/wire';
import { COUNTRIES, MODULES, PLATFORM_SETTINGS, ROLES } from './settingsData';

const ACCESS: Record<string, number> = { none: 0, view: 1, edit: 2 };

export interface LiveRoles {
  modules: string[];
  roles: Array<{ id: string; name: string; desc: string; access: number[]; seats: number }>;
  etag: string;
}

export async function getRoles(signal?: AbortSignal): Promise<LiveRoles> {
  if (isDemoMode()) return { modules: [...MODULES], roles: ROLES.map((role) => ({ id: role.name, ...role })), etag: '' };
  const body = await apiRequest<{ modules?: string[]; roles?: Array<Record<string, unknown>>; etag?: string }>(ENDPOINTS.settings.roles, { signal });
  const modules = body.modules ?? [];
  return {
    modules,
    etag: textOf(body.etag),
    roles: (body.roles ?? []).map((role) => {
      const access = asRecord(role.access) ?? {};
      return {
        id: textOf(role.id),
        name: textOf(role.name),
        desc: textOf(role.description),
        seats: Number(role.seats ?? 0),
        access: modules.map((module) => ACCESS[textOf(access[module])] ?? 0),
      };
    }),
  };
}

export interface PlatformScreen {
  rows: Array<(typeof PLATFORM_SETTINGS)[number] & { key: string; raw: number }>;
  etag: string;
}

export interface BtcScreen {
  rows: typeof COUNTRIES;
  etag: string;
}

export async function getPlatformSettings(signal?: AbortSignal): Promise<PlatformScreen> {
  if (isDemoMode()) return { rows: PLATFORM_SETTINGS.map((row) => ({ ...row, key: '', raw: Number.NaN })), etag: '' };
  const body = await apiRequest<{ settings?: Array<Record<string, unknown>>; etag?: string }>(ENDPOINTS.settings.platform, { signal });
  return {
    etag: textOf(body.etag),
    rows: (body.settings ?? []).map((row) => ({
      key: textOf(row.key),
      label: textOf(row.label),
      desc: textOf(row.description),
      raw: typeof row.value === 'number' ? row.value : Number(row.value),
      value: `${textOf(row.value)}${row.unit ? ` ${textOf(row.unit)}` : ''}`,
    })),
  };
}

export async function savePlatformSettings(etag: string, values: Record<string, number>): Promise<string> {
  const saved = await apiRequest<{ message?: string }>(ENDPOINTS.settings.platform, {
    method: 'PUT',
    headers: etag ? { 'If-Match': etag } : {},
    body: JSON.stringify({ values }),
  });
  return saved.message || 'Platform configuration saved';
}

export async function getBtcCountries(signal?: AbortSignal): Promise<BtcScreen> {
  if (isDemoMode()) return { rows: COUNTRIES, etag: '' };
  const body = await apiRequest<{ data?: Array<Record<string, unknown>>; etag?: string }>(ENDPOINTS.settings.btc, { signal });
  return {
    etag: textOf(body.etag),
    rows: (body.data ?? []).map((row) => ({
      name: textOf(row.name),
      code: textOf(row.code),
      reg: textOf(row.regulationLabel),
      rail: textOf(row.rail, '—'),
      limit: moneyLabel(row.limit),
      enabled: Boolean(row.enabled),
    })),
  };
}

export async function saveBtcCountries(etag: string, changes: Array<{ code: string; enabled: boolean }>): Promise<string> {
  const saved = await apiRequest<{ message?: string }>(ENDPOINTS.settings.btc, {
    method: 'PUT',
    headers: etag ? { 'If-Match': etag } : {},
    body: JSON.stringify({ changes }),
  });
  return saved.message || 'Bitcoin payment settings saved';
}
