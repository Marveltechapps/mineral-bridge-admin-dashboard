/**
 * Backend endpoints the console would call in production. The current build
 * runs on bundled demo data (VITE_API_BASE_URL empty), so none of these are
 * requested yet — they document the integration surface for each screen.
 */
export const ENDPOINTS = {
  auth: {
    signIn: '/auth/sign-in',
    sso: '/auth/sso/start',
    verifyOtp: '/auth/otp/verify',
    resendOtp: '/auth/otp/resend',
    unlock: '/auth/unlock',
    signOut: '/auth/sign-out',
    passwordReset: '/auth/password-reset',
  },
  orders: {
    list: '/orders',
    detail: (id: string) => `/orders/${id}`,
    advanceStage: (id: string) => `/orders/${id}/advance`,
    flag: (id: string) => `/orders/${id}/exceptions`,
    reassign: (id: string) => `/orders/${id}/assignee`,
    message: (id: string) => `/orders/${id}/messages`,
    intake: '/orders/intake',
    firmOffer: (id: string) => `/orders/intake/${id}/offer`,
    exportCsv: '/orders/export',
  },
  vault: {
    lots: '/vault/lots',
    lot: (id: string) => `/vault/lots/${id}`,
    allocate: (id: string) => `/vault/lots/${id}/allocation`,
  },
  listings: { list: '/listings', detail: (id: string) => `/listings/${id}` },
  catalog: {
    hierarchy: '/catalog/hierarchy',
    form: (slug: string) => `/catalog/forms/${slug}`,
  },
  pricing: { rates: '/pricing/rates', override: (key: string) => `/pricing/rates/${key}/override`, offers: '/pricing/offers' },
  auctions: { list: '/auctions', detail: (id: string) => `/auctions/${id}`, bids: (id: string) => `/auctions/${id}/bids` },
  lc: { list: '/letters-of-credit', detail: (id: string) => `/letters-of-credit/${id}`, release: (id: string) => `/letters-of-credit/${id}/release` },
  collab: { negotiations: '/negotiations', contracts: '/contracts' },
  chain: { events: '/chain/events', anchor: '/chain/anchor', verifyPassport: '/chain/passports/verify' },
  users: { list: '/users', detail: (id: string) => `/users/${id}`, tierRequests: '/users/tier-requests' },
  compliance: { kyc: '/compliance/kyc', documents: '/compliance/documents' },
  disputes: { list: '/disputes', detail: (id: string) => `/disputes/${id}` },
  academy: { courses: '/academy/courses', analytics: '/academy/analytics' },
  marketing: { banners: '/marketing/banners' },
  partners: { list: '/partners' },
  support: { tickets: '/support/tickets', calls: '/support/calls' },
  audit: { log: '/audit-log', export: '/audit-log/export' },
  financial: { ledger: '/settlements', statement: '/settlements/statement' },
  analytics: { summary: '/analytics/summary' },
  settings: { roles: '/settings/roles', platform: '/settings/platform', btc: '/settings/btc' },
  profile: { me: '/me', sessions: '/me/sessions' },
} as const;
