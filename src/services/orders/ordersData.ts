import type { IntakeItem, OrderExtra, OrderRow } from '@/types/orders';

export const ORDERS: OrderRow[] = [
  { id: 'MB-SELL-41982', mineral: 'Gold Concentrate', side: 'Sell', party: 'Rift Valley Minerals Ltd', qty: '18.4 kg', stage: 'Inspection & approval', days: 3, agent: 'FW', tier: 2 },
  { id: 'MB-BUY-38904', mineral: 'Platinum Sponge', side: 'Buy', party: 'Athi River Refinery Ltd', qty: '42 kg', stage: 'Agent visit', days: 1, agent: 'JO', tier: 3 },
  { id: 'MB-SELL-41903', mineral: 'Copper Cathode', side: 'Sell', party: 'Nyanza Smelting Ltd', qty: '64 t', stage: 'Agent visit', days: 2, agent: 'DK', tier: 3 },
  { id: 'MB-BUY-38217', mineral: 'Silver Bullion', side: 'Buy', party: 'Coast Bullion Partners', qty: '11,240 kg', stage: 'Custody transfer', days: 1, agent: 'GK', tier: 3 },
  { id: 'MB-SELL-41877', mineral: 'Gold Concentrate', side: 'Sell', party: 'Kilimapesa Mining Co-op', qty: '7.2 kg', stage: 'Pricing confirmation', days: 4, agent: 'AM', tier: 2 },
  { id: 'MB-SELL-41964', mineral: 'Tantalite (Coltan)', side: 'Sell', party: 'Kakamega Artisanal Group', qty: '2.8 t', stage: 'Verification', days: 6, agent: 'LA', tier: 1 },
  { id: 'MB-BUY-38871', mineral: 'Cobalt Hydroxide', side: 'Buy', party: 'Mombasa Metals Exchange', qty: '18 t', stage: 'Payment released', days: 5, agent: 'PN', tier: 3 },
  { id: 'MB-SELL-41940', mineral: 'Silver Bullion', side: 'Sell', party: 'Turkana Gold SACCO', qty: '640 kg', stage: 'Inspection & approval', days: 2, agent: 'SB', tier: 2 },
  { id: 'MB-BUY-38933', mineral: 'Gold Concentrate', side: 'Buy', party: 'Baringo Trading Co', qty: '24 kg', stage: 'Verification', days: 1, agent: 'RK', tier: 2 },
  { id: 'MB-SELL-41918', mineral: 'Lithium Spodumene', side: 'Sell', party: 'Samburu Aggregates', qty: '112 t', stage: 'Agent visit', days: 9, agent: 'DK', tier: 3 },
  { id: 'MB-BUY-38860', mineral: 'Tin Ingot', side: 'Buy', party: 'Eldoret Assay Holdings', qty: '36 t', stage: 'Pricing confirmation', days: 3, agent: 'AM', tier: 2 },
  { id: 'MB-SELL-41889', mineral: 'Platinum Sponge', side: 'Sell', party: 'Machakos Mining SME', qty: '11 kg', stage: 'Custody transfer', days: 1, agent: 'FW', tier: 2 },
];

