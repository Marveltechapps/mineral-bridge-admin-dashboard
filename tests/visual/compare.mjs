/**
 * Visual diff harness: renders the ORIGINAL design bundle and the React app in
 * the same state at the same viewport, screenshots both with Chrome and
 * pixel-diffs them.
 *
 * Requires:  design server  → http://localhost:5181/original-bundle.html
 *            React dev app  → http://localhost:5190
 * Usage:     node tests/visual/compare.mjs [stateName ...] [--width=1440] [--height=900] [--dark]
 * Output:    test-results/visual/<state>-{original,react,diff}.png + summary table
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { STATES } from './states.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const width = Number(opt('width', 1440));
const height = Number(opt('height', 900));
const dark = args.includes('--dark');
const only = args.filter((a) => !a.startsWith('--'));
const ORIGINAL = 'http://localhost:5181/original-bundle.html';
const APP = 'http://localhost:5190';
const outDir = path.resolve('test-results/visual');
fs.mkdirSync(outDir, { recursive: true });

const theme = dark ? 'dark' : 'light';

async function shootOriginal(browser, state) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', colorScheme: theme });
  await ctx.addInitScript((t) => localStorage.setItem('mb-theme', t), theme);
  const page = await ctx.newPage();
  await page.goto(ORIGINAL);
  await page.waitForFunction(() => !!document.querySelector('input'));
  await page.evaluate((patch) => {
    let inst = null;
    for (const n of document.querySelectorAll('*')) {
      const k = Object.keys(n).find((x) => x.startsWith('__reactFiber'));
      if (!k) continue;
      let f = n[k];
      while (f) {
        const sn = f.stateNode;
        if (sn && typeof sn === 'object' && !(sn instanceof Node)) {
          // The DC runtime keeps template state on a logic object hung off the host component.
          const logic = Object.values(sn).find((v) => v && typeof v === 'object' && v.__host && v.state && 'nav' in v.state);
          if (logic) {
            inst = logic;
            break;
          }
        }
        f = f.return;
      }
      if (inst) break;
    }
    if (!inst) throw new Error('design component not found');
    inst.setState(patch);
  }, state.original);
  await page.waitForTimeout(600);
  if (state.originalClick) await page.getByText(state.originalClick, { exact: true }).first().click();
  await page.waitForTimeout(300);
  const file = path.join(outDir, `${state.name}-original.png`);
  await page.screenshot({ path: file, fullPage: !state.viewportOnly });
  await ctx.close();
  return file;
}

async function shootReact(browser, state) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', colorScheme: theme });
  await ctx.addInitScript(
    ([t, stage]) => {
      localStorage.setItem('mb-theme', t);
      sessionStorage.setItem('mb-session', JSON.stringify({ stage, roleIndex: 0 }));
    },
    [theme, state.stage || 'app'],
  );
  const page = await ctx.newPage();
  await page.goto(APP + state.route);
  await page.waitForFunction(() => !!window.__mb);
  if (state.react) {
    await page.evaluate((patch) => {
      const { consoleStore } = window.__mb;
      const s = consoleStore.getState();
      consoleStore.setState({ ...patch, filters: { ...s.filters, ...(patch.filters || {}) } });
    }, state.react);
  }
  if (state.session) await page.evaluate((patch) => window.__mb.sessionStore.setState(patch), state.session);
  await page.waitForTimeout(600);
  if (state.reactClick) await page.getByText(state.reactClick, { exact: true }).first().click();
  await page.waitForTimeout(300);
  const file = path.join(outDir, `${state.name}-react.png`);
  await page.screenshot({ path: file, fullPage: !state.viewportOnly });
  const errors = [];
  await ctx.close();
  return { file, errors };
}

function diff(name, a, b) {
  const A = PNG.sync.read(fs.readFileSync(a));
  const B = PNG.sync.read(fs.readFileSync(b));
  const w = Math.min(A.width, B.width);
  const h = Math.min(A.height, B.height);
  const crop = (img) => {
    const out = new PNG({ width: w, height: h });
    PNG.bitblt(img, out, 0, 0, w, h, 0, 0);
    return out;
  };
  const ca = crop(A);
  const cb = crop(B);
  const d = new PNG({ width: w, height: h });
  const n = pixelmatch(ca.data, cb.data, d.data, w, h, { threshold: 0.1 });
  fs.writeFileSync(path.join(outDir, `${name}-diff.png`), PNG.sync.write(d));
  return { pct: (n / (w * h)) * 100, ha: A.height, hb: B.height };
}

const browser = await chromium.launch({ channel: 'chrome' });
const rows = [];
for (const state of STATES.filter((s) => !only.length || only.includes(s.name))) {
  try {
    const a = await shootOriginal(browser, state);
    const { file: b } = await shootReact(browser, state);
    const r = diff(state.name, a, b);
    rows.push({ state: state.name, diffPct: r.pct.toFixed(2), originalH: r.ha, reactH: r.hb });
  } catch (e) {
    rows.push({ state: state.name, diffPct: 'ERR', originalH: '-', reactH: String(e.message).slice(0, 80) });
  }
}
await browser.close();
console.table(rows);
fs.writeFileSync(path.join(outDir, `summary-${width}x${height}-${theme}.json`), JSON.stringify(rows, null, 2));
