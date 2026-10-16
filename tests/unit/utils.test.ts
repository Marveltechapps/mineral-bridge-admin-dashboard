import { describe, expect, it } from 'vitest';
import { authenticateDemo, resolveSso } from '@/services/auth';
import { resolveJump } from '@/hooks/useJump';
import { matchesQuery, money, numeric, sortRows } from '@/lib/collection';

describe('collection utils', () => {
  it('matches the header search across fields, case-insensitively', () => {
    expect(matchesQuery('', ['anything'])).toBe(true);
    expect(matchesQuery('  gold ', ['MB-SELL-1', 'Gold Concentrate'])).toBe(true);
    expect(matchesQuery('platinum', ['MB-SELL-1', 'Gold Concentrate'])).toBe(false);
  });

  it('sorts by the active column in both directions and leaves rows alone without a sort', () => {
    const rows = [{ n: 2 }, { n: 3 }, { n: 1 }];
    const fns = { n: (r: { n: number }) => r.n };
    expect(sortRows(rows, undefined, fns)).toBe(rows);
    expect(sortRows(rows, { k: 'n', d: 1 }, fns).map((r) => r.n)).toEqual([1, 2, 3]);
    expect(sortRows(rows, { k: 'n', d: -1 }, fns).map((r) => r.n)).toEqual([3, 2, 1]);
  });

  it('parses and formats money like the design', () => {
    expect(numeric('$1,174,000')).toBe(1174000);
    expect(numeric('18.4 kg')).toBe(18.4);
    expect(money(3988200)).toBe('$3.99M');
    expect(money(742000)).toBe('$742,000');
  });
});

describe('record jump resolver', () => {
  it('routes record references to the owning screen', () => {
    expect(resolveJump('Order MB-SELL-41982 moved to Inspection')).toBe('/orders/MB-SELL-41982');
    expect(resolveJump('Lot MBV-2026-0388 held 46 days')).toBe('/vault/MBV-2026-0388');
    expect(resolveJump('AUC-2026-0219 flagged')).toBe('/auctions/live/AUC-2026-0219');
    expect(resolveJump('Dispute DSP-2026-0071 opened')).toBe('/disputes/DSP-2026-0071');
    expect(resolveJump('Export permit expiring in 21 days')).toBe('/verification/expiry');
    expect(resolveJump('6 firm offers awaiting approval')).toBe('/pricing/offers');
    expect(resolveJump('Lot MBV-2026-0417 listed in Buy catalog')).toBe('/listings');
    expect(resolveJump('Something unrelated')).toBe('/audit');
  });
});

describe('demo staff authentication', () => {
  it('validates inputs with the design copy', () => {
    expect(authenticateDemo('', '')).toEqual({ ok: false, error: 'Enter your work email and password.' });
    expect(authenticateDemo('nobody@x.com', 'pw')).toEqual({ ok: false, error: 'No staff account matches that email.' });
    expect(authenticateDemo('Grace.Kioko@mineralbridge.co.ke', 'wrong')).toEqual({ ok: false, error: 'Incorrect password for grace.kioko@mineralbridge.co.ke.' });
    expect(authenticateDemo(' grace.kioko@mineralbridge.co.ke ', 'Desk2026!')).toEqual({ ok: true, index: 0 });
  });

  it('lets SSO continue with a known staff email only', () => {
    expect(resolveSso('lydia.achieng@mineralbridge.co.ke')).toEqual({ ok: true, index: 1 });
    expect(resolveSso('')).toEqual({ ok: false, error: 'Enter a staff email above, then continue with SSO.' });
  });
});
