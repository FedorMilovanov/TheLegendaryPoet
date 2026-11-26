import indexData from './poemPages.generated.json';
import { approvedPoemPath, poemPayloadFile, validatePoemPayload, type PoemPageIndex } from './poemPagePayload';
import type { PoemPageModel } from '../../lib/poemPageModel';

const index = indexData as PoemPageIndex;
const requests = new Map<string, Promise<PoemPageModel>>();
const missing = Promise.resolve(undefined);
export function getBrowserPoem(id: string, slug: string, pathname: string, visitKey: string): Promise<PoemPageModel | undefined> {
  const path = approvedPoemPath(index, id, slug);
  if (!path || (pathname !== path && pathname + '/' !== path)) return missing;
  const key = path + ':' + visitKey;
  const pending = requests.get(key);
  if (pending) return pending;
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const request = fetch(base + 'data/poem-pages/' + poemPayloadFile(path), { credentials: 'same-origin', cache: 'no-store' }).then(async response => {
    // Known approved routes must not silently become missing because of deployment drift.
    if (!response.ok || response.headers.get('content-type')?.includes('text/html')) throw new Error('Poem payload unavailable: ' + path);
    return validatePoemPayload(await response.json(), path, index.pages[path]);
  });
  // Bounded visit cache; later navigations can retry without an infinite suspense loop.
  requests.set(key, request);
  if (requests.size > 24) requests.delete(requests.keys().next().value!);
  return request;
}
