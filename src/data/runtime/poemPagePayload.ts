import type { PoemPageModel } from '../../lib/poemPageModel';
import { canonicalRoutePath } from '../../routes/publicUrl';

export type PoemPageIndex = { schemaVersion: 1; pages: Record<string, string> };
const token = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function approvedPoemPath(index: PoemPageIndex, id: string, slug: string): string | null {
  if (!token.test(id) || !token.test(slug)) return null;
  const path = canonicalRoutePath('/poets/' + id + '/' + slug);
  return Object.prototype.hasOwnProperty.call(index.pages, path) ? path : null;
}
export function poemPayloadFile(path: string): string {
  const match = /^\/poets\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/.exec(path);
  if (!match) throw new Error('Invalid standalone poem path: ' + path);
  return match[1] + '/' + match[2] + '.json';
}
export function validatePoemPayload(value: unknown, path: string, workId: string): PoemPageModel {
  if (!value || typeof value !== 'object') throw new Error('Invalid poem payload');
  const page = value as Partial<PoemPageModel>;
  if (page.path !== path || page.poemId !== workId || !['full','excerpt'].includes(page.scope ?? '')
    || typeof page.text !== 'string' || !page.text.trim()
    || typeof page.analysis !== 'string' || !page.analysis.trim()
    || typeof page.heading !== 'string' || typeof page.title !== 'string'
    || typeof page.description !== 'string' || typeof page.authorName !== 'string'
    || typeof page.authorHref !== 'string' || typeof page.source !== 'string'
    || typeof page.legacyPath !== 'string' || !Array.isArray(page.breadcrumbs)
    || !Array.isArray(page.music) || !page.schema) throw new Error('Poem payload identity or content mismatch: ' + path);
  const authorPath = path.slice(0, path.lastIndexOf('/', path.length - 2) + 1);
  if (page.authorHref !== authorPath || page.legacyPath !== authorPath + '#poem-' + workId) {
    throw new Error('Poem payload legacy identity mismatch: ' + path);
  }
  return page as PoemPageModel;
}

export type DirectPoemSnapshot = { path: string; workId: string; heading: string; text: string; analysis: string };
export function assertDirectPoemParity(snapshot: DirectPoemSnapshot, page: PoemPageModel): void {
  if (snapshot.path !== page.path || snapshot.workId !== page.poemId
    || snapshot.heading !== page.heading || snapshot.text !== page.text || snapshot.analysis !== page.analysis) {
    throw new Error('Static and interactive poem content differ: ' + snapshot.path);
  }
}
