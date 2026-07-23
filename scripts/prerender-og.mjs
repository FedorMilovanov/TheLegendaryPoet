// Prerender static HTML files with route-specific Open Graph metadata.
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

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderPage({ title, description, routePath, image, type = 'website', publishedTime, author }) {
  const url = `${SITE_URL}${routePath}`;
  const img = absUrl(image);
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  let html = template;
  html = html.replace(/<title>.*?<\/title>/, `<title>${t}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${d}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${url}" />`);
  html = html.replace(/<meta property="og:type" content="[^"]*"\s*\/>/, `<meta property="og:type" content="${type}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${t}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${d}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${url}" />`);
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${img}" />`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${t}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${d}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${img}" />`);
  if (type === 'article') {
    const articleMeta = [
      publishedTime ? `<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />` : '',
      author ? `<meta property="article:author" content="${escapeHtml(author)}" />` : '',
    ].filter(Boolean).join('\n    ');
    if (articleMeta) html = html.replace('</head>', `    ${articleMeta}\n  </head>`);
  }
  return html;
}

function write(routePath, html) {
  const rel = routePath.replace(/^\//, '');
  const outDir = path.join(DIST, rel);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  fs.writeFileSync(path.join(DIST, `${rel}.html`), html);
}

async function main() {
  const [{ getAllEssays }, { poets, articles, allMusicTracks, musicTracks }] = await Promise.all([
    import(path.resolve('src/data/essays/index.ts')),
    import(path.resolve('src/data/poets.ts')),
  ]);
  let count = 0;

  for (const essay of getAllEssays()) {
    write(`/essays/${essay.slug}`, renderPage({ title: `${essay.title} — THE LEGENDARY POET`, description: essay.excerpt, routePath: `/essays/${essay.slug}`, image: essay.cover, type: 'article', publishedTime: essay.date, author: essay.author }));
    count++;
  }
  for (const poet of poets) {
    write(`/poets/${poet.id}`, renderPage({ title: `${poet.name} — THE LEGENDARY POET`, description: poet.shortBio, routePath: `/poets/${poet.id}`, image: poet.photo, type: 'profile' }));
    count++;
  }
  for (const article of articles) {
    write(`/articles/${article.id}`, renderPage({ title: `${article.title} — THE LEGENDARY POET`, description: article.excerpt, routePath: `/articles/${article.id}`, image: article.image, type: 'article', publishedTime: article.date, author: article.author }));
    count++;
  }
  for (const track of allMusicTracks) {
    write(`/music/${track.id}`, renderPage({
      title: `${track.title} — ${track.poet} — THE LEGENDARY POET`,
      description: track.description || 'Музыкальная публикация проекта The Legendary Poet.',
      routePath: `/music/${track.id}`,
      image: track.wideCoverUrl || track.coverUrl,
      type: track.availability === 'published' ? 'music.song' : 'website',
    }));
    count++;
  }

  const featuredTrack = musicTracks.find((track) => track.featured) || musicTracks[0];
  write('/ratings', renderPage({ title: 'Рейтинг поэтов — THE LEGENDARY POET', description: 'Сводный читательский рейтинг русских поэтов: оценки, комментарии и прозрачная методика.', routePath: '/ratings', image: '/og-image.jpg' }));
  write('/music', renderPage({ title: 'Музыка — THE LEGENDARY POET', description: 'Официальные музыкальные интерпретации русской поэзии от проекта The Legendary Poet.', routePath: '/music', image: featuredTrack?.wideCoverUrl || featuredTrack?.coverUrl }));
  count += 2;

  console.log(`prerender-og: wrote ${count} static pages (${getAllEssays().length} essays, ${poets.length} poets, ${articles.length} articles, ${allMusicTracks.length} music registry entries, 2 hubs)`);
}

main();
