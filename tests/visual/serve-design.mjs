/**
 * Static server for the original design bundle (design-src/) used as the
 * reference by compare.mjs / measure.mjs.
 * Usage: node tests/visual/serve-design.mjs [port=5181]
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve('design-src');
const port = Number(process.argv[2] || 5181);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };

http
  .createServer((req, res) => {
    const rel = decodeURIComponent((req.url || '/').split('?')[0]);
    const file = path.join(root, rel.endsWith('/') ? `${rel}index.html` : rel);
    if (!file.startsWith(root)) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('not found');
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(port, () => console.log(`design reference on http://localhost:${port}/original-bundle.html`));
