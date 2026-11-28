import { poemTextDigest } from './poem-discovery.mjs';

const routePattern = /^\/poets\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/;
const poemNamespace = /^\/poets\/[^/]+\/[^/]+\/$/;
const workPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', '#x27': "'", '#39': "'" };
const decode = value => value.replace(/&(amp|lt|gt|quot|#x27|#39);/g, (_, key) => entities[key]);
const normalize = value => value.replace(/\r\n?/g, '\n');
const equalSet = (actual, expected) => actual.length === expected.length && new Set(actual).size === actual.length && actual.every(value => expected.includes(value));
const body = html => html.match(/<div id="root">(<main\b[\s\S]*?<\/main>)<\/div>/)?.[1] ?? '';
const anchor = (html, href) => [...html.matchAll(/<a\b[^>]*\shref="([^"]+)"[^>]*>/g)].some(match => decode(match[1]) === href);
const block = (html, tag, marker) => {
  const pattern = new RegExp(`<${tag}\\b[^>]*\\s${marker}="[^"]*"[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'g');
  const matches = [...html.matchAll(pattern)];
  return matches.length === 1 ? decode(matches[0][1]) : null;
};

/** Validate the final emitted route graph, not just its head metadata. */
export function poemOutputErrors({ index, policy, sitemapPaths, manifestEntries, htmlFiles, payloadFiles, read, readGenerated }) {
  const errors = [];
  const expect = (condition, message) => { if (!condition) errors.push(message); };
  if (index?.schemaVersion !== 1 || !index.pages || typeof index.pages !== 'object' || Array.isArray(index.pages)) return ['Invalid generated poem index'];
  const admitted = Object.entries(index.pages);
  const expectedPaths = admitted.map(([route]) => route);
  const approvedIds = Object.entries(policy.reviews ?? {}).filter(([, review]) => review.decision === 'approved').map(([id]) => id);
  expect(equalSet(admitted.map(([, id]) => id), approvedIds), 'Approved work IDs differ from generated poem index');
  expect(equalSet(sitemapPaths.filter(route => poemNamespace.test(route)), expectedPaths), 'Standalone poem sitemap paths differ from generated index');
  const manifest = manifestEntries.filter(entry => entry.routeId === 'poem-detail');
  expect(equalSet(manifest.map(entry => entry.path), expectedPaths) && manifest.every(entry => entry.state === 'ready'), 'Standalone poem manifest paths/state differ from generated index');
  expect(equalSet(htmlFiles.filter(file => poemNamespace.test('/' + file.replace(/index\.html$/, ''))).filter(file => file.endsWith('/index.html')), expectedPaths.map(route => route.slice(1) + 'index.html')), 'Standalone poem HTML inventory differs from generated index');
  expect(equalSet(payloadFiles, expectedPaths.map(route => route.slice('/poets/'.length, -1) + '.json')), 'Standalone poem payload inventory differs from generated index');
  for (const [route, id] of admitted) {
    const match = routePattern.exec(route);
    if (!match || typeof id !== 'string' || !workPattern.test(id)) { errors.push('Invalid standalone poem identity: ' + route); continue; }
    const [, author, slug] = match;
    const review = policy.reviews?.[id];
    const authorPath = `/poets/${author}/`;
    const legacy = authorPath + '#poem-' + id;
    expect(policy.authors?.[author]?.[id] === slug && review?.decision === 'approved', 'Standalone poem policy mismatch: ' + route);
    const file = `data/poem-pages/${author}/${slug}.json`;
    let page;
    try {
      const emitted = read(file);
      expect(normalize(emitted) === normalize(readGenerated(file)), 'Emitted poem payload differs from generated source: ' + route);
      page = JSON.parse(emitted);
    } catch { errors.push('Missing or invalid poem payload: ' + route); continue; }
    if (!page || typeof page !== 'object' || typeof page.text !== 'string' || typeof page.analysis !== 'string' || typeof page.heading !== 'string') { errors.push('Incomplete poem payload: ' + route); continue; }
    expect(page.path === route && page.poemId === id && page.authorHref === authorPath && page.legacyPath === legacy && page.scope === review?.scope, 'Poem payload identity/scope mismatch: ' + route);
    const digest = poemTextDigest(page);
    expect(digest === review?.textSha256, 'Poem payload text differs from reviewed text: ' + route);
    const authorHtml = body(read(authorPath.slice(1) + 'index.html'));
    const poemHtml = body(read(route.slice(1) + 'index.html'));
    expect(authorHtml.includes(`data-author-poem-static="${author}"`) && (authorHtml.match(/<h1\b/g) || []).length === 1, 'Missing readable author entry body: ' + authorPath);
    expect(anchor(authorHtml, route) && authorHtml.includes(`id="poem-${id}"`), 'Missing author link or return anchor: ' + route);
    expect(poemHtml.includes(`data-poem-static-path="${route}"`) && poemHtml.includes(`data-poem-reading-page="${id}"`) && (poemHtml.match(/<h1\b/g) || []).length === 1 && decode(poemHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '') === page.heading, 'Missing single readable poem body: ' + route);
    expect(block(poemHtml, 'div', 'data-poem-canonical') === page.text && block(poemHtml, 'p', 'data-poem-analysis') === page.analysis, 'Static verse/analysis differs from payload: ' + route);
    expect(anchor(poemHtml, legacy) && anchor(poemHtml, page.source), 'Missing return or source link: ' + route);
    if (page.facsimile) {
      expect(page.facsimile.rights === 'approved' && page.facsimile.poemId === id && Array.isArray(page.facsimile.pages) && page.facsimile.pages.length > 0 && page.facsimile.pages.every(leaf => typeof leaf.src === 'string' && leaf.src.startsWith('/images/facsimiles/') && anchor(poemHtml, leaf.src) && anchor(poemHtml, leaf.originalUrl)), 'Missing approved facsimile links: ' + route);
    }
    expect(!poemHtml.includes('/images/facsimile-review/'), 'Review-only facsimile leaked into poem HTML: ' + route);
  }
  return errors;
}
