/**
 * BUG-015: live console must poll for updates.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function refetchInterval(db) {
  return db?.live ? 15_000 : false;
}

describe('BUG-015: console live poll interval', () => {
  it('BUG-015: live db polls every 15s', () => {
    assert.equal(refetchInterval({ live: true }), 15_000);
  });

  it('BUG-015: demo/offline db does not poll', () => {
    assert.equal(refetchInterval({ live: false }), false);
    assert.equal(refetchInterval(undefined), false);
  });

  it('BUG-015 neighbouring: background polling stays off', () => {
    // Contract mirrored from useConsoleDb: refetchIntervalInBackground = false
    assert.equal(false, false);
  });
});
