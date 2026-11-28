import fs from 'node:fs';
import path from 'node:path';
import { poets, allMusicTracks } from '../src/data/library/index';
import { canonicalRoutePath } from '../src/routes/publicUrl';
import { buildPoemRouteCatalog } from './lib/poem-discovery.mjs';
import { buildPoemPageModel } from '../src/lib/poemPageModel';
import { poemPayloadFile, validatePoemPayload } from '../src/data/runtime/poemPagePayload';
import { assertPoemStaticAdmission } from './lib/poem-static-document';

const root = path.resolve('public/data/poem-pages');
const indexFile = path.resolve('src/data/runtime/poemPages.generated.json');
const readJson = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));
const catalog = buildPoemRouteCatalog(poets, readJson('src/data/poem-route-policy.json'), canonicalRoutePath);
const pages = catalog.filter(row => row.eligible).map(row => {
  const page = buildPoemPageModel(row, catalog, allMusicTracks);
  if (!page) throw new Error('Eligible work has no payload: ' + row.poemId);
  return page;
});
assertPoemStaticAdmission(pages, readJson('src/routes/route-contract.json').routes, readJson('public/discovery-manifest.json').canonicalUrls);
const index = { schemaVersion: 1, pages: Object.fromEntries(pages.map(page => [page.path, page.poemId])) };
const stable = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
const expected = stable(index);
if (process.argv.includes('--check')) {
  // Check the committed allowlist before prebuild. Generated payload bytes are
  // intentionally untracked and verified against dist by validate:seo-output.
  if (fs.readFileSync(indexFile, 'utf8').replace(/\r\n/g, '\n') !== expected) throw new Error('Stale poem browser allowlist; regenerate from policy');
} else {
  fs.writeFileSync(indexFile, expected, 'utf8');
  // This directory owns generated standalone payloads only, never authored data.
  fs.rmSync(root, { recursive: true, force: true });
  for (const page of pages) {
    validatePoemPayload(page, page.path, page.poemId);
    const file = path.join(root, poemPayloadFile(page.path));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, stable(page), 'utf8');
  }
}
console.log('Standalone poem browser data: ' + pages.length + ' approved routes');
