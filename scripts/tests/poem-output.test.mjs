import test from 'node:test';
import assert from 'node:assert/strict';
import { poemTextDigest } from '../lib/poem-discovery.mjs';
import { poemOutputErrors } from '../lib/poem-output-contract.mjs';
import { hasApprovedPoemPages } from '../lib/poem-build-admission.mjs';

const route = '/poets/author-a/fixed-slug/';
const authorPath = '/poets/author-a/';
const legacy = authorPath + '#poem-work-1';
const payload = 'data/poem-pages/author-a/fixed-slug.json';
const authorFile = 'poets/author-a/index.html';
const poemFile = 'poets/author-a/fixed-slug/index.html';
const escapeHtml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const wrap = html => '<div id="root"><main ' + html + '</main></div>';
function outputFixture() {
  const page = { path: route, poemId: 'work-1', authorHref: authorPath, legacyPath: legacy, scope: 'full', heading: 'Title & <name>', text: 'Line & <word>\n\n"Second" line', analysis: "Analysis & author's note", source: 'https://example.org/edition?a=1&b=2' };
  const policy = { authors: { 'author-a': { 'work-1': 'fixed-slug', 'held-work': 'held' } }, reviews: { 'work-1': { decision: 'approved', scope: 'full', textSha256: poemTextDigest(page) }, 'held-work': { decision: 'hold' } } };
  const files = {
    [payload]: JSON.stringify(page, null, 2) + '\n',
    [authorFile]: wrap(`data-author-poem-static="author-a"><h1>Author</h1><li id="poem-work-1"><a href="${route}">Read</a></li>`),
    [poemFile]: wrap(`data-poem-static-path="${route}"><article data-poem-reading-page="work-1"><h1>${escapeHtml(page.heading)}</h1><div data-poem-canonical="true">${escapeHtml(page.text)}</div><p data-poem-analysis="true">${escapeHtml(page.analysis)}</p><a href="${escapeHtml(page.source)}">Source</a><a href="${legacy}">Return</a></article>`),
  };
  const generated = { [payload]: files[payload] };
  const input = { index: { schemaVersion: 1, pages: { [route]: 'work-1' } }, policy, sitemapPaths: [authorPath, route], manifestEntries: [{ path: route, routeId: 'poem-detail', state: 'ready' }], htmlFiles: [authorFile, poemFile], payloadFiles: ['author-a/fixed-slug.json'], read: file => files[file] ?? '', readGenerated: file => generated[file] ?? '' };
  return { input, files, generated, page };
}

test('emitted poem graph passes with escaped literal text and exact policy digest', () => {
  assert.deepEqual(poemOutputErrors(outputFixture().input), []);
});
test('zero approvals permit no standalone artifacts', () => {
  const { input } = outputFixture();
  input.index.pages = {}; input.policy.reviews['work-1'].decision = 'hold'; input.sitemapPaths = [authorPath]; input.manifestEntries = []; input.htmlFiles = [authorFile]; input.payloadFiles = [];
  assert.deepEqual(poemOutputErrors(input), []);
});
test('emitted poem graph rejects missing, stale and stray output', () => {
  const mutations = [
    ['author link', f => { f.files[authorFile] = f.files[authorFile].replace(' href=', ' data-href='); }],
    ['return anchor', f => { f.files[authorFile] = f.files[authorFile].replace('id="poem-work-1"', 'id="wrong"'); }],
    ['author body', f => { f.files[authorFile] = '<div id="root"></div>'; }],
    ['poem body', f => { f.files[poemFile] = '<div id="root"></div>'; }],
    ['duplicate heading', f => { f.files[poemFile] = f.files[poemFile].replace('</h1>', '</h1><h1>Other</h1>'); }],
    ['changed verse', f => { f.files[poemFile] = f.files[poemFile].replace('Second', 'Wrong'); }],
    ['changed analysis', f => { f.files[poemFile] = f.files[poemFile].replace('Analysis', 'Wrong'); }],
    ['lost return link', f => { f.files[poemFile] = f.files[poemFile].replace(legacy, authorPath); }],
    ['stale payload', f => { f.files[payload] = JSON.stringify({ ...f.page, analysis: 'Wrong' }); }],
    ['changed reviewed text', f => { f.files[payload] = f.generated[payload] = JSON.stringify({ ...f.page, text: 'Wrong' }); }],
    ['invalid JSON', f => { f.files[payload] = '{'; }],
    ['missing sitemap', f => { f.input.sitemapPaths = [authorPath]; }],
    ['held sitemap path', f => { f.input.sitemapPaths.push('/poets/author-a/held/'); }],
    ['duplicate manifest', f => { f.input.manifestEntries.push(f.input.manifestEntries[0]); }],
    ['manifest noindex', f => { f.input.manifestEntries[0].state = 'hold'; }],
    ['stray HTML', f => { f.input.htmlFiles.push('poets/author-a/held/index.html'); }],
    ['stray JSON', f => { f.input.payloadFiles.push('author-a/held.json'); }],
    ['held approval', f => { f.input.policy.reviews['work-1'].decision = 'hold'; }],
    ['wrong scope', f => { f.files[payload] = f.generated[payload] = JSON.stringify({ ...f.page, scope: 'excerpt' }); }],
    ['unapproved facsimile path', f => { f.files[poemFile] = f.files[poemFile].replace('</article>', '<a href="/images/facsimile-review/foo.png">Review</a></article>'); }],
  ];
  for (const [label, mutate] of mutations) {
    const fixture = outputFixture(); mutate(fixture);
    assert.ok(poemOutputErrors(fixture.input).length > 0, label);
  }
});
test('approved facsimile links must be visible in the static reading body', () => {
  const f = outputFixture();
  const leaf = { src: '/images/facsimiles/leaf.png', originalUrl: 'https://example.org/leaf' };
  f.files[payload] = f.generated[payload] = JSON.stringify({ ...f.page, facsimile: { rights: 'approved', poemId: 'work-1', pages: [leaf] } });
  assert.ok(poemOutputErrors(f.input).some(error => error.includes('facsimile links')));
  f.files[poemFile] = f.files[poemFile].replace('</article>', `<a href="${leaf.src}">Leaf</a><a href="${leaf.originalUrl}">Archive</a></article>`);
  assert.deepEqual(poemOutputErrors(f.input), []);
});

test('standalone reader build admission is driven by the exact generated index', () => {
  assert.equal(hasApprovedPoemPages({ schemaVersion: 1, pages: {} }), false);
  assert.equal(hasApprovedPoemPages(outputFixture().input.index), true);
  for (const index of [
    null, { schemaVersion: 2, pages: {} }, { schemaVersion: 1, pages: [] },
    { schemaVersion: 1, pages: { '/poets/a/b': 'work' } },
    { schemaVersion: 1, pages: { '/poets/a/b/': '' } },
  ]) assert.throws(() => hasApprovedPoemPages(index), /Invalid standalone poem build admission/);
});
