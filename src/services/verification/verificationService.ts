import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import type { KycSubmission, TrackedDoc } from '@/types/verification';
import { KYC, TRACKED_DOCS } from './verificationData';

export function getKycSubmissions(signal?: AbortSignal): Promise<KycSubmission[]> {
  return apiRequestOrDemo(ENDPOINTS.compliance.kyc, KYC, { signal });
}

export function getTrackedDocuments(signal?: AbortSignal): Promise<TrackedDoc[]> {
  return apiRequestOrDemo(ENDPOINTS.compliance.documents, TRACKED_DOCS, { signal });
}