export const ORDER_EXTRA: Record<string, OrderExtra> = {
  'MB-SELL-41982': { contact: 'Joseph Kiptoo', phone: '+254 722 418 003', done: 14, rate: '$63,800 / kg', value: '$1,174,000', origin: 'Kerio Valley site, Baringo', hub: 'Nairobi Zone 0', carrier: 'Sentinel Bonded Logistics · KBZ 744J', dest: 'MB vault A · Nairobi', lab: 'Sarova Assay Labs', escrow: 'ESC-2026-118842', opened: '04 Sep 2026', seal: 'KE-44219' },
  'MB-BUY-38904': { contact: 'Sarah Ochieng', phone: '+254 720 884 116', done: 51, rate: '$31,240 / kg', value: '$1,312,080', origin: 'MB vault A · Nairobi', hub: 'Nairobi Zone 0', carrier: 'Zawadi Secure Freight · KCB 209M', dest: 'Athi River refinery', lab: 'Sarova Assay Labs', escrow: 'ESC-2026-118901', opened: '07 Sep 2026', seal: 'KE-44301' },
  'MB-SELL-41903': { contact: 'Victor Barasa', phone: '+254 727 811 550', done: 22, rate: '$9,180 / t', value: '$587,520', origin: 'Nyanza smelter, Kisumu', hub: 'Kisumu Lakeside Hub', carrier: 'Zawadi Secure Freight · KDA 118K', dest: 'MB vault B · Nairobi', lab: 'Rift Analytical Services', escrow: 'ESC-2026-118877', opened: '06 Sep 2026', seal: 'KE-44288' },
  'MB-BUY-38217': { contact: 'Amina Hassan', phone: '+254 720 118 447', done: 38, rate: '$1,128 / kg', value: '$12,678,720', origin: 'MB vault A · Nairobi', hub: 'Mombasa Port Hub', carrier: 'Sentinel Bonded Logistics · KBX 552T', dest: 'Coast Bullion vault, Mombasa', lab: 'Coastal Metals Lab', escrow: 'ESC-2026-118804', opened: '02 Sep 2026', seal: 'KE-44190' },
  'MB-SELL-41877': { contact: 'Peter Mutiso', phone: '+254 701 338 664', done: 6, rate: '$59,200 / kg', value: '$426,240', origin: 'Kilimapesa site, Narok', hub: 'Nairobi Zone 0', carrier: 'Highland Armoured Transit · KCE 441P', dest: 'MB vault A · Nairobi', lab: 'Sarova Assay Labs', escrow: 'ESC-2026-118790', opened: '03 Sep 2026', seal: 'KE-44166' },
  'MB-SELL-41964': { contact: 'Mary Wekesa', phone: '+254 715 990 221', done: 3, rate: '$46,900 / t', value: '$131,320', origin: 'Kakamega group site', hub: 'Kisumu Lakeside Hub', carrier: 'Unassigned', dest: 'MB vault B · Nairobi', lab: 'Rift Analytical Services', escrow: 'ESC-2026-118920', opened: '05 Sep 2026', seal: '—' },
  'MB-BUY-38871': { contact: 'Ibrahim Noor', phone: '+254 733 442 907', done: 27, rate: '$34,100 / t', value: '$613,800', origin: 'MB vault B · Nairobi', hub: 'Mombasa Port Hub', carrier: 'Zawadi Secure Freight · KBG 771R', dest: 'MMEX yard, Mombasa', lab: 'Coastal Metals Lab', escrow: 'ESC-2026-118812', opened: '06 Sep 2026', seal: 'KE-44222' },
  'MB-SELL-41940': { contact: 'Daniel Lokorio', phone: '+254 714 220 118', done: 9, rate: '$1,046 / kg', value: '$669,440', origin: 'Turkana SACCO store, Lodwar', hub: 'Nairobi Zone 0', carrier: 'Sentinel Bonded Logistics · KBZ 903L', dest: 'MB vault A · Nairobi', lab: 'Sarova Assay Labs', escrow: 'ESC-2026-118888', opened: '07 Sep 2026', seal: 'KE-44295' },
  'MB-BUY-38933': { contact: 'Nelson Kemboi', phone: '+254 722 664 018', done: 11, rate: '$68,450 / kg', value: '$1,642,800', origin: 'MB vault A · Nairobi', hub: 'Nairobi Zone 0', carrier: 'Unassigned', dest: 'Baringo Trading store, Kabarnet', lab: 'Sarova Assay Labs', escrow: 'ESC-2026-118931', opened: '10 Sep 2026', seal: '—' },
  'MB-SELL-41918': { contact: 'Lydia Lemuya', phone: '+254 701 552 774', done: 7, rate: '$1,140 / t', value: '$127,680', origin: 'Samburu pit, Archers Post', hub: 'Nairobi Zone 0', carrier: 'Highland Armoured Transit · KCE 118D', dest: 'MB vault B · Nairobi', lab: 'Rift Analytical Services', escrow: 'ESC-2026-118841', opened: '01 Sep 2026', seal: 'KE-44120' },
  'MB-BUY-38860': { contact: 'Esther Njeri', phone: '+254 711 908 220', done: 11, rate: '$32,600 / t', value: '$1,173,600', origin: 'MB vault B · Nairobi', hub: 'Nairobi Zone 0', carrier: 'Zawadi Secure Freight · KDA 660F', dest: 'Eldoret assay holdings', lab: 'Rift Analytical Services', escrow: 'ESC-2026-118798', opened: '04 Sep 2026', seal: 'KE-44172' },
  'MB-SELL-41889': { contact: 'Esther Njeri', phone: '+254 711 908 220', done: 11, rate: '$28,900 / kg', value: '$317,900', origin: 'Machakos site', hub: 'Nairobi Zone 0', carrier: 'Sentinel Bonded Logistics · KBZ 441C', dest: 'MB vault A · Nairobi', lab: 'Sarova Assay Labs', escrow: 'ESC-2026-118760', opened: '29 Aug 2026', seal: 'KE-44098' },
};

export const STAGE_DESC: Array<[string, string]> = [
  ['KYC + counterparty checks cleared', 'Verification of tier documents and counterparty standing'],
  ['Desk locked rate', 'Desk confirms the rate the order settles against'],
  ['Agent dispatched to the seller', 'Field agent visits the site to see the goods'],
  ['Agent weighed, tested and approved', 'On-site check against the declared quantity and grade'],
  ['Funds released to the seller', 'Seller is paid before the goods leave the site'],
  ['Sealed, packed and moved to the vault', 'Agent seals the parcel and hands it to the bonded carrier'],
];

export const INTAKE: IntakeItem[] = [
  { id: 'MB-INT-2209', party: 'Nyanza Smelting Ltd', mineral: 'Copper Cathode', qty: '64 t', grade: 'Grade A · 99.95% Cu', rate: '$9,180 / t', suggested: '$587,520', docs: ['Export permit EP-KE-88412', 'Mining lease ML-KE-33180', 'KYB pack 2026'], photos: '4 photos' },
  { id: 'MB-INT-2211', party: 'Athi River Refinery Ltd', mineral: 'Platinum Sponge', qty: '42 kg', grade: 'Sponge · 99.9% Pt', rate: '$31,240 / kg', suggested: '$1,312,080', docs: ['Import permit IP-KE-11209', 'KYB pack 2026'], photos: '6 photos' },
  { id: 'MB-INT-2214', party: 'Mombasa Metals Exchange', mineral: 'Cobalt Hydroxide', qty: '18 t', grade: '20.5% Co content', rate: '$31,400 / t', suggested: '$565,200', docs: ['Export permit EP-KE-77301', 'Mining lease ML-KE-29840', 'Bonded store licence'], photos: '3 photos' },
  { id: 'MB-INT-2216', party: 'Samburu Aggregates', mineral: 'Lithium Spodumene', qty: '112 t', grade: '5.8% Li2O', rate: '$1,140 / t', suggested: '$127,680', docs: ['Export permit EP-KE-90221', 'KYB pack 2026'], photos: '5 photos' },
];
