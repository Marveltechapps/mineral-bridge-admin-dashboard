import type { ModuleId } from './nav';

/** Central route table so links never hard-code path strings. */
export const ROUTES = {
  login: '/login',
  verify: '/verify',
  locked: '/locked',
  signedOut: '/signed-out',

  overview: '/overview',
  orders: '/orders',
  ordersIntake: '/orders/intake',
  order: (id: string) => `/orders/${encodeURIComponent(id)}`,
  vault: '/vault',
  lot: (id: string) => `/vault/${encodeURIComponent(id)}`,
  listings: '/listings',
  listing: (id: string) => `/listings/${encodeURIComponent(id)}`,
  pricing: '/pricing',
  pricingOffers: '/pricing/offers',
  auctions: '/auctions',
  auctionsUpcoming: '/auctions/upcoming',
  auctionsEnded: '/auctions/ended',
  auctionCreate: '/auctions/create',
  auctionMonitor: (id: string) => `/auctions/live/${encodeURIComponent(id)}`,
  auctionResolution: (id: string) => `/auctions/ended/${encodeURIComponent(id)}`,
  lc: '/lc',
  collab: '/collab',
  chain: '/chain',
  users: '/users',
  usersTiers: '/users/tiers',
  user: (id: string) => `/users/${encodeURIComponent(id)}`,
  verification: '/verification',
  verificationExpiry: '/verification/expiry',
  disputes: '/disputes',
  dispute: (id: string) => `/disputes/${encodeURIComponent(id)}`,
  academy: '/academy',
  academyAnalytics: '/academy/analytics',
  marketing: '/marketing',
  partners: '/partners',
  support: '/support',
  supportCalls: '/support/calls',
  audit: '/audit',
  financial: '/financial',
  analytics: '/analytics',
  settings: '/settings',
  settingsPlatform: '/settings/platform',
  settingsBtc: '/settings/btc',
  profile: '/profile',
} as const;

export const MODULE_ROOT: Record<ModuleId, string> = {
  overview: ROUTES.overview,
  orders: ROUTES.orders,
  vault: ROUTES.vault,
  listings: ROUTES.listings,
  pricing: ROUTES.pricing,
  auctions: ROUTES.auctions,
  lc: ROUTES.lc,
  collab: ROUTES.collab,
  chain: ROUTES.chain,
  users: ROUTES.users,
  verification: ROUTES.verification,
  disputes: ROUTES.disputes,
  academy: ROUTES.academy,
  marketing: ROUTES.marketing,
  partners: ROUTES.partners,
  support: ROUTES.support,
  audit: ROUTES.audit,
  financial: ROUTES.financial,
  analytics: ROUTES.analytics,
  settings: ROUTES.settings,
  profile: ROUTES.profile,
};

/** Resolves the active module from a pathname (first segment). */
export function moduleFromPath(pathname: string): ModuleId {
  const seg = pathname.split('/')[1] as ModuleId | '';
  return seg && seg in MODULE_ROOT ? seg : 'overview';
}
