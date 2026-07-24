import fs from 'node:fs';
import path from 'node:path';
import { getAllEssays } from '../src/data/essays/index';
import { articles, poets } from '../src/data/poets';
import { siteConfig } from '../src/config/site';

const errors: string[] = [];
const DEFAULT_OG_IMAGE = `${siteConfig.url}/og-image.jpg`;

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

function absoluteImage(image?: string): string {
  if (!image) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//.test(image)) return image;
  const publicPath = path.resolve('public', image.replace(/^\//, ''));
  return fs.existsSync(publicPath)
    ? `${siteConfig.url}${image.startsWith('/') ? '' : '/'}${image}`
    : DEFAULT_OG_IMAGE;
}

function validateCommonHead({
  route,
  html,
  expectedTitle,
  expectedDescription,
  expectedType,
  expectedImage,
  expectedImageAlt,
}: {
  route: string;
  html: string;
  expectedTitle: string;
  expectedDescription: string;
  expectedType: 'article' | 'profile';
  expectedImage?: string;
  expectedImageAlt: string;
}) {
  const title = decodeHtml(extract(html, /<title>(.*?)<\/title>/, 'title', route));
  const description = decodeHtml(
    extract(html, /<meta name="description" content="([^"]*)"\s*\/>/, 'description', route),
  );
  const robots = extract(
    html,
    /<meta name="robots" content="([^"]*)"\s*\/>/,
    'robots directive',
    route,
  );
  const canonical = extract(
    html,
    /<link rel="canonical" href="([^"]*)"\s*\/>/,
    'canonical',
    route,
  );
  const ogType = extract(
    html,
    /<meta property="og:type" content="([^"]*)"\s*\/>/,
    'Open Graph type',
    route,
  );
  const ogImage = extract(
    html,
    /<meta property="og:image" content="([^"]*)"\s*\/>/,
    'Open Graph image',
    route,
  );
  const ogAlt = decodeHtml(
    extract(html, /<meta property="og:image:alt" content="([^"]*)"\s*\/>/, 'Open Graph image alt', route),
  );
  const twitterAlt = decodeHtml(
    extract(html, /<meta name="twitter:image:alt" content="([^"]*)"\s*\/>/, 'Twitter image alt', route),
  );

  if (title !== expectedTitle) errors.push(`${route}: title drifted from canonical data`);
  if (description !== expectedDescription) errors.push(`${route}: description drifted from canonical data`);
  if (robots !== 'index, follow, max-image-preview:large') {
    errors.push(`${route}: public prerender has an unexpected robots directive`);
  }
  if (canonical !== `${siteConfig.url}${route}`) errors.push(`${route}: canonical URL is incorrect`);
  if (ogType !== expectedType) errors.push(`${route}: Open Graph type should be ${expectedType}`);

  const image = absoluteImage(expectedImage);
  if (ogImage !== image) errors.push(`${route}: social image drifted from canonical data`);
  if (ogAlt !== expectedImageAlt || twitterAlt !== expectedImageAlt) {
    errors.push(`${route}: social image alternative text drifted from canonical data`);
  }

  const declaresWidth = /<meta property="og:image:width"/.test(html);
  const declaresHeight = /<meta property="og:image:height"/.test(html);
  if (image !== DEFAULT_OG_IMAGE && (declaresWidth || declaresHeight)) {
    errors.push(`${route}: heterogeneous cover incorrectly inherited 1200×630 metadata`);
  }
}

function parseJsonLd(html: string, route: string): unknown {
  const jsonText = extract(
    html,
    /<script id="route-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/,
    'route JSON-LD',
    route,
  );
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    errors.push(`${route}: invalid JSON-LD (${String(error)})`);
    return undefined;
  }
}

