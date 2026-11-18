import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { poets } from '../src/data/library/index';
import { poemFacsimiles, visiblePoemFacsimile } from '../src/data/poemFacsimiles';

const errors: string[] = [];
const knownPoems = new Set(poets.flatMap((poet) => poet.poems.map((poem) => poem.id)));
const ids = Object.keys(poemFacsimiles);
for (const [id, record] of Object.entries(poemFacsimiles)) {
  if (!knownPoems.has(id) || record.poemId !== id) errors.push(id + ': unknown or mismatched canonical poem id');
  if (!record.publication || !record.credit || record.publicationYear < 1600) errors.push(id + ': missing historical citation');
  if (!record.pages.length) errors.push(id + ': no pages');
  if (record.rights === 'approved' && !record.rightsEvidence) errors.push(id + ': approved media lacks rights evidence');
  if (record.rights === 'review' && record.rightsEvidence) errors.push(id + ': review item must not claim approval');
  const seen = new Set<string>();
  for (const [index, page] of record.pages.entries()) {
    if (!/^\/images\/[a-z0-9/_-]+\.png$/i.test(page.src)) errors.push(id + ': unsafe local media path on ' + index);
    if (page.width < 200 || page.height < 200 || !page.printPage || page.alt.length < 50) errors.push(id + ': invalid image dimensions/alt/page');
    if (!/^https:\/\/[^\s]+$/.test(page.originalUrl)) errors.push(id + ': invalid primary source URL');
    if (seen.has(page.src)) errors.push(id + ': duplicate media page');
    seen.add(page.src);
    if (record.rights === 'review' && !page.src.startsWith('/images/facsimile-review/')) errors.push(id + ': review media outside local-only folder');
    if (record.rights === 'approved' && page.src.includes('facsimile-review')) errors.push(id + ': approved media uses review-only path');
    if (record.rights === 'approved' && !existsSync('public' + page.src)) errors.push(id + ': approved media file missing');
  }
  if (record.rights === 'review' && visiblePoemFacsimile(id, 'production')) errors.push(id + ': review image leaked into production');
  if (record.rights === 'review' && !visiblePoemFacsimile(id, 'facsimile-preview')) errors.push(id + ': preview mode cannot access review record');
}
if (ids.length !== 2) errors.push('Expected two documented preview cases; found ' + ids.length);
try {
  const tracked = execFileSync('git', ['ls-files', '--', 'public/images/facsimile-review'], { encoding: 'utf8' }).trim();
  if (tracked) errors.push('Unapproved scan files are tracked in Git: ' + tracked);
} catch (error) {
  errors.push('Cannot audit tracked review assets: ' + String(error));
}
if (errors.length) throw new Error('Poem facsimile rights/registry contract FAILED:\n- ' + errors.join('\n- '));
console.log('Poem facsimile contract PASS: ' + ids.length + ' documentary previews; approved media gated; no review assets in Git.');
