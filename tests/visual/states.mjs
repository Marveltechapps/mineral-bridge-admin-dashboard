/**
 * Matching states for the visual diff: `original` is a setState patch for the
 * design component, `route` (+ optional `react` store patch) the React equivalent.
 */
const app = (nav, extra = {}) => ({ auth: 'app', nav, ...extra });

export const STATES = [
  { name: 'login', original: { auth: 'login' }, route: '/login', stage: 'login', viewportOnly: true },
  { name: 'otp', original: { auth: 'otp' }, route: '/verify', stage: 'otp', viewportOnly: true },
  { name: 'locked', original: { auth: 'locked' }, route: '/locked', stage: 'locked', viewportOnly: true },
  { name: 'signed-out', original: { auth: 'out' }, route: '/signed-out', stage: 'out', viewportOnly: true },
  { name: 'overview', original: app('overview'), route: '/overview' },
];
STATES.push(
  { name: 'orders-list', original: app('orders', { ordersTab: 'list', orderId: null }), route: '/orders' },
  { name: 'order-detail', original: app('orders', { ordersTab: 'list', orderId: 'MB-SELL-41982' }), route: '/orders/MB-SELL-41982' },
  { name: 'order-detail-buy', original: app('orders', { ordersTab: 'list', orderId: 'MB-BUY-38217' }), route: '/orders/MB-BUY-38217' },
  { name: 'orders-intake', original: app('orders', { ordersTab: 'intake', orderId: null }), route: '/orders/intake' },
);
STATES.push(
  { name: 'vault-list', original: app('vault', { lotId: null }), route: '/vault' },
  { name: 'lot-catalog', original: app('vault', { lotId: 'MBV-2026-0417', allocMode: 'catalog' }), route: '/vault/MBV-2026-0417', react: { allocMode: 'catalog' } },
  { name: 'lot-auction', original: app('vault', { lotId: 'MBV-2026-0408', allocMode: 'auction' }), route: '/vault/MBV-2026-0408', react: { allocMode: 'auction' } },
  { name: 'lot-reserve', original: app('vault', { lotId: 'MBV-2026-0402', allocMode: 'reserve' }), route: '/vault/MBV-2026-0402', react: { allocMode: 'reserve' } },
  { name: 'listings', original: app('listings', { listingId: null }), route: '/listings' },
  { name: 'listing-detail', original: app('listings', { listingId: 'MBL-2026-0107' }), route: '/listings/MBL-2026-0107' },
  { name: 'listing-edit', original: app('listings', { listingId: 'MBL-2026-0101', editing: { listingCfg: true } }), route: '/listings/MBL-2026-0101', react: { editing: { listingCfg: true } } },
);
STATES.push(
  { name: 'pricing-rates', original: app('pricing', { pricingTab: 'rates' }), route: '/pricing' },
  { name: 'pricing-rates-cobalt', original: app('pricing', { pricingTab: 'rates', rateFocus: 'Cobalt Hydroxide', rateRange: '6M' }), route: '/pricing', react: { rateFocus: 'Cobalt Hydroxide', rateRange: '6M' } },
  { name: 'pricing-offers', original: app('pricing', { pricingTab: 'offers' }), route: '/pricing/offers' },
  { name: 'auctions-live', original: app('auctions', { auctionsTab: 'live', auctionView: null }), route: '/auctions' },
  { name: 'auctions-upcoming', original: app('auctions', { auctionsTab: 'upcoming', auctionView: null }), route: '/auctions/upcoming' },
  { name: 'auctions-ended', original: app('auctions', { auctionsTab: 'ended', auctionView: null }), route: '/auctions/ended' },
  { name: 'auction-create', original: app('auctions', { auctionView: 'create', createLot: 'MBV-2026-0402' }), route: '/auctions/create', react: { createLot: 'MBV-2026-0402' } },
  { name: 'auction-monitor', original: app('auctions', { auctionView: 'monitor', auctionId: 'AUC-2026-0226' }), route: '/auctions/live/AUC-2026-0226' },
  { name: 'auction-met', original: app('auctions', { auctionView: 'resolution', auctionId: 'AUC-2026-0214' }), route: '/auctions/ended/AUC-2026-0214' },
  { name: 'auction-not-met', original: app('auctions', { auctionView: 'resolution', auctionId: 'AUC-2026-0211' }), route: '/auctions/ended/AUC-2026-0211' },
);
STATES.push(
  { name: 'lc', original: app('lc', { lcSel: null, lcFilter: 'All LCs' }), route: '/lc' },
  { name: 'lc-selected', original: app('lc', { lcSel: 'LC-2026-0418' }), route: '/lc', react: { lcSel: 'LC-2026-0418' } },
  { name: 'lc-release', original: app('lc', { lcSel: 'LC-2026-0412', lcFilter: 'Issued' }), route: '/lc', react: { lcSel: 'LC-2026-0412', filters: { lcFilter: 'Issued' } } },
  { name: 'collab', original: app('collab', { negSel: null }), route: '/collab' },
  { name: 'collab-selected', original: app('collab', { negSel: 'NEG-2026-0231' }), route: '/collab', react: { negSel: 'NEG-2026-0231' } },
  { name: 'chain', original: app('chain'), route: '/chain' },
);
STATES.push(
  { name: 'users-list', original: app('users', { usersTab: 'list', userId: null }), route: '/users' },
  { name: 'users-tiers', original: app('users', { usersTab: 'tiers', userId: null }), route: '/users/tiers' },
  { name: 'user-detail', original: app('users', { usersTab: 'list', userId: 'Ibrahim Noor' }), route: '/users/Ibrahim%20Noor' },
  { name: 'user-detail-rejected', original: app('users', { usersTab: 'list', userId: 'Grace Cheruiyot' }), route: '/users/Grace%20Cheruiyot' },
  { name: 'kyc', original: app('verification', { verTab: 'kyc' }), route: '/verification' },
  { name: 'kyc-closed', original: app('verification', { verTab: 'kyc', kycOpen: null }), route: '/verification', react: { kycOpen: null } },
  { name: 'expiry', original: app('verification', { verTab: 'expiry' }), route: '/verification/expiry' },
  { name: 'disputes', original: app('disputes', { disputeId: null }), route: '/disputes' },
  { name: 'dispute-detail', original: app('disputes', { disputeId: 'DSP-2026-0071' }), route: '/disputes/DSP-2026-0071' },
);
STATES.push(
  { name: 'academy-cms', original: app('academy', { academyTab: 'cms' }), route: '/academy' },
  { name: 'academy-analytics', original: app('academy', { academyTab: 'analytics' }), route: '/academy/analytics' },
  { name: 'marketing', original: app('marketing'), route: '/marketing' },
  { name: 'partners', original: app('partners'), route: '/partners' },
  { name: 'support-tickets', original: app('support', { supportTab: 'tickets' }), route: '/support' },
  { name: 'support-calls', original: app('support', { supportTab: 'calls' }), route: '/support/calls' },
  { name: 'audit', original: app('audit'), route: '/audit' },
  { name: 'financial', original: app('financial'), route: '/financial' },
  { name: 'analytics', original: app('analytics'), route: '/analytics' },
  { name: 'settings-roles', original: app('settings', { settingsTab: 'roles' }), route: '/settings' },
  { name: 'settings-roles-edit', original: app('settings', { settingsTab: 'roles', editing: { roles: true } }), route: '/settings', react: { editing: { roles: true } } },
  { name: 'settings-platform', original: app('settings', { settingsTab: 'platform' }), route: '/settings/platform' },
  { name: 'settings-btc', original: app('settings', { settingsTab: 'btc' }), route: '/settings/btc' },
  { name: 'settings-btc-edit', original: app('settings', { settingsTab: 'btc', editing: { btc: true } }), route: '/settings/btc', react: { editing: { btc: true } } },
  { name: 'profile', original: app('profile'), route: '/profile' },
  { name: 'profile-edit', original: app('profile', { editing: { profile: true } }), route: '/profile', react: { editing: { profile: true } } },
);
STATES.push(
  { name: 'overlay-avatar', original: app('overview', { avatarOpen: true }), route: '/overview', react: { avatarOpen: true }, viewportOnly: true },
  { name: 'overlay-bell', original: app('overview', { bellOpen: true }), route: '/overview', react: { bellOpen: true }, viewportOnly: true },
  {
    name: 'overlay-drawer',
    original: app('orders', { drawer: { title: 'New order', sub: 'Desk-entered order. Sell orders start at Verification and follow the agent-visit flow.', fields: [['SIDE', 'Sell — MB buys into vault'], ['COUNTERPARTY', '', 'Search a verified account'], ['MINERAL', 'Gold Concentrate'], ['DECLARED QUANTITY', '', 'e.g. 18.4 kg'], ['ASSIGNED AGENT', 'F. Wanjiru'], ['DESK NOTE', '', '', 'area']], cta: 'Create order', done: 'x', draft: 'y' } }),
    route: '/orders',
    react: { drawer: { title: 'New order', sub: 'Desk-entered order. Sell orders start at Verification and follow the agent-visit flow.', fields: [{ label: 'SIDE', value: 'Sell — MB buys into vault' }, { label: 'COUNTERPARTY', hint: 'Search a verified account' }, { label: 'MINERAL', value: 'Gold Concentrate' }, { label: 'DECLARED QUANTITY', hint: 'e.g. 18.4 kg' }, { label: 'ASSIGNED AGENT', value: 'F. Wanjiru' }, { label: 'DESK NOTE', kind: 'area' }], cta: 'Create order', done: 'x', draft: 'y' } },
    viewportOnly: true,
  },
  { name: 'login-creds', original: { auth: 'login', credsOpen: true }, route: '/login', stage: 'login', session: { credsOpen: true }, viewportOnly: true },
  { name: 'login-error', original: { auth: 'login', authError: 'No staff account matches that email.' }, route: '/login', stage: 'login', session: { authError: 'No staff account matches that email.' }, viewportOnly: true },
);
