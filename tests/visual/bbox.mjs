// Lists clusters (by 40px rows) of differing pixels between original and react screenshots.
import fs from 'node:fs';
import { PNG } from 'pngjs';
const name = process.argv[2];
const A = PNG.sync.read(fs.readFileSync(`test-results/visual/${name}-original.png`));
const B = PNG.sync.read(fs.readFileSync(`test-results/visual/${name}-react.png`));
const w = Math.min(A.width, B.width), h = Math.min(A.height, B.height);
const bands = new Map();
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const i = (y * A.width + x) * 4, j = (y * B.width + x) * 4;
  let d = 0; for (let c = 0; c < 3; c++) d += Math.abs(A.data[i + c] - B.data[j + c]);
  if (d > 60) { const k = Math.floor(y / 40); const b = bands.get(k) || { n: 0, x0: 1e9, x1: 0, y0: 1e9, y1: 0 }; b.n++; b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y); bands.set(k, b); }
}
for (const [, b] of [...bands].sort((a, c) => a[0] - c[0])) console.log(`y ${b.y0}-${b.y1}  x ${b.x0}-${b.x1}  px ${b.n}`);
