import { expect, test, type Page } from '@playwright/test';

/** Opens the console with an active demo session (skips the sign-in UI). */
async function signedIn(page: Page, path = '/overview', theme: 'light' | 'dark' = 'light') {
  // Seed only once so reloads keep whatever the test changed.
  await page.addInitScript((t) => {
    if (!localStorage.getItem('mb-theme')) localStorage.setItem('mb-theme', t);
    if (!sessionStorage.getItem('mb-session')) sessionStorage.setItem('mb-session', JSON.stringify({ stage: 'app', roleIndex: 0 }));
  }, theme);
  await page.goto(path);
}

async function openNav(page: Page) {
  const menu = page.getByRole('button', { name: 'Open navigation' });
  if (await menu.isVisible()) await menu.click();
}

test('opens the overview from a staff session without listing passwords', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /staff test credentials/i })).toHaveCount(0);
  await expect(page.getByText(/DEMO ADMIN ACCOUNTS/i)).toHaveCount(0);
  await signedIn(page, '/overview');
  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
});

test('rejects a wrong password with the design message', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('firstname.lastname@mineralbridge.co.ke').fill('grace.kioko@mineralbridge.co.ke');
  await page.getByPlaceholder('Enter your password').fill('nope');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Incorrect password for grace.kioko@mineralbridge.co.ke.');
});

const MODULES: Array<[string, string]> = [
  ['Orders', 'Orders'],
  ['Vault & Inventory', 'Vault & Inventory'],
  ['Catalog Listings', 'Catalog Listings'],
  ['Pricing & Rates', 'Pricing & Rates'],
  ['Auctions', 'Auctions'],
  ['LC & Payments', 'LC & Payments'],
  ['Collaboration', 'Collaboration'],
  ['Blockchain Monitor', 'Blockchain Monitor'],
  ['Users & Accounts', 'Users & Accounts'],
  ['Verification & Compliance', 'Verification & Compliance'],
  ['Disputes & Resolution', 'Disputes & Resolution'],
  ['Academy', 'Academy'],
  ['Marketing', 'Marketing'],
  ['Partners & Logistics', 'Partners & Logistics'],
  ['Enquiries & Support', 'Enquiries & Support'],
  ['Audit Log', 'Audit Log'],
  ['Financial & Reporting', 'Financial & Reporting'],
  ['Analytics', 'Analytics'],
  ['Settings', 'Settings'],
  ['Profile', 'Profile'],
];

test('sidebar navigates to every module', async ({ page }) => {
  await signedIn(page);
  for (const [link, title] of MODULES) {
    await openNav(page);
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: new RegExp(`^${link.replace(/[&]/g, '\\&')}`) }).click();
    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
  }
});

test('no page-level horizontal overflow on any console route', async ({ page }) => {
  test.setTimeout(120_000);
  const routes = ['/overview', '/orders', '/orders/MB-SELL-41982', '/vault/MBV-2026-0417', '/listings/MBL-2026-0112', '/pricing', '/auctions/live/AUC-2026-0219', '/lc', '/collab', '/chain', '/users/Joseph%20Kiptoo', '/verification', '/disputes/DSP-2026-0071', '/academy/analytics', '/financial', '/analytics', '/settings', '/profile'];
  await signedIn(page);
  for (const r of routes) {
    await page.goto(r);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `horizontal overflow on ${r}`).toBeLessThanOrEqual(0);
  }
});

test('search, filter chips and sorting work on the vault list', async ({ page }) => {
  await signedIn(page, '/vault');
  await expect(page.getByText('Showing 10 of 10 lots in custody')).toBeVisible();
  await page.getByRole('button', { name: 'Reserved', exact: true }).click();
  await expect(page.getByText('Showing 2 of 10 lots in custody')).toBeVisible();
  await page.getByRole('button', { name: 'All lots' }).click();
  await page.getByRole('textbox', { name: /Search orders/ }).fill('platinum');
  await expect(page.getByText('Showing 1 of 10 lots in custody')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await page.getByRole('columnheader', { name: /DAYS HELD/ }).click();
  await page.getByRole('columnheader', { name: /DAYS HELD/ }).click();
  await expect(page.getByRole('row').nth(1)).toContainText('MBV-2026-0344');
});

test('lot allocation switches panels and hands off to the auction form', async ({ page }) => {
  await signedIn(page, '/vault/MBV-2026-0412');
  await page.getByRole('button', { name: 'Create auction' }).click();
  await expect(page.getByText('SEND TO AUCTION')).toBeVisible();
  await page.getByRole('button', { name: 'Continue to auction form' }).click();
  await expect(page).toHaveURL(/\/auctions\/create$/);
  await expect(page.getByRole('radio', { name: /MBV-2026-0412/ })).toHaveAttribute('aria-checked', 'true');
});

test('drawer opens, closes on Escape and confirms on submit', async ({ page }) => {
  await signedIn(page, '/partners');
  await page.getByRole('button', { name: 'Add partner' }).click();
  await expect(page.getByRole('dialog', { name: 'Add partner' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add partner' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add partner' }).click();
  await expect(page.getByText('Partner added in Onboarding status')).toBeVisible();
});

test('theme toggle switches to dark and persists across reloads', async ({ page }) => {
  await signedIn(page);
  await page.getByRole('button', { name: 'Switch to dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('lock, unlock and sign out from the account menu', async ({ page }) => {
  await signedIn(page, '/lc');
  await page.getByRole('button', { name: /Account menu/ }).click();
  await page.getByRole('menuitem', { name: 'Lock console' }).click();
  await expect(page.getByRole('heading', { name: 'Console locked' })).toBeVisible();
  await page.getByRole('button', { name: 'Unlock console' }).click();
  await expect(page).toHaveURL(/\/lc$/);
  await page.getByRole('button', { name: /Account menu/ }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: "You're signed out" })).toBeVisible();
  await page.getByRole('button', { name: 'Sign in again' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('edit gate makes settings editable and BTC toggles respond', async ({ page }) => {
  await signedIn(page, '/settings/btc');
  const tanzania = page.getByRole('switch', { name: 'Bitcoin payments in Tanzania' });
  // aria-disabled switches stay clickable (they explain why they are locked).
  await tanzania.click({ force: true });
  await expect(page.getByText('Click Edit to change Bitcoin payment settings')).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await tanzania.click();
  await expect(tanzania).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText(/7 of 12 countries enabled/)).toBeVisible();
});
