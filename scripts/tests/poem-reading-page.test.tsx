import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildPoemPageModel, type PoemRouteRow } from '../../src/lib/poemPageModel';
import PoemReadingBody, { type PoemInternalLinkProps } from '../../src/components/poet-detail/PoemReadingBody';
import type { MusicTrack } from '../../src/types/poet';
import { approvedPoemPath, assertDirectPoemParity, poemPayloadFile, validatePoemPayload, poemHistoryVisitKey, preparedPoemForVisit } from '../../src/data/runtime/poemPagePayload';
import { assertPoemStaticAdmission, renderPoemStaticBody } from '../lib/poem-static-document';

const poet = { id: 'test-author', name: 'Автор', fullName: 'Имя Автора', photo: '/images/test.webp' };
const makeRow = (id: string, eligible = true): PoemRouteRow => ({
  poetId: poet.id, poemId: id, slug: id, candidatePath: '/poets/test-author/' + id + '/',
  legacyPath: '/poets/test-author/#poem-' + id, eligible, scope: eligible ? 'full' : 'unreviewed', poet,
  poem: { id, title: 'Заглавие ' + id, text: 'Первая строка\nВторая строка\n\nТретья строка',
    analysis: 'Самостоятельный литературный анализ.', sourceUrl: 'https://example.org/edition', rating: 9 },
});
const row = makeRow('work');
const track = (id: string, availability: MusicTrack['availability']): MusicTrack => ({
  id, title: 'Музыка ' + id, availability, poet: poet.name, releaseOrder: 1, releaseYear: 2026,
});
const render = (item: PoemRouteRow, catalog = [item], tracks: MusicTrack[] = []) => {
  const page = buildPoemPageModel(item, catalog, tracks);
  assert.ok(page);
  return { page, html: renderToStaticMarkup(createElement(PoemReadingBody, { page })) };
};

test('static shared reading body has one H1, one canonical verse, real source and author links', () => {
  const { page, html } = render(row);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal((html.match(/data-poem-canonical=/g) || []).length, 1);
  assert.equal((html.match(/Первая строка/g) || []).length, 1);
  assert.ok(html.includes(row.poem.text));
  assert.ok(html.includes('href="https://example.org/edition"'));
  assert.ok(html.includes('href="/poets/test-author/#poem-work"'));
  assert.ok(html.includes(row.poem.analysis!));
  assert.ok(!html.includes('Христианский взгляд') && !html.includes('Музыкальные интерпретации'));
  assert.equal(page.path, row.candidatePath);
  const webPage = (page.schema['@graph'] as Record<string, any>[]).find(node => node['@type'] === 'WebPage')!;
  assert.equal(webPage.mainEntity['@type'], 'CreativeWork');
  assert.equal(webPage.mainEntity.author.name, poet.fullName);
  assert.ok(!webPage.datePublished && !webPage.dateModified);
  assert.equal(webPage.url, 'https://thelegendarypoet.ru/poets/test-author/work/');
});
test('held works yield no standalone view or metadata; invalid identity fails', () => {
  const held = makeRow('hold', false);
  assert.equal(buildPoemPageModel(held, [held], []), null);
  assert.throws(() => buildPoemPageModel({ ...row, candidatePath: '/wrong/' }, [row], []), /Invalid poem page identity/);
  assert.throws(() => buildPoemPageModel(row, [], []), /missing or duplicated/);
  assert.throws(() => buildPoemPageModel({ ...row, scope: 'unreviewed' }, [row], []), /Unapproved poem page scope/);
});
test('excerpt stays explicit, epigraph is separate, year and edition retain their meaning', () => {
  const excerpt: PoemRouteRow = { ...row, scope: 'excerpt', poem: { ...row.poem,
    year: 1826, yearLabel: '1826–1827', editionYear: 1829, yearNote: 'Датировка уточняется.',
    epigraph: { text: 'Эпиграф', attribution: 'Другой автор' }, textualNote: 'История редакции.',
    textualSourceUrl: 'https://example.org/notes', biblicalPerspective: 'Сопоставление с Писанием.' } };
  const { page, html } = render(excerpt);
  assert.ok(page.description.startsWith('Фрагмент.'));
  assert.ok(html.includes('не полный текст') && html.includes('1826–1827') && html.includes('редакция 1829 г.'));
  assert.ok(html.includes('Эпиграф') && html.includes('Другой автор'));
  assert.ok(html.includes('Христианский взгляд') && html.includes('https://example.org/notes'));
  assert.ok(!html.includes('>Текст стихотворения<'));
});
test('neighbours use standalone path only when eligible; explicit published music only', () => {
  const previous = makeRow('previous', false);
  const next = makeRow('next');
  const item = { ...row, poem: { ...row.poem, relatedMusicTrackIds: ['live', 'future', 'retired'] } };
  const { page, html } = render(item, [previous, item, next],
    [track('live', 'published'), track('future', 'coming-soon'), track('retired', 'archived'), track('other', 'published')]);
  assert.equal(page.previous?.href, previous.legacyPath);
  assert.equal(page.next?.href, next.candidatePath);
  assert.deepEqual(page.music.map(item => item.href), ['/music/live/']);
  assert.ok(html.includes('href="/music/live/"'));
  assert.ok(!html.includes('/music/future/') && !html.includes('/music/retired/') && !html.includes('/music/other/'));
});
test('text is escaped by React and unsafe edition links cannot render', () => {
  const changed = { ...row, poem: { ...row.poem, text: '<script>alert(1)</script> & строка' } };
  const { html } = render(changed);
  assert.ok(html.includes('&lt;script&gt;') && !html.includes('<script>'));
  for (const sourceUrl of ['javascript:alert(1)', 'http://example.org', 'https://secret@example.org/']) {
    assert.throws(() => render({ ...row, poem: { ...row.poem, sourceUrl } }), /Non-public poem source URL/);
  }
});

