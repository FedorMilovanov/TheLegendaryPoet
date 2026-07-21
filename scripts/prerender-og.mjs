// Prerender real static HTML files (with per-page Open Graph tags) for the
// site's shareable deep links: essays, poets, and legacy articles.
//
// Why this exists: GitHub Pages serves 404.html (a copy of index.html, see
// deploy.yml's "SPA fallback" step) for any path that isn't a real file, and
// it does so with an HTTP 404 status. Link-unfurl bots (Telegram, WhatsApp,
// Slack, ...) don't run JavaScript and many of them refuse to build a
// preview card at all when the response status isn't 200 — so a shared
// article link showed no image/title, even though the OG tags were
// technically present in the body via useSeo(). Writing a real
// `dist/<route>/index.html` per shareable page fixes both problems: GitHub
// Pages serves it directly with 200, and the tags are already correct in
// the raw HTML the bot fetches. React still mounts on top and takes over
// client-side routing once the page loads for real visitors.
//
// Run via `tsx` so it can import the same TS data modules the app uses —
// no duplicated/hand-maintained content, so it can't drift from the site.
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = 'https://thelegendarypoet.ru';
const DIST = path.resolve('dist');
const PUBLIC = path.resolve('public');
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

function absUrl(pathOrUrl) {
  if (!pathOrUrl) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;

  const publicPath = path.resolve(PUBLIC, pathOrUrl.replace(/^\//, ''));
  if (!fs.existsSync(publicPath)) {
    console.warn(`prerender-og: missing image ${pathOrUrl}; using default OG image`);
    return DEFAULT_OG_IMAGE;
  }

  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Swap the static index.html's title/description/canonical/OG/Twitter tags for page-specific ones. */
function renderPage({ title, description, routePath, image, type = 'website', publishedTime, author }) {
  const url = `${SITE_URL}${routePath}`;
  const img = absUrl(image);
  const t = escapeHtml(title);
  const d = escapeHtml(description);

  let html = template;
  html = html.replace(/<title>.*?<\/title>/, `<title>${t}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${d}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${url}" />`);

  html = html.replace(/<meta property="og:type" content="[^"]*"\s*\/>/, `<meta property="og:type" content="${type}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${t}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${d}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${url}" />`);
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${img}" />`);

  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${t}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${d}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${img}" />`);

  if (type === 'article') {
    const articleMeta = [
      publishedTime ? `<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />` : '',
      author ? `<meta property="article:author" content="${escapeHtml(author)}" />` : '',
    ].filter(Boolean).join('\n    ');
    if (articleMeta) html = html.replace('</head>', `    ${articleMeta}\n  </head>`);
  }

  return html;
}

/**
 * GitHub Pages resolves extensionless "pretty" URLs differently depending on
 * whether the request has a trailing slash, and that behaviour isn't worth
 * gambling on — so write BOTH forms: `<route>/index.html` (serves `/route/`,
 * and `/route` on hosts that do directory-index resolution without a slash)
 * and `<route>.html` (serves `/route` on hosts that try appending `.html`).
 * Belt and suspenders; the files are tiny text, so the duplication is free.
 */
function write(routePath, html) {
  const rel = routePath.replace(/^\//, '');
  const outDir = path.join(DIST, rel);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  fs.writeFileSync(path.join(DIST, `${rel}.html`), html);
}

async function main() {
  const [{ getAllEssays }, { poets, articles }] = await Promise.all([
    import(path.resolve('src/data/essays/index.ts')),
    import(path.resolve('src/data/poets.ts')),
  ]);

  let count = 0;

  for (const essay of getAllEssays()) {
    const html = renderPage({
      title: `${essay.title} — THE LEGENDARY POET`,
      description: essay.excerpt,
      routePath: `/essays/${essay.slug}`,
      image: essay.cover,
      type: 'article',
      publishedTime: essay.date,
      author: essay.author,
    });
    write(`/essays/${essay.slug}`, html);
    count++;
  }

  for (const poet of poets) {
    const html = renderPage({
      title: `${poet.name} — THE LEGENDARY POET`,
      description: poet.shortBio,
      routePath: `/poets/${poet.id}`,
      image: poet.photo,
      type: 'profile',
    });
    write(`/poets/${poet.id}`, html);
    count++;
  }

  for (const article of articles) {
    const html = renderPage({
      title: `${article.title} — THE LEGENDARY POET`,
      description: article.excerpt,
      routePath: `/articles/${article.id}`,
      image: article.image,
      type: 'article',
      publishedTime: article.date,
      author: article.author,
    });
    write(`/articles/${article.id}`, html);
    count++;
  }

  console.log(`prerender-og: wrote ${count} static pages (${getAllEssays().length} essays, ${poets.length} poets, ${articles.length} articles)`);
}

main();
