import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildPoemPageModel, type PoemRouteRow } from '../../src/lib/poemPageModel';
import PoemReadingBody from '../../src/components/poet-detail/PoemReadingBody';
import type { MusicTrack } from '../../src/types/poet';
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
  return { page, html: renderToStaticMarkup(<PoemReadingBody page={page} />) };
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
  assert.ok(html.includes('<div id="root"><main id="main-content">'));
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
