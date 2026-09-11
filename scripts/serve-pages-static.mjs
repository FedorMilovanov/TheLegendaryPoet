import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'dist');
const port = Number(process.argv[3] || process.env.PORT || 4173);
const host = '127.0.0.1';

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.mp3', 'audio/mpeg'],
  ['.m4a', 'audio/mp4'],
  ['.mp4', 'video/mp4'],
  ['.glb', 'model/gltf-binary'],
]);

function safeRequestPath(rawUrl) {
  const url = new URL(rawUrl || '/', `http://${host}:${port}`);
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (!pathname.startsWith('/') || pathname.includes('\0')) return null;
  const resolved = path.resolve(root, `.${pathname}`);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return null;
  return resolved;
}

function resolveStaticFile(rawUrl) {
  const requested = safeRequestPath(rawUrl);
  if (!requested) return { status: 400, file: null };

  try {
    const stat = fs.statSync(requested);
    if (stat.isFile()) return { status: 200, file: requested };
    if (stat.isDirectory()) {
      const index = path.join(requested, 'index.html');
      if (fs.existsSync(index) && fs.statSync(index).isFile()) return { status: 200, file: index };
    }
  } catch {
    // Fall through to the dedicated Pages-style 404 document.
  }

  const notFound = path.join(root, '404.html');
  return { status: 404, file: fs.existsSync(notFound) ? notFound : null };
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }

  const { status, file } = resolveStaticFile(req.url);
  if (!file) {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(status === 400 ? 'Bad Request' : 'Not Found');
    return;
  }

  const body = fs.readFileSync(file);
  res.writeHead(status, {
    'Content-Type': contentTypes.get(path.extname(file).toLowerCase()) || 'application/octet-stream',
    'Content-Length': String(body.length),
    'Cache-Control': 'no-store',
  });
  res.end(req.method === 'HEAD' ? undefined : body);
});

server.listen(port, host, () => {
  console.log(`Pages-like static server: http://${host}:${port} -> ${root}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
