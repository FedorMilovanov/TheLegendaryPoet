import type { MusicTrack, Poem, Poet } from '../types/poet';
import { siteConfig } from '../config/site';
import { canonicalRoutePath } from '../routes/publicUrl';
import { absoluteRouteUrl, buildWebPageSchema, type SeoBreadcrumb } from './seoSchema';

/** Build-time catalog row; no Node crypto or full library import in browser code. */
export interface PoemRouteRow {
  poetId: string;
  poemId: string;
  slug: string | null;
  candidatePath: string | null;
  legacyPath: string;
  eligible: boolean;
  scope: 'unreviewed' | 'full' | 'excerpt';
  poet: Pick<Poet, 'id' | 'name' | 'fullName' | 'photo'>;
  poem: Poem;
}

export interface ReadingLink {
  title: string;
  href: string;
}

function sourceHref(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Non-public poem source URL');
  }
  return value;
}

function authorPath(row: PoemRouteRow): string {
  return canonicalRoutePath('/poets/' + row.poetId);
}

function validateIdentity(row: PoemRouteRow): void {
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slug.test(row.poetId) || !slug.test(row.poemId)
    || row.poetId !== row.poet.id || row.poemId !== row.poem.id
    || row.legacyPath !== authorPath(row) + '#poem-' + row.poemId
    || (row.slug === null ? row.candidatePath !== null
      : !slug.test(row.slug) || row.candidatePath !== canonicalRoutePath(authorPath(row) + row.slug))) {
    throw new Error('Invalid poem page identity: ' + row.poemId);
  }
}

function relatedWork(row: PoemRouteRow): ReadingLink {
  validateIdentity(row);
  return { title: row.poem.title, href: row.eligible && row.candidatePath ? row.candidatePath : row.legacyPath };
}

/** One deterministic view model for static HTML and the future route component.
 * Held rows never produce standalone page content or structured data.
 * The model is a transient projection, not a second authored corpus.
 */
export function buildPoemPageModel(row: PoemRouteRow, catalog: readonly PoemRouteRow[], tracks: readonly MusicTrack[]) {
  if (!row.eligible) return null;
  validateIdentity(row);
  if (!row.candidatePath || !row.slug || (row.scope !== 'full' && row.scope !== 'excerpt')) {
    throw new Error('Unapproved poem page scope: ' + row.poemId);
  }
  const { poem, poet } = row;
  const source = sourceHref(poem.sourceUrl);
  if (!source || !poem.text.trim() || !poem.analysis?.trim()) throw new Error('Incomplete poem page: ' + row.poemId);
  const title = poem.title + ' — ' + poet.name + ' — ' + siteConfig.name;
  // A factual excerpt of the existing analysis, not new editorial claims.
  const summary = poem.analysis.replace(/\s+/gu, ' ').trim();
  const shortened = summary.length <= 145 ? summary : summary.slice(0, 145).replace(/\s+\S*$/u, '') + '…';
  const description = (row.scope === 'excerpt' ? 'Фрагмент. ' : '') + shortened;
  const path = row.candidatePath;
  const breadcrumbs: SeoBreadcrumb[] = [
    { name: 'Главная', path: '/' }, { name: 'Поэты', path: '/poets/' },
    { name: poet.name, path: authorPath(row) }, { name: poem.title, path },
  ];
  const sameAuthor = catalog.filter(item => item.poetId === row.poetId);
  const position = sameAuthor.findIndex(item => item.poemId === row.poemId);
  if (position < 0 || sameAuthor.filter(item => item.poemId === row.poemId).length !== 1) {
    throw new Error('Poem page missing or duplicated in author catalog: ' + row.poemId);
  }
  const music = tracks.filter(track => track.availability === 'published' && poem.relatedMusicTrackIds?.includes(track.id))
    .map(track => ({ title: track.title, href: canonicalRoutePath('/music/' + track.id) }));
  const yearLabel = poem.yearLabel || (poem.year === undefined ? undefined : String(poem.year) + ' год');
  const schema = buildWebPageSchema({ title, description, path, image: poet.photo, breadcrumbs,
    mainEntity: {
      '@type': 'CreativeWork', '@id': absoluteRouteUrl(path) + '#work',
      name: poem.title, inLanguage: 'ru-RU',
      author: { '@type': 'Person', '@id': absoluteRouteUrl(authorPath(row)) + '#person', name: poet.fullName || poet.name },
      citation: source,
    },
  });
  return {
    path, legacyPath: row.legacyPath, poemId: row.poemId, title, description, breadcrumbs, schema,
    heading: poem.title, authorName: poet.name, authorHref: authorPath(row),
    image: poet.photo, scope: row.scope, yearLabel, yearNote: poem.yearNote,
    editionYear: poem.editionYear, epigraph: poem.epigraph, text: poem.text,
    analysis: poem.analysis, biblicalPerspective: poem.biblicalPerspective,
    textualNote: poem.textualNote, source, textualSource: sourceHref(poem.textualSourceUrl),
    music, previous: position > 0 ? relatedWork(sameAuthor[position - 1]) : undefined,
    next: position + 1 < sameAuthor.length ? relatedWork(sameAuthor[position + 1]) : undefined,
  };
}
export type PoemPageModel = NonNullable<ReturnType<typeof buildPoemPageModel>>;