test('static full document owns exactly one visible H1 and verse before JavaScript', () => {
  const item = { ...row, poem: { ...row.poem, text: 'Строка $& $1 $$\nВторая строка' } };
  const { page } = render(item);
  const shell = '<!doctype html><html lang="ru"><head><title>Title</title></head><body><div id="root"></div><script type="module" src="/assets/app.js"></script></body></html>';
  const html = renderPoemStaticBody(shell, page);
  assert.ok(html.includes('Строка $&amp; $1 $$\nВторая строка'));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal((html.match(/data-poem-canonical=/g) || []).length, 1);
  assert.ok(html.includes('<div id="root"><main id="main-content" data-poem-static-path="' + page.path + '"'));
  assert.ok(html.includes('src="/assets/app.js"'));
  assert.throws(() => renderPoemStaticBody('<div id="root">old</div>', page), /exactly one empty/);
  assert.throws(() => renderPoemStaticBody(shell + '<div id="root"></div>', page), /exactly one empty/);
});
test('static admission is fail-closed until runtime route and discovery inventory agree', () => {
  const { page } = render(row);
  const route = { id: 'poem-detail', path: '/poets/:id/:slug', discoveryState: 'ready', sitemap: false };
  const entry = { path: page.path, state: 'ready', routeId: route.id };
  assert.doesNotThrow(() => assertPoemStaticAdmission([], [], []));
  assert.throws(() => assertPoemStaticAdmission([], [route], [entry]), /Unapproved poem/);
  assert.throws(() => assertPoemStaticAdmission([page], [], [entry]), /not registered/);
  assert.throws(() => assertPoemStaticAdmission([page], [route], []), /does not match/);
  assert.throws(() => assertPoemStaticAdmission([page], [route], [{ ...entry, state: 'noindex' }]), /does not match/);
  assert.throws(() => assertPoemStaticAdmission([page, page], [route], [entry, entry]), /does not match/);
  assert.doesNotThrow(() => assertPoemStaticAdmission([page], [route], [entry]));
});

