// Prerender real static HTML files (with per-page Open Graph tags) for every
// public top-level route and every shareable deep link.
//
// Why this exists:
// GitHub Pages serves 404.html for paths that do not have a real static file.
// Many preview bots neither run JavaScript nor accept a 404 response, so public
// routes get both `<route>/index.html` and `<route>.html`. The static head uses
// the same canonical data and JSON-LD builders as the hydrated React app.
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = 'https://thelegendarypoet.ru';
const DIST = path.resolve('dist');
const PUBLIC = path.resolve('public');
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

function absUrl(pathOrUrl) {
  if (!pathOrUrl) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;

  const publicPath = path.resolve(PUBLIC, pathOrUrl.replace(/^\//, ''));
  if (!fs.existsSync(publicPath)) {
    console.warn(`prerender-og: missing image ${pathOrUrl}; using default OG image`);
    return DEFAULT_OG_IMAGE;
  }

  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function safeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function injectOrReplaceMeta(html, selectorPattern, tag) {
  if (selectorPattern.test(html)) return html.replace(selectorPattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

/** Swap the static index.html head for page-specific SEO and structured data. */
function renderPage({
  title,
  description,
  routePath,
  image,
  imageAlt,
  type = 'website',
  publishedTime,
  author,
  keywords,
  jsonLd,
}) {
  const url = `${SITE_URL}${routePath}`;
  const img = absUrl(image);
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const alt = escapeHtml(imageAlt || title);

  let html = template;
  html = html.replace(/<title>.*?<\/title>/, `<title>${t}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${d}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${url}" />`);

  html = html.replace(/<meta property="og:type" content="[^"]*"\s*\/>/, `<meta property="og:type" content="${type}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${t}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${d}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${url}" />`);
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${img}" />`);
  html = html.replace(/<meta property="og:image:alt" content="[^"]*"\s*\/>/, `<meta property="og:image:alt" content="${alt}" />`);

  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${t}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${d}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${img}" />`);
  html = html.replace(/<meta name="twitter:image:alt" content="[^"]*"\s*\/>/, `<meta name="twitter:image:alt" content="${alt}" />`);

  // The homepage default is known to be 1200×630. Essay and portrait covers use
  // heterogeneous source ratios, so retaining those default dimensions would be
  // false metadata and can make social crawlers crop the wrong rectangle.
  if (img !== DEFAULT_OG_IMAGE) {
    html = html.replace(/\s*<meta property="og:image:width" content="[^"]*"\s*\/>/, '');
    html = html.replace(/\s*<meta property="og:image:height" content="[^"]*"\s*\/>/, '');
  }

  if (keywords?.length) {
    const content = escapeHtml(Array.isArray(keywords) ? keywords.join(', ') : keywords);
    html = injectOrReplaceMeta(
      html,
      /<meta name="keywords" content="[^"]*"\s*\/>/,
      `<meta name="keywords" content="${content}" />`,
    );
  }

  if (type === 'article') {
    const articleMeta = [
      publishedTime ? `<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />` : '',
      author ? `<meta property="article:author" content="${escapeHtml(author)}" />` : '',
    ].filter(Boolean).join('\n    ');
    if (articleMeta) html = html.replace('</head>', `    ${articleMeta}\n  </head>`);
  }

  if (jsonLd) {
    const block = `<script id="route-jsonld" type="application/ld+json">${safeJsonLd(jsonLd)}</script>`;
    html = html.replace('</head>', `    ${block}\n  </head>`);
  }

  return html;
}

/**
 * Write BOTH pretty-URL forms. GitHub Pages and static hosts do not all resolve
 * an extensionless path in exactly the same way.
 */
function write(routePath, html) {
  const rel = routePath.replace(/^\//, '');
  const outDir = path.join(DIST, rel);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  fs.writeFileSync(path.join(DIST, `${rel}.html`), html);
}

async function main() {
  const [
    { getAllEssays },
    { poets, articles, musicTracks },
    { essayStructuredData, legacyArticleStructuredData, poetStructuredData, relatedEssaysFor },
    {
      aboutPageStructuredData,
      articlesCollectionStructuredData,
      hallPageStructuredData,
      musicCollectionStructuredData,
      poetsCollectionStructuredData,
    },
  ] = await Promise.all([
    import(path.resolve('src/data/essays/index.ts')),
    import(path.resolve('src/data/poets.ts')),
    import(path.resolve('src/utils/structuredData.ts')),
    import(path.resolve('src/utils/collectionStructuredData.ts')),
  ]);

  const essays = getAllEssays();
  let count = 0;

  const publicTopLevelPages = [
    {
      routePath: '/poets',
      title: 'Русские поэты: биографии, стихи и исследования — THE LEGENDARY POET',
      description: 'Каталог русских поэтов: биографии, избранные стихи, свидетельства современников и документальные исследования.',
      keywords: ['русские поэты', 'биографии поэтов', 'стихи', 'Пушкин', 'Лермонтов', 'Есенин', 'Маяковский'],
      jsonLd: poetsCollectionStructuredData(poets),
    },
    {
      routePath: '/articles',
      title: 'Статьи, биографии и литературные исследования — THE LEGENDARY POET',
      description: 'Большие биографии поэтов, документальные расследования, история произведений, архивные источники и литературный анализ.',
      keywords: ['литературные статьи', 'биографии поэтов', 'литературный анализ', 'архивные источники'],
      jsonLd: articlesCollectionStructuredData(essays, articles),
    },
    {
      routePath: '/music',
      title: 'Музыка поэзии — THE LEGENDARY POET',
      description: 'Музыкальные интерпретации и декламации великих стихов на каналах проекта.',
      keywords: ['музыка на стихи', 'поэзия в музыке', 'декламация стихов'],
      jsonLd: musicCollectionStructuredData(musicTracks),
    },
    {
      routePath: '/about',
      title: 'О проекте — THE LEGENDARY POET',
      description: 'Независимый редакторский проект о поэзии, истории и культуре с осторожным христианским анализом.',
      keywords: ['THE LEGENDARY POET', 'проект о поэзии', 'литературный анализ'],
      jsonLd: aboutPageStructuredData(),
    },
    {
      routePath: '/hall',
      title: 'Зал Поэтов — THE LEGENDARY POET',
      description: 'Иммерсивный Храм Русской Поэзии сейчас в разработке.',
      keywords: ['зал поэтов', 'русская поэзия', 'виртуальный музей поэтов'],
      jsonLd: hallPageStructuredData(),
    },
  ];

  for (const page of publicTopLevelPages) {
    write(page.routePath, renderPage({ ...page, imageAlt: page.title }));
    count += 1;
  }

  for (const essay of essays) {
    const poet = essay.poetId ? poets.find((entry) => entry.id === essay.poetId) : undefined;
    const related = relatedEssaysFor(essay, essays);
    const html = renderPage({
      title: `${essay.seoTitle ?? essay.title} — THE LEGENDARY POET`,
      description: essay.seoDescription ?? essay.excerpt,
      routePath: `/essays/${essay.slug}`,
      image: essay.cover,
      imageAlt: essay.coverAlt,
      type: 'article',
      publishedTime: essay.date,
      author: essay.author,
      keywords: essay.seoKeywords ?? essay.tags,
      jsonLd: essayStructuredData(essay, poet, related),
    });
    write(`/essays/${essay.slug}`, html);
    count += 1;
  }

  for (const poet of poets) {
    const related = essays.filter((essay) => essay.poetId === poet.id);
    const html = renderPage({
      title: `${poet.name} — THE LEGENDARY POET`,
      description: poet.shortBio,
      routePath: `/poets/${poet.id}`,
      image: poet.photo,
      imageAlt: poet.fullName || poet.name,
      type: 'profile',
      keywords: [poet.name, poet.fullName, ...poet.tags, 'стихи', 'биография'],
      jsonLd: poetStructuredData(poet, related),
    });
    write(`/poets/${poet.id}`, html);
    count += 1;
  }

  for (const article of articles) {
    const html = renderPage({
      title: `${article.title} — THE LEGENDARY POET`,
      description: article.excerpt,
      routePath: `/articles/${article.id}`,
      image: article.image,
      imageAlt: article.title,
      type: 'article',
      publishedTime: article.date,
      author: article.author,
      jsonLd: legacyArticleStructuredData(article),
    });
    write(`/articles/${article.id}`, html);
    count += 1;
  }

  console.log(
    `prerender-og: wrote ${count} static pages (${publicTopLevelPages.length} top-level, ${essays.length} essays, ${poets.length} poets, ${articles.length} articles)`,
  );
}

main();
