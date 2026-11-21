/**
 * Debug helper: prints bounding boxes + computed type metrics for elements
 * whose text matches, in the original design and in the React app.
 * Usage: node tests/visual/measure.mjs <route> '<original setState patch JSON>' "Text A" "Text B" …
 */
import { chromium } from '@playwright/test';

const [route, origPatch, ...texts] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome' });

async function boxes(page) {
  return page.evaluate(
    (texts) =>
      texts.map((t) => {
        const el = [...document.querySelectorAll('span,div,h1,h2,button,dt,dd')].filter((e) => e.textContent.trim() === t).pop();
        if (!el) return [t, 'not found'];
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return [t, [r.x, r.y, r.width, r.height].map((n) => n.toFixed(2)).join(','), cs.fontSize, cs.fontWeight, cs.lineHeight, cs.letterSpacing, cs.display];
      }),
    texts,
  );
}

async function context() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => {
    localStorage.setItem('mb-theme', 'light');
    sessionStorage.setItem('mb-session', JSON.stringify({ stage: 'app', roleIndex: 0 }));
  });
  return ctx;
}

const o = await (await context()).newPage();
await o.goto('http://localhost:5181/original-bundle.html');
await o.waitForFunction(() => !!document.querySelector('input'));
await o.evaluate((patch) => {
  for (const n of document.querySelectorAll('*')) {
    const k = Object.keys(n).find((x) => x.startsWith('__reactFiber'));
    if (!k) continue;
    let f = n[k];
    while (f) {
      const sn = f.stateNode;
      if (sn && typeof sn === 'object' && !(sn instanceof Node)) {
        const l = Object.values(sn).find((v) => v && typeof v === 'object' && v.__host && v.state && 'nav' in v.state);
        if (l) {
          l.setState(patch);
          return;
        }
      }
      f = f.return;
    }
  }
}, JSON.parse(origPatch));
await o.waitForTimeout(500);

const r = await (await context()).newPage();
await r.goto('http://localhost:5190' + route);
await r.waitForTimeout(800);

const a = await boxes(o);
const b = await boxes(r);
a.forEach((x, i) => console.log('O', x.join(' | '), '\nR', b[i].join(' | ')));
await browser.close();