test('browser admission uses exact approved path and validates route payload identity', () => {
  const { page } = render(row);
  const index = { schemaVersion: 1 as const, pages: { [page.path]: page.poemId } };
  assert.equal(approvedPoemPath(index, 'test-author', 'work'), page.path);
  assert.equal(approvedPoemPath(index, 'test-author', 'held'), null);
  assert.equal(approvedPoemPath(index, 'test-author', '../work'), null);
  assert.equal(poemPayloadFile(page.path), 'test-author/work.json');
  assert.throws(() => poemPayloadFile('/poets/../work/'), /Invalid standalone/);
  assert.deepEqual(validatePoemPayload(JSON.parse(JSON.stringify(page)), page.path, page.poemId).text, page.text);
  assert.throws(() => validatePoemPayload({ ...page, poemId: 'other' }, page.path, page.poemId), /identity or content/);
  assert.throws(() => validatePoemPayload({ ...page, legacyPath: '/wrong/' }, page.path, page.poemId), /legacy identity/);
});

test('initial static snapshot must agree with approved payload before client handoff', () => {
  const { page } = render(row);
  const snapshot = { path: page.path, workId: page.poemId, heading: page.heading, text: page.text, analysis: page.analysis };
  assert.doesNotThrow(() => assertDirectPoemParity(snapshot, page));
  for (const key of ['path', 'workId', 'heading', 'text', 'analysis'] as const) {
    assert.throws(() => assertDirectPoemParity({ ...snapshot, [key]: snapshot[key] + ' changed' }, page), /content differ/);
  }
});

test('shared reading body exposes interaction slots without duplicating canonical content', () => {
  const { page, html } = render(row);
  const enhanced = renderToStaticMarkup(createElement(PoemReadingBody, { page,
    actions: createElement('button', { type: 'button' }, 'В архив') }));
  assert.ok(!html.includes('В архив'));
  assert.ok(enhanced.includes('В архив'));
  assert.equal((enhanced.match(/data-poem-canonical=/g) || []).length, 1);
  assert.equal((enhanced.match(/<h1\b/g) || []).length, 1);
  assert.ok(enhanced.includes(page.text));
});

test('interactive navigation adapter preserves every crawlable internal href and never handles external sources', () => {
  const previous = makeRow('previous', false);
  const next = makeRow('next');
  const item = { ...row, poem: { ...row.poem, textualNote: 'Редакция.', textualSourceUrl: 'https://example.org/notes', relatedMusicTrackIds: ['live'] } };
  const { page, html } = render(item, [previous, item, next], [track('live', 'published')]);
  const seen: string[] = [];
  const Adapter = (props: PoemInternalLinkProps) => {
    seen.push(props.href);
    return createElement('a', props);
  };
  const interactive = renderToStaticMarkup(createElement(PoemReadingBody, { page, internalLink: Adapter }));
  assert.equal(interactive, html);
  assert.deepEqual(seen, ['/', '/poets/', page.authorHref, page.authorHref, '/music/live/', page.legacyPath, previous.legacyPath, next.candidatePath]);
  assert.ok(seen.every(href => href.startsWith('/') && !href.startsWith('//')));
  assert.ok(html.includes('href="https://example.org/edition"'));
  assert.ok(html.includes('href="https://example.org/notes"'));
});

test('direct handoff reuses the actual history visit on reload, not only the default entry', () => {
  const { page } = render(row);
  for (const state of [null, undefined, {}, { key: '' }, { key: 7 }]) assert.equal(poemHistoryVisitKey(state), 'default');
  const visitKey = poemHistoryVisitKey({ key: 'reload-entry' });
  assert.equal(visitKey, 'reload-entry');
  const prepared = { visitKey, page };
  assert.equal(preparedPoemForVisit(prepared, page.path, page.path, visitKey), page);
  assert.equal(preparedPoemForVisit(prepared, page.path, page.path.slice(0, -1), visitKey), page);
  assert.equal(preparedPoemForVisit(prepared, page.path, page.path, 'default'), undefined);
  assert.equal(preparedPoemForVisit(prepared, page.path, page.path, 'fresh-entry'), undefined);
  assert.equal(preparedPoemForVisit(prepared, null, page.path, visitKey), undefined);
  assert.equal(preparedPoemForVisit(prepared, page.path, '/wrong/', visitKey), undefined);
  assert.equal(preparedPoemForVisit(prepared, '/poets/test-author/other/', '/poets/test-author/other/', visitKey), undefined);
});
