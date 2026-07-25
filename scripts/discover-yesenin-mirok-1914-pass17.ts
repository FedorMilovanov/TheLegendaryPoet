import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

interface PublicationTarget {
  book: 1 | 2 | 3 | 4 | 7 | 12;
  month: string;
  poem: string;
  printedPages: string;
  febUrl: string;
}

interface IssueRecord {
  book: number;
  title: string;
  catalogueCode: string;
  catalogueUrl: string;
  issuePageSha256: string;
  issuePageBytes: number;
  literalPdfCandidates: string[];
  viewerCandidates: string[];
  exactIssueIdentified: true;
  pdfBytesAcquired: false;
  contentInspected: false;
}

const serialCode = '000199_000009_006697247';
const serialUrl = `https://rusneb.ru/catalog/${serialCode}/`;
const yearUrl = `${serialUrl}?year=1914`;
const artifactRoot = 'artifacts/yesenin-mirok-1914-discovery-pass17';
const rawDir = join(artifactRoot, 'raw');
await mkdir(rawDir, { recursive: true });

const targets: readonly PublicationTarget[] = [
  {
    book: 1,
    month: 'январь',
    poem: 'Берёза',
    printedPages: '10',
    febUrl: 'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p',
  },
  {
    book: 2,
    month: 'февраль',
    poem: 'Пороша',
    printedPages: '46',
    febUrl: 'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p',
  },
  {
    book: 3,
    month: 'март',
    poem: 'Село',
    printedPages: '85',
    febUrl: 'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p',
  },
  {
    book: 4,
    month: 'апрель',
    poem: 'Пасхальный благовест',
    printedPages: '124',
    febUrl: 'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p',
  },
  {
    book: 7,
    month: 'июль',
    poem: 'С добрым утром!',
    printedPages: '219',
    febUrl: 'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p',
  },
  {
    book: 12,
    month: 'декабрь',
    poem: 'Сиротка',
    printedPages: '364–368',
    febUrl: 'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p',
  },
] as const;

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function stripHtml(value: string): string {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(value: string, base: string): string | null {
  const decoded = decodeHtml(value).replace(/\\u002F/g, '/').replace(/\\\//g, '/');
  try {
    const url = new URL(decoded, base);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    url.protocol = 'https:';
    return url.toString();
  } catch {
    return null;
  }
}

async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string; status: number }> {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'TheLegendaryPoet primary-source discovery runner/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)',
      accept: 'text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.2',
      'accept-language': 'ru,en;q=0.7',
    },
    signal: AbortSignal.timeout(60_000),
  });
  const html = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return { html, finalUrl: response.url, status: response.status };
}

function extractAnchors(html: string, base: string): Array<{ url: string; text: string }> {
  const anchors: Array<{ url: string; text: string }> = [];
  const regex = /<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(regex)) {
    const url = absoluteUrl(match[1], base);
    if (!url) continue;
    anchors.push({ url, text: stripHtml(match[2]) });
  }
  return anchors;
}

