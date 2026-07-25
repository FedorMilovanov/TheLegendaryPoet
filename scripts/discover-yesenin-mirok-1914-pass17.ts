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

type DiscoveryMethod = 'serial-year-anchor' | 'neb-search-anchor';

interface DiscoveredIssue {
  book: number;
  title: string;
  code: string;
  url: string;
  method: DiscoveryMethod;
  discoveredOn: string;
}

interface PdfAcquisition {
  url: string;
  finalUrl: string;
  contentType: string;
  byteSize: number;
  sha256: string;
  savedAs: string;
}

interface IssueRecord {
  book: number;
  title: string;
  catalogueCode: string;
  catalogueUrl: string;
  discoveryMethod: DiscoveryMethod;
  discoverySourceUrl: string;
  issuePageSha256: string;
  issuePageBytes: number;
  literalPdfCandidates: string[];
  viewerCandidates: string[];
  accessOpenMarker: boolean;
  exactIssueIdentified: true;
  pdfBytesAcquired: boolean;
  pdfAcquisition: PdfAcquisition | null;
  contentInspected: false;
}

const serialCode = '000199_000009_006697247';
const serialUrl = `https://rusneb.ru/catalog/${serialCode}/`;
const yearUrl = `${serialUrl}?year=1914`;
const searchUrl = 'https://rusneb.ru/search/';
const artifactRoot = 'artifacts/yesenin-mirok-1914-discovery-pass17';
const rawDir = join(artifactRoot, 'raw');
const pdfDir = join(artifactRoot, 'pdf');
await mkdir(rawDir, { recursive: true });
await mkdir(pdfDir, { recursive: true });

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

const requiredBooks = targets.map((target) => target.book);
const requiredBookSet = new Set<number>(requiredBooks);

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
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
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
      'user-agent': 'TheLegendaryPoet primary-source discovery runner/1.1 (+https://github.com/FedorMilovanov/TheLegendaryPoet)',
      accept: 'text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.2',
      'accept-language': 'ru,en;q=0.7',
    },
    signal: AbortSignal.timeout(60_000),
  });
  const html = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return { html, finalUrl: response.url, status: response.status };
}

