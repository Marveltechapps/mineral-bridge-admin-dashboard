function gradeKey(value: unknown) {
  return String(value ?? '').replace(/~/g, '').replace(/\s+/g, '').replace(/%/g, '').toLowerCase();
}

function sameQty(declared: number, cert: number) {
  if (!Number.isFinite(declared) || !Number.isFinite(cert)) return false;
  if (declared === 0) return cert === 0;
  return Math.abs(cert - declared) <= Math.max(0.0005, Math.abs(declared) * 0.0005);
}

export interface SellVariation {
  unit: number;
  declared: number;
  cert: number | null;
  fair?: number;
  quoted?: number;
  current?: number;
  diff?: number;
  qtyPct?: number;
  pct?: number;
  applied?: boolean;
  qtyMatch: boolean;
  gradeMatch: boolean;
  failed: boolean;
  material: boolean;
}

/**
 * Quoted unit price is the product amount divided by the declared quantity in the sell unit.
 * A quote line can store its quantity in grams while the request is in kilograms. Using that
 * line's unit price prices 2 kg as if it were 2 grams and produces a false −100% variation.
 * Matching quantity keeps the quoted payable unchanged.
 */
export function sellPriceVariation(o: {
  kind?: string;
  quotes?: Array<Record<string, unknown>>;
  sell?: { qty?: number; grade?: string; unit?: string };
  sgs?: { net?: number; grade?: string; result?: string };
  insp?: { res?: { weight?: number; result?: string; notes?: string } };
  variations?: Array<{ from?: number }>;
  total?: number;
}): SellVariation | null {
  if (o.kind !== 'sell' || !o.quotes?.length) return null;
  const open = o.quotes.filter((row) => row.status !== 'declined');
  const q = (open.length ? open[open.length - 1] : o.quotes[o.quotes.length - 1]) as Record<string, unknown>;
  const declared = Number(o.sell?.qty) || 0;
  const lines = Array.isArray(q.lines) ? q.lines as Array<Record<string, unknown>> : [];
  const line = lines[0];
  const linePrice = line ? Number(line.price) || 0 : 0;
  // The line price is the product amount before deductions. `prod` on a live quote can already be net.
  const prod = linePrice > 0 ? linePrice : Number(q.prod) || 0;
  let unit = declared > 0 ? prod / declared : 0;
  if (line && line.unitPrice && declared > 0) {
    const rebuilt = Number(line.unitPrice) * declared;
    const target = Number(line.price) || prod;
    if (target > 0 && Math.abs(rebuilt - target) / target <= 0.02) unit = Number(line.unitPrice);
  }
  const cert = o.sgs ? Number(o.sgs.net) : o.insp?.res && o.insp.res.weight != null ? Number(o.insp.res.weight) : null;
  if (cert == null || !Number.isFinite(cert)) {
    return { unit, declared, cert: null, qtyMatch: false, gradeMatch: true, failed: false, material: false };
  }
  const ded = Number(q.deduct) || 0;
  const quoted = Number((o.variations && o.variations.length ? o.variations[0]?.from : o.total) || q.total) || 0;
  const qtyMatch = sameQty(declared, cert);
  const declaredGrade = o.sell?.grade || '';
  const certifiedGrade = o.sgs ? o.sgs.grade || '' : declaredGrade;
  const gradeMatch = !o.sgs || gradeKey(declaredGrade) === gradeKey(certifiedGrade);
  const failed = Boolean(o.sgs && /non-compliant/i.test(String(o.sgs.result || '')) && !/with remarks/i.test(String(o.sgs.result || '')));
  const fair = qtyMatch ? quoted : Math.max(0, Math.round(unit * cert - ded));
  const diff = fair - quoted;
  const qtyPct = declared ? ((cert - declared) / declared) * 100 : 0;
  const pct = quoted ? (diff / quoted) * 100 : 0;
  return {
    unit, declared, cert, fair, quoted, current: o.total, diff, qtyPct, pct,
    applied: o.total !== quoted, qtyMatch, gradeMatch, failed, material: !qtyMatch || !gradeMatch || failed,
  };
}

export function isNonCompliantReport(result?: string) {
  const text = String(result || '').trim();
  if (!text || /with remarks/i.test(text)) return false;
  return /non[\s_-]*compliant/i.test(text);
}

export function discrepancyState(note?: string): 'pending' | 'rejected' {
  return /^\[qty:rejected\]/i.test(String(note || '')) ? 'rejected' : 'pending';
}

