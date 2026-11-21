export const navigation = [{ label: 'Samples', path: '/samples' }] as const;

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
  inspections: ['Inspections', 'Mineral Bridge inspection and SGS testing for sell requests'],
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
