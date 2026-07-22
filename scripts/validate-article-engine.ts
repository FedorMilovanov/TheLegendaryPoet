import fs from 'node:fs';
import path from 'node:path';

const errors: string[] = [];
const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const publicPages = [
  'src/pages/EssayPage.tsx',
  'src/pages/ArticleDetailPage.tsx',
];

for (const page of publicPages) {
  const source = read(page);
  if (!source.includes("from '../components/essay/LongformPage'")) {
    errors.push(`${page}: public article page must import the shared LongformPage shell`);
  }
  if (!source.includes('<LongformPage')) {
    errors.push(`${page}: public article page must render LongformPage`);
  }
  if (/ArticleBody|ArticleHeader|ArticleMetaRail/.test(source)) {
    errors.push(`${page}: legacy article renderer returned to a public route`);
  }
}

const app = read('src/App.tsx');
for (const route of ['/essays/:slug', '/articles/:id']) {
  if (!app.includes(`path="${route}"`)) {
    errors.push(`src/App.tsx: expected public article route is missing: ${route}`);
  }
}

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [target] : [];
  });
}

const legacyNames = ['ArticleBody', 'ArticleHeader', 'ArticleMetaRail'];
for (const absolutePath of walk(path.join(root, 'src'))) {
  const relativePath = path.relative(root, absolutePath).replaceAll(path.sep, '/');
  const source = fs.readFileSync(absolutePath, 'utf8');
  for (const legacyName of legacyNames) {
    const ownFile = relativePath.endsWith(`/${legacyName}.tsx`);
    if (!ownFile && new RegExp(`(?:import|require)[\\s\\S]{0,160}${legacyName}`).test(source)) {
      errors.push(`${relativePath}: imports obsolete renderer ${legacyName}`);
    }
  }
}

for (const error of errors) console.error(`ERROR ${error}`);
console.log(`Article engine validation: ${errors.length} errors`);
if (errors.length > 0) process.exit(1);
