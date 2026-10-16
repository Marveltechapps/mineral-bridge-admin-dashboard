export const MODULES = ['Orders', 'Vault', 'Pricing', 'Auctions', 'Users', 'Compliance', 'Content', 'Financial', 'Settings'] as const;

/** Access level per module: 0 none, 1 view, 2 edit. */
export const ROLES: Array<{ name: string; desc: string; access: number[]; seats: number }> = [
  { name: 'CEO / Super Admin', desc: 'Full platform access', access: [2, 2, 2, 2, 2, 2, 2, 2, 2], seats: 2 },
  { name: 'Trading Desk Manager', desc: 'Prices consignments, runs the vault', access: [2, 2, 2, 2, 1, 1, 0, 1, 0], seats: 3 },
  { name: 'Compliance Officer', desc: 'KYC, documents, disputes', access: [1, 1, 0, 1, 1, 2, 0, 1, 0], seats: 2 },
  { name: 'Content Manager', desc: 'Academy and marketing', access: [0, 0, 0, 0, 0, 0, 2, 0, 0], seats: 2 },
  { name: 'Support Agent', desc: 'Tickets, read-only records', access: [1, 0, 0, 0, 1, 0, 0, 0, 0], seats: 6 },
  { name: 'Data Entry Clerk', desc: 'Vault intake, account creation', access: [1, 2, 0, 0, 1, 0, 0, 0, 0], seats: 4 },
];

export const PLATFORM_SETTINGS = [
  { label: 'Instant estimate tolerance', desc: 'Variance allowed before a firm offer needs desk approval', value: '±3.0%' },
  { label: 'Assay variance flag threshold', desc: 'Weight or grade variance that opens an exception', value: '3.0%' },
  { label: 'Firm offer validity', desc: 'How long a seller has to accept', value: '48 hours' },
  { label: 'KYC review SLA', desc: 'Target time to first decision', value: '48 hours' },
  { label: 'Document expiry escalation', desc: 'Days before expiry that a document enters the compliance queue', value: '30 days' },
  { label: 'Default bid increment', desc: 'Applied unless overridden per auction', value: '1.0% of starting bid' },
];

export const COUNTRIES: Array<{ name: string; code: string; reg: string; rail: string; limit: string; enabled: boolean }> = [
  { name: 'Kenya', code: 'KE', reg: 'Permitted · VASP licence', rail: 'Lightning + on-chain', limit: '$500,000', enabled: true },
  { name: 'Tanzania', code: 'TZ', reg: 'Pending regulator review', rail: 'On-chain only', limit: '$100,000', enabled: false },
  { name: 'Uganda', code: 'UG', reg: 'Permitted · sandbox', rail: 'On-chain only', limit: '$150,000', enabled: false },
  { name: 'Rwanda', code: 'RW', reg: 'Permitted · VASP licence', rail: 'Lightning + on-chain', limit: '$250,000', enabled: true },
  { name: 'DR Congo', code: 'CD', reg: 'Restricted', rail: 'On-chain only', limit: '$50,000', enabled: false },
  { name: 'Ghana', code: 'GH', reg: 'Permitted · sandbox', rail: 'On-chain only', limit: '$200,000', enabled: true },
  { name: 'Nigeria', code: 'NG', reg: 'Permitted · SEC registration', rail: 'On-chain only', limit: '$250,000', enabled: false },
  { name: 'South Africa', code: 'ZA', reg: 'Permitted · FSCA licence', rail: 'Lightning + on-chain', limit: '$750,000', enabled: true },
  { name: 'Zambia', code: 'ZM', reg: 'Pending regulator review', rail: '—', limit: '—', enabled: false },
  { name: 'Ethiopia', code: 'ET', reg: 'Prohibited', rail: '—', limit: '—', enabled: false },
  { name: 'United Arab Emirates', code: 'AE', reg: 'Permitted · VARA licence', rail: 'Lightning + on-chain', limit: '$2,000,000', enabled: true },
  { name: 'Switzerland', code: 'CH', reg: 'Permitted · FINMA', rail: 'Lightning + on-chain', limit: '$2,000,000', enabled: true },
];
