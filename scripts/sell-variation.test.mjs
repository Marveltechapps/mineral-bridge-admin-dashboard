import assert from 'node:assert/strict';
import test from 'node:test';
import { discrepancySummary, sellPriceVariation } from '../src/services/console/sellVariation.ts';

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
