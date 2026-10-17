import { apiRequest, isDemoMode, setCsrfToken } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import type { StaffAccount } from '@/types/auth';

/**
 * Demo staff accounts from the design. The design itself exposes these in a
 * "Show staff test credentials" panel on the sign-in screen, so they are not
 * secrets. A production build must replace authenticateDemo() with a call to
 * the real identity provider (see lib/endpoints.ts → auth.signIn).
 */
export const STAFF_ACCOUNTS: StaffAccount[] = [
  { name: 'Grace Kioko', role: 'Trading Desk Manager', initials: 'GK', email: 'grace.kioko@mineralbridge.co.ke', demoPassword: 'Desk2026!', scope: 'Orders, vault, pricing and auctions. Read-only on compliance.' },
  { name: 'Lydia Achieng', role: 'Compliance Officer', initials: 'LA', email: 'lydia.achieng@mineralbridge.co.ke', demoPassword: 'Kyc2026!', scope: 'KYC queue, documents and disputes. Read-only on trading.' },
  { name: 'Samuel Njoroge', role: 'CEO / Super Admin', initials: 'SN', email: 'samuel.njoroge@mineralbridge.co.ke', demoPassword: 'Super2026!', scope: 'Full platform access including roles and access control.' },
  { name: 'Sylvia Barasa', role: 'Support Agent', initials: 'SB', email: 'sylvia.barasa@mineralbridge.co.ke', demoPassword: 'Help2026!', scope: 'Tickets and call history. Read-only on orders and users.' },
  { name: 'Patrick Njoroge', role: 'Content Manager', initials: 'PN', email: 'patrick.njoroge@mineralbridge.co.ke', demoPassword: 'Learn2026!', scope: 'Academy and marketing content only.' },
  { name: 'David Kimani', role: 'Data Entry Clerk', initials: 'DK', email: 'david.kimani@mineralbridge.co.ke', demoPassword: 'Intake2026!', scope: 'Vault intake and account creation. No pricing access.' },
];

export type AuthResult = { ok: true; index: number } | { ok: false; error: string };

/** Validation rules and messages exactly as the design's attempt() handler. */
export function authenticateDemo(emailRaw: string, passwordRaw: string): AuthResult {
  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw.trim();
  if (!email || !password) return { ok: false, error: 'Enter your work email and password.' };
  const index = STAFF_ACCOUNTS.findIndex((a) => a.email === email);
  if (index < 0) return { ok: false, error: 'No staff account matches that email.' };
  if (STAFF_ACCOUNTS[index].demoPassword !== password) return { ok: false, error: `Incorrect password for ${email}.` };
  return { ok: true, index };
}

export interface StaffChallenge {
  challengeId: string;
  channel?: string;
  maskedDestination?: string;
  expiresAt?: string;
  resendAvailableAt?: string;
}

export function formatAuthError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'fields' in error) {
    const fields = (error as { fields?: Record<string, string> }).fields;
    const first = fields && Object.values(fields).find((value) => typeof value === 'string' && value);
    if (first) return first;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

/** Copy that reports provider acceptance. It does not claim the handset or inbox received the code. */
export function staffOtpCopy(maskedDestination: string | null, channel: string | null, name: string): string {
  if (!maskedDestination) return `A 6-digit code was submitted for ${name}. Check the contact on the staff account.`;
  const where = channel === 'email' ? 'email' : 'phone';
  return `A 6-digit code was submitted to the ${where} ${maskedDestination}. Delivery is confirmed only when it arrives.`;
}

export async function signInStaff(email: string, password: string): Promise<StaffChallenge> {
  return apiRequest<StaffChallenge>(ENDPOINTS.auth.signIn, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function resendStaffOtp(challengeId: string): Promise<{ maskedDestination?: string; resendAvailableAt?: string }> {
  return apiRequest(ENDPOINTS.auth.resendOtp, {
    method: 'POST',
    body: JSON.stringify({ challengeId }),
  });
}

export async function requestStaffPasswordReset(email: string): Promise<{ message: string }> {
  return apiRequest(ENDPOINTS.auth.passwordReset, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function startStaffSso(email: string): Promise<{ redirectUrl: string }> {
  return apiRequest(ENDPOINTS.auth.sso, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyStaffOtp(challengeId: string, code: string): Promise<{ name: string; role: string }> {
  const body = await apiRequest<{ me?: { name?: string; role?: { name?: string }; csrfToken?: string } }>(ENDPOINTS.auth.verifyOtp, {
    method: 'POST',
    body: JSON.stringify({ challengeId, code: code.replace(/\s/g, '') }),
  });
  if (body.me?.csrfToken) setCsrfToken(body.me.csrfToken);
  return { name: body.me?.name || emailFallback(challengeId), role: body.me?.role?.name || 'Staff' };
}

function emailFallback(id: string): string {
  return id;
}

export { isDemoMode };

/** SSO path: only the email is required (design's ssoAttempt()). */
export function resolveSso(emailRaw: string): AuthResult {
  const email = emailRaw.trim().toLowerCase();
  const index = STAFF_ACCOUNTS.findIndex((a) => a.email === email);
  if (index < 0) return { ok: false, error: 'Enter a staff email above, then continue with SSO.' };
  return { ok: true, index };
}
