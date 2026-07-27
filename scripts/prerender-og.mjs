// Prerender route-specific HTML so crawlers and unfurl bots receive complete
// metadata in the first 200 response without executing JavaScript.
import fs from 'node:fs';
import path from 'node:path';
import { getAllEssays } from '../src/data/essays/index.ts';
import { allMusicTracks, musicTracks, poets } from '../src/data/poets.ts';
import { siteConfig } from '../src/config/site.ts';
import {
  buildArticlePageSchema,
  buildMusicPageSchema,
  buildPoetPageSchema,
  buildWebPageSchema,
} from '../src/lib/seoSchema.ts';

const SITE_URL = siteConfig.url;
const DIST = path.resolve('dist');
const PUBLIC = path.resolve('public');
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

function absUrl(pathOrUrl) {
  if (!pathOrUrl || pathOrUrl === '/og-image.jpg') return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const publicPath = path.resolve(PUBLIC, pathOrUrl.replace(/^\//, ''));
  if (!fs.existsSync(publicPath)) {
    console.warn(`prerender: missing image ${pathOrUrl}; using default OG image`);
    return DEFAULT_OG_IMAGE;
  }
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

function imageMime(url) {
  const pathname = url.split(/[?#]/, 1)[0].toLowerCase();
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  return 'image/jpeg';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function jsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function replaceMeta(html, selector, value) {
  const escaped = escapeHtml(value);
  const expression = selector.kind === 'property'
    ? new RegExp(`<meta property="${selector.key}" content="[^"]*"\\s*\\/?>`)
    : new RegExp(`<meta name="${selector.key}" content="[^"]*"\\s*\\/?>`);
  const tag = selector.kind === 'property'
    ? `<meta property="${selector.key}" content="${escaped}" />`
    : `<meta name="${selector.key}" content="${escaped}" />`;
  return expression.test(html) ? html.replace(expression, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function renderPage({
  title,
  description,
  routePath,
  image,
  imageAlt,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  robots = INDEX_ROBOTS,
  jsonLd,
}) {
  const url = `${SITE_URL}${routePath}`;
  const img = absUrl(image);
  const resolvedImageAlt = imageAlt || title;
  let html = template;

  html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = replaceMeta(html, { kind: 'name', key: 'description' }, description);
  html = replaceMeta(html, { kind: 'name', key: 'robots' }, robots);
  html = replaceMeta(html, { kind: 'name', key: 'googlebot' }, robots);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${escapeHtml(url)}" />`);
  html = replaceMeta(html, { kind: 'property', key: 'og:type' }, type);
  html = replaceMeta(html, { kind: 'property', key: 'og:title' }, title);
  html = replaceMeta(html, { kind: 'property', key: 'og:description' }, description);
  html = replaceMeta(html, { kind: 'property', key: 'og:url' }, url);
  html = replaceMeta(html, { kind: 'property', key: 'og:image' }, img);
  html = replaceMeta(html, { kind: 'property', key: 'og:image:secure_url' }, img);
  html = replaceMeta(html, { kind: 'property', key: 'og:image:type' }, imageMime(img));
  html = replaceMeta(html, { kind: 'property', key: 'og:image:alt' }, resolvedImageAlt);
  html = replaceMeta(html, { kind: 'name', key: 'twitter:card' }, 'summary_large_image');
  html = replaceMeta(html, { kind: 'name', key: 'twitter:title' }, title);
  html = replaceMeta(html, { kind: 'name', key: 'twitter:description' }, description);
  html = replaceMeta(html, { kind: 'name', key: 'twitter:image' }, img);
  html = replaceMeta(html, { kind: 'name', key: 'twitter:image:alt' }, resolvedImageAlt);

  // Width and height on the root social image must not be copied to portraits or
  // other route-specific artwork with different dimensions.
  if (img !== DEFAULT_OG_IMAGE) {
    html = html
      .replace(/\s*<meta property="og:image:width" content="[^"]*"\s*\/?>/, '')
      .replace(/\s*<meta property="og:image:height" content="[^"]*"\s*\/?>/, '');
  }

  const extraHead = [];
  if (type === 'article') {
    if (publishedTime) extraHead.push(`<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />`);
    if (modifiedTime) extraHead.push(`<meta property="article:modified_time" content="${escapeHtml(modifiedTime)}" />`);
    if (author) extraHead.push(`<meta property="article:author" content="${escapeHtml(author)}" />`);
  }
  if (jsonLd) extraHead.push(`<script id="route-jsonld" type="application/ld+json">${jsonForHtml(jsonLd)}</script>`);
  if (extraHead.length) html = html.replace('</head>', `    ${extraHead.join('\n    ')}\n  </head>`);
  return html;
}

function writeRoute(routePath, html) {
  const rel = routePath.replace(/^\//, '');
  if (!rel || rel.includes('..') || rel.endsWith('.html')) throw new Error(`Invalid prerender route: ${routePath}`);
  const outDir = path.join(DIST, rel);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

function writeNotFound() {
  const title = 'Страница не найдена — THE LEGENDARY POET';
  const description = 'Запрошенная страница не существует или была перемещена.';
  let html = template;
  html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
  html = replaceMeta(html, { kind: 'name', key: 'description' }, description);
  html = replaceMeta(html, { kind: 'name', key: 'robots' }, 'noindex,follow');
  html = replaceMeta(html, { kind: 'name', key: 'googlebot' }, 'noindex,follow');
  html = replaceMeta(html, { kind: 'property', key: 'og:title' }, title);
  html = replaceMeta(html, { kind: 'property', key: 'og:description' }, description);
  html = replaceMeta(html, { kind: 'name', key: 'twitter:title' }, title);
  html = replaceMeta(html, { kind: 'name', key: 'twitter:description' }, description);
  html = html
    .replace(/\s*<link rel="canonical" href="[^"]*"\s*\/?>/, '')
    .replace(/\s*<meta property="og:url" content="[^"]*"\s*\/?>/, '');
  fs.writeFileSync(path.join(DIST, '404.html'), html);
}

function pageBreadcrumbs(sectionName, sectionPath, currentName, currentPath) {
  return [
    { name: 'Главная', path: '/' },
    ...(sectionPath ? [{ name: sectionName, path: sectionPath }] : []),
    { name: currentName, path: currentPath },
  ];
}

async function main() {
  let count = 0;
  const essays = getAllEssays();

  for (const essay of essays) {
    const routePath = `/essays/${essay.slug}`;
    const poet = essay.poetId ? poets.find((candidate) => candidate.id === essay.poetId) : undefined;
    const title = `${essay.title} — THE LEGENDARY POET`;
    const breadcrumbs = pageBreadcrumbs('Статьи', '/articles', essay.title, routePath);
    writeRoute(routePath, renderPage({
      title,
      description: essay.excerpt,
      routePath,
      image: essay.cover,
      imageAlt: essay.coverAlt || essay.title,
      type: 'article',
      publishedTime: essay.date,
      modifiedTime: essay.dateModified || essay.date,
      author: essay.author,
      jsonLd: buildArticlePageSchema({
        title: essay.title,
        description: essay.excerpt,
        routePath,
        path: routePath,
        image: essay.cover,
        author: essay.author,
        tags: essay.tags,
        datePublished: essay.date,
        dateModified: essay.dateModified || essay.date,
        breadcrumbs,
        poet: poet ? { id: poet.id, name: poet.fullName || poet.name } : undefined,
      }),
    }));
    count++;
  }

  for (const poet of poets) {
    const routePath = `/poets/${poet.id}`;
    const title = `${poet.name} — биография, стихи и анализ — THE LEGENDARY POET`;
    const breadcrumbs = pageBreadcrumbs('Поэты', '/poets', poet.name, routePath);
    writeRoute(routePath, renderPage({
      title,
      description: poet.shortBio,
      routePath,
      image: poet.photo,
      imageAlt: `Портрет: ${poet.fullName || poet.name}`,
      jsonLd: buildPoetPageSchema({
        title,
        description: poet.shortBio,
        path: routePath,
        image: poet.photo,
        breadcrumbs,
        poet,
      }),
    }));
    count++;
  }

  for (const track of allMusicTracks) {
    const routePath = `/music/${track.id}`;
    const imagePath = track.wideCoverUrl || track.coverUrl;
    const title = `${track.title} — ${track.poet} — THE LEGENDARY POET`;
    const description = track.description || 'Музыкальная публикация проекта THE LEGENDARY POET.';
    const breadcrumbs = pageBreadcrumbs('Музыка', '/music', track.title, routePath);
    writeRoute(routePath, renderPage({
      title,
      description,
      routePath,
      image: imagePath,
      imageAlt: `Обложка: ${track.title} — ${track.poet}`,
      type: track.availability === 'published' ? 'music.song' : 'website',
      robots: track.availability === 'published' ? INDEX_ROBOTS : 'noindex,follow',
      jsonLd: buildMusicPageSchema({ title, description, path: routePath, image: imagePath, breadcrumbs, track }),
    }));
    count++;
  }

  const featuredTrack = musicTracks.find((track) => track.featured) || musicTracks[0];
  const staticPages = [
    {
      routePath: '/poets',
      title: 'Русские поэты: биографии, стихи и анализ — THE LEGENDARY POET',
      description: 'Каталог русских поэтов: биографии, стихотворения, исторический контекст и литературный анализ от Пушкина и Лермонтова до Блока, Есенина и Маяковского.',
    },
    {
      routePath: '/ratings',
      title: 'Рейтинг русских поэтов — THE LEGENDARY POET',
      description: 'Сводный читательский рейтинг русских поэтов: оценки, комментарии и прозрачная методика.',
    },
    {
      routePath: '/articles',
      title: 'Исследования и большие статьи о поэтах — THE LEGENDARY POET',
      description: 'Документальные биографии и исследования русской поэзии с открытой библиографией, проверенными формулировками и редакционными иллюстрациями.',
    },
    {
      routePath: '/music',
      title: 'Музыка на стихи русских поэтов — THE LEGENDARY POET',
      description: 'Официальные музыкальные интерпретации русской поэзии от проекта THE LEGENDARY POET.',
      image: featuredTrack?.wideCoverUrl || featuredTrack?.coverUrl,
    },
    {
      routePath: '/about',
      title: 'О проекте — THE LEGENDARY POET',
      description: 'THE LEGENDARY POET — независимый редакторский проект о русской поэзии, истории и культуре с осторожным христианским анализом.',
    },
    {
      routePath: '/editorial-policy',
      title: 'Редакционная политика и исправления — THE LEGENDARY POET',
      description: 'Как THE LEGENDARY POET проверяет факты, оформляет источники, обозначает реконструкции и исправляет ошибки.',
    },
    {
      routePath: '/privacy',
      title: 'Политика конфиденциальности — THE LEGENDARY POET',
      description: 'Какие технические данные использует THE LEGENDARY POET, как работает аналитика и как управлять согласием.',
    },
    {
      routePath: '/hall',
      title: 'Зал Поэтов — в разработке — THE LEGENDARY POET',
      description: 'Иммерсивный Зал Русской Поэзии сейчас в разработке.',
      robots: 'noindex,follow',
    },
    {
      routePath: '/archive',
      title: 'Мой архив — THE LEGENDARY POET',
      description: 'Личная коллекция сохранённых стихотворений и музыкальных сессий.',
      robots: 'noindex,nofollow',
    },
  ];

  for (const page of staticPages) {
    const breadcrumbs = pageBreadcrumbs('', '', page.title.split(' — ')[0], page.routePath);
    writeRoute(page.routePath, renderPage({
      ...page,
      jsonLd: buildWebPageSchema({
        title: page.title,
        description: page.description,
        path: page.routePath,
        image: page.image,
        breadcrumbs,
      }),
    }));
    count++;
  }

  writeNotFound();
  console.log(`prerender: wrote ${count} canonical route documents plus a dedicated noindex 404`);
}

main();
