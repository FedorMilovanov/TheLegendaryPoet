// Regenerate public/sitemap.xml from the data modules so routes stay accurate.
import fs from 'fs';
import path from 'path';

const BASE = 'https://thelegendarypoet.ru';
const libDir = path.resolve('src/data/library');
const essaysDir = path.resolve('src/data/essays');
const read = (f) => fs.readFileSync(path.join(libDir, f), 'utf8');

const poetFiles = fs.readdirSync(libDir).filter((f) => f.endsWith('.ts') && !['index.ts', 'articles.ts', 'musicTracks.ts'].includes(f));
const poetIds = poetFiles.map((f) => (read(f).match(/^\s*id: '([a-z-]+)',/m) || [])[1]).filter(Boolean);

const articleIds = new Set();
for (const f of [...poetFiles, 'articles.ts']) {
  for (const m of read(f).matchAll(/id: '(article[a-z0-9-]*)'/g)) articleIds.add(m[1]);
}

const essaySlugs = fs.readdirSync(essaysDir)
  .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
  .map((f) => (fs.readFileSync(path.join(essaysDir, f), 'utf8').match(/^\s*slug:\s*['"]([a-z0-9-]+)['"]/m) || [])[1])
  .filter(Boolean);

const staticRoutes = ['/', '/hall', '/poets', '/articles', '/music', '/about'];
const urls = [
  ...staticRoutes.map((u) => ({ loc: u, priority: u === '/' ? '1.0' : '0.8' })),
  ...essaySlugs.map((slug) => ({ loc: `/essays/${slug}`, priority: '0.9' })),
  ...poetIds.map((id) => ({ loc: `/poets/${id}`, priority: '0.7' })),
  ...[...articleIds].map((id) => ({ loc: `/articles/${id}`, priority: '0.6' })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${BASE}${u.loc}</loc><changefreq>monthly</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;

fs.writeFileSync('public/sitemap.xml', xml);
console.log(`sitemap.xml: ${urls.length} urls (${poetIds.length} poets, ${essaySlugs.length} essays, ${articleIds.size} articles)`);
