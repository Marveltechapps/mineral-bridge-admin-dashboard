export type AuthStage = 'login' | 'otp' | 'app' | 'locked' | 'out';

export interface StaffAccount {
  name: string;
  role: string;
  initials: string;
  email: string;
  /** Unused for live sign-in. Kept empty so a password is never stored in the dashboard. */
  demoPassword: string;
  scope: string;
}
