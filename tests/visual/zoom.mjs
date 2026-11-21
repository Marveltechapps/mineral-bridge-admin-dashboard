// Crops the same region from the original and react screenshots and writes a
// 3x enlarged side-by-side image for inspection.
import fs from 'node:fs';
import { PNG } from 'pngjs';
const [name, x, y, w, h, scale = 3] = process.argv.slice(2);
const X = +x, Y = +y, W = +w, H = +h, S = +scale;
const imgs = ['original', 'react'].map((k) => PNG.sync.read(fs.readFileSync(`test-results/visual/${name}-${k}.png`)));
const out = new PNG({ width: W * S * 2 + 10, height: H * S });
out.data.fill(255);
imgs.forEach((img, n) => {
  for (let yy = 0; yy < H * S; yy++)
    for (let xx = 0; xx < W * S; xx++) {
      const sx = X + Math.floor(xx / S), sy = Y + Math.floor(yy / S);
      if (sx >= img.width || sy >= img.height) continue;
      const si = (sy * img.width + sx) * 4, di = (yy * out.width + xx + n * (W * S + 10)) * 4;
      for (let c = 0; c < 4; c++) out.data[di + c] = img.data[si + c];
    }
});
fs.writeFileSync(`test-results/visual/${name}-zoom.png`, PNG.sync.write(out));
