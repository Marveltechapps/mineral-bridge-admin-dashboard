/**
 * Responsive audit: loads every console route at the five target viewports,
 * reports page-level horizontal overflow and elements that poke outside the
 * viewport (ignoring content inside intentional horizontal scrollers), and
 * saves a screenshot per route/viewport for review.
 *
 * Usage: node tests/visual/responsive.mjs [route ...]
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const APP = 'http://localhost:5190';
const VIEWPORTS = [
  [1440, 900],
  [1366, 768],
  [768, 1024],
  [390, 844],
  [320, 568],
];
const ROUTES = [
  '/login', '/verify', '/locked', '/signed-out',
  '/overview', '/orders', '/orders/MB-SELL-41982', '/orders/intake', '/vault', '/vault/MBV-2026-0417', '/listings', '/listings/MBL-2026-0112',
  '/pricing', '/pricing/offers', '/auctions', '/auctions/upcoming', '/auctions/ended', '/auctions/create', '/auctions/live/AUC-2026-0219', '/auctions/ended/AUC-2026-0214',
  '/lc', '/collab', '/chain', '/users', '/users/tiers', '/users/Joseph%20Kiptoo', '/verification', '/verification/expiry', '/disputes', '/disputes/DSP-2026-0071',
  '/academy', '/academy/analytics', '/marketing', '/partners', '/support', '/support/calls', '/audit', '/financial', '/analytics', '/settings', '/settings/platform', '/settings/btc', '/profile',
];
const STAGE = { '/login': 'login', '/verify': 'otp', '/locked': 'locked', '/signed-out': 'out' };
const only = process.argv.slice(2);
const outDir = path.resolve('test-results/responsive');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const problems = [];
let checks = 0;
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', isMobile: w < 768, hasTouch: w < 768 });
  for (const route of ROUTES.filter((r) => !only.length || only.includes(r))) {
    await ctx.addInitScript((stage) => {
      localStorage.setItem('mb-theme', 'light');
      sessionStorage.setItem('mb-session', JSON.stringify({ stage, roleIndex: 0 }));
    }, STAGE[route] || 'app');
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(APP + route);
    await page.waitForTimeout(450);
    const res = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const pageOverflow = document.documentElement.scrollWidth - vw;
      const offenders = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.right <= vw + 1) continue;
        // Skip anything inside an intentional horizontal scroller or a closed off-canvas drawer.
        let p = el.parentElement;
        let contained = false;
        while (p && p !== document.body) {
          const cs = getComputedStyle(p);
          if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden' || cs.visibility === 'hidden') {
            contained = true;
            break;
          }
          p = p.parentElement;
        }
        if (getComputedStyle(el).visibility === 'hidden') contained = true;
        if (!contained) offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} → ${Math.round(r.right)}px`);
      }
      return { pageOverflow, offenders: offenders.slice(0, 4) };
    });
    checks++;
    const name = `${w}x${h}${route.replace(/[/%]/g, '_')}.png`;
    await page.screenshot({ path: path.join(outDir, name), fullPage: false });
    if (res.pageOverflow > 0 || res.offenders.length || errors.length) problems.push({ viewport: `${w}x${h}`, route, overflow: res.pageOverflow, offenders: res.offenders.join(' | '), errors: errors.join(' | ').slice(0, 120) });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(`checked ${checks} route/viewport combinations`);
if (problems.length) console.table(problems);
else console.log('no horizontal overflow, no off-screen elements, no console errors');
