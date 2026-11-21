export type AuthStage = 'login' | 'otp' | 'app' | 'locked' | 'out';

export interface StaffAccount {
  name: string;
  role: string;
  initials: string;
  email: string;
  /** Demo-only credential shown in the design's "staff test credentials" panel. */
  demoPassword: string;
  scope: string;
}
