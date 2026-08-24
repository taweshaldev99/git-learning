/* Minimal static file server for testing dist/ before deploying.

   Cloudflare Pages needs no server, but a browser does: opening the files over
   file:// leaves crypto.subtle unavailable, so sign-in would fail. http on
   localhost counts as a secure context, so this works.

   Run: npm run dev     then open http://localhost:8080
*/

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, '..', 'dist');
const PORT = Number(process.env.PORT) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

if (!fs.existsSync(DIST)) {
  console.error('no dist/ folder - run npm run build first');
  process.exit(1);
}

http
  .createServer((req, res) => {
    const urlPath = new URL(req.url, 'http://localhost').pathname;
    const target = path.resolve(DIST, urlPath === '/' ? 'index.html' : urlPath.slice(1));

    if (!target.startsWith(DIST + path.sep) && target !== DIST) {
      res.writeHead(403).end('forbidden');
      return;
    }

    fs.readFile(target, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'application/json' }).end('{"error":"not found"}');
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(target)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`\n  static build serving at http://localhost:${PORT}\n  Ctrl+C to stop\n`);
  });
