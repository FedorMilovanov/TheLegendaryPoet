// Regenerate public/sitemap.xml from the data modules so routes stay accurate.
import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.env.SITE_URL || 'https://thelegendarypoet.ru').replace(/\/$/, '');
const libDir = path.resolve('src/data/library');
const essaysDir = path.resolve('src/data/essays');
const readLibraryFile = (file) => fs.readFileSync(path.join(libDir, file), 'utf8');

const poetFiles = fs
  .readdirSync(libDir)
  .filter(
    (file) =>
      file.endsWith('.ts') &&
      !['index.ts', 'articles.ts', 'musicTracks.ts'].includes(file),
  )
  .sort();

const poetIds = poetFiles
  .map((file) => (readLibraryFile(file).match(/^\s*id:\s*['"]([a-z0-9-]+)['"]/m) || [])[1])
  .filter(Boolean)
  .sort();

const articleIds = new Set();
for (const file of [...poetFiles, 'articles.ts']) {
  for (const match of readLibraryFile(file).matchAll(/id:\s*['"](article[a-z0-9-]*)['"]/g)) {
    articleIds.add(match[1]);
  }
}

const essaySlugs = fs
  .readdirSync(essaysDir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
  .map((file) => {
    const source = fs.readFileSync(path.join(essaysDir, file), 'utf8');
    return (source.match(/^\s*slug:\s*['"]([a-z0-9-]+)['"]/m) || [])[1];
  })
  .filter(Boolean)
  .sort();

const staticRoutes = ['/', '/hall', '/poets', '/articles', '/music', '/about'];
const urls = [
  ...staticRoutes.map((route) => ({
    loc: route,
    priority: route === '/' ? '1.0' : '0.8',
  })),
  ...essaySlugs.map((slug) => ({ loc: `/essays/${slug}`, priority: '0.9' })),
  ...poetIds.map((id) => ({ loc: `/poets/${id}`, priority: '0.7' })),
  ...[...articleIds]
    .sort()
    .map((id) => ({ loc: `/articles/${id}`, priority: '0.6' })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, priority }) =>
      `  <url><loc>${BASE}${loc}</loc><changefreq>monthly</changefreq><priority>${priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync('public/sitemap.xml', xml);
console.log(
  `sitemap.xml: ${urls.length} urls (${poetIds.length} poets, ${essaySlugs.length} essays, ${articleIds.size} articles)`,
);
