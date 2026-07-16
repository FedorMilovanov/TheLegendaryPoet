/**
 * Data / brand integrity guard.
 *
 * Run via `npm run check:integrity` (or as part of `npm run check`).
 * Fails the process (exit 1) on any hard violation so CI and agents catch
 * regressions before a deploy. Soft warnings print but do not fail.
 *
 * What it protects:
 *  - poet modules stay modular and export a valid Poet shape
 *  - every photo path exists under public/
 *  - no duplicate ids across poets / articles / essays / tracks
 *  - channel URLs and contact email only come from siteConfig (no hardcodes)
 *  - no emoji in src UI code
 *  - internal navigation uses components/ui/Link (View Transitions)
 *  - sitemap covers current routes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { poets, articles, musicTracks } from '../src/data/library/index.ts';
import { essays } from '../src/data/essays/index.ts';
import { getAllArticles } from '../src/utils/articleLibrary.ts';
import { siteConfig } from '../src/config/site.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcRoot = path.join(root, 'src');

let errors = 0;
let warnings = 0;

function fail(msg: string) {
  console.error(`  ✕ ${msg}`);
  errors += 1;
}
function warn(msg: string) {
  console.warn(`  ⚠ ${msg}`);
  warnings += 1;
}
function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}

function walk(dir: string, pred: (f: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, pred));
    else if (pred(full)) out.push(full);
  }
  return out;
}

console.log('\n— Data integrity —');

// Poets
if (poets.length < 1) fail('no poets loaded');
else ok(`${poets.length} poets`);

const poetIds = new Set<string>();
for (const p of poets) {
  if (!p.id) fail('poet missing id');
  if (poetIds.has(p.id)) fail(`duplicate poet id: ${p.id}`);
  poetIds.add(p.id);
  if (!p.name || !p.fullName) fail(`poet ${p.id}: missing name/fullName`);
  if (!p.photo?.startsWith('/images/')) fail(`poet ${p.id}: photo must be /images/...`);
  else {
    const photoPath = path.join(root, 'public', p.photo.replace(/^\//, ''));
    if (!fs.existsSync(photoPath)) fail(`poet ${p.id}: photo file missing at public${p.photo}`);
  }
  if (!p.shortBio || p.shortBio.length < 20) fail(`poet ${p.id}: shortBio too short`);
  if (!p.fullBio || p.fullBio.length < 40) fail(`poet ${p.id}: fullBio too short`);
  if (!Array.isArray(p.poems) || p.poems.length === 0) fail(`poet ${p.id}: no poems`);
  for (const poem of p.poems || []) {
    if (!poem.id) fail(`poet ${p.id}: poem without id`);
    if (!poem.text || poem.text.trim().length < 20) fail(`poet ${p.id}: poem "${poem.title}" text too short`);
  }
  if (!Array.isArray(p.tags) || p.tags.length === 0) warn(`poet ${p.id}: no tags`);
  if (typeof p.rating !== 'number' || p.rating < 0 || p.rating > 10) fail(`poet ${p.id}: rating out of range`);
}

// Articles
const allArticles = getAllArticles();
const articleIds = new Set<string>();
for (const a of allArticles) {
  if (!a.id) fail('article missing id');
  if (articleIds.has(a.id)) fail(`duplicate article id: ${a.id}`);
  articleIds.add(a.id);
  if (!a.title || !a.content) fail(`article ${a.id}: missing title/content`);
  if (!a.date) warn(`article ${a.id}: missing date`);
}
ok(`${allArticles.length} articles (${articles.length} global + ${allArticles.length - articles.length} poet-attached)`);

// Essays
const essayIds = new Set<string>();
const essaySlugs = new Set<string>();
for (const e of essays) {
  if (!e.id) fail('essay missing id');
  if (essayIds.has(e.id)) fail(`duplicate essay id: ${e.id}`);
  essayIds.add(e.id);
  if (!e.slug) fail(`essay ${e.id}: missing slug`);
  if (essaySlugs.has(e.slug)) fail(`duplicate essay slug: ${e.slug}`);
  essaySlugs.add(e.slug);
  if (!Array.isArray(e.blocks) || e.blocks.length < 3) fail(`essay ${e.id}: too few blocks`);
  if (!e.cover) warn(`essay ${e.id}: no cover`);
}
ok(`${essays.length} essays`);

// Tracks
const trackIds = new Set<string>();
for (const t of musicTracks) {
  if (!t.id) fail('track missing id');
  if (trackIds.has(t.id)) fail(`duplicate track id: ${t.id}`);
  trackIds.add(t.id);
  if (!t.audioUrl && !t.externalUrl && !t.videoUrl) {
    warn(`track ${t.id}: no audioUrl/externalUrl/videoUrl — dead row`);
  }
}
ok(`${musicTracks.length} tracks`);

console.log('\n— Brand links (siteConfig is the single source) —');
ok(`youtube: ${siteConfig.channels.youtube}`);
ok(`rutube:  ${siteConfig.channels.rutube}`);
ok(`vk:      ${siteConfig.channels.vk}`);
ok(`email:   ${siteConfig.contactEmail}`);

// Scan source for hard-coded channel URLs / dead mail domains outside site.ts
const sourceFiles = walk(srcRoot, (f) => /\.(tsx?|jsx?)$/.test(f));
const bannedPatterns: Array<{ re: RegExp; label: string; allowIn: RegExp }> = [
  {
    re: /https?:\/\/youtube\.com\/@TheLegendaryPoet/,
    label: 'hard-coded YouTube URL (use siteConfig.channels.youtube)',
    allowIn: /config\/site\.ts$/,
  },
  {
    re: /https?:\/\/rutube\.ru\/channel\/74579453/,
    label: 'hard-coded Rutube URL (use siteConfig.channels.rutube)',
    allowIn: /config\/site\.ts$/,
  },
  {
    re: /https?:\/\/vk\.com\/thelegendarypoet/,
    label: 'hard-coded VK URL (use siteConfig.channels.vk)',
    allowIn: /config\/site\.ts$/,
  },
  {
    re: /contact@legendarypoet\.com/,
    label: 'dead placeholder email contact@legendarypoet.com (use siteConfig.contactEmail)',
    allowIn: /$a/, // never allowed
  },
];

for (const file of sourceFiles) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, 'utf8');
  for (const rule of bannedPatterns) {
    if (rule.allowIn.test(file)) continue;
    if (rule.re.test(text)) fail(`${rel}: ${rule.label}`);
  }
}

// Emoji in UI source (protocol: no emoji)
const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
for (const file of sourceFiles) {
  const rel = path.relative(root, file);
  // Allow in docs under src/docs and in comments of integrity itself.
  if (rel.includes(`${path.sep}docs${path.sep}`)) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (emojiRe.test(text)) {
    // Find first line for a useful message
    const lines = text.split('\n');
    const idx = lines.findIndex((l) => emojiRe.test(l));
    fail(`${rel}:${idx + 1}: emoji in source (use SVG icons, not emoji)`);
  }
}

// Internal Link imports
console.log('\n— Navigation discipline —');
const linkImportRe = /import\s*\{[^}]*\bLink\b[^}]*\}\s*from\s*['"]react-router-dom['"]/;
let linkOffenders = 0;
for (const file of sourceFiles) {
  if (file.endsWith(`${path.sep}ui${path.sep}Link.tsx`)) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (linkImportRe.test(text)) {
    fail(`${path.relative(root, file)}: import Link from components/ui/Link, not react-router-dom`);
    linkOffenders += 1;
  }
}
if (linkOffenders === 0) ok('all Link imports go through components/ui/Link');

// Icon system: shell UI must use PremiumIcons / ChannelIcons, not lucide-react.
// (lucide may still appear only if a new surface is mid-migration — flag it.)
console.log('\n— Icon system —');
const lucideRe = /from\s*['"]lucide-react['"]/;
let lucideHits = 0;
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  if (lucideRe.test(text)) {
    fail(`${path.relative(root, file)}: use PremiumIcons/ChannelIcons, not lucide-react`);
    lucideHits += 1;
  }
}
if (lucideHits === 0) ok('no lucide-react imports in src');

// Sitemap coverage
console.log('\n— Sitemap —');
const sitemapPath = path.join(root, 'public', 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  fail('public/sitemap.xml missing — run npm run sitemap');
} else {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  for (const p of poets) {
    if (!sitemap.includes(`/poets/${p.id}`)) fail(`sitemap missing /poets/${p.id}`);
  }
  for (const e of essays) {
    if (!sitemap.includes(`/essays/${e.slug}`)) fail(`sitemap missing /essays/${e.slug}`);
  }
  for (const route of ['/hall', '/archive', '/music', '/about', '/articles', '/poets']) {
    if (!sitemap.includes(route)) fail(`sitemap missing ${route}`);
  }
  if (errors === 0) ok('sitemap covers poets, essays, and static routes');
}

// Feedback validation engine (pure unit checks)
console.log('\n— Feedback validation —');
{
  const { validateCommentInput, validateScores, pluralRu, clampScore } = await import(
    '../src/utils/feedbackValidation.ts'
  );
  const dims = [
    { key: 'a', label: 'A', hint: '' },
    { key: 'b', label: 'B', hint: '' },
  ];
  const badScores = validateScores({ a: 0, b: 3 }, dims);
  if (badScores.ok) fail('validateScores should reject zero');
  const goodScores = validateScores({ a: 4, b: 5 }, dims);
  if (!goodScores.ok || goodScores.scores.a !== 4) fail('validateScores should accept 1–5');
  const short = validateCommentInput('', 'коротко', 'literary');
  if (short.ok) fail('validateCommentInput should reject short text');
  const longOk = validateCommentInput('  Иван  ', 'Это вдумчивый комментарий о силе строки.', 'literary');
  if (!longOk.ok || longOk.author !== 'Иван') fail('validateCommentInput should sanitize author/text');
  if (clampScore(9) !== 5 || clampScore(0.2) !== 1) fail('clampScore range broken');
  if (pluralRu(1, 'оценка', 'оценки', 'оценок') !== 'оценка') fail('pluralRu(1) broken');
  if (pluralRu(3, 'оценка', 'оценки', 'оценок') !== 'оценки') fail('pluralRu(3) broken');
  if (pluralRu(11, 'оценка', 'оценки', 'оценок') !== 'оценок') fail('pluralRu(11) broken');
  if (errors === 0) ok('validateScores / validateCommentInput / pluralRu');
}

// Library modularity
console.log('\n— Library modularity —');
const poetsTs = fs.readFileSync(path.join(srcRoot, 'data', 'poets.ts'), 'utf8');
if (!/export\s*\{[^}]*poets[^}]*\}\s*from\s*['"]\.\/library['"]/.test(poetsTs) && poetsTs.split('\n').length > 30) {
  fail('src/data/poets.ts must stay a thin re-export aggregator');
} else {
  ok('src/data/poets.ts is a thin aggregator');
}
const libIndex = path.join(srcRoot, 'data', 'library', 'index.ts');
if (!fs.existsSync(libIndex)) fail('src/data/library/index.ts missing');
else ok('library/index.ts present');

// Summary
console.log('\n— Result —');
if (errors === 0) {
  console.log(`PASS — ${warnings} warning(s).`);
  process.exit(0);
} else {
  console.error(`FAIL — ${errors} error(s), ${warnings} warning(s).`);
  process.exit(1);
}
