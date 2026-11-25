import assert from 'node:assert/strict';
import test from 'node:test';
import { approvalBlockers, discrepancyRecord, discrepancySummary, sellPriceVariation } from '../src/services/console/sellVariation.ts';

const quoted = {
  kind: 'sell',
  id: 'MB-SELL-26-90417',
  total: 3195,
  sell: { qty: 2, unit: 'kg', grade: '88%' },
  quotes: [{
    status: 'accepted',
    lines: [{ name: 'Gold', qty: 2000, unit: 'kg', price: 3200, unitPrice: 2 }],
    prod: 3200,
    deduct: 5,
    total: 3195,
  }],
};

test('matching quantity and grade is 0% and does not change the quote', () => {
  const vr = sellPriceVariation({ ...quoted, sgs: { net: 2, grade: '88%', result: 'Compliant' } });
  assert.ok(vr);
  assert.equal(vr.unit, 1600);
  assert.equal(vr.pct, 0);
  assert.equal(vr.qtyPct, 0);
  assert.equal(vr.fair, 3195);
  assert.equal(vr.quoted, 3195);
  assert.equal(vr.material, false);
  assert.equal(vr.qtyMatch, true);
  assert.equal(vr.gradeMatch, true);
});

test('a gram-sized line quantity does not set the unit price', () => {
  const vr = sellPriceVariation({
    ...quoted,
    quotes: [{ ...quoted.quotes[0], prod: 3195, lines: [{ name: 'Gold', qty: 2000, unit: 'kg', price: 3200, unitPrice: 2 }] }],
    sgs: { net: 2, grade: '88%', result: 'Compliant' },
  });
  assert.ok(vr);
  assert.equal(vr.unit, 1600);
  assert.equal(vr.pct, 0);
  assert.equal(vr.fair, 3195);
});

test('a different certified quantity is a real variation and blocks approval', () => {
  const vr = sellPriceVariation({ ...quoted, sgs: { net: 1.5, grade: '88%', result: 'Compliant' } });
  assert.ok(vr);
  assert.equal(vr.qtyMatch, false);
  assert.equal(vr.fair, 2395);
  assert.equal(vr.pct.toFixed(2), '-25.04');
  assert.equal(vr.material, true);
});

test('certified quantity of zero is a discrepancy', () => {
  const vr = sellPriceVariation({ ...quoted, sgs: { net: 0, grade: '88%', result: 'Compliant' } });
  assert.ok(vr);
  assert.equal(vr.qtyMatch, false);
  assert.equal(vr.fair, 0);
  assert.equal(vr.pct, -100);
  assert.equal(vr.material, true);
});

test('a compliant matching inspection has nothing blocking approval', () => {
  const order = { ...quoted, insp: { agency: 'Intertek', res: { weight: 2 } }, sgs: { no: '123456', grade: '88%', net: 2, result: 'Compliant' } };
  const vr = sellPriceVariation(order);
  assert.deepEqual(approvalBlockers(order, vr), []);
});

test('a non-compliant report blocks approval even when the quantity matches', () => {
  const order = { ...quoted, insp: { agency: 'Intertek', res: { weight: 2, result: 'Quantity and condition verified' } }, sgs: { agency: 'Intertek', no: '123456', grade: '88%', net: 2, result: 'Non-compliant' } };
  const vr = sellPriceVariation(order);
  assert.equal(vr.qtyMatch, true);
  assert.equal(vr.failed, true);
  const blocks = approvalBlockers(order, vr);
  assert.equal(blocks.length, 1);
  assert.match(blocks[0], /123456/);
  assert.match(blocks[0], /non-compliant/);
  assert.equal(order.sgs.result, 'Non-compliant');
});

test('an unresolved quantity difference blocks approval and a resolved one does not', () => {
  const order = { ...quoted, insp: { agency: 'Intertek', res: { weight: 1.5 } }, sgs: { no: '123456', grade: '88%', net: 1.5, result: 'Compliant' } };
  const open = approvalBlockers(order, sellPriceVariation(order));
  assert.match(open.join(' '), /Quantity discrepancy is unresolved/);
  const resolved = approvalBlockers({ ...order, hist: [{ text: 'Discrepancy resolved', note: 'Discrepancy resolved: accepted' }] }, sellPriceVariation(order));
  assert.deepEqual(resolved, []);
  const pending = approvalBlockers({ ...order, hold: { t: 'discrepancy', note: discrepancyRecord({ declared: 2, actual: 1.5, unit: 'kg', reason: 'short weight' }) } }, sellPriceVariation(order));
  assert.match(pending.join(' '), /pending/);
});

test('a grade difference blocks approval without changing the quoted amount', () => {
  const vr = sellPriceVariation({ ...quoted, sgs: { net: 2, grade: '90%', result: 'Compliant' } });
  assert.ok(vr);
  assert.equal(vr.qtyMatch, true);
  assert.equal(vr.gradeMatch, false);
  assert.equal(vr.pct, 0);
  assert.equal(vr.fair, 3195);
  assert.equal(vr.material, true);
  const text = discrepancySummary({ ...quoted, sgs: { grade: '90%', result: 'Compliant' } }, vr);
  assert.match(text, /Grade differs/);
  assert.match(text, /Quoted amount \$3195/);
});
