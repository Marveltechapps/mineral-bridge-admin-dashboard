/* eslint-disable @typescript-eslint/no-explicit-any */
// Ported from the design file mb-admin-data.js. Behaviour and styles are kept as designed.
import { MBA } from './registry';

const H = 36e5, D = 864e5;
const CATS = [
  ['precious', 'Precious metals', [['gold', 'Gold'], ['silver', 'Silver'], ['platinum', 'Platinum']]],
  ['base', 'Base metals', [['copper', 'Copper'], ['bauxite', 'Aluminium / Bauxite'], ['nickel', 'Nickel'], ['zinc', 'Zinc'], ['lead', 'Lead'], ['tin', 'Tin']]],
  ['critical', 'Critical minerals', [['lithium', 'Lithium'], ['cobalt', 'Cobalt'], ['tantalum', 'Tantalum'], ['niobium', 'Niobium'], ['rare', 'Rare earth elements']]],
  ['industrial', 'Industrial minerals', [['quartz', 'Quartz'], ['graphite', 'Graphite'], ['mica', 'Mica'], ['feldspar', 'Feldspar'], ['limestone', 'Limestone']]],
  ['gems', 'Gemstones', [['diamonds', 'Diamonds'], ['emeralds', 'Emeralds'], ['rubies', 'Rubies'], ['sapphires', 'Sapphires']]]
];
const BT = { refinery: 'Refineries and smelters', house: 'International trading houses', industry: 'Manufacturing & industrial end-users', jewel: 'Jewelry manufacturers & artisans', investor: 'Retail investors & collectors', wholesale: 'B2B wholesalers' };
const ST = { asm: 'Artisanal & small-scale miners', industrial: 'Industrial mining companies', coop: 'Mining cooperatives', dealer: 'Licensed local dealers / brokers', exporter: 'International traders / exporters', scrap: 'Individual salvagers / scrap collectors' };
const NO_BIZ = ['investor', 'asm', 'scrap'];
const ROLES = [
  ['super', 'Super admin', 'Adaeze Okafor', 'adaeze@mineralbridge.com'],
  ['ops', 'Operations manager', 'Chiamaka Eze', 'chiamaka@mineralbridge.com'],
  ['trading', 'Trading desk', 'Tunde Adebayo', 'tunde@mineralbridge.com'],
  ['compliance', 'Compliance', 'Fatima Bello', 'fatima@mineralbridge.com'],
  ['inspection', 'Inspection coordinator', 'Emeka Balogun', 'emeka@mineralbridge.com'],
  ['finance', 'Finance', 'Ngozi Obi', 'ngozi@mineralbridge.com'],
  ['logistics', 'Logistics coordinator', 'Kelechi Nwosu', 'kelechi@mineralbridge.com'],
  ['catalogue', 'Catalogue manager', 'Ifeoma Uche', 'ifeoma@mineralbridge.com'],
  ['support', 'Support agent', 'Bola Adeyemi', 'bola@mineralbridge.com']
];
const PERMS = { ops: ['ops', 'remind'], trading: ['trading', 'auction', 'remind'], compliance: ['kyc', 'suspend', 'remind'], inspection: ['inspection', 'remind'], finance: ['finance', 'remind'], logistics: ['logistics', 'remind'], catalogue: ['catalogue'], support: ['support', 'remind'] };
const PERM_ROLE = { ops: 'Operations manager', trading: 'Trading desk', auction: 'Trading desk', kyc: 'Compliance', suspend: 'Compliance', inspection: 'Inspection coordinator', finance: 'Finance', logistics: 'Logistics coordinator', catalogue: 'Catalogue manager', support: 'Support agent', remind: 'an operations role', settings: 'Super admin', autobid: 'Super admin' };
// key, label, owner (cust | mb | lp | sgs), role, phase
const BUY = [
  ['placed', 'Order placed', 'cust', null, 0], ['accepted', 'Order accepted', 'mb', 'ops', 0],
  ['quote', 'Quotation issued', 'mb', 'trading', 1], ['quoteOk', 'Quotation accepted', 'cust', null, 1], ['confirmed', 'Price confirmed', 'mb', 'trading', 1],
  ['contract', 'E-contract signed by customer', 'cust', null, 2], ['contractMb', 'E-contract countersigned', 'mb', 'trading', 2],
  ['paid', 'Payment made', 'cust', null, 3], ['payOk', 'Payment confirmed', 'mb', 'finance', 3],
  ['assigned', 'Logistics partner assigned', 'lp', 'logistics', 4], ['picked', 'Picked up', 'lp', 'logistics', 4], ['transit', 'In transit', 'lp', 'logistics', 4],
  ['delivered', 'Delivered', 'lp', 'logistics', 5], ['receipt', 'Receipt confirmed', 'cust', null, 5], ['done', 'Order completed', 'mb', 'ops', 5]
].map(s => ({ key: s[0], label: s[1], owner: s[2], role: s[3], phase: s[4] }));
const SELL = [
  ['submitted', 'Sell request submitted', 'cust', null, 0], ['reviewed', 'Reviewed by operations', 'mb', 'ops', 0],
  ['quote', 'Price quotation issued', 'mb', 'trading', 1], ['quoteOk', 'Quotation accepted', 'cust', null, 1], ['confirmed', 'Price and terms confirmed', 'mb', 'trading', 1],
  ['contract', 'E-contract signed by seller', 'cust', null, 2], ['contractMb', 'E-contract countersigned', 'mb', 'trading', 2],
  ['form', 'Seller confirmation form', 'cust', null, 3], ['formOk', 'Details accepted', 'mb', 'ops', 3],
  ['schedule', 'Third-party inspection booked', 'mb', 'inspection', 4], ['inspect', 'Inspection carried out', 'sgs', 'inspection', 4],
  ['sgs', 'Inspection report and test certificate uploaded', 'sgs', 'inspection', 4], ['reportOk', 'Reports accepted', 'cust', null, 4], ['approved', 'Final approval', 'mb', 'ops', 4],
  ['payout', 'Payment released', 'mb', 'finance', 5],
  ['picked', 'Collected', 'lp', 'logistics', 6], ['transit', 'In transit to vault', 'lp', 'logistics', 6],
  ['received', 'Received at vault', 'mb', 'logistics', 7], ['done', 'Completed', 'mb', 'ops', 7]
].map(s => ({ key: s[0], label: s[1], owner: s[2], role: s[3], phase: s[4] }));
const BUY_PH = ['Order review', 'Price quotation', 'E-contract', 'Payment', 'Logistics', 'Delivery & completion'];
const SELL_PH = ['Submission & review', 'Price negotiation', 'E-contract', 'Seller confirmation form', 'Third-party inspection', 'Payment', 'Transportation', 'Received & completed'];
const HOLDS = {
  declined: { label: 'Quotation declined', owner: 'mb', role: 'trading' },
  discrepancy: { label: 'Delivery discrepancy', owner: 'mb', role: 'ops' },
  refund: { label: 'Refund requested', owner: 'mb', role: 'finance' },
  changes: { label: 'Changes requested', owner: 'cust', role: null },
  clarify: { label: 'Clarification requested', owner: 'mb', role: 'inspection' }
};
const OWNER = { cust: 'Customer', mb: 'Mineral Bridge', lp: 'Logistics partner', sgs: 'Inspection agency' };

