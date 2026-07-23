import fs from 'node:fs';
import path from 'node:path';
import { siteConfig } from '../src/config/site';

const errors: string[] = [];

const routes = [
  {
    path: '/poets',
    title: 'Русские поэты: биографии, стихи и исследования — THE LEGENDARY POET',
    types: ['CollectionPage', 'ItemList', 'BreadcrumbList'],
  },
  {
    path: '/articles',
    title: 'Статьи, биографии и литературные исследования — THE LEGENDARY POET',
    types: ['CollectionPage', 'ItemList', 'BreadcrumbList'],
  },
  {
    path: '/music',
    title: 'Музыка поэзии — THE LEGENDARY POET',
    types: ['CollectionPage', 'ItemList', 'BreadcrumbList'],
  },
  {
    path: '/about',
    title: 'О проекте — THE LEGENDARY POET',
    types: ['AboutPage', 'Organization', 'BreadcrumbList'],
  },
  {
    path: '/hall',
    title: 'Зал Поэтов — THE LEGENDARY POET',
    types: ['WebPage', 'BreadcrumbList'],
  },
] as const;

function read(route: string): string {
  const file = path.resolve('dist', route.replace(/^\//, ''), 'index.html');
  if (!fs.existsSync(file)) {
    errors.push(`${route}: missing index.html`);
    return '';
  }
  const alias = path.resolve('dist', `${route.replace(/^\//, '')}.html`);
  if (!fs.existsSync(alias)) errors.push(`${route}: missing .html alias`);
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

function collectTypes(value: unknown, result = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectTypes(item, result);
    return result;
  }
  if (!value || typeof value !== 'object') return result;

  const record = value as Record<string, unknown>;
  const type = record['@type'];
  if (typeof type === 'string') result.add(type);
  else if (Array.isArray(type)) {
    for (const item of type) if (typeof item === 'string') result.add(item);
  }
  for (const item of Object.values(record)) collectTypes(item, result);
  return result;
}

for (const route of routes) {
  const html = read(route.path);
  if (!html) continue;

  const title = extract(html, /<title>(.*?)<\/title>/, 'title', route.path);
  const canonical = extract(
    html,
    /<link rel="canonical" href="([^"]*)"\s*\/>/,
    'canonical URL',
    route.path,
  );
  const robots = extract(
    html,
    /<meta name="robots" content="([^"]*)"\s*\/>/,
    'robots directive',
    route.path,
  );
  const ogType = extract(
    html,
    /<meta property="og:type" content="([^"]*)"\s*\/>/,
    'Open Graph type',
    route.path,
  );
  const jsonText = extract(
    html,
    /<script id="route-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/,
    'route JSON-LD',
    route.path,
  );

  if (title !== route.title) errors.push(`${route.path}: title drifted`);
  if (canonical !== `${siteConfig.url}${route.path}`) errors.push(`${route.path}: canonical drifted`);
  if (robots !== 'index, follow, max-image-preview:large') {
    errors.push(`${route.path}: unexpected robots directive`);
  }
  if (ogType !== 'website') errors.push(`${route.path}: top-level OG type must be website`);

  try {
    const types = collectTypes(JSON.parse(jsonText));
    for (const required of route.types) {
      if (!types.has(required)) errors.push(`${route.path}: JSON-LD has no ${required}`);
    }
  } catch (error) {
    errors.push(`${route.path}: invalid JSON-LD (${String(error)})`);
  }
}

for (const error of errors) console.error(`ERROR ${error}`);
console.log(`Top-level prerender validation: ${routes.length} routes, ${errors.length} errors`);
if (errors.length > 0) process.exit(1);
