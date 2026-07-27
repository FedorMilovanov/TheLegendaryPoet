// Prerender static HTML files with route-specific SEO and Open Graph metadata.
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = 'https://thelegendarypoet.ru';
const BRAND_VERSION = 'cloak-20260726-8';
const DIST = path.resolve('dist');
const PUBLIC = path.resolve('public');
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg?v=${BRAND_VERSION}`;
const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

function absUrl(pathOrUrl) {
  if (!pathOrUrl || pathOrUrl === '/og-image.jpg') return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  const publicPath = path.resolve(PUBLIC, pathOrUrl.replace(/^\//, ''));
  if (!fs.existsSync(publicPath)) {
    console.warn(`prerender-og: missing image ${pathOrUrl}; using default OG image`);
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
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function jsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function renderPage({
  title,
  description,
  routePath,
  image,
  type = 'website',
  publishedTime,
  author,
  robots = INDEX_ROBOTS,
  jsonLd,
}) {
  const url = `${SITE_URL}${routePath}`;
  const img = absUrl(image);
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  let html = template;
  html = html.replace(/<title>.*?<\/title>/, `<title>${t}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${d}" />`);
  html = html.replace(/<meta name="robots" content="[^"]*"\s*\/>/, `<meta name="robots" content="${escapeHtml(robots)}" />`);
  html = html.replace(/<meta name="googlebot" content="[^"]*"\s*\/>/, `<meta name="googlebot" content="${escapeHtml(robots)}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${url}" />`);
  html = html.replace(/<meta property="og:type" content="[^"]*"\s*\/>/, `<meta property="og:type" content="${type}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${t}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${d}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${url}" />`);
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${img}" />`);
  html = html.replace(/<meta property="og:image:secure_url" content="[^"]*"\s*\/>/, `<meta property="og:image:secure_url" content="${img}" />`);
  html = html.replace(/<meta property="og:image:type" content="[^"]*"\s*\/>/, `<meta property="og:image:type" content="${imageMime(img)}" />`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${t}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${d}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${img}" />`);

  const extraHead = [];
  if (type === 'article') {
    if (publishedTime) extraHead.push(`<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />`);
    if (author) extraHead.push(`<meta property="article:author" content="${escapeHtml(author)}" />`);
  }
  if (jsonLd) extraHead.push(`<script id="route-jsonld" type="application/ld+json">${jsonForHtml(jsonLd)}</script>`);
  if (extraHead.length) html = html.replace('</head>', `    ${extraHead.join('\n    ')}\n  </head>`);
  return html;
}

function write(routePath, html) {
  const rel = routePath.replace(/^\//, '');
  const outDir = path.join(DIST, rel);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  fs.writeFileSync(path.join(DIST, `${rel}.html`), html);
}

function webpageSchema(title, description, routePath) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: `${SITE_URL}${routePath}`,
    inLanguage: 'ru-RU',
    isPartOf: { '@type': 'WebSite', name: 'THE LEGENDARY POET', url: `${SITE_URL}/` },
  };
}

async function main() {
  const [{ getAllEssays }, { poets, allMusicTracks, musicTracks }] = await Promise.all([
    import(path.resolve('src/data/essays/index.ts')),
    import(path.resolve('src/data/poets.ts')),
  ]);
  let count = 0;

  for (const essay of getAllEssays()) {
    const routePath = `/essays/${essay.slug}`;
    const image = absUrl(essay.cover);
    const title = `${essay.title} — THE LEGENDARY POET`;
    write(routePath, renderPage({
      title,
      description: essay.excerpt,
      routePath,
      image: essay.cover,
      type: 'article',
      publishedTime: essay.date,
      author: essay.author,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: essay.title,
        description: essay.excerpt,
        image,
        url: `${SITE_URL}${routePath}`,
        inLanguage: 'ru-RU',
        datePublished: essay.date,
        author: { '@type': 'Person', name: essay.author },
        publisher: {
          '@type': 'Organization',
          name: 'THE LEGENDARY POET',
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png?v=${BRAND_VERSION}` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${routePath}` },
      },
    }));
    count++;
  }

  for (const poet of poets) {
    const routePath = `/poets/${poet.id}`;
    const image = absUrl(poet.photo);
    const title = `${poet.name} — THE LEGENDARY POET`;
    write(routePath, renderPage({
      title,
      description: poet.shortBio,
      routePath,
      image: poet.photo,
      type: 'profile',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        name: title,
        description: poet.shortBio,
        url: `${SITE_URL}${routePath}`,
        inLanguage: 'ru-RU',
        mainEntity: {
          '@type': 'Person',
          name: poet.fullName || poet.name,
          image,
          description: poet.shortBio,
        },
      },
    }));
    count++;
  }

  for (const track of allMusicTracks) {
    const routePath = `/music/${track.id}`;
    const imagePath = track.wideCoverUrl || track.coverUrl;
    const image = absUrl(imagePath);
    const title = `${track.title} — ${track.poet} — THE LEGENDARY POET`;
    const description = track.description || 'Музыкальная публикация проекта The Legendary Poet.';
    write(routePath, renderPage({
      title,
      description,
      routePath,
      image: imagePath,
      type: track.availability === 'published' ? 'music.song' : 'website',
      robots: track.availability === 'published' ? INDEX_ROBOTS : 'noindex,follow',
      jsonLd: track.availability === 'published' ? {
        '@context': 'https://schema.org',
        '@type': 'MusicRecording',
        name: track.title,
        description,
        image,
        url: `${SITE_URL}${routePath}`,
        inLanguage: 'ru-RU',
        byArtist: { '@type': 'MusicGroup', name: 'THE LEGENDARY POET' },
      } : webpageSchema(title, description, routePath),
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
      description: 'Официальные музыкальные интерпретации русской поэзии от проекта The Legendary Poet.',
      image: featuredTrack?.wideCoverUrl || featuredTrack?.coverUrl,
    },
    {
      routePath: '/about',
      title: 'О проекте — THE LEGENDARY POET',
      description: 'THE LEGENDARY POET — независимый редакторский проект о русской поэзии, истории и культуре с осторожным христианским анализом.',
    },
    {
      routePath: '/hall',
      title: 'Зал Поэтов — в разработке — THE LEGENDARY POET',
      description: 'Иммерсивный Храм Русской Поэзии сейчас в разработке.',
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
    write(page.routePath, renderPage({
      ...page,
      jsonLd: webpageSchema(page.title, page.description, page.routePath),
    }));
    count++;
  }

  console.log(`prerender-og: wrote ${count} static pages (${getAllEssays().length} essays, ${poets.length} poets, ${allMusicTracks.length} music registry entries, ${staticPages.length} hubs)`);
}

main();
