import fs from 'node:fs';
import path from 'node:path';
import { getAllEssays } from '../src/data/essays/index';
import { poets } from '../src/data/poets';
import { siteConfig } from '../src/config/site';

const errors: string[] = [];

function readRoute(route: string): string {
  const file = path.resolve('dist', route.replace(/^\//, ''), 'index.html');
  if (!fs.existsSync(file)) {
    errors.push(`missing prerendered route ${route}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

function extract(html: string, pattern: RegExp, label: string, route: string): string {
  const match = html.match(pattern);
  if (!match) {
    errors.push(`${route}: missing ${label}`);
    return '';
  }
  return match[1];
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function graphTypes(jsonLd: unknown): Set<string> {
  if (!jsonLd || typeof jsonLd !== 'object') return new Set();
  const graph = (jsonLd as { '@graph'?: unknown[] })['@graph'];
  if (!Array.isArray(graph)) return new Set();
  return new Set(
    graph.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return [];
      const type = (entry as { '@type'?: unknown })['@type'];
      return Array.isArray(type)
        ? type.filter((value): value is string => typeof value === 'string')
        : typeof type === 'string'
          ? [type]
          : [];
    }),
  );
}

for (const essay of getAllEssays()) {
  const route = `/essays/${essay.slug}`;
  const html = readRoute(route);
  if (!html) continue;

  const title = decodeHtml(extract(html, /<title>(.*?)<\/title>/, 'title', route));
  const description = decodeHtml(
    extract(html, /<meta name="description" content="([^"]*)"\s*\/>/, 'description', route),
  );
  const canonical = extract(
    html,
    /<link rel="canonical" href="([^"]*)"\s*\/>/,
    'canonical',
    route,
  );
  const keywords = decodeHtml(
    extract(html, /<meta name="keywords" content="([^"]*)"\s*\/>/, 'keywords', route),
  );
  const jsonText = extract(
    html,
    /<script id="route-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/,
    'route JSON-LD',
    route,
  );

  const expectedTitle = `${essay.seoTitle ?? essay.title} — THE LEGENDARY POET`;
  if (title !== expectedTitle) errors.push(`${route}: title drifted from canonical essay data`);
  if (description !== (essay.seoDescription ?? essay.excerpt)) {
    errors.push(`${route}: description drifted from canonical essay data`);
  }
  if (canonical !== `${siteConfig.url}${route}`) errors.push(`${route}: canonical URL is incorrect`);
  for (const keyword of essay.seoKeywords ?? essay.tags) {
    if (!keywords.includes(keyword)) errors.push(`${route}: missing keyword “${keyword}”`);
  }
  if (title.includes('«Про Это»')) errors.push(`${route}: quoted work title was over-capitalized`);

  try {
    const jsonLd = JSON.parse(jsonText);
    const types = graphTypes(jsonLd);
    if (!types.has('Article')) errors.push(`${route}: JSON-LD graph has no Article`);
    if (!types.has('BreadcrumbList')) errors.push(`${route}: JSON-LD graph has no BreadcrumbList`);
    if (essay.cluster && !types.has('CollectionPage')) {
      errors.push(`${route}: clustered essay JSON-LD has no CollectionPage`);
    }

    const graph = (jsonLd as { '@graph': Array<Record<string, unknown>> })['@graph'];
    const article = graph.find((entry) => entry['@type'] === 'Article');
    const citations = article?.citation;
    if ((essay.sources?.filter((source) => source.url).length ?? 0) > 0) {
      if (!Array.isArray(citations) || citations.length === 0) {
        errors.push(`${route}: Article JSON-LD has no source citations`);
      }
    }
  } catch (error) {
    errors.push(`${route}: invalid JSON-LD (${String(error)})`);
  }

  const htmlAlias = path.resolve('dist', `essays/${essay.slug}.html`);
  if (!fs.existsSync(htmlAlias)) errors.push(`${route}: missing extensionless-host alias`);
}

for (const poet of poets) {
  const route = `/poets/${poet.id}`;
  const html = readRoute(route);
  if (!html) continue;
  const jsonText = extract(
    html,
    /<script id="route-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/,
    'route JSON-LD',
    route,
  );
  try {
    const jsonLd = JSON.parse(jsonText);
    const types = graphTypes(jsonLd);
    for (const required of ['ProfilePage', 'Person', 'BreadcrumbList']) {
      if (!types.has(required)) errors.push(`${route}: JSON-LD graph has no ${required}`);
    }
    const relatedCount = getAllEssays().filter((essay) => essay.poetId === poet.id).length;
    if (relatedCount > 0) {
      const graph = (jsonLd as { '@graph': Array<Record<string, unknown>> })['@graph'];
      const person = graph.find((entry) => entry['@type'] === 'Person');
      if (!Array.isArray(person?.subjectOf) || person.subjectOf.length !== relatedCount) {
        errors.push(`${route}: Person.subjectOf does not match ${relatedCount} related essays`);
      }
    }
  } catch (error) {
    errors.push(`${route}: invalid JSON-LD (${String(error)})`);
  }
}

for (const error of errors) console.error(`ERROR ${error}`);
console.log(
  `Prerendered SEO validation: ${getAllEssays().length} essays, ${poets.length} poets, ${errors.length} errors`,
);

if (errors.length > 0) process.exit(1);
