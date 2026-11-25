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
