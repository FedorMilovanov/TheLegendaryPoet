// Generate the canonical sitemap from the same typed data used by the application.
import fs from 'node:fs';
import path from 'node:path';
import { getAllEssays } from '../src/data/essays/index.ts';
import { allMusicTracks, poets } from '../src/data/poets.ts';

const BASE = (process.env.SITE_URL || 'https://thelegendarypoet.ru').replace(/\/$/, '');
const OUTPUT = path.resolve('public/sitemap.xml');
const POLICY_DATE = '2026-07-28';

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${BASE}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function latestDate(values) {
  return values.map(validDate).filter(Boolean).sort().at(-1);
}

function renderUrl({ loc, lastmod, image }) {
  const lines = ['  <url>', `    <loc>${escapeXml(`${BASE}${loc}`)}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  if (image?.loc) {
    lines.push('    <image:image>');
    lines.push(`      <image:loc>${escapeXml(absoluteUrl(image.loc))}</image:loc>`);
    if (image.title) lines.push(`      <image:title>${escapeXml(image.title)}</image:title>`);
    if (image.caption) lines.push(`      <image:caption>${escapeXml(image.caption)}</image:caption>`);
    lines.push('    </image:image>');
  }
  lines.push('  </url>');
  return lines.join('\n');
}

const essays = getAllEssays();
const publishedTracks = allMusicTracks.filter((track) => track.availability === 'published');
const latestEssayDate = latestDate(essays.map((essay) => essay.dateModified || essay.date));
const latestMusicDate = latestDate(publishedTracks.map((track) => track.publishedAt));
const latestSiteDate = latestDate([latestEssayDate, latestMusicDate, POLICY_DATE]);

const routeContract = JSON.parse(fs.readFileSync(path.resolve('src/routes/route-contract.json'), 'utf8'));
const lastmodBySource = {
  site: latestSiteDate,
  essays: latestEssayDate,
  music: latestMusicDate,
  policy: POLICY_DATE,
};
const staticRoutes = routeContract.routes
  .filter((route) => route.sitemap)
  .map((route) => ({
    loc: route.path,
    lastmod: lastmodBySource[route.sitemapLastmod],
    image: route.sitemapImage === 'site'
      ? { loc: '/og-image.jpg', title: 'THE LEGENDARY POET', caption: 'Поэзия, анализ и история русской литературы' }
      : undefined,
  }));

const urls = [
  ...staticRoutes,
  ...essays.map((essay) => ({
    loc: `/essays/${essay.slug}`,
    lastmod: validDate(essay.dateModified || essay.date),
    image: {
      loc: essay.cover,
      title: essay.title,
      caption: essay.coverAlt || essay.excerpt,
    },
  })),
  ...publishedTracks.map((track) => ({
    loc: `/music/${track.id}`,
    lastmod: validDate(track.publishedAt),
    image: {
      loc: track.wideCoverUrl || track.coverUrl,
      title: `${track.title} — ${track.poet}`,
      caption: track.description,
    },
  })),
  ...poets.map((poet) => {
    const relatedDates = [
      ...essays.filter((essay) => essay.poetId === poet.id).map((essay) => essay.dateModified || essay.date),
      ...publishedTracks.filter((track) => track.poetId === poet.id).map((track) => track.publishedAt),
    ];
    return {
      loc: `/poets/${poet.id}`,
      lastmod: latestDate(relatedDates),
      image: {
        loc: poet.photo,
        title: poet.fullName || poet.name,
        caption: poet.shortBio,
      },
    };
  }),
];

const seen = new Set();
for (const item of urls) {
  if (!item.loc.startsWith('/') || item.loc.includes('.html')) throw new Error(`Invalid canonical sitemap route: ${item.loc}`);
  if (seen.has(item.loc)) throw new Error(`Duplicate sitemap route: ${item.loc}`);
  seen.add(item.loc);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(renderUrl).join('\n')}
</urlset>
`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, xml);
console.log(`sitemap.xml: ${urls.length} canonical URLs, ${urls.filter((item) => item.image?.loc).length} image entries`);