for (const essay of getAllEssays()) {
  const route = `/essays/${essay.slug}`;
  const html = readRoute(route);
  if (!html) continue;

  validateCommonHead({
    route,
    html,
    expectedTitle: `${essay.seoTitle ?? essay.title} — THE LEGENDARY POET`,
    expectedDescription: essay.seoDescription ?? essay.excerpt,
    expectedType: 'article',
    expectedImage: essay.cover,
    expectedImageAlt: essay.coverAlt ?? essay.title,
  });

  const keywords = decodeHtml(
    extract(html, /<meta name="keywords" content="([^"]*)"\s*\/>/, 'keywords', route),
  );
  for (const keyword of essay.seoKeywords ?? essay.tags) {
    if (!keywords.includes(keyword)) errors.push(`${route}: missing keyword “${keyword}”`);
  }
  if (html.includes('«Про Это»')) errors.push(`${route}: quoted work title was over-capitalized`);

  const published = extract(
    html,
    /<meta property="article:published_time" content="([^"]*)"\s*\/>/,
    'article published time',
    route,
  );
  const author = decodeHtml(
    extract(html, /<meta property="article:author" content="([^"]*)"\s*\/>/, 'article author', route),
  );
  if (published !== essay.date) errors.push(`${route}: article date drifted from essay data`);
  if (author !== essay.author) errors.push(`${route}: article author drifted from essay data`);

  const jsonLd = parseJsonLd(html, route);
  const types = graphTypes(jsonLd);
  if (!types.has('Article')) errors.push(`${route}: JSON-LD graph has no Article`);
  if (!types.has('BreadcrumbList')) errors.push(`${route}: JSON-LD graph has no BreadcrumbList`);
  if (essay.cluster && !types.has('CollectionPage')) {
    errors.push(`${route}: clustered essay JSON-LD has no CollectionPage`);
  }

  if (jsonLd && typeof jsonLd === 'object') {
    const graph = (jsonLd as { '@graph'?: Array<Record<string, unknown>> })['@graph'];
    const article = graph?.find((entry) => entry['@type'] === 'Article');
    const citations = article?.citation;
    if ((essay.sources?.filter((source) => source.url).length ?? 0) > 0) {
      if (!Array.isArray(citations) || citations.length === 0) {
        errors.push(`${route}: Article JSON-LD has no source citations`);
      }
    }
  }

  const htmlAlias = path.resolve('dist', `essays/${essay.slug}.html`);
  if (!fs.existsSync(htmlAlias)) errors.push(`${route}: missing extensionless-host alias`);
}

for (const poet of poets) {
  const route = `/poets/${poet.id}`;
  const html = readRoute(route);
  if (!html) continue;

  validateCommonHead({
    route,
    html,
    expectedTitle: `${poet.name} — THE LEGENDARY POET`,
    expectedDescription: poet.shortBio,
    expectedType: 'profile',
    expectedImage: poet.photo,
    expectedImageAlt: poet.fullName || poet.name,
  });

  const jsonLd = parseJsonLd(html, route);
  const types = graphTypes(jsonLd);
  for (const required of ['ProfilePage', 'Person', 'BreadcrumbList']) {
    if (!types.has(required)) errors.push(`${route}: JSON-LD graph has no ${required}`);
  }
  const relatedCount = getAllEssays().filter((essay) => essay.poetId === poet.id).length;
  if (relatedCount > 0 && jsonLd && typeof jsonLd === 'object') {
    const graph = (jsonLd as { '@graph'?: Array<Record<string, unknown>> })['@graph'];
    const person = graph?.find((entry) => entry['@type'] === 'Person');
    if (!Array.isArray(person?.subjectOf) || person.subjectOf.length !== relatedCount) {
      errors.push(`${route}: Person.subjectOf does not match ${relatedCount} related essays`);
    }
  }
}

for (const article of articles) {
  const route = `/articles/${article.id}`;
  const html = readRoute(route);
  if (!html) continue;

  validateCommonHead({
    route,
    html,
    expectedTitle: `${article.title} — THE LEGENDARY POET`,
    expectedDescription: article.excerpt,
    expectedType: 'article',
    expectedImage: article.image,
    expectedImageAlt: article.title,
  });

  const published = extract(
    html,
    /<meta property="article:published_time" content="([^"]*)"\s*\/>/,
    'article published time',
    route,
  );
  const author = decodeHtml(
    extract(html, /<meta property="article:author" content="([^"]*)"\s*\/>/, 'article author', route),
  );
  if (published !== article.date) errors.push(`${route}: article date drifted from library data`);
  if (author !== article.author) errors.push(`${route}: article author drifted from library data`);

  const types = graphTypes(parseJsonLd(html, route));
  if (!types.has('Article')) errors.push(`${route}: JSON-LD graph has no Article`);
  if (!types.has('BreadcrumbList')) errors.push(`${route}: JSON-LD graph has no BreadcrumbList`);

  const htmlAlias = path.resolve('dist', `articles/${article.id}.html`);
  if (!fs.existsSync(htmlAlias)) errors.push(`${route}: missing extensionless-host alias`);
}

for (const error of errors) console.error(`ERROR ${error}`);
console.log(
  `Prerendered SEO validation: ${getAllEssays().length} essays, ${poets.length} poets, ${articles.length} articles, ${errors.length} errors`,
);

if (errors.length > 0) process.exit(1);
