import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PoemReadingBody from '../../src/components/poet-detail/PoemReadingBody';
import type { PoemPageModel } from '../../src/lib/poemPageModel';

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
