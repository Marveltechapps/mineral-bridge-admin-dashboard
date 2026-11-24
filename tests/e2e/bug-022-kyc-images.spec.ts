import { expect, test } from '@playwright/test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const docs = [
  { kind: 'idFront', label: 'National ID (NIN) — front', name: 'id-front.png', status: 'submitted', note: '', fileId: 'fil_front', mimeType: 'image/png', url: '/v2/admin/files/fil_front/content', availability: 'ready' },
  { kind: 'idBack', label: 'National ID (NIN) — back', name: 'id-back.png', status: 'submitted', note: '', fileId: 'fil_back', mimeType: 'image/png', url: '/v2/admin/files/fil_back/content', availability: 'ready' },
  { kind: 'business', label: 'Business registration', name: 'company-registration.pdf', status: 'submitted', note: '', fileId: 'fil_biz', mimeType: 'application/pdf', url: '/v2/admin/files/fil_biz/content', availability: 'ready' },
  { kind: 'address', label: 'Proof of address', name: 'address.png', status: 'submitted', note: '', fileId: 'fil_gone', mimeType: '', url: '', availability: 'unavailable' },
];

function emptyLists() {
  return { lots: [], orders: [], auctions: [], refunds: [], docs: [], threads: [], deliveries: [], audit: [], partners: [], admins: [], dtpl: [] };
}

test('@bugfix @admin BUG-022 admin opens a KYC submission and sees every uploaded image', async ({ page }) => {
  const db = {
    v: 4,
    live: true,
    ...emptyLists(),
    customers: [{ id: 'C-022', name: 'Ada Miner', business: 'Ada Mining', email: 'ada.kyc@example.com', whatsapp: '+2348010000022', country: 'NG', role: 'seller', buyerType: '', sellerType: 'dealer', signin: 'email', kyc: 'pending', status: 'active', joined: Date.now(), prefs: { email: true }, kycRef: 'KYC-2026-10022' }],
    kyc: [{ ref: 'KYC-2026-10022', cust: 'C-022', idType: 'nin', biz: true, at: Date.now(), status: 'pending', docs, reason: '', reviewedBy: '', live: true }],
    settings: {},
    totals: { kyc: 1, customers: 1 },
    pageSize: 100,
  };

  await page.route('**/v2/admin/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/files/') && url.endsWith('/content')) {
      await route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
      return;
    }
    if (url.includes('/me/actions')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ roleKey: 'super' }) });
      return;
    }
    if (url.endsWith('/me') || url.includes('/me?')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'Bug CEO', email: 'bug022.ceo@mineralbridge.test', role: { id: 'ROLE-CEO', name: 'CEO' } }) });
      return;
    }
    if (url.includes('/console')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(db) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/overview');
  // A live session sets auth after the first paint, which lands on Overview.
  await page.getByRole('button', { name: 'Customers & KYC' }).click();
  await page.getByRole('button', { name: 'KYC queue' }).click();
  await page.getByText('KYC-2026-10022').click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('National ID (NIN) — front')).toBeVisible();
  await expect(dialog.getByText('National ID (NIN) — back')).toBeVisible();
  await expect(dialog.getByText('Business registration')).toBeVisible();
  await expect(dialog.getByText('unavailable')).toBeVisible();
  await expect(dialog.locator('[style*="fil_front"]')).toHaveCount(1);
  await expect(dialog.locator('[style*="fil_back"]')).toHaveCount(1);
  await expect(dialog.locator('[style*="fil_biz"]')).toHaveCount(1);
});
