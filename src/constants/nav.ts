import type { IconName } from './icons';

export const navigation = [{ label: 'Samples', path: '/samples' }] as const;

export type ModuleId =
  | 'overview'
  | 'orders'
  | 'vault'
  | 'listings'
  | 'pricing'
  | 'auctions'
  | 'lc'
  | 'collab'
  | 'chain'
  | 'users'
  | 'verification'
  | 'disputes'
  | 'academy'
  | 'marketing'
  | 'partners'
  | 'support'
  | 'audit'
  | 'financial'
  | 'analytics'
  | 'settings'
  | 'profile';

export interface NavItem {
  id: ModuleId;
  label: string;
  icon: IconName;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'TRADING',
    items: [
      { id: 'overview', label: 'Overview', icon: 'grid' },
      { id: 'orders', label: 'Orders', icon: 'orders', badge: '184' },
      { id: 'vault', label: 'Vault & Inventory', icon: 'vault' },
      { id: 'listings', label: 'Catalog Listings', icon: 'box', badge: '9' },
      { id: 'pricing', label: 'Pricing & Rates', icon: 'pricing', badge: '6' },
      { id: 'auctions', label: 'Auctions', icon: 'auctions', badge: '7' },
      { id: 'lc', label: 'LC & Payments', icon: 'lc', badge: '4' },
    ],
  },
  {
    label: 'TRADE NETWORK',
    items: [
      { id: 'collab', label: 'Collaboration', icon: 'collab', badge: '23' },
      { id: 'chain', label: 'Blockchain Monitor', icon: 'chain' },
    ],
  },
  {
    label: 'PEOPLE & TRUST',
    items: [
      { id: 'users', label: 'Users & Accounts', icon: 'users' },
      { id: 'verification', label: 'Verification & Compliance', icon: 'shield', badge: '27' },
      { id: 'disputes', label: 'Disputes & Resolution', icon: 'dispute', badge: '5' },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { id: 'academy', label: 'Academy', icon: 'academy' },
      { id: 'marketing', label: 'Marketing', icon: 'marketing' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { id: 'partners', label: 'Partners & Logistics', icon: 'partners' },
      { id: 'support', label: 'Enquiries & Support', icon: 'support', badge: '12' },
      { id: 'audit', label: 'Audit Log', icon: 'audit' },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { id: 'financial', label: 'Financial & Reporting', icon: 'financial' },
      { id: 'analytics', label: 'Analytics', icon: 'analytics' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings', icon: 'settings' },
      { id: 'profile', label: 'Profile', icon: 'profile' },
    ],
  },
];

/** Page title and subtitle shown in the header for each module. */
export const PAGE_TITLES: Record<ModuleId, [string, string]> = {
  overview: ['Overview', 'Trading desk snapshot · Saturday 12 September 2026'],
  orders: ['Orders', 'One pipeline, both sides · 184 active orders'],
  vault: ['Vault & Inventory', '312 lots in custody · $46.31M realisable'],
  listings: ['Catalog Listings', 'Minerals on sale at a fixed price · 9 live listings'],
  pricing: ['Pricing & Rates', 'Feeds instant estimates and firm offers'],
  auctions: ['Auctions', '7 live · 4 upcoming · 38 ended this quarter'],
  users: ['Users & Accounts', '8,412 accounts · 63 pending tier changes'],
  verification: ['Verification & Compliance', '27 in KYC queue · 9 documents expiring'],
  disputes: ['Disputes & Resolution', '5 open · median resolution 3.2 days'],
  academy: ['Academy', '6 categories · 41 lessons · 2 certified tracks'],
  marketing: ['Marketing', 'Homepage banners and promotional content'],
  partners: ['Partners & Logistics', '18 partners across 3 types'],
  support: ['Enquiries & Support', '12 open tickets · 48 calls logged this week'],
  audit: ['Audit Log', 'Every admin action, timestamped and attributed'],
  financial: ['Financial & Reporting', 'Settlements, escrow and statements'],
  analytics: ['Analytics', 'Platform performance · last 90 days'],
  lc: ['LC & Payments', 'Letters of credit across buy and sell orders · 10 Oct 2026'],
  collab: ['Collaboration', 'Miner–trader negotiations and signed contracts'],
  chain: ['Blockchain Monitor', 'Mineral passports, custody events and Bitcoin anchoring'],
  settings: ['Settings', 'Roles, access and platform configuration'],
  profile: ['Profile', 'Your admin account'],
};

/** Icon names drawn by the console's icon set (see modules/console/components/Icon). */
export type ConsoleIconName =
  | 'grid' | 'cart' | 'box' | 'gavel' | 'users' | 'chat' | 'bell' | 'layers' | 'shield' | 'truck' | 'card'
  | 'undo' | 'doc' | 'list' | 'sliders' | 'search' | 'sun' | 'moon' | 'x' | 'arrowL' | 'check' | 'logout';

export interface ConsoleNavItem {
  /** Screen key used by the console engine, also the first URL segment. */
  key: string;
  label: string;
  icon: ConsoleIconName;
  path: string;
}

export interface ConsoleNavGroup {
  label: string;
  items: readonly ConsoleNavItem[];
}

const item = (key: string, label: string, icon: ConsoleIconName): ConsoleNavItem => ({ key, label, icon, path: '/' + key });

/** Sidebar of the Mineral Bridge admin console, grouped as in the design. */
export const consoleNavigation: readonly ConsoleNavGroup[] = [
  { label: 'OPERATIONS', items: [item('overview', 'Overview', 'grid'), item('orders', 'All orders', 'list'), item('buy', 'Buy orders', 'cart'), item('sell', 'Sell requests', 'box'), item('auctions', 'Auctions', 'gavel')] },
  { label: 'PEOPLE', items: [item('customers', 'Customers & KYC', 'users'), item('support', 'Support', 'chat'), item('notifications', 'Notifications', 'bell')] },
  { label: 'INVENTORY', items: [item('catalogue', 'Catalogue', 'layers'), item('inventory', 'Inventory & stock', 'box'), item('inspections', 'Inspections', 'shield'), item('logistics', 'Logistics', 'truck')] },
  { label: 'MONEY', items: [item('payments', 'Payments & payouts', 'card'), item('refunds', 'Refunds', 'undo')] },
  { label: 'RECORDS', items: [item('documents', 'Documents', 'doc'), item('audit', 'Audit log', 'list'), item('settings', 'Settings', 'sliders')] },
];

/** Header title and subtitle for each console screen. */
export const consoleTitles: Readonly<Record<string, readonly [string, string]>> = {
  overview: ['Overview', 'Everything waiting on Mineral Bridge right now'],
  orders: ['All orders', 'Buy orders, sell requests and auction purchases in one list'],
  buy: ['Buy orders', 'Direct and auction purchases across 15 steps'],
  sell: ['Sell requests', 'Seller submissions through inspection, payout and vault receipt'],
  auctions: ['Auctions', 'Live, upcoming and closed lots'],
  customers: ['Customers & KYC', 'Accounts, verification and suspensions'],
  support: ['Support', 'Customer conversations linked to records'],
  notifications: ['Notifications', 'Every message sent to customers, by channel'],
  catalogue: ['Catalogue', 'Lots listed for buyers'],
  inventory: ['Inventory & stock', 'What is on hand, reserved for orders and available to sell'],
  inspections: ['Inspections', 'Mineral Bridge inspection and third-party testing for sell requests'],
  logistics: ['Logistics', 'Shipments and partners'],
  payments: ['Payments & payouts', 'Incoming payments and seller payouts'],
  refunds: ['Refunds', 'Requests, approvals and receipts'],
  documents: ['Documents', 'Every issued document and its template'],
  audit: ['Audit log', 'Every action, by who and when'],
  settings: ['Settings', 'Platform rules, payment methods and admin users'],
};

export const CONSOLE_HOME = '/overview';
export const CONSOLE_SIGN_IN = '/signin';

export const isConsoleScreen = (key: string | undefined): key is string => !!key && Object.hasOwn(consoleTitles, key);

/** Console screen for a URL path: /<screen> or /<screen>/<order id>. Null for any other path. */
export function parseConsolePath(pathname: string): { nav: string; orderId: string | null } | null {
  const [nav, orderId] = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  return isConsoleScreen(nav) ? { nav, orderId: orderId || null } : null;
}

export const consolePath = (nav: string, orderId: string | null) => '/' + nav + (orderId ? '/' + encodeURIComponent(orderId) : '');