const LOTS = [
  ['G-1041', 'gold', 'Gold Doré Bar', 'Doré bar', 12.5, 'kg', 1, 'Au 92.1%', 'SGS Lagos', 'SGS-NG-26-4471', 'Ilesha, Osun · Nigeria', 61400, 'listed', 4],
  ['G-1042', 'gold', 'Gold Bullion Bar', 'Bullion', 8, 'kg', 1, 'Au 99.99%', 'Bureau Veritas Accra', 'BV-GH-26-0912', 'Kumasi · Ghana', 75100, 'listed', 3],
  ['G-1043', 'gold', 'Gold Bars · 1 kg', 'Bars', 20, 'kg', 1, 'Au 99.5%', 'SGS Dubai', 'SGS-AE-26-1180', 'Dubai · UAE', 74300, 'listed', 3],
  ['G-1044', 'gold', 'Gold Biscuits · 100 g', 'Biscuits', 6, 'kg', 0.5, 'Au 99.9%', 'Intertek Johannesburg', 'ITK-ZA-26-3307', 'Johannesburg · South Africa', 74800, 'listed', 2],
  ['G-1045', 'gold', 'Alluvial Gold Dust', 'Dust', 4.2, 'kg', 0.5, 'Au 89.4%', 'SGS Lagos', 'SGS-NG-26-4502', 'Kebbi · Nigeria', 58100, 'listed', 3],
  ['G-1046', 'gold', 'Gold Concentrate', 'Concentrate', 18, 't', 2, '', '', '', 'Geita · Tanzania', 2900, 'listed', 1],
  ['G-1047', 'gold', 'Gold Grain', 'Grain', 1.4, 'kg', 0.5, 'Au 99.5%', 'SGS Lagos', 'SGS-NG-26-4519', 'Osogbo · Nigeria', 74800, 'listed', 2],
  ['G-1048', 'gold', 'Gold Doré Bar · Lot B', 'Doré bar', 0, 'kg', 1, 'Au 90.6%', 'SGS Lagos', 'SGS-NG-26-4390', 'Ilesha, Osun · Nigeria', 60200, 'sold out', 2],
  ['S-2011', 'silver', 'Silver Bars', 'Bars', 120, 'kg', 10, 'Ag 99.9%', 'SGS Lima', 'SGS-PE-26-0778', 'Arequipa · Peru', 940, 'listed', 2],
  ['S-2012', 'silver', 'Silver Bullion', 'Bullion', 20, 'kg', 5, 'Ag 99.95%', 'Alex Stewart International', 'ASI-MX-26-1204', 'Zacatecas · Mexico', 955, 'listed', 2],
  ['P-3011', 'platinum', 'Platinum Bars', 'Bars', 4, 'kg', 0.5, 'Pt 99.95%', 'SGS Johannesburg', 'SGS-ZA-26-0331', 'Rustenburg · South Africa', 32500, 'listed', 2],
  ['C-4011', 'copper', 'Copper Concentrate', 'Concentrate', 500, 't', 50, 'Cu 28.4%', 'SGS Lubumbashi', 'SGS-CD-26-2210', 'Katanga · DR Congo', 2700, 'listed', 2],
  ['C-4012', 'copper', 'Copper Cathode', 'Cathode', 95, 't', 25, 'Cu 99.99%', 'Alex Stewart International', 'ASI-ZM-26-0415', 'Copperbelt · Zambia', 9600, 'listed', 3],
  ['LI-5011', 'lithium', 'Spodumene Concentrate', 'Concentrate', 1000, 't', 100, 'Li₂O 6.0%', 'SGS Harare', 'SGS-ZW-26-0544', 'Bikita · Zimbabwe', 980, 'listed', 2],
  ['CO-5021', 'cobalt', 'Cobalt Hydroxide', 'Hydroxide', 160, 't', 20, 'Co 34%', 'SGS Lubumbashi', 'SGS-CD-26-2231', 'Kolwezi · DR Congo', 9800, 'listed', 2],
  ['TA-5031', 'tantalum', 'Coltan Concentrate', 'Concentrate', 10, 't', 1, 'Ta₂O₅ 30%', 'Alex Stewart Kigali', 'ASI-RW-26-0219', 'Rubaya · DR Congo', 48000, 'listed', 2],
  ['RE-5051', 'rare', 'Mixed Rare Earth Carbonate', 'Carbonate', 25, 't', 2, 'TREO 92%', 'SGS Mombasa', 'SGS-KE-26-0120', 'Kwale · Kenya', 11500, 'draft', 1],
  ['GR-6021', 'graphite', 'Flake Graphite', 'Flake', 300, 't', 20, 'C 94%', 'SGS Maputo', 'SGS-MZ-26-0187', 'Balama · Mozambique', 640, 'listed', 1],
  ['D-7011', 'diamonds', 'Rough Diamonds', 'Rough', 1200, 'ct', 50, 'Gem-quality mix', 'GIA Antwerp', 'KP-BW-26-00871', 'Orapa · Botswana', 410, 'listed', 3],
  ['E-7021', 'emeralds', 'Rough Emeralds', 'Rough', 3000, 'ct', 100, 'Medium green, AA', 'Gübelin Gem Lab', 'GGL-26-2214', 'Kagem · Zambia', 95, 'listed', 2],
  ['SA-7041', 'sapphires', 'Blue Sapphires', 'Rough', 2100, 'ct', 50, 'Royal blue, AA', 'GIA Bangkok', 'GIA-TH-26-5520', 'Ilakaka · Madagascar', 140, 'archived', 2]
];
// id, name, business, email, whatsapp, country, role, buyerType, sellerType, sign-in, kyc, status, joined days ago, channels
const CUS = [
  ['C-1001', 'Lukas Meier', 'Halden Refining AG', 'l.meier@haldenrefining.ch', '+41 79 412 0081', 'Switzerland', 'buyer', 'refinery', '', 'email', 'approved', 'active', 210, 'ew'],
  ['C-1002', 'Priya Raman', 'Arcadia Jewels Pvt Ltd', 'priya@arcadiajewels.in', '+91 98201 44317', 'India', 'buyer', 'jewel', '', 'whatsapp', 'approved', 'active', 160, 'wp'],
  ['C-1003', 'Omar Haddad', 'Northgate Trading FZE', 'omar@northgate-fze.ae', '+971 50 318 2290', 'UAE', 'both', 'house', 'exporter', 'email', 'approved', 'active', 305, 'ewp'],
  ['C-1004', 'Jana Weber', 'Volta Battery Materials GmbH', 'j.weber@volta-bm.de', '+49 151 2240 7781', 'Germany', 'buyer', 'industry', '', 'email', 'approved', 'active', 120, 'e'],
  ['C-1005', 'Wei Lin', '', 'wei.lin@gmail.com', '+65 9123 4471', 'Singapore', 'buyer', 'investor', '', 'whatsapp', 'approved', 'active', 88, 'wp'],
  ['C-1006', 'Pieter de Vries', 'Kestrel Metals BV', 'pieter@kestrelmetals.nl', '+31 6 4821 0093', 'Netherlands', 'buyer', 'wholesale', '', 'email', 'approved', 'active', 140, 'es'],
  ['C-1007', 'Mei Tan', 'Lumen Refining Pte Ltd', 'mei.tan@lumenrefining.sg', '+65 8812 0045', 'Singapore', 'buyer', 'refinery', '', 'email', 'approved', 'active', 260, 'ep'],
  ['C-2001', 'Adebola Ojo', 'Ilesha Miners Cooperative', 'ilesha.coop@gmail.com', '+234 803 412 7781', 'Nigeria', 'seller', '', 'coop', 'whatsapp', 'approved', 'active', 190, 'wp'],
  ['C-2002', 'Musa Danladi', '', 'musa.danladi@yahoo.com', '+234 806 220 1934', 'Nigeria', 'seller', '', 'asm', 'whatsapp', 'approved', 'active', 64, 'ws'],
  ['C-2003', 'Chanda Mwale', 'Copperbelt Exporters Ltd', 'chanda@copperbelt-exp.zm', '+260 97 742 0116', 'Zambia', 'seller', '', 'exporter', 'email', 'approved', 'active', 230, 'ew'],
  ['C-2004', 'Jean Habimana', 'Rubaya Minerals Trading', 'jean@rubayaminerals.cd', '+243 81 330 4471', 'DR Congo', 'seller', '', 'dealer', 'whatsapp', 'approved', 'active', 150, 'w'],
  ['C-2005', 'Danjuma Pam', 'Jos Tin Company Ltd', 'd.pam@jostin.ng', '+234 805 118 4409', 'Nigeria', 'seller', '', 'industrial', 'email', 'approved', 'active', 175, 'e'],
  ['C-2006', 'Funke Adeyemi', 'Osun Gold Cooperative', 'osungold.coop@gmail.com', '+234 802 771 0390', 'Nigeria', 'seller', '', 'coop', 'whatsapp', 'approved', 'active', 95, 'wp'],
  ['C-2007', 'Tendai Moyo', 'Bikita Lithium Mining (Pvt) Ltd', 'tendai@bikitalithium.co.zw', '+263 77 410 2286', 'Zimbabwe', 'seller', '', 'industrial', 'email', 'approved', 'active', 200, 'ep'],
  ['C-2008', 'Ali Hassan', 'Kwale Minerals Dealers', 'ali@kwaleminerals.co.ke', '+254 722 418 330', 'Kenya', 'seller', '', 'dealer', 'whatsapp', 'approved', 'active', 110, 'w'],
  ['C-2009', 'Neema Mollel', 'Geita Small Miners Group', 'geita.smallminers@gmail.com', '+255 754 220 918', 'Tanzania', 'seller', '', 'asm', 'whatsapp', 'approved', 'active', 140, 'ws'],
  ['C-2010', 'Patrice Mwamba', 'Kolwezi Cobalt SA', 'p.mwamba@kolwezicobalt.cd', '+243 99 812 3307', 'DR Congo', 'seller', '', 'industrial', 'email', 'approved', 'active', 250, 'e'],
  ['C-3001', 'Chidi Okeke', '', 'chidi.okeke@gmail.com', '+234 809 331 2207', 'Nigeria', 'seller', '', 'scrap', 'whatsapp', 'pending', 'active', 1, 'w'],
  ['C-3002', 'Ananya Gupta', '', 'ananya.gupta@outlook.com', '+91 99300 18842', 'India', 'buyer', 'investor', '', 'email', 'pending', 'active', 2, 'e'],
  ['C-3003', 'Karim Mansour', 'Sahara Gold Refinery SAE', 'karim@saharagold.eg', '+20 100 448 2219', 'Egypt', 'buyer', 'refinery', '', 'email', 'pending', 'active', 1, 'ep'],
  ['C-3004', 'Aline Uwase', 'Kivu Mining Cooperative', 'kivu.coop@gmail.com', '+250 788 412 006', 'Rwanda', 'seller', '', 'coop', 'whatsapp', 'requested', 'active', 4, 'w'],
  ['C-3005', 'Viktor Hale', 'Hale Bullion Traders', 'v.hale@halebullion.com', '+44 7700 900412', 'United Kingdom', 'buyer', 'wholesale', '', 'email', 'rejected', 'suspended', 30, 'e']
];
// id, cust, items [[lot, qty, entered]], stage, created h ago, h in stage, extra
const BUYS = [
  ['MB-ORD-26-10482', 'C-1001', [['G-1041', 2.5, '2,500 g']], 1, 2, 2],
  ['MB-ORD-26-10477', 'C-1002', [['G-1044', 1.5, '1.5 kg']], 2, 30, 9],
  ['MB-ORD-26-10471', 'C-1003', [['C-4012', 50, '50 t']], 3, 72, 26],
  ['MB-ORD-26-10466', 'C-1004', [['LI-5011', 200, '200,000 kg']], 3, 120, 30, { hold: 'declined' }],
  ['MB-ORD-26-10460', 'C-1005', [['G-1042', 2, '2 kg']], 6, 140, 5],
  ['MB-ORD-26-10455', 'C-1006', [['S-2011', 30, '30 kg']], 8, 190, 3, { method: 'Bank transfer' }],
  ['MB-ORD-26-10452', 'C-1007', [['P-3011', 1.5, '1,500 g']], 8, 200, 1, { method: 'Bitcoin' }],
  ['MB-ORD-26-10449', 'C-1001', [['G-1045', 1, '1 kg']], 9, 240, 50, { method: 'UPI', hold: 'refund' }],
  ['MB-ORD-26-10441', 'C-1003', [['C-4011', 100, '100 t']], 11, 320, 34, { method: 'Bank transfer', hold: 'refund' }],
  ['MB-ORD-26-10437', 'C-1002', [['E-7021', 400, '400 ct']], 13, 380, 40, { method: 'Net banking', hold: 'discrepancy' }],
  ['MB-ORD-26-10430', 'C-1005', [['G-1043', 3, '3 kg']], 14, 420, 6, { method: 'Bitcoin' }],
  ['MB-ORD-26-10425', 'C-1006', [['CO-5021', 40, '40 t']], 9, 260, 6, { method: 'Bank transfer', hold: 'refund' }],
  ['MB-ORD-26-10418', 'C-1004', [['GR-6021', 100, '100 t']], 15, 900, 400, { method: 'Bank transfer' }],
  ['MB-ORD-26-10412', 'C-1003', [['TA-5031', 2, '2 t']], 7, 150, 30],
  ['MB-ORD-26-10405', 'C-1001', [['G-1046', 4, '4,000 kg']], 1, 60, 50, { rejected: 'No test report on this lot yet — we can offer it once SGS testing is complete.' }],
  ['MB-ORD-26-10488', 'C-1007', [['P-3011', 0.5, '0.5 kg']], 7, 20, 20, { src: 'A-306', total: 16500 }],
  ['MB-ORD-26-10399', 'C-1003', [['C-4012', 25, '25 t']], 11, 210, 20, { src: 'A-302', total: 241000, method: 'Bank transfer' }]
];
// id, cust, [mineral, name, qty, unit, form, grade, photos, docs], stage, created h ago, h in stage, extra
const SELLS = [
  ['MB-SELL-26-20418', 'C-2001', ['gold', 'Alluvial gold dust', 3.2, 'kg', 'Dust', 'Au ~88%', 5, ['Mining licence ML-OS-2291', 'Cooperative registration']], 1, 6, 6],
  ['MB-SELL-26-20414', 'C-2002', ['gold', 'Gold doré', 1.8, 'kg', 'Doré bar', 'Au ~90%', 3, ['ASM permit NG-ASM-0412']], 1, 50, 22, { hold: 'changes' }],
  ['MB-SELL-26-20409', 'C-2003', ['copper', 'Copper concentrate', 120, 't', 'Concentrate', 'Cu 27%', 6, ['Export permit ZM-EX-4471', 'Mine assay sheet']], 2, 40, 14],
  ['MB-SELL-26-20402', 'C-2004', ['tantalum', 'Coltan concentrate', 4, 't', 'Concentrate', 'Ta₂O₅ 28%', 4, ['ICGLR certificate', 'Dealer licence']], 6, 160, 8],
  ['MB-SELL-26-20397', 'C-2005', ['tin', 'Cassiterite concentrate', 10, 't', 'Concentrate', 'Sn 66%', 5, ['Mining lease ML-PL-0812']], 8, 190, 10],
  ['MB-SELL-26-20391', 'C-2006', ['gold', 'Gold doré', 2.4, 'kg', 'Doré bar', 'Au ~91%', 4, ['Cooperative registration']], 9, 210, 16],
  ['MB-SELL-26-20386', 'C-2007', ['lithium', 'Spodumene concentrate', 300, 't', 'Concentrate', 'Li₂O 5.8%', 7, ['Mining licence ZW-ML-1180', 'Export permit ZW-EX-2207']], 10, 240, 26, { today: true }],
  ['MB-SELL-26-20380', 'C-2008', ['rare', 'Mixed rare earth carbonate', 6, 't', 'Carbonate', 'TREO ~90%', 4, ['Dealer licence KE-DL-551']], 12, 280, 30, { hold: 'clarify' }],
  ['MB-SELL-26-20374', 'C-2009', ['gold', 'Gold concentrate', 8, 't', 'Concentrate', 'Au 45 g/t', 3, ['ASM permit TZ-PML-0921']], 13, 300, 10],
  ['MB-SELL-26-20369', 'C-2003', ['copper', 'Copper cathode', 60, 't', 'Cathode', 'Cu 99.99%', 6, ['Export permit ZM-EX-4402', 'LME brand certificate']], 14, 330, 7],
  ['MB-SELL-26-20361', 'C-2001', ['gold', 'Alluvial gold dust', 1.1, 'kg', 'Dust', 'Au ~88%', 4, ['Mining licence ML-OS-2291']], 14, 350, 4],
  ['MB-SELL-26-20355', 'C-2010', ['cobalt', 'Cobalt hydroxide', 25, 't', 'Hydroxide', 'Co 33%', 5, ['Mining licence CD-PE-7710', 'Export permit CD-EX-1192']], 17, 400, 18],
  ['MB-SELL-26-20348', 'C-2006', ['gold', 'Gold doré', 1.6, 'kg', 'Doré bar', 'Au 91.2%', 4, ['Cooperative registration']], 19, 800, 500]
];
const SELL_REF = { gold: 60000, copper: 2700, tantalum: 48000, tin: 21000, lithium: 980, rare: 11500, cobalt: 9800, silver: 940, platinum: 32500 };
const SITES = { 'C-2001': 'Ilesha mine site, Osun State, Nigeria', 'C-2002': 'Zuru, Kebbi State, Nigeria', 'C-2003': 'Kitwe yard, Copperbelt, Zambia', 'C-2004': 'Rubaya depot, North Kivu, DR Congo', 'C-2005': 'Bukuru, Jos, Plateau State, Nigeria', 'C-2006': 'Iperindo site, Osun State, Nigeria', 'C-2007': 'Bikita mine, Masvingo, Zimbabwe', 'C-2008': 'Kwale depot, Kenya', 'C-2009': 'Geita, Tanzania', 'C-2010': 'Kolwezi plant, Lualaba, DR Congo' };
const KYC = [
  ['MB-KYC-26-3127', 'C-3003', 'Driving licence', 5, 'pending'],
  ['MB-KYC-26-3125', 'C-3001', 'National ID', 9, 'pending'],
  ['MB-KYC-26-3124', 'C-3002', 'Passport', 20, 'pending'],
  ['MB-KYC-26-3119', 'C-3004', 'National ID', 96, 'requested'],
  ['MB-KYC-26-3102', 'C-3005', 'Passport', 720, 'rejected']
];
const AUCTIONS = [
  ['A-311', 'G-1042', 1, 70000, 20, 44, 14],
  ['A-312', 'CO-5021', 20, 180000, 70, 94, 6],
  ['A-308', 'G-1041', 3, 170000, -22, 2.23, 21, 186500],
  ['A-309', 'D-7011', 300, 110000, -10, 5.67, 9, 121000],
  ['A-310', 'S-2012', 20, 17000, -4, 26, 4, 19500],
  ['A-306', 'P-3011', 0.5, 15000, -44, -20, 8, 16500, 'C-1007', 'MB-ORD-26-10488'],
  ['A-305', 'G-1047', 1, 70000, -94, -70, 11, 73500, 'C-1005', null],
  ['A-304', 'TA-5031', 1, 46000, -54, -30, 3, 0],
  ['A-302', 'C-4012', 25, 220000, -224, -200, 10, 241000, 'C-1003', 'MB-ORD-26-10399']
];
const BIDDERS = ['C-1001', 'C-1003', 'C-1007', 'C-1005', 'C-1006', 'C-1002', 'C-1004'];
const REFUNDS = [
  ['MB-RF-26-0041', 'MB-ORD-26-10425', 'full', null, 'No longer needed', 'Our end customer cancelled the cobalt contract. Please refund the full amount to our bank account.', { method: 'bank', bank: 'ING Bank N.V.', account: 'NL91 INGB 0004 1288 77', code: 'INGBNL2A' }, ['Cancellation letter.pdf'], 'requested', 6],
  ['MB-RF-26-0038', 'MB-ORD-26-10441', 'partial', 12000, 'Delivery delayed', 'Shipment is 4 days late and we paid demurrage at our plant. Requesting partial compensation.', { method: 'original' }, ['Demurrage invoice.pdf'], 'review', 34],
  ['MB-RF-26-0035', 'MB-ORD-26-10449', 'partial', 4200, 'Paid twice', 'The insured transport fee was charged twice through UPI.', { method: 'original' }, ['UPI statement.png'], 'approved', 50],
  ['MB-RF-26-0031', 'MB-ORD-26-10437', 'partial', 9500, 'Quantity or quality issue', 'Two stones look below AA grade.', { method: 'original' }, ['Photo 1.jpg', 'Photo 2.jpg'], 'declined', 120],
  ['MB-RF-26-0029', 'MB-ORD-26-10418', 'partial', 6400, 'Damaged in transit', 'Two bags were torn on arrival and about 1 t was lost.', { method: 'original' }, ['Photos (4)'], 'refunded', 400]
];
const THREADS = [
  ['T-801', 'C-1003', 'MB-ORD-26-10412', 'Other payment method', 2, [['c', 'We would like to pay for the coltan order by a confirmed LC from Emirates NBD. Can Mineral Bridge accept that?', 5], ['c', 'Draft LC terms attached. Our bank needs your beneficiary details.', 4.5]]],
  ['T-802', 'C-1002', 'MB-ORD-26-10437', 'Order', 1, [['c', 'We received the emeralds but the parcel is 18 ct short against the packing list. Photos attached.', 40], ['a', 'Thank you Priya. We have opened a discrepancy and the operations manager will review today.', 39], ['c', 'Any update on the shortfall?', 3]]],
  ['T-803', 'C-2008', 'MB-SELL-26-20380', 'Sell', 1, [['c', 'The SGS report shows TREO 88.6% but our assay said 90%. Can you explain the method used?', 26]]],
  ['T-804', 'C-1005', 'MB-ORD-26-10430', 'Order', 0, [['c', 'Has my gold been delivered? I see it is completed on my side.', 30], ['a', 'Yes Wei, delivered and signed for on Tuesday. Please confirm receipt in the app.', 29]]],
  ['T-805', 'C-2002', 'MB-SELL-26-20414', 'Sell', 0, [['a', 'Hi Musa, please add a close-up photo of the bar stamp and the weighing scale reading.', 22], ['c', 'Okay, I will take them tomorrow morning.', 21]]],
  ['T-806', 'C-3002', null, 'General', 1, [['c', 'My passport expires in 5 months. Is that fine for KYC?', 2]]]
];
const SAVED = ['Thanks — we have received this and will update you within 24 hours.', 'Please upload the missing document in the app under Profile → Verification.', 'Your payment has been received and is being confirmed by our finance team.', 'Our logistics partner will contact you to confirm the pickup window.'];
const PARTNERS = [
  ['logistics', 'Sahel Secure Freight', 'Road', 'Nigeria, Ghana, Benin', 'Musa Ibrahim · +234 803 555 0142'],
  ['logistics', 'TransAfrica Rail Cargo', 'Rail', 'Zambia, DR Congo, Tanzania', 'Grace Banda · +260 96 330 1122'],
  ['logistics', 'Atlantic Sea Lines', 'Sea', 'Lagos, Tema, Mombasa', 'ops@atlanticsealines.com'],
  ['logistics', 'Skybridge Air Cargo', 'Air, Road', 'Worldwide', '+234 1 280 4400'],
  ['inspection', 'SGS Nigeria', 'Inspection & testing agency', 'Lagos, Abuja, Port Harcourt', 'lagos.minerals@sgs.com'],
  ['inspection', 'Bureau Veritas Ghana', 'Inspection & testing agency', 'Accra, Kumasi', 'minerals.gh@bureauveritas.com'],
  ['inspection', 'Intertek Nigeria', 'Inspection & testing agency', 'Lagos, Kano', 'minerals.ng@intertek.com'],
  ['inspector', 'Tunde Afolabi · SGS Nigeria', 'Agency inspector', 'Southwest Nigeria', '+234 802 118 2201'],
  ['inspector', 'Halima Sule · SGS Nigeria', 'Agency inspector', 'North Nigeria', '+234 803 771 9032'],
  ['inspector', 'Kofi Mensah · Bureau Veritas', 'Agency inspector', 'East & Southern Africa', '+233 24 410 2287']
];
const SETTINGS = {
  signinEmail: true, signinWhatsapp: true, codeDigits: 4, codeResend: 30, codeExpiry: 5,
  fee: 1.2, transport: 4200, buyValidity: 7, sellValidity: 48, payoutHours: 24, minPhotos: 3,
  bidStep: 500, auctionWindow: 72, refundSla: 2, refundApprover: 50000, refundDays: '3–7', payoutApprover: 250000,
  tolerance: 0.05, btcLock: 15, btcConfs: 3, btcCountries: 'Nigeria, Ghana, Kenya, South Africa, UAE, Singapore, Switzerland',
  mUPI: true, mNet: true, mBank: true, mBTC: true,
  bankName: 'Mineral Bridge Ltd', bankBank: 'Zenith Bank Plc', bankAcct: '1014 8820 51', bankSwift: 'ZEIBNGLA', bankUpi: 'mineralbridge@hdfcbank'
};
const DOC_TPL = ['Buy e-contract', 'Sell e-contract', 'Auction terms', 'Price quotation', 'Auction result certificate', 'Payment receipt', 'Tax invoice', 'Third-party inspection report', 'Payment advice', 'Consignment note', 'Proof of delivery', 'Completion certificate', 'Refund receipt'];

