// Regenerate public/sitemap.xml from the data modules so routes stay accurate.
// Source of truth: library/*.ts + essays/*.ts + static routes in App.tsx.
import fs from 'fs';
import path from 'path';

const BASE = 'https://fedormilovanov.github.io/TheLegendaryPoet';
const libDir = path.resolve('src/data/library');
const essaysDir = path.resolve('src/data/essays');
const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');

const poetFiles = fs
  .readdirSync(libDir)
  .filter((f) => f.endsWith('.ts') && !['index.ts', 'articles.ts', 'musicTracks.ts'].includes(f));
const poetIds = poetFiles
  .map((f) => (read(libDir, f).match(/^\s*id: '([a-z-]+)',/m) || [])[1])
  .filter(Boolean)
  .sort();

const articleIds = new Set();
for (const f of [...poetFiles, 'articles.ts']) {
  for (const m of read(libDir, f).matchAll(/id: '(article[a-z0-9-]*)'/g)) {
    articleIds.add(m[1]);
  }
}

// Essays live in src/data/essays/*.ts (not the index aggregator).
const essaySlugs = new Set();
if (fs.existsSync(essaysDir)) {
  for (const f of fs.readdirSync(essaysDir).filter((n) => n.endsWith('.ts') && n !== 'index.ts')) {
    const src = read(essaysDir, f);
    for (const m of src.matchAll(/slug:\s*'([a-z0-9-]+)'/g)) {
      essaySlugs.add(m[1]);
    }
  }
}

// Keep in sync with routes in src/App.tsx.
const staticRoutes = [
  { loc: '/', priority: '1.0', changefreq: 'monthly' },
  { loc: '/poets', priority: '0.8', changefreq: 'monthly' },
  { loc: '/hall', priority: '0.7', changefreq: 'monthly' },
  { loc: '/articles', priority: '0.8', changefreq: 'weekly' },
  { loc: '/music', priority: '0.8', changefreq: 'monthly' },
  { loc: '/about', priority: '0.7', changefreq: 'monthly' },
  { loc: '/archive', priority: '0.5', changefreq: 'monthly' },
];

const urls = [
  ...staticRoutes,
  ...[...essaySlugs].sort().map((slug) => ({
    loc: `/essays/${slug}`,
    priority: '0.9',
    changefreq: 'monthly',
  })),
  ...poetIds.map((id) => ({ loc: `/poets/${id}`, priority: '0.7', changefreq: 'monthly' })),
  ...[...articleIds].sort().map((id) => ({
    loc: `/articles/${id}`,
    priority: '0.6',
    changefreq: 'monthly',
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${BASE}${u.loc === '/' ? '/' : u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync('public/sitemap.xml', xml);
console.log(
  `sitemap.xml: ${urls.length} urls (${poetIds.length} poets, ${articleIds.size} articles, ${essaySlugs.size} essays)`,
);