async function acquirePdf(
  candidates: readonly string[],
  book: number,
  code: string,
): Promise<PdfAcquisition | null> {
  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': 'TheLegendaryPoet primary-source acquisition runner/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)',
          accept: 'application/pdf,*/*;q=0.2',
          'accept-language': 'ru,en;q=0.7',
        },
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 5 || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') continue;
      const filename = `mirok-1914-book-${book}-${code}.pdf`;
      await writeFile(join(pdfDir, filename), bytes);
      return {
        url,
        finalUrl: response.url,
        contentType: response.headers.get('content-type') ?? 'application/pdf',
        byteSize: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        savedAs: `pdf/${filename}`,
      };
    } catch {
      // The next literal candidate may be the functioning variant.
    }
  }
  return null;
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
  for (const match of html.matchAll(/(?:href|src|data-url|data-src|data-download)\s*=\s*["']([^"']+)["']/gi)) {
    const url = absoluteUrl(match[1], base);
    if (url) values.add(url);
  }
  for (const match of html.matchAll(/https?:\\?\/\\?\/[^"'<>\s]+/gi)) {
    const url = absoluteUrl(match[0], base);
    if (url) values.add(url);
  }
  for (const match of html.matchAll(/["'](?:downloadUrl|pdfUrl|fileUrl|viewerUrl|url)["']\s*:\s*["']([^"']+)["']/gi)) {
    const url = absoluteUrl(match[1], base);
    if (url) values.add(url);
  }
  return [...values];
}

function bookNumber(text: string): number | null {
  const normalized = text.replace(/№/g, 'кн.').replace(/\s+/g, ' ');
  const match = normalized.match(/1914\s*,?\s*(?:кн\.|книга)\s*(\d{1,2})/iu);
  return match ? Number(match[1]) : null;
}

function catalogueCode(url: string): string | null {
  const match = url.match(/\/catalog\/([^/?#]+)\/?/i);
  return match ? match[1] : null;
}

const discovered = new Map<number, DiscoveredIssue>();
const discoveryPages: Array<{
  method: 'serial-year' | 'neb-search';
  url: string;
  htmlBytes: number;
  htmlSha256: string;
  savedAs: string;
}> = [];
const searchAttempts: Array<{ book: number; query: string; url: string; error: string | null }> = [];

async function crawlAndRegister(
  url: string,
  filename: string,
  method: DiscoveryMethod,
): Promise<{ htmlSha256: string; newMatches: number }> {
  const { html, finalUrl } = await fetchHtml(url);
  const htmlBytes = Buffer.byteLength(html);
  const htmlSha256 = createHash('sha256').update(html).digest('hex');
  await writeFile(join(rawDir, filename), html, 'utf8');
  discoveryPages.push({
    method: method === 'serial-year-anchor' ? 'serial-year' : 'neb-search',
    url: finalUrl,
    htmlBytes,
    htmlSha256,
    savedAs: `raw/${filename}`,
  });

  let newMatches = 0;
  for (const anchor of extractAnchors(html, finalUrl)) {
    const code = catalogueCode(anchor.url);
    const book = bookNumber(anchor.text);
    if (!code || code === serialCode || book === null || !requiredBookSet.has(book)) continue;
    // Do not use JS \b around Cyrillic words: \b is ASCII-oriented and caused the pass-17 false zero.
    if (!/Мирок/iu.test(anchor.text) || !/1914/iu.test(anchor.text)) continue;
    if (!discovered.has(book)) {
      discovered.set(book, {
        book,
        title: anchor.text,
        code,
        url: `https://rusneb.ru/catalog/${code}/`,
        method,
        discoveredOn: finalUrl,
      });
      newMatches += 1;
    }
  }
  return { htmlSha256, newMatches };
}

let previousYearSha: string | null = null;
for (let page = 1; page <= 6; page += 1) {
  const url = page === 1 ? yearUrl : `${yearUrl}&page=${page}`;
  const result = await crawlAndRegister(url, `year-1914-page-${page}.html`, 'serial-year-anchor');
  if (page > 1 && result.htmlSha256 === previousYearSha) break;
  previousYearSha = result.htmlSha256;
  if (page > 1 && result.newMatches === 0) break;
}

for (const target of targets) {
  if (discovered.has(target.book)) continue;
  const queries = [
    `Мирок 1914 кн. ${target.book}`,
    `1914, кн. ${target.book} Мирок`,
    `Мирок Сытин 1914 книга ${target.book}`,
    `${target.poem} Мирок 1914`,
  ];

  queryLoop: for (const [queryIndex, query] of queries.entries()) {
    for (let page = 1; page <= 4; page += 1) {
      const params = new URLSearchParams({ q: query });
      params.append('access[]', 'open');
      if (page > 1) params.set('page', String(page));
      const url = `${searchUrl}?${params.toString()}`;
      try {
        const result = await crawlAndRegister(
          url,
          `search-book-${target.book}-q${queryIndex + 1}-page-${page}.html`,
          'neb-search-anchor',
        );
        searchAttempts.push({ book: target.book, query, url, error: null });
        if (discovered.has(target.book)) break queryLoop;
        if (page > 1 && result.newMatches === 0) break;
      } catch (error) {
        searchAttempts.push({
          book: target.book,
          query,
          url,
          error: error instanceof Error ? error.message : String(error),
        });
        break;
      }
    }
  }
}

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
  const literalPdfCandidates = urls.filter((url) =>
    /\.pdf(?:$|[?#])|\/pdf(?:\/|$)|download[^?#]*pdf|format=pdf|type=pdf|download/i.test(url),
  );
  const viewerCandidates = urls.filter((url) => /viewer|dlib\.rsl\.ru|viewer\.rsl\.ru|read\//i.test(url));
  const uniquePdfCandidates = [...new Set(literalPdfCandidates)];
  const pdfAcquisition = await acquirePdf(uniquePdfCandidates, target.book, issue.code);
  issueRecords.push({
    book: target.book,
    title: issue.title,
    catalogueCode: issue.code,
    catalogueUrl: issue.url,
    discoveryMethod: issue.method,
    discoverySourceUrl: issue.discoveredOn,
    issuePageSha256: sha,
    issuePageBytes: bytes,
    literalPdfCandidates: uniquePdfCandidates,
    viewerCandidates: [...new Set(viewerCandidates)],
    accessOpenMarker: /Доступ[\s\S]{0,200}свободн/iu.test(html),
    exactIssueIdentified: true,
    pdfBytesAcquired: pdfAcquisition !== null,
    pdfAcquisition,
    contentInspected: false,
  });
}

const manifest = {
  schema: 'yesenin-mirok-1914-discovery-pass17/v3',
  generatedAt: new Date().toISOString(),
  parentSerial: {
    title: 'Мирок : ежемесячный иллюстрированный детский журнал для семьи и начальной школы',
    code: serialCode,
    url: serialUrl,
    yearFilterUrl: yearUrl,
    publisher: 'Т-во И. Д. Сытин',
    holding: 'Российская государственная библиотека / НЭБ',
  },
  discoveryPages,
  searchAttempts,
  exactIssuesDiscovered: [...discovered.values()].sort((a, b) => a.book - b.book),
  publicationTargets: targets,
  requiredBooks,
  missingRequiredBooks: missing,
  issueRecords,
  parserCorrection: 'Removed ASCII word-boundary matching around Cyrillic Мирок; added independent literal NEB search fallback.',
  pdfAcquisitions: issueRecords.filter((record) => record.pdfAcquisition !== null).map((record) => record.pdfAcquisition),
  acquiredPdfCount: issueRecords.filter((record) => record.pdfBytesAcquired).length,
  acquiredPdfBytes: issueRecords.reduce((sum, record) => sum + (record.pdfAcquisition?.byteSize ?? 0), 0),
  noCatalogueArithmetic: true,
  pdfBytesAcquired: issueRecords.some((record) => record.pdfBytesAcquired),
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
    issue?.discoveryMethod ?? '—',
    issue?.literalPdfCandidates.length ?? 0,
    issue?.viewerCandidates.length ?? 0,
  ].join(' | ');
});
const acquiredPdfCount = issueRecords.filter((record) => record.pdfBytesAcquired).length;
const acquiredPdfBytes = issueRecords.reduce((sum, record) => sum + (record.pdfAcquisition?.byteSize ?? 0), 0);
const summary = `# «Мирок», 1914 — discovery/acquisition pass 17 v3\n\n`
  + `- Parent NEB code: ${serialCode}\n`
  + `- Exact issues discovered: ${discovered.size}\n`
  + `- Required targets resolved: ${requiredBooks.length - missing.length}/${requiredBooks.length}\n`
  + `- Serial-year issue anchors: ${[...discovered.values()].filter((item) => item.method === 'serial-year-anchor').length}\n`
  + `- NEB-search issue anchors: ${[...discovered.values()].filter((item) => item.method === 'neb-search-anchor').length}\n`
  + `- Exact PDFs acquired: ${acquiredPdfCount}\n`
  + `- Acquired PDF bytes: ${acquiredPdfBytes}\n`
  + `- Content inspected: false\n`
  + `- Catalogue arithmetic used: false\n`
  + `- Wikipedia evidence: false\n\n`
  + `Book | Month | Poem | Printed page(s) | Exact NEB code | Discovery | Literal PDF candidates | Viewer candidates\n`
  + `---: | --- | --- | --- | --- | --- | ---: | ---:\n`
  + `${rows.join('\n')}\n`;
await writeFile(join(artifactRoot, 'SUMMARY.md'), summary, 'utf8');

console.log(summary);
if (missing.length > 0) {
  throw new Error(`Required literal 1914 issue records were not found: ${missing.join(', ')}`);
}