const money = (n?: any) => (n < 0 ? '−$' : '$') + Math.round(Math.abs(n)).toLocaleString('en-US');
const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const p2 = (n?: any) => String(n).padStart(2, '0');
const fmt = (t?: any) => { const d = new Date(t); return p2(d.getDate()) + ' ' + M[d.getMonth()] + ' · ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); };
const date = (t?: any) => { const d = new Date(t); return p2(d.getDate()) + ' ' + M[d.getMonth()] + ' ' + d.getFullYear(); };
const day = (t?: any) => { const d = new Date(t); return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] + ' ' + d.getDate() + ' ' + M[d.getMonth()]; };
const ago = (ms?: any) => { ms = Math.max(0, ms); const m = Math.floor(ms / 6e4); if (m < 60) return m + ' m'; const h = Math.floor(m / 60); if (h < 48) return h + ' h ' + (m % 60) + ' m'; return Math.floor(h / 24) + ' d ' + (h % 24) + ' h'; };
const left = (ms?: any) => { if (ms <= 0) return '00:00:00'; const s = Math.floor(ms / 1000); const h = Math.floor(s / 3600); return (h >= 48 ? Math.floor(h / 24) + 'd ' + p2(h % 24) + 'h' : p2(h) + ':' + p2(Math.floor(s / 60) % 60) + ':' + p2(s % 60)); };
const qfmt = (q?: any, u?: any) => (+q).toLocaleString('en-US', { maximumFractionDigits: 3 }) + ' ' + u;

Object.assign(MBA, { H, D, CATS, BT, ST, NO_BIZ, ROLES, PERMS, PERM_ROLE, BUY, SELL, BUY_PH, SELL_PH, HOLDS, OWNER, LOTS, CUS, BUYS, SELLS, SELL_REF, SITES, KYC, AUCTIONS, BIDDERS, REFUNDS, THREADS, SAVED, PARTNERS, SETTINGS, DOC_TPL, money, fmt, date, day, ago, left, qfmt });