function extractAllUrls(html: string, base: string): string[] {
  const values = new Set<string>();
  for (const match of html.matchAll(/(?:href|src|data-url|data-src)\s*=\s*["']([^"']+)["']/gi)) {
    const url = absoluteUrl(match[1], base);
    if (url) values.add(url);
  }
  for (const match of html.matchAll(/https?:\\?\/\\?\/[^"'<>\s]+/gi)) {
    const url = absoluteUrl(match[0], base);
    if (url) values.add(url);
  }
  for (const match of html.matchAll(/["'](?:downloadUrl|pdfUrl|fileUrl|viewerUrl)["']\s*:\s*["']([^"']+)["']/gi)) {
    const url = absoluteUrl(match[1], base);
    if (url) values.add(url);
  }
  return [...values];
}

function bookNumber(text: string): number | null {
  const match = text.match(/1914\s*,?\s*(?:кн\.|книга|№)\s*(\d{1,2})/iu);
  return match ? Number(match[1]) : null;
}

const discovered = new Map<number, { title: string; code: string; url: string }>();
const crawledYearPages: string[] = [];
for (let page = 1; page <= 6; page += 1) {
  const url = page === 1 ? yearUrl : `${yearUrl}&page=${page}`;
  const { html, finalUrl } = await fetchHtml(url);
  crawledYearPages.push(finalUrl);
  await writeFile(join(rawDir, `year-1914-page-${page}.html`), html, 'utf8');
  let added = 0;
  for (const anchor of extractAnchors(html, finalUrl)) {
    const codeMatch = anchor.url.match(/\/catalog\/(000199_000009_\d+)\/?/);
    const book = bookNumber(anchor.text);
    if (!codeMatch || book === null || !/\bМирок\b/iu.test(anchor.text)) continue;
    if (!discovered.has(book)) added += 1;
    discovered.set(book, { title: anchor.text, code: codeMatch[1], url: `https://rusneb.ru/catalog/${codeMatch[1]}/` });
  }
  if (page > 1 && added === 0) break;
}

const requiredBooks = targets.map((target) => target.book);
const missing = requiredBooks.filter((book) => !discovered.has(book));
const issueRecords: IssueRecord[] = [];
for (const target of targets) {
  const issue = discovered.get(target.book);
  if (!issue) continue;
  const { html, finalUrl } = await fetchHtml(issue.url);
  const bytes = Buffer.byteLength(html);
  const sha = createHash('sha256').update(html).digest('hex');
  await writeFile(join(rawDir, `issue-${target.book}-${issue.code}.html`), html, 'utf8');
  const urls = extractAllUrls(html, finalUrl);
  const literalPdfCandidates = urls.filter((url) => /\.pdf(?:$|[?#])|\/pdf(?:\/|$)|download[^/]*pdf|format=pdf/i.test(url));
  const viewerCandidates = urls.filter((url) => /viewer|dlib\.rsl\.ru|viewer\.rsl\.ru|read\//i.test(url));
  issueRecords.push({
    book: target.book,
    title: issue.title,
    catalogueCode: issue.code,
    catalogueUrl: issue.url,
    issuePageSha256: sha,
    issuePageBytes: bytes,
    literalPdfCandidates: [...new Set(literalPdfCandidates)],
    viewerCandidates: [...new Set(viewerCandidates)],
    exactIssueIdentified: true,
    pdfBytesAcquired: false,
    contentInspected: false,
  });
}

const manifest = {
  schema: 'yesenin-mirok-1914-discovery-pass17/v1',
  generatedAt: new Date().toISOString(),
  parentSerial: {
    title: 'Мирок : ежемесячный иллюстрированный детский журнал для семьи и начальной школы',
    code: serialCode,
    url: serialUrl,
    yearFilterUrl: yearUrl,
    publisher: 'Т-во И. Д. Сытин',
    holding: 'Российская государственная библиотека / НЭБ',
  },
  crawledYearPages,
  exactIssuesDiscovered: [...discovered.entries()].sort(([a], [b]) => a - b).map(([book, issue]) => ({ book, ...issue })),
  publicationTargets: targets,
  requiredBooks,
  missingRequiredBooks: missing,
  issueRecords,
  noCatalogueArithmetic: true,
  pdfBytesAcquired: false,
  contentInspected: false,
  wikipediaUsedAsEvidence: false,
};
await writeFile(join(artifactRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const rows = targets.map((target) => {
  const issue = issueRecords.find((record) => record.book === target.book);
  return [
    target.book,
    target.month,
    target.poem,
    target.printedPages,
    issue?.catalogueCode ?? 'UNRESOLVED',
    issue?.literalPdfCandidates.length ?? 0,
    issue?.viewerCandidates.length ?? 0,
  ].join(' | ');
});
const summary = `# «Мирок», 1914 — discovery pass 17\n\n`
  + `- Parent NEB code: ${serialCode}\n`
  + `- Exact issues discovered in year filter: ${discovered.size}\n`
  + `- Required targets resolved: ${requiredBooks.length - missing.length}/${requiredBooks.length}\n`
  + `- PDF bytes acquired: false\n`
  + `- Content inspected: false\n`
  + `- Catalogue arithmetic used: false\n`
  + `- Wikipedia evidence: false\n\n`
  + `Book | Month | Poem | Printed page(s) | Exact NEB code | Literal PDF candidates | Viewer candidates\n`
  + `---: | --- | --- | --- | --- | ---: | ---:\n`
  + `${rows.join('\n')}\n`;
await writeFile(join(artifactRoot, 'SUMMARY.md'), summary, 'utf8');

console.log(summary);
if (missing.length > 0) {
  throw new Error(`Required literal 1914 issue records were not found: ${missing.join(', ')}`);
}
