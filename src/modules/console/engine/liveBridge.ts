/* eslint-disable @typescript-eslint/no-explicit-any */
// Sends operator actions on live records to /v2/admin, then reloads from the database.
import { adminApi, adminRequest, AdminApiError } from '../../../lib/adminApi';
import { getConsoleDb } from '../../../services/console/consoleService';
import { MBA, MBV } from './registry';

const V = MBV;

/** Money-moving admin posts need an Idempotency-Key so a retry cannot double-create. */
function idempotencyKey() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `mb-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
function postIdempotent<T>(path: string, body: unknown) {
  return adminRequest<T>(path, { method: 'POST', body: JSON.stringify(body), headers: { 'Idempotency-Key': idempotencyKey() } });
}

async function reload(c: any) {
  try {
    const db = await getConsoleDb();
    if ((db as { live?: boolean }).live) c.setState({ db });
  } catch (err) {
    c.toast(err instanceof Error ? err.message : 'Could not reload records');
  }
}

function fail(c: any, err: unknown) {
  const message = err instanceof AdminApiError ? err.message : err instanceof Error ? err.message : 'The database rejected this change';
  c.toast(message);
  return reload(c);
}

function minor(value: unknown): number {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

const COUNTRY_ALIASES: Record<string, string> = {
  nigeria: 'NG', kenya: 'KE', india: 'IN', singapore: 'SG', rwanda: 'RW', tanzania: 'TZ',
  'dr congo': 'CD', 'democratic republic of the congo': 'CD', congo: 'CD', ghana: 'GH',
};

function countryCode(country: unknown): string | undefined {
  const t = String(country || '').trim();
  if (!t) return undefined;
  if (/^[a-zA-Z]{2}$/.test(t)) return t.toUpperCase();
  return COUNTRY_ALIASES[t.toLowerCase()];
}

function lotApiUnit(unit: string): 'g' | 'kg' | 't' | null {
  if (unit === 'g' || unit === 'kg' || unit === 't') return unit;
  return null;
}

export function stepPayload(stepKey: string, order: any, form: Record<string, unknown>) {
  if (stepKey === 'quote' && order.kind !== 'sell') {
    return {
      lines: (order.items || []).map((it: any, i: number) => ({ productRef: it.lot, amountMinor: minor(form['price' + i]) })),
      feeMinor: minor(form.fee),
      transportMinor: minor(form.transport),
      other: form.other ? { label: String(form.otherLabel || 'Other'), amountMinor: minor(form.other) } : undefined,
      marketRateNote: form.rate ? String(form.rate) : undefined,
      validDays: Number(form.valid || 7),
    };
  }
  if (stepKey === 'quote') {
    return {
      offerMinor: minor(form.offer),
      deduction: form.deduct ? { label: String(form.deductLabel || 'Deduction'), amountMinor: minor(form.deduct) } : undefined,
      marketRateNote: form.rate ? String(form.rate) : undefined,
      validHours: Number(form.valid || 48),
    };
  }
  if (stepKey === 'payOk') {
    const ref = form.ref || form.pref;
    return { confirmedRef: ref ? String(ref) : undefined };
  }
  if (stepKey === 'contractMb') return { signatory: form.signatory ? String(form.signatory) : undefined };
  if (stepKey === 'assigned') return { partnerId: String(form.partner || '') };
  if (stepKey === 'schedule') return { date: form.date, time: form.time, location: form.loc || '' };
  if (stepKey === 'payout') return { reference: form.ref ? String(form.ref) : undefined };
  return { note: form.note || form.notes || undefined };
}

const advance = V.advance;
V.advance = (c?: any, o?: any, sim?: any) => {
  if (!o?.live || sim || !c?.state?.db?.live) return advance(c, o, sim);
  const before = o.stage;
  const step = MBA.stages(o)[o.stage];
  const stepKey = o.serverStep || step?.key;
  const version = o.version ?? 0;
  const form = { ...(c.form || {}) };
  advance(c, o, sim);
  if (o.stage === before || !stepKey) return;
  const data = stepPayload(stepKey, o, form);
  if (stepKey === 'payout' && o.payout?.id) {
    // A payout record exists: approve it if needed, then release it with the bank reference.
    const payoutId = encodeURIComponent(o.payout.id);
    const reference = String(form.ref || '').trim();
    void (async () => {
      if (o.payout.status === 'pending_approval') await adminApi.post(`/payouts/${payoutId}/approve`, {});
      await postIdempotent(`/payouts/${payoutId}/release`, { reference, version });
    })().then(() => reload(c)).catch((err) => fail(c, err));
    return;
  }  void adminApi.post(`/orders/${encodeURIComponent(o.id)}/steps/${encodeURIComponent(stepKey)}`, { version, data })
    .then(() => reload(c))
    .catch((err) => fail(c, err));
};

V.persistReject = (c: any, o: any, reason: string) => {
  if (!o?.live) return;
  void adminApi.post(`/orders/${encodeURIComponent(o.id)}/reject`, { version: o.version ?? 0, reason })
    .then(() => reload(c))
    .catch((err) => fail(c, err));
};

V.persistCustomerCreate = (c: any, v: {
  name: string; email: string; whatsapp?: string; country?: string; business?: string; role?: string;
}) => {
  if (!c?.state?.db?.live) return;
  const role = v.role === 'buyer' || v.role === 'seller' || v.role === 'both' ? v.role : 'both';
  void adminApi.post('/customers', {
    fullName: v.name,
    email: v.email,
    phone: v.whatsapp || undefined,
    businessName: v.business || undefined,
    countryCode: countryCode(v.country),
    role,
  }).then(() => {
    c.setState({ drawer: null });
    c.commit(v.name + ' created');
    return reload(c);
  }).catch((err) => fail(c, err));
};

V.persistCustomerUpdate = (c: any, customer: any, patch: { name?: string; business?: string; country?: string }) => {
  if (!customer?.userId || !c?.state?.db?.live) return;
  void adminApi.patch(`/customers/${encodeURIComponent(customer.userId)}`, {
    fullName: patch.name,
    businessName: patch.business,
    countryCode: patch.country != null ? countryCode(patch.country) : undefined,
  }).then(() => {
    c.commit((patch.name || customer.name) + ' saved');
    c.openDrawer('customer', customer.id);
    return reload(c);
  }).catch((err) => fail(c, err));
};

V.persistSuspend = (c: any, customer: any, reason: string) => {
  if (!customer?.userId || !c?.state?.db?.live) return;
  void adminApi.post(`/customers/${encodeURIComponent(customer.userId)}/suspend`, { reason })
    .then(() => reload(c))
    .catch((err) => fail(c, err));
};

const REFUND_ACTION: Record<string, string> = {
  review: 'review',
  approved: 'approve',
  declined: 'decline',
  processing: 'processing',
  refunded: 'complete',
};

V.persistRefund = (c: any, refund: any, status: string, extra?: { reason?: string; bankRef?: string }) => {
  if (!refund?.live) return;
  const action = REFUND_ACTION[status];
  if (!action) return;
  void adminApi.post(`/refunds/${encodeURIComponent(refund.ref)}/${action}`, {
    reason: extra?.reason,
    bankRef: extra?.bankRef || refund.bankRef,
    version: refund.version ?? 0,
  }).then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistSettings = (c: any, values: Record<string, unknown>) => {
  if (!c?.state?.db?.live) return;
  void adminApi.patch('/settings', values).then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistReinstate = (c: any, customer: any) => {
  if (!customer?.userId || !c?.state?.db?.live) return;
  void adminApi.post(`/customers/${encodeURIComponent(customer.userId)}/reinstate`, {})
    .then(() => reload(c)).catch((err) => fail(c, err));
};

const KYC_DECISION: Record<string, string> = { approved: 'verified', requested: 'resubmission_required', rejected: 'rejected' };
V.persistKyc = (c: any, kyc: any, status: string, reason?: string) => {
  if (!kyc?.live || !kyc.submissionId) return;
  const decision = KYC_DECISION[status];
  if (!decision) return;
  void adminApi.post(`/kyc/${encodeURIComponent(kyc.submissionId)}/decide`, { decision, reason })
    .then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistPaymentReject = (c: any, order: any, reason: string) => {
  if (!order?.live) return;
  void adminApi.post(`/payments/${encodeURIComponent(order.id)}/reject`, { version: order.version ?? 0, reason })
    .then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistPaymentConfirm = (c: any, order: any, confirmedRef: string) => {
  if (!order?.live || !c?.state?.db?.live) return;
  void adminApi.post(`/payments/${encodeURIComponent(order.id)}/confirm`, {
    version: order.version ?? 0,
    confirmedRef,
  }).then(() => {
    c.setState({ drawer: null });
    c.commit('Payment confirmed on ' + order.id);
    return reload(c);
  }).catch((err) => fail(c, err));
};

V.persistSupportReply = (c: any, thread: any, body: string) => {
  if (!thread?.live) return;
  void adminApi.post(`/support/${encodeURIComponent(thread.id)}/reply`, { body })
    .then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistSupportStatus = (c: any, thread: any, status: string) => {
  if (!thread?.live) return;
  void adminApi.post(`/support/${encodeURIComponent(thread.id)}/status`, { status: status === 'resolved' ? 'resolved' : 'open' })
    .then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistSupportAssign = (c: any, thread: any) => {
  if (!thread?.live) return;
  void adminApi.post(`/support/${encodeURIComponent(thread.id)}/assign`, {})
    .then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistNotificationRetry = (c: any, delivery: any) => {
  if (!delivery?.live || !delivery.id) return;
  void adminApi.post(`/notifications/${encodeURIComponent(delivery.id)}/retry`, {})
    .then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistDocument = (c: any, doc: any, action: 'reissue' | 'cancel', reason?: string) => {
  if (!doc?.live) return;
  const path = action === 'reissue' ? 'reissue' : 'cancel';
  void adminApi.post(`/documents/${encodeURIComponent(doc.no)}/${path}`, { reason: reason || 'Reissued from the console' })
    .then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistUpload = (c: any, doc: any, file: { filename: string; contentType: string; base64: string }) => {
  if (!c?.state?.db?.live) return;
  const body: Record<string, unknown> = {
    filename: file.filename,
    contentType: file.contentType || 'application/pdf',
    contentBase64: file.base64,
  };
  if (doc?.no) body.number = doc.no;
  if (doc?.eid) body.orderRef = doc.eid;
  if (doc?.typeKey) body.type = doc.typeKey;
  void adminApi.post('/documents/upload', body)
    .then(() => reload(c))
    .catch((err) => fail(c, err));
};

/** Registers a new issued document against an order and stores the chosen file. */
V.persistNewDocument = (c: any, input: { type: string; eid: string; filename: string; contentType: string; base64: string }) => {
  if (!c?.state?.db?.live) return;
  const typeKey = /consign/i.test(input.type) ? 'consignment_note'
    : /invoice/i.test(input.type) ? 'tax_invoice'
    : /receipt/i.test(input.type) ? 'payment_receipt'
    : /inspect/i.test(input.type) ? 'inspection_report'
    : /certif/i.test(input.type) ? 'test_certificate'
    : /delivery/i.test(input.type) ? 'proof_of_delivery'
    : 'consignment_note';
  void adminApi.post('/documents/upload', {
    orderRef: input.eid,
    type: typeKey,
    filename: input.filename,
    contentType: input.contentType || 'application/pdf',
    contentBase64: input.base64,
  }).then((res: any) => {
    c.toast(res?.number ? res.number + ' uploaded' : 'Document uploaded');
    return reload(c);
  }).catch((err) => fail(c, err));
};

V.downloadDocument = (c: any, doc: any) => {
  if (!doc?.live) return;
  void adminApi.get<{ filename: string; contentType: string; contentBase64: string }>(`/documents/${encodeURIComponent(doc.no)}/download`)
    .then((file) => {
      const bin = atob(file.contentBase64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: file.contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch((err) => fail(c, err));
};

V.persistPartner = (c: any, partner: any) => {
  if (!partner?.live) return;
  void adminApi.patch(`/partners/${encodeURIComponent(partner.id)}`, {
    name: partner.name,
    type: partner.type === 'inspection' ? 'inspection' : 'logistics',
    active: Boolean(partner.active),
  }).then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistLot = (c: any, lot: any, extra?: { minOrder?: number; referencePrice?: number }) => {
  if (!lot?.live) return;
  const unit = lotApiUnit(lot.unit);
  if (!unit) return c.toast('Live lots use units g, kg, or t only');
  void adminApi.patch(`/catalogue/lots/${encodeURIComponent(lot.id)}`, {
    name: lot.name,
    grade: lot.grade || undefined,
    avail: Number(lot.avail),
    unit,
    status: lot.status,
    minOrder: extra?.minOrder,
    referencePrice: extra?.referencePrice,
  }).then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistLotCreate = (c: any, input: {
  name: string; mineral: string; unit: string; avail: number; origin: string; grade?: string; form?: string;
}, files?: { media?: File[]; docs?: File[] }) => {
  if (!c?.state?.db?.live) return;
  const unit = lotApiUnit(input.unit);
  if (!unit) return c.toast('Live lots use units g, kg, or t only');
  if (!input.name.trim()) return c.toast('Name the lot');
  if (!input.origin.trim()) return c.toast('Add an origin');
  void adminApi.post('/catalogue/lots', {
    name: input.name.trim(),
    mineral: input.mineral.trim() || 'gold',
    unit,
    avail: Number(input.avail) || 0,
    origin: input.origin.trim(),
    grade: input.grade?.trim() || undefined,
    form: input.form?.trim() || undefined,
  }).then(async (created: any) => {
    c.form = {};
    c.setState({ drawer: null });
    // Photos and documents staged on the New lot panel go to the new lot once it exists.
    const staged = [
      ...(files?.media || []).map((file) => ({ file, kind: 'image' as const })),
      ...(files?.docs || []).map((file) => ({ file, kind: 'document' as const })),
    ];
    let failed = 0;
    for (const { file, kind } of staged) {
      try {
        await adminApi.post(`/catalogue/lots/${encodeURIComponent(created.reference)}/media`, {
          kind,
          filename: file.name,
          contentType: file.type || (kind === 'image' ? 'image/jpeg' : 'application/octet-stream'),
          contentBase64: await fileBase64(file),
        });
      } catch {
        failed += 1;
      }
    }
    c.commit(input.name.trim() + ' saved' + (staged.length ? ' with ' + (staged.length - failed) + ' of ' + staged.length + ' files' : ''));
    return reload(c);
  }).catch((err) => fail(c, err));
};

V.persistLotDelete = (c: any, lot: { id: string }) => {
  if (!lot?.id || !c?.state?.db?.live) return;
  void adminApi.delete(`/catalogue/lots/${encodeURIComponent(lot.id)}`)
    .then(() => {
      c.setState({ drawer: null });
      c.commit(lot.id + ' deleted');
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

V.persistAuctionDelete = (c: any, auctionId: string) => {
  if (!auctionId || !c?.state?.db?.live) return;
  void adminApi.delete(`/auctions/${encodeURIComponent(auctionId)}`)
    .then(() => {
      c.setState({ drawer: null });
      c.commit(auctionId + ' deleted');
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

V.persistPartnerCreate = (c: any, partner: { name: string; type: string; regions?: string; contact?: string }) => {
  if (!c?.state?.db?.live) return;
  const type = partner.type === 'inspection' || partner.type === 'inspector' ? 'inspection' : 'logistics';
  void adminApi.post('/partners', {
    name: partner.name,
    type,
    regions: partner.regions,
    contact: partner.contact,
    active: true,
  }).then(() => {
    c.setState({ drawer: null });
    c.commit(partner.name + ' added');
    return reload(c);
  }).catch((err) => fail(c, err));
};

V.persistHold = (c: any, lot: any) => {
  if (!lot?.live) return;
  const hold = Boolean(lot.onHold);
  void adminApi.post(`/catalogue/lots/${encodeURIComponent(lot.id)}/hold`, {
    hold,
    reason: hold ? String(lot.holdReason || '').trim() : undefined,
  }).then((res: any) => {
    lot.onHold = Boolean(res?.onHold ?? hold);
    if (!lot.onHold) lot.holdReason = '';
    return reload(c);
  }).catch((err) => fail(c, err));
};

V.persistShipment = (c: any, shipment: any, location: string) => {
  if (!shipment?.id || !c?.state?.db?.live) return;
  void adminApi.patch(`/shipments/${encodeURIComponent(shipment.id)}`, { location, note: 'Location updated from the console' })
    .then(() => reload(c)).catch((err) => fail(c, err));
};

function gramsOf(qty: number, unit: string) {
  if (unit === 'kg') return qty * 1000;
  if (unit === 't') return qty * 1_000_000;
  return qty;
}

V.persistAuction = (c: any, input: { productId?: string; name: string; qty: number; unit: string; start: number; step: number; reserve?: number; opens: number; hours: number }) => {
  if (!c?.state?.db?.live) return;
  const opensAt = new Date(input.opens).toISOString();
  const closesAt = new Date(input.opens + input.hours * 3600_000).toISOString();
  void adminApi.post('/auctions', {
    name: input.name,
    quantityGrams: gramsOf(Number(input.qty), input.unit),
    currency: 'USD',
    startingBidMinor: Math.round(Number(input.start) * 100),
    stepMinor: Math.round(Number(input.step) * 100),
    reserveMinor: input.reserve ? Math.round(Number(input.reserve) * 100) : undefined,
    opensAt,
    closesAt,
    productId: input.productId,
  }).then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistTemplate = (c: any, template: { id?: string; name: string; body: string }) => {
  if (!c?.state?.db?.live) return;
  void adminApi.post('/templates', { id: template.id, name: template.name, body: template.body })
    .then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistTemplateDelete = (c: any, id: string) => {
  if (!c?.state?.db?.live) return;
  void adminApi.delete(`/templates/${encodeURIComponent(id)}`).then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistInvite = (c: any, input: { name: string; email: string; roleKey: string }) => {
  if (!c?.state?.db?.live) return;
  void adminApi.post<{ temporaryPassword?: string; email: string }>('/admins/invite', input)
    .then((row) => {
      reload(c);
      c.toast(`Temporary password for ${row.email}: ${row.temporaryPassword}`);
    })
    .catch((err) => fail(c, err));
};

V.persistInvoice = (c: any, order: { id: string }, rate: number) => {
  if (!c?.state?.db?.live) return;
  void adminApi.post(`/orders/${encodeURIComponent(order.id)}/invoice`, { rate })
    .then(() => reload(c)).catch((err) => fail(c, err));
};

// ---------- orders created by an operator ----------
const ORDER_QTY_UNITS = ['g', 'kg', 't', 'ct'];

V.persistBuy = (c: any, input: { cust: any; lot: any; qty: number; addr?: string; note?: string }) => {
  if (!c?.state?.db?.live) return;
  const { cust, lot } = input;
  if (!cust?.userId) return c.toast('Choose a buyer from the customer list');
  if (!lot?.id) return c.toast('Choose a lot');
  if (!ORDER_QTY_UNITS.includes(lot.unit)) return c.toast('This lot uses a unit that orders do not accept');
  const addr = String(input.addr || '').trim();
  const org = String(cust.business || cust.name || '').trim();
  const parts = addr.split(',').map((s) => s.trim()).filter(Boolean);
  void adminApi.post<{ reference: string }>('/orders', {
    customerId: cust.userId,
    kind: 'buy',
    items: [{ productRef: lot.id, qty: { value: Number(input.qty), unit: lot.unit } }],
    delivery: {
      org,
      street: addr || org,
      city: parts.length > 1 ? parts[1] : '',
      country: countryCode(cust.country) || '',
      contact: String(cust.name || ''),
      mobile: String(cust.whatsapp || ''),
    },
    note: input.note ? String(input.note) : undefined,
  }).then(async (res) => {
    c.setState({ drawer: null });
    c.commit(res.reference + ' created');
    await reload(c);
    c.openOrder(res.reference);
  }).catch((err) => fail(c, err));
};

V.persistSell = (c: any, input: {
  cust: any; mineral: string; name: string; qty: number; unit: string; form?: string; grade?: string; photos: number; details?: string;
}) => {
  if (!c?.state?.db?.live) return;
  if (!input.cust?.userId) return c.toast('Choose a seller from the customer list');
  if (!ORDER_QTY_UNITS.includes(input.unit)) return c.toast('Choose g, kg, t, or ct');
  void adminApi.post<{ reference: string }>('/orders', {
    customerId: input.cust.userId,
    kind: 'sell',
    sell: {
      mineral: String(input.mineral || '').trim().toLowerCase(),
      name: String(input.name || '').trim(),
      qty: { value: Number(input.qty), unit: input.unit },
      grade: String(input.grade || '').trim(),
      form: String(input.form || '').trim(),
      details: String(input.details || '').trim() || 'Entered by Mineral Bridge.',
      photosReceived: Number(input.photos) || 0,
    },
  }).then(async (res) => {
    c.setState({ drawer: null });
    c.commit(res.reference + ' created');
    await reload(c);
    c.openOrder(res.reference);
  }).catch((err) => fail(c, err));
};

// ---------- refunds ----------
const REFUND_REASON: Record<string, string> = {
  'No longer needed': 'no_longer_needed',
  'Delivery delayed': 'delivery_delayed',
  'Paid twice': 'paid_twice',
  'Quantity or quality issue': 'quantity_quality',
  'Damaged in transit': 'damaged',
  Other: 'other',
};

V.persistRefundCreate = (c: any, input: {
  order: any; type: string; amount: number; reason: string; note: string; dest: string; bank?: string;
}) => {
  if (!c?.state?.db?.live || !input.order?.id) return;
  const bank = String(input.bank || '').trim();
  const bankParts = bank.split(',').map((s) => s.trim()).filter(Boolean);
  const accountDigits = (bankParts[1] || '').replace(/\D/g, '');
  const destination = input.dest === 'bank'
    ? {
        method: 'bank',
        bankName: bankParts[0],
        accountMasked: accountDigits ? `•••• ${accountDigits.slice(-4)}` : undefined,
        swiftOrIfsc: bankParts[2],
        accountEnc: bank,
      }
    : { method: 'original' };
  void postIdempotent<{ ref: string }>('/refunds', {
    orderRef: input.order.id,
    type: input.type === 'full' ? 'full' : 'partial',
    amountMinor: input.type === 'full' ? undefined : minor(input.amount),
    reason: REFUND_REASON[input.reason] || 'other',
    note: input.note,
    destination,
  }).then(async (refund) => {
    c.setState({ drawer: null });
    c.commit(refund.ref + ' created');
    await reload(c);
    c.openDrawer('refund', refund.ref);
  }).catch((err) => fail(c, err));
};

V.persistRefundEdit = (c: any, refund: any, patch: { amount?: number; reason?: string; note?: string }) => {
  if (!refund?.live || !c?.state?.db?.live) return;
  void adminApi.patch(`/refunds/${encodeURIComponent(refund.ref)}`, {
    amountMinor: patch.amount != null ? minor(patch.amount) : undefined,
    reason: patch.reason ? REFUND_REASON[patch.reason] || 'other' : undefined,
    note: patch.note || undefined,
  }).then(async () => {
    c.commit(refund.ref + ' saved');
    await reload(c);
    c.openDrawer('refund', refund.ref);
  }).catch((err) => fail(c, err));
};

// ---------- partners ----------
V.persistPartnerDelete = (c: any, partner: any) => {
  if (!partner?.live || !c?.state?.db?.live) return;
  void adminApi.delete(`/partners/${encodeURIComponent(partner.id)}`)
    .then(() => {
      c.setState({ drawer: null });
      c.commit(partner.name + ' deleted');
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

// ---------- order holds, change requests and price variations ----------
V.persistOrderHold = (c: any, order: any, input: { type?: string; reason?: string; clear?: boolean }) => {
  if (!order?.live || !c?.state?.db?.live) return;
  void adminApi.post(`/orders/${encodeURIComponent(order.id)}/hold`, {
    type: input.clear ? undefined : input.type,
    reason: input.reason,
    clear: input.clear ? true : undefined,
  }).then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistChanges = (c: any, order: any, note: string) => {
  if (!order?.live || !c?.state?.db?.live) return;
  void adminApi.post(`/orders/${encodeURIComponent(order.id)}/changes`, {
    scope: 'submission',
    note,
    version: order.version ?? 0,
  }).then(() => reload(c)).catch((err) => fail(c, err));
};

V.persistVariation = (c: any, order: any, input: { total: number; kind: string; note: string }) => {
  if (!order?.live || !c?.state?.db?.live) return;
  void adminApi.post(`/orders/${encodeURIComponent(order.id)}/price-variations`, {
    newTotalMinor: minor(input.total),
    reason: input.kind,
    note: input.note,
    version: order.version ?? 0,
  }).then(() => {
    c.setState({ drawer: null });
    c.commit('Price adjustment sent to the seller');
    return reload(c);
  }).catch((err) => fail(c, err));
};

// ---------- auctions ----------
const AUCTION_DONE: Record<string, string> = { live: 'is live', paused: 'paused', cancelled: 'cancelled' };

V.persistAuctionTransition = (c: any, auction: any, to: 'live' | 'paused' | 'cancelled', reason?: string) => {
  if (!auction?.live || !auction.auctionId || !c?.state?.db?.live) return;
  void adminApi.post(`/auctions/${encodeURIComponent(auction.auctionId)}/transition`, { to, reason })
    .then(() => {
      c.commit(auction.id + ' ' + (to === 'live' && auction.paused ? 'resumed' : AUCTION_DONE[to]));
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

V.persistAuctionExtend = (c: any, auction: any, hours = 1) => {
  if (!auction?.live || !auction.auctionId || !c?.state?.db?.live) return;
  void adminApi.post(`/auctions/${encodeURIComponent(auction.auctionId)}/extend`, { hours })
    .then(() => {
      c.commit(auction.id + ' extended by ' + hours + ' h');
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

V.persistAuctionClose = (c: any, auction: any) => {
  if (!auction?.live || !auction.auctionId || !c?.state?.db?.live) return;
  const id = encodeURIComponent(auction.auctionId);
  void adminApi.post(`/auctions/${id}/transition`, { to: 'ended' })
    .then(() => adminApi.post<{ outcome?: { result?: string } }>(`/auctions/${id}/finalize`, {}))
    .then((done) => {
      const result = done?.outcome?.result;
      c.commit(auction.id + (result === 'sold' ? ' closed and awarded' : result === 'reserve_not_met' ? ' closed · reserve not met' : ' closed'));
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

V.persistAuctionWinnerOrder = (c: any, auction: any) => {
  if (!auction?.live || !c?.state?.db?.live) return;
  void adminApi.post<{ orderRef?: string }>(`/auctions/${encodeURIComponent(auction.auctionId || auction.id)}/order`, {})
    .then((res) => {
      c.commit(res?.orderRef ? res.orderRef + ' created' : 'No winner order: the reserve was not met');
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

// ---------- payouts ----------
V.persistPayoutApprove = (c: any, order: any) => {
  if (!order?.live || !order.payout?.id || !c?.state?.db?.live) return;
  void adminApi.post(`/payouts/${encodeURIComponent(order.payout.id)}/approve`, {})
    .then(() => {
      c.commit('Payout approval recorded');
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

// ---------- support and notifications started by an operator ----------
V.persistThreadCreate = (c: any, customer: any, input: { tag?: string; ref?: string; msg: string }) => {
  if (!customer?.userId || !c?.state?.db?.live) return c.toast('Choose a customer from the customer list');
  void adminApi.post<{ reference: string }>('/support', {
    customerId: customer.userId,
    topic: input.tag || undefined,
    body: input.msg,
    relatedRef: input.ref || undefined,
  }).then(async (res) => {
    c.setState({ drawer: null });
    c.commit('Message sent to ' + customer.name);
    await reload(c);
    c.openDrawer('thread', res.reference);
  }).catch((err) => fail(c, err));
};

V.persistNotification = (c: any, customer: any, input: { msg: string; ref?: string; ch?: string }) => {
  if (!customer?.userId || !c?.state?.db?.live) return c.toast('Choose a customer from the customer list');
  void adminApi.post<{ channels: string[] }>('/notifications', {
    customerId: customer.userId,
    message: input.msg,
    channel: input.ch || 'all',
    ref: input.ref || undefined,
  }).then((res) => {
    c.setState({ drawer: null });
    c.commit('Sent to ' + customer.name + ' by ' + (res.channels || []).join(', '));
    return reload(c);
  }).catch((err) => fail(c, err));
};
// ---------- catalogue hierarchy ----------
/** Categories. `action`: create | rename | visibility | delete. A hidden category keeps its lots. */
V.persistCategory = (c: any, action: string, cat: any, extra?: any) => {
  if (!c?.state?.db?.live || !cat?.id) return;
  const slug = encodeURIComponent(cat.id);
  if (action === 'create') {
    const subs: string[] = extra?.subcategories || [];
    void adminApi.post<{ slug: string }>('/catalogue/categories', { name: extra?.name || cat.label, subcategories: subs.length ? subs : undefined })
      .then(async (res) => {
        // A category with no subcategory is created hidden in the console, so match that.
        if (!cat.active) await adminApi.patch(`/catalogue/categories/${encodeURIComponent(res.slug)}`, { active: false });
        await reload(c);
        c.openDrawer('cat', res.slug);
      })
      .catch((err) => fail(c, err));
    return;
  }
  let run: Promise<unknown>;
  if (action === 'rename') run = adminApi.patch(`/catalogue/categories/${slug}`, { name: extra?.name });
  else if (action === 'visibility') run = adminApi.patch(`/catalogue/categories/${slug}`, { active: Boolean(extra?.active) });
  else if (action === 'delete') run = adminApi.delete(`/catalogue/categories/${slug}`);
  else return;
  void run.then(() => reload(c)).catch((err) => fail(c, err));
};

/** Subcategories (the console's second level, a mineral type on the server). `action`: create | rename | visibility | move | delete. */
V.persistSubcategory = (c: any, action: string, cat: any, sub: any, extra?: any) => {
  if (!c?.state?.db?.live || !cat?.id || !sub) return;
  const slug = encodeURIComponent(sub.id);
  let run: Promise<unknown>;
  if (action === 'create') run = adminApi.post('/catalogue/minerals', { categorySlug: cat.id, name: sub.label });
  else if (action === 'rename') run = adminApi.patch(`/catalogue/minerals/${slug}`, { name: extra?.name });
  else if (action === 'visibility') run = adminApi.patch(`/catalogue/minerals/${slug}`, { active: Boolean(extra?.active) });
  else if (action === 'move') run = adminApi.patch(`/catalogue/minerals/${slug}`, { categorySlug: extra?.categorySlug });
  else if (action === 'delete') run = adminApi.delete(`/catalogue/minerals/${slug}`);
  else return;
  void run.then(() => reload(c)).catch((err) => fail(c, err));
};

// ---------- lot images and documents ----------
function fileBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(reader.error || new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}
const mediaPath = (lot: any) => `/catalogue/lots/${encodeURIComponent(lot.id)}/media`;

/** Uploads images or documents to a lot, one request per file, then reloads from the database. */
V.persistMediaAdd = (c: any, lot: any, files: File[], kind: 'image' | 'document') => {
  if (!lot?.live || !c?.state?.db?.live || !files?.length) return;
  void (async () => {
    for (const file of files) {
      await adminApi.post(mediaPath(lot), {
        kind,
        filename: file.name,
        contentType: file.type || (kind === 'image' ? 'image/jpeg' : 'application/octet-stream'),
        contentBase64: await fileBase64(file),
      });
    }
  })().then(() => {
    c.commit(files.length + (kind === 'image' ? ' image' : ' document') + (files.length > 1 ? 's' : '') + ' added to ' + lot.id);
    return reload(c);
  }).catch((err) => fail(c, err));
};

/** Caption, cover, order, name, type, visibility, or a replacement file (`replaceFile`) for one image or document. */
V.persistMediaUpdate = (c: any, lot: any, id: string, patch: Record<string, any>, done?: string) => {
  if (!lot?.live || !c?.state?.db?.live || !id) return;
  void (async () => {
    const { replaceFile, ...body } = patch;
    if (replaceFile) {
      body.replace = { filename: replaceFile.name, contentType: replaceFile.type || 'application/octet-stream', contentBase64: await fileBase64(replaceFile) };
    }
    await adminApi.patch(`${mediaPath(lot)}/${encodeURIComponent(id)}`, body);
  })().then(() => {
    if (done) c.commit(done);
    return reload(c);
  }).catch((err) => fail(c, err));
};

V.persistMediaRemove = (c: any, lot: any, id: string, done?: string, after?: () => void) => {
  if (!lot?.live || !c?.state?.db?.live || !id) return;
  void adminApi.delete(`${mediaPath(lot)}/${encodeURIComponent(id)}`)
    .then(() => {
      if (done) c.commit(done);
      if (after) after();
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

/** Downloads a stored lot document from the platform. */
V.downloadLotFile = (c: any, lot: any, doc: any) => {
  if (!lot?.live || !doc?.id) return;
  void adminApi.get<{ filename: string; contentType: string; contentBase64: string }>(`${mediaPath(lot)}/${encodeURIComponent(doc.id)}/download`)
    .then((file) => {
      const bin = atob(file.contentBase64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: file.contentType }));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch((err) => fail(c, err));
};

// ---------- stock ----------
/** Stock adjustment with a reason. `type`: add | remove | count. `qty` is in the lot's own unit. */
V.persistStock = (c: any, lot: any, input: { type: 'add' | 'remove' | 'count'; qty: number; note: string }) => {
  if (!lot?.live || !c?.state?.db?.live) return;
  const unit = lotApiUnit(lot.unit);
  if (!unit) return c.toast('Live lots use units g, kg, or t only');
  const perUnit = unit === 'kg' ? 1000 : unit === 't' ? 1_000_000 : 1;
  const qty = Number(input.qty);
  const body = input.type === 'count'
    ? { avail: qty, unit, reason: input.note, kind: 'count' }
    : { deltaGrams: Math.round(qty * perUnit) * (input.type === 'remove' ? -1 : 1), reason: input.note, kind: input.type };
  void adminApi.post(`/catalogue/lots/${encodeURIComponent(lot.id)}/stock`, body)
    .then(() => reload(c)).catch((err) => fail(c, err));
};

// ---------- order delete (soft: the order is cancelled and hidden, never destroyed) ----------
V.persistOrderDelete = (c: any, order: any, reason: string) => {
  if (!order?.live || !c?.state?.db?.live) return;
  void adminApi.delete(`/orders/${encodeURIComponent(order.id)}`, { reason })
    .then(() => {
      c.setState({ drawer: null, orderId: null });
      c.commit(order.id + ' deleted');
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

// ---------- admins ----------
V.persistAdminUpdate = (c: any, admin: any, patch: { name?: string; email?: string; role?: string }) => {
  if (!admin?.live || !c?.state?.db?.live) return;
  void adminApi.patch(`/admins/${encodeURIComponent(admin.id)}`, { name: patch.name, email: patch.email, roleKey: patch.role })
    .then(() => {
      c.commit((patch.name || admin.name) + ' saved');
      c.openDrawer('admin', admin.id);
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

V.persistAdminStatus = (c: any, admin: any, disabled: boolean) => {
  if (!admin?.live || !c?.state?.db?.live) return;
  void adminApi.post(`/admins/${encodeURIComponent(admin.id)}/${disabled ? 'disable' : 'enable'}`, {})
    .then(() => {
      c.commit(admin.name + (disabled ? ' disabled' : ' enabled'));
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

V.persistAdminDelete = (c: any, admin: any, reason: string) => {
  if (!admin?.live || !c?.state?.db?.live) return;
  void adminApi.delete(`/admins/${encodeURIComponent(admin.id)}`, { reason })
    .then(() => {
      c.setState({ drawer: null });
      c.commit(admin.name + ' deleted');
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

// ---------- roles and permissions ----------
V.persistRoleCreate = (c: any, input: { label: string; copy?: string }) => {
  if (!c?.state?.db?.live) return;
  void adminApi.post<{ key: string }>('/roles', { label: input.label, copyFrom: input.copy || undefined, actions: input.copy ? undefined : [] })
    .then(async (role) => {
      c.setState({ drawer: null });
      c.commit(input.label + ' created');
      await reload(c);
      c.openDrawer('role', role.key);
    })
    .catch((err) => fail(c, err));
};

V.persistRole = (c: any, key: string, patch: { label?: string; actions?: string[]; reset?: boolean }, done?: string) => {
  if (!c?.state?.db?.live || !key) return;
  void adminApi.patch(`/roles/${encodeURIComponent(key)}`, patch)
    .then(() => {
      if (done) c.commit(done);
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

V.persistMasterSheet = (c: any, csv: string) => {
  if (!c?.state?.db?.live || !csv) return;
  void adminApi.post<{ imported: number; created: number; updated: number; skipped: number; invalid: number }>('/catalogue/master-sheet', { csv })
    .then((res) => {
      c.sheet = null;
      c.setState({ drawer: null });
      c.commit('Imported ' + res.imported + ' products · ' + res.created + ' new · ' + res.updated + ' updated');
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

V.persistRoleDelete = (c: any, key: string, reason: string) => {
  if (!c?.state?.db?.live || !key) return;
  void adminApi.delete(`/roles/${encodeURIComponent(key)}`, { reason })
    .then(() => {
      c.setState({ drawer: null });
      c.commit('Role deleted');
      return reload(c);
    })
    .catch((err) => fail(c, err));
};

const me = V.me;
V.me = (c?: any) => c?.state?.db?.staff || me(c);
