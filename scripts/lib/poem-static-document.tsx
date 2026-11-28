import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PoemReadingBody from '../../src/components/poet-detail/PoemReadingBody';
import type { PoemPageModel } from '../../src/lib/poemPageModel';
import type { Poet } from '../../src/types/poet';
import { approvedPoemHref, type PoemPageIndex } from '../../src/data/runtime/poemPagePayload';

const emptyRoot = '<div id="root"></div>';
export function renderPoemStaticBody(document: string, page: PoemPageModel): string {
  if (document.split(emptyRoot).length !== 2) {
    throw new Error('Poem prerender requires exactly one empty application root');
  }
  // Callback replacement is deliberate: literal $ sequences in authored verse
  // must survive String.replace unchanged. React handles text/attribute escaping.
  const body = renderToStaticMarkup(createElement(PoemReadingBody, { page }));
  // The path is a validated canonical model value; escape attribute characters
  // defensively before injecting the single existing application root.
  const marker = page.path.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return document.replace(emptyRoot, () => '<div id="root"><main id="main-content" data-poem-static-path="' + marker + '" class="relative z-10 min-h-screen pb-32 md:pb-0"><div class="pt-24 sm:pt-28">' + body + '</div></main></div>');
}

/** Honest first-response author navigation for approved standalone works.
 * This is a visible fallback, not an alternative full biography or a hidden SEO
 * copy. Retain all legacy anchors including neighbours without standalone routes.
 */
export function renderAuthorPoemEntryBody(document: string, poet: Pick<Poet, 'id' | 'name' | 'shortBio' | 'poems'>, index: PoemPageIndex): string {
  const entries = poet.poems.map(poem => ({ poem, href: approvedPoemHref(index, poet.id, poem.id) }));
  if (!entries.some(entry => entry.href)) return document;
  if (document.split(emptyRoot).length !== 2) throw new Error('Author prerender requires exactly one empty application root');
  const body = renderToStaticMarkup(createElement('main', {
    id: 'main-content', 'data-author-poem-static': poet.id, className: 'theme-page-surface mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-8'
  },
    createElement('h1', { className: 'theme-text font-serif text-4xl' }, poet.name),
    createElement('p', { className: 'theme-text mt-4 leading-relaxed' }, poet.shortBio),
    createElement('h2', { className: 'theme-text mt-8 font-serif text-2xl' }, 'Стихотворения'),
    createElement('p', { className: 'theme-functional-muted mt-2 text-sm' }, 'Отдельные опубликованные страницы доступны сразу. Полная биография и собрание автора доступны в интерактивном режиме.'),
    createElement('ol', { className: 'mt-4 space-y-3' }, entries.map(({ poem, href }) =>
      createElement('li', { key: poem.id, id: 'poem-' + poem.id, className: 'theme-elevated-surface scroll-mt-28 rounded-xl border p-4' },
        createElement('h3', { className: 'theme-text font-semibold break-words' }, poem.title),
        href ? createElement('a', { href, 'aria-label': 'Читать отдельно: ' + poem.title, className: 'theme-text inline-flex min-h-11 items-center underline underline-offset-4' }, 'Читать стихотворение отдельно') : null
      )
    ))
  ));
  return document.replace(emptyRoot, () => '<div id="root">' + body + '</div>');
}

type Route = { id: string; path: string; discoveryState: string; sitemap: boolean };
type InventoryRow = { path: string; state: string; routeId: string };
export function assertPoemStaticAdmission(
  pages: readonly PoemPageModel[], routes: readonly Route[], inventory: readonly InventoryRow[],
): void {
  if (!pages.length) {
    if (inventory.some(item => item.routeId === 'poem-detail')) throw new Error('Unapproved poem inventory entries');
    return;
  }
  const matching = routes.filter(route => route.id === 'poem-detail'
    && route.path === '/poets/:id/:slug' && route.discoveryState === 'ready' && !route.sitemap);
  if (matching.length !== 1) throw new Error('Standalone poem runtime route is not registered');
  const entries = inventory.filter(item => item.routeId === 'poem-detail');
  const paths = new Set(pages.map(page => page.path));
  if (paths.size !== pages.length || entries.length !== pages.length
    || new Set(entries.map(item => item.path)).size !== entries.length
    || entries.some(item => item.state !== 'ready' || !paths.has(item.path))) {
    throw new Error('Standalone poem discovery inventory does not match approved page set');
  }
}
