// Generate canonical discovery inventory from the same route/content authorities
// used by the application. The sitemap is long-term inventory; the companion
// manifest carries deterministic per-URL fingerprints for change-scoped IndexNow.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getAllEssays } from '../src/data/essays/index.ts';
import { allMusicTracks, poets } from '../src/data/poets.ts';

const BASE = (process.env.SITE_URL || 'https://thelegendarypoet.ru').replace(/\/$/, '');
const OUTPUT = path.resolve('public/sitemap.xml');
const MANIFEST_OUTPUT = path.resolve('public/discovery-manifest.json');
const ROUTE_CONTRACT_PATH = path.resolve('src/routes/route-contract.json');
const DISCOVERY_POLICY_PATH = path.resolve('src/routes/discovery-policy.json');

const routeContract = JSON.parse(fs.readFileSync(ROUTE_CONTRACT_PATH, 'utf8'));
const discoveryPolicy = JSON.parse(fs.readFileSync(DISCOVERY_POLICY_PATH, 'utf8'));

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

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function sha256(value) {
  const input = typeof value === 'string' ? value : JSON.stringify(stableValue(value));
  return crypto.createHash('sha256').update(input).digest('hex');
}

function fileHash(file) {
  return sha256(fs.readFileSync(path.resolve(file)));
}

function routeById(id) {
  const route = routeContract.routes.find((candidate) => candidate.id === id);
  if (!route) throw new Error(`Missing route contract id: ${id}`);
  return route;
}

function policyForRoute(route) {
  const policy = discoveryPolicy.states[route.discoveryState];
  if (!policy) throw new Error(`Unknown discoveryState ${route.discoveryState} for ${route.id}`);
  return policy;
}

const essays = getAllEssays();
const publishedTracks = allMusicTracks.filter((track) => track.availability === 'published');

const staticRoutes = routeContract.routes
  .filter((route) => route.sitemap)
  .map((route) => {
    const policy = policyForRoute(route);
    if (!policy.sitemap || !policy.indexNow || route.discoveryState !== 'ready') {
      throw new Error(`Sitemap route ${route.path} is not a ready/indexable discovery state`);
    }
    return {
      routeId: route.id,
      loc: route.path,
      image: route.sitemapImage === 'site'
        ? { loc: '/og-image.jpg', title: 'THE LEGENDARY POET', caption: 'Поэзия, анализ и история русской литературы' }
        : undefined,
    };
  });

const urls = [
  ...staticRoutes,
  ...essays.map((essay) => ({
    routeId: 'essay',
    loc: `/essays/${essay.slug}`,
    // Essays own explicit publication/modification dates. Other route families
    // omit lastmod until they acquire an equally explicit modification clock.
    lastmod: validDate(essay.dateModified || essay.date),
    image: {
      loc: essay.cover,
      title: essay.title,
      caption: essay.coverAlt || essay.excerpt,
    },
  })),
  ...publishedTracks.map((track) => ({
    routeId: 'track-detail',
    loc: `/music/${track.id}`,
    image: {
      loc: track.wideCoverUrl || track.coverUrl,
      title: `${track.title} — ${track.poet}`,
      caption: track.description,
    },
  })),
  ...poets.map((poet) => ({
    routeId: 'poet-detail',
    loc: `/poets/${poet.id}`,
    image: {
      loc: poet.photo,
      title: poet.fullName || poet.name,
      caption: poet.shortBio,
    },
  })),
];

const seen = new Set();
for (const item of urls) {
  if (!item.loc.startsWith('/') || item.loc.includes('.html')) throw new Error(`Invalid canonical sitemap route: ${item.loc}`);
  if (seen.has(item.loc)) throw new Error(`Duplicate sitemap route: ${item.loc}`);
  const route = routeById(item.routeId);
  if (route.discoveryState !== 'ready') throw new Error(`Canonical URL ${item.loc} is not in ready discovery state`);
  seen.add(item.loc);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(renderUrl).join('\n')}
</urlset>
`;

const globalAuthority = {
  policy: discoveryPolicy,
  routeContractSchemaVersion: routeContract.schemaVersion,
  useSeo: fileHash('src/hooks/useSeo.ts'),
  discoveryHead: fileHash('src/routes/discoveryHead.ts'),
  seoSchema: fileHash('src/lib/seoSchema.ts'),
  siteConfig: fileHash('src/config/site.ts'),
  prerender: fileHash('scripts/prerender-og.mjs'),
  appShell: fileHash('src/App.tsx'),
  header: fileHash('src/components/Header.tsx'),
  footer: fileHash('src/components/Footer.tsx'),
};
const globalAuthorityHash = sha256(globalAuthority);

const dataDependencies = {
  home: { essays, poets, publishedTracks },
  poets,
  ratings: poets,
  articles: essays,
  music: publishedTracks,
};

const dynamicContentByPath = new Map([
  ...essays.map((essay) => [`/essays/${essay.slug}`, essay]),
  ...publishedTracks.map((track) => [`/music/${track.id}`, track]),
  ...poets.map((poet) => [`/poets/${poet.id}`, poet]),
]);

const manifestRoutes = urls.map((item) => {
  const route = routeById(item.routeId);
  const moduleHash = fileHash(route.module);
  const content = dynamicContentByPath.get(item.loc) ?? dataDependencies[route.id] ?? null;
  return {
    url: `${BASE}${item.loc}`,
    path: item.loc,
    routeId: route.id,
    state: route.discoveryState,
    lastmod: item.lastmod ?? null,
    fingerprint: sha256({
      globalAuthorityHash,
      route,
      moduleHash,
      content,
      image: item.image ?? null,
      lastmod: item.lastmod ?? null,
    }),
  };
});

const manifest = {
  schemaVersion: 1,
  site: BASE,
  policySchemaVersion: discoveryPolicy.schemaVersion,
  routeStates: routeContract.routes.map((route) => ({
    id: route.id,
    path: route.path,
    state: route.discoveryState,
    sitemap: Boolean(route.sitemap),
  })),
  redirects: routeContract.redirects.map((redirect) => ({ ...redirect, state: 'redirect' })),
  canonicalUrls: manifestRoutes,
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, xml);
fs.writeFileSync(MANIFEST_OUTPUT, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`sitemap.xml: ${urls.length} canonical URLs, ${urls.filter((item) => item.image?.loc).length} image entries`);
console.log(`discovery-manifest.json: ${manifestRoutes.length} fingerprinted canonical URLs`);