export function discrepancyResolved(o: { hist?: Array<{ text?: string; note?: string }> }) {
  return (o.hist || []).some((row) => /^Discrepancy resolved\b/i.test(String(row?.note || row?.text || '')));
}

export function discrepancyRecord(input: {
  declared: number;
  actual: number;
  unit: string;
  reason: string;
  notes?: string;
  status?: 'pending' | 'rejected';
}) {
  const diff = Number(input.actual) - Number(input.declared);
  const sign = diff > 0 ? '+' : '';
  const notes = String(input.notes || '').trim();
  return `[qty:${input.status || 'pending'}] Expected ${input.declared} ${input.unit}. Inspected ${input.actual} ${input.unit}. Difference ${sign}${diff} ${input.unit}. Reason: ${String(input.reason || '').trim()}.${notes ? ' Notes: ' + notes : ''}`;
}

export function approvalBlockers(o: {
  kind?: string;
  sell?: { grade?: string; unit?: string };
  insp?: { agency?: string; res?: { weight?: number } };
  sgs?: { agency?: string; no?: string; grade?: string; result?: string; remarks?: string };
  hold?: { t?: string; note?: string } | null;
  hist?: Array<{ text?: string; note?: string }>;
}, vr: SellVariation | null): string[] {
  if (o.kind && o.kind !== 'sell') return [];
  const blocks: string[] = [];
  const agency = String(o.insp?.agency || o.sgs?.agency || '').trim();
  if (!agency || agency === '—' || agency === 'Inspection') blocks.push('An inspection agency has not been assigned.');
  if (!(o.insp?.res && o.insp.res.weight != null)) blocks.push('The inspected quantity has not been recorded.');
  if (!o.sgs?.no) blocks.push('The inspection report and certificate have not been uploaded.');
  else if (!String(o.sgs.result || '').trim()) blocks.push('The inspection report has no result.');
  if (o.sgs?.no && isNonCompliantReport(o.sgs.result)) {
    const why = String(o.sgs.remarks || '').trim() || (o.sgs.grade ? `grade ${o.sgs.grade}` : 'no remarks were recorded');
    blocks.push(`The inspection report ${o.sgs.no} is non-compliant (${why}). Final approval stays blocked until a corrected report is uploaded.`);
  }
  if (o.hold?.t === 'discrepancy') {
    blocks.push(discrepancyState(o.hold.note) === 'rejected'
      ? 'The quantity discrepancy was rejected. Final approval stays blocked.'
      : 'A quantity discrepancy is pending. Final approval stays blocked until it is resolved.');
  } else if (vr && !discrepancyResolved(o)) {
    if (!vr.qtyMatch) blocks.push(`Quantity discrepancy is unresolved. Declared ${vr.declared} ${o.sell?.unit || ''}, inspected ${vr.cert}.`);
    if (!vr.gradeMatch) blocks.push(`Certified grade ${o.sgs?.grade || '—'} does not match declared grade ${o.sell?.grade || '—'}.`);
  }
  return blocks;
}

export function discrepancySummary(o: { id?: string; sell?: { grade?: string; unit?: string }; sgs?: { grade?: string; result?: string }; insp?: { res?: { result?: string; notes?: string } }; total?: number }, vr: SellVariation) {
  const unit = o.sell?.unit || '';
  const declaredGrade = o.sell?.grade || '—';
  const certifiedGrade = o.sgs?.grade || '—';
  const findings = [o.insp?.res?.result, o.insp?.res?.notes, o.sgs?.result].filter((part) => part && String(part).trim()).join(' · ');
  const quoted = vr.quoted ?? o.total ?? 0;
  return [
    `Quantity discrepancy on ${o.id}.`,
    `Declared ${vr.declared} ${unit}, grade ${declaredGrade}.`,
    `Certified ${vr.cert ?? '—'} ${unit}, grade ${certifiedGrade}.`,
    `Quantity difference ${(vr.qtyPct ?? 0).toFixed(2)}%.`,
    vr.gradeMatch ? 'Grade matches.' : `Grade differs (${declaredGrade} → ${certifiedGrade}).`,
    `Quoted amount $${quoted}.`,
    findings ? `Inspection findings: ${findings}.` : '',
    'Final approval and payment are blocked until this is corrected or resolved.',
  ].filter(Boolean).join(' ');
}
