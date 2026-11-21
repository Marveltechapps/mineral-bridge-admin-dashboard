import { isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { ago, asRecord, fetchAllPages, statusLabel, textOf } from '@/lib/wire';
import type { Tone } from '@/constants/tones';
import type { KycSubmission, TrackedDoc } from '@/types/verification';
import { KYC, TRACKED_DOCS } from './verificationData';

const DOC_TONE: Record<string, Tone> = { verified: 'green', in_review: 'blue', expiring: 'amber', expired: 'red', rejected: 'red' };

function mapKyc(raw: unknown): KycSubmission {
  const row = asRecord(raw) ?? {};
  const docs = Array.isArray(row.documents) ? row.documents : [];
  return {
    id: textOf(row.id),
    org: textOf(row.org),
    person: textOf(row.person),
    tier: (Number(row.tier) === 2 || Number(row.tier) === 3 ? Number(row.tier) : 1) as 1 | 2 | 3,
    submitted: ago(row.submittedAt) ? `Submitted ${ago(row.submittedAt)}` : '',
    status: statusLabel(row.status),
    tone: row.overdue ? 'amber' : 'blue',
    overdue: Boolean(row.overdue),
    docs: docs.map((doc) => {
      const item = asRecord(doc) ?? {};
      const status = textOf(item.status);
      return {
        id: textOf(item.id),
        name: textOf(item.name),
        ref: textOf(item.ref),
        status: status.replace(/_/g, ' ').toUpperCase(),
        tone: DOC_TONE[status] ?? 'gray',
        fileId: textOf(item.fileId) || undefined,
        side: textOf(item.side) || undefined,
        mimeType: textOf(item.mimeType) || undefined,
        rejectionReason: textOf(item.rejectionReason) || undefined,
      };
    }),
  };
}

export async function getKycSubmissions(signal?: AbortSignal): Promise<KycSubmission[]> {
  if (isDemoMode()) return KYC;
  return (await fetchAllPages(ENDPOINTS.compliance.kyc, signal)).map(mapKyc);
}

const REASON_MIN = 3;

/** Body for the compliance decision endpoint. Reject and resubmit require a reason. */
export function reviewDecisionBody(
  outcome: string,
  reason: string,
): { decision: 'approve' } | { decision: 'reject' | 'request_resubmission'; reason: string } | { error: string } {
  if (outcome === 'Verified') return { decision: 'approve' };
  const trimmed = reason.trim();
  if (trimmed.length < REASON_MIN) return { error: 'Enter a reason of at least 3 characters so the customer knows what to correct.' };
  if (outcome === 'Rejected') return { decision: 'reject', reason: trimmed };
  return { decision: 'request_resubmission', reason: trimmed };
}

export async function getTrackedDocuments(signal?: AbortSignal): Promise<TrackedDoc[]> {
  if (isDemoMode()) return TRACKED_DOCS;
  const rows = await fetchAllPages<Record<string, unknown>>(ENDPOINTS.compliance.documents, signal);
  return rows.map((row) => ({
    type: textOf(row.type),
    ref: textOf(row.ref),
    holder: textOf(asRecord(row.holder)?.name),
    tier: textOf(row.tier),
    expires: textOf(row.expiresOn),
    days: Number(row.daysToExpiry ?? 0),
    status: statusLabel(row.status),
    tone: DOC_TONE[textOf(row.status)] ?? 'gray',
  }));
}
