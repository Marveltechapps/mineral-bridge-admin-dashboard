import type { IconName } from './icons';

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
