import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('dist', 'index.html');
let html = fs.readFileSync(file, 'utf8');

html = html.replace(
  /<title>.*?<\/title>/,
  '<title>Страница не найдена — THE LEGENDARY POET</title>',
);
html = html.replace(
  /<meta name="description" content="[^"]*"\s*\/>/,
  '<meta name="description" content="Запрошенная страница не существует или была перемещена." />',
);
html = html.replace(
  /<meta name="robots" content="[^"]*"\s*\/>/,
  '<meta name="robots" content="noindex, nofollow" />',
);
// One fallback file serves many unknown paths; a fixed canonical would be
// misleading even though robots already forbids indexing.
html = html.replace(/\s*<link rel="canonical" href="[^"]*"\s*\/>/, '');
html = html.replace(
  /<meta property="og:title" content="[^"]*"\s*\/>/,
  '<meta property="og:title" content="Страница не найдена — THE LEGENDARY POET" />',
);
html = html.replace(
  /<meta property="og:description" content="[^"]*"\s*\/>/,
  '<meta property="og:description" content="Запрошенная страница не существует или была перемещена." />',
);
html = html.replace(
  /<meta name="twitter:title" content="[^"]*"\s*\/>/,
  '<meta name="twitter:title" content="Страница не найдена — THE LEGENDARY POET" />',
);
html = html.replace(
  /<meta name="twitter:description" content="[^"]*"\s*\/>/,
  '<meta name="twitter:description" content="Запрошенная страница не существует или была перемещена." />',
);

fs.writeFileSync(path.resolve('dist', '404.html'), html);
console.log('prerender-404: wrote dedicated noindex fallback');
