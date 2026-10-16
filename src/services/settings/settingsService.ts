import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { PLATFORM_SETTINGS, ROLES } from './settingsData';

export function getRoles(signal?: AbortSignal): Promise<typeof ROLES> {
  return apiRequestOrDemo(ENDPOINTS.settings.roles, ROLES, { signal });
}

export function getPlatformSettings(signal?: AbortSignal): Promise<typeof PLATFORM_SETTINGS> {
  return apiRequestOrDemo(ENDPOINTS.settings.platform, PLATFORM_SETTINGS, { signal });
}
