import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { poets } from '../src/data/library/index';
import { poemFacsimiles, visiblePoemFacsimile } from '../src/data/poemFacsimiles';

const errors: string[] = [];
const knownPoems = new Set(poets.flatMap((poet) => poet.poems.map((poem) => poem.id)));
const provenance = readFileSync('public/images/PROVENANCE.yml', 'utf8').replace(/\r\n?/g, '\n');
let approvedCount = 0;
let reviewCount = 0;

for (const [id, record] of Object.entries(poemFacsimiles)) {
  if (!knownPoems.has(id) || record.poemId !== id) errors.push(id + ': unknown or mismatched canonical poem id');
  if (!record.publication || !record.credit || record.publicationYear < 1600) errors.push(id + ': missing historical citation');
  if (!record.pages.length) errors.push(id + ': no pages');
  if (record.rights === 'approved') {
    approvedCount += 1;
    if (!record.rightsEvidence || !/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(record.rightsEvidence)) {
      errors.push(id + ': approved facsimile requires an item-level Commons file license witness');
    }
  } else {
    reviewCount += 1;
    if (record.rightsEvidence) errors.push(id + ': review item must not claim approval');
  }

  const seen = new Set<string>();
  for (const [index, page] of record.pages.entries()) {
    const key = id + '/' + index;
    if (!/^\/images\/[a-z0-9/_-]+\.png$/i.test(page.src)) errors.push(key + ': unsafe media path');
    if (page.width < 200 || page.height < 200 || !page.printPage || page.alt.length < 50) errors.push(key + ': invalid historical page metadata');
    if (!/^https:\/\/[^\s]+$/.test(page.originalUrl)) errors.push(key + ': invalid source URL');
    if (!/^[0-9a-f]{64}$/.test(page.sha256)) errors.push(key + ': invalid SHA-256');
    if (seen.has(page.src)) errors.push(key + ': duplicate page path');
    seen.add(page.src);

    const file = 'public' + page.src;
    if (record.rights === 'review' && !page.src.startsWith('/images/facsimile-review/')) errors.push(key + ': review media outside local-only folder');
    if (record.rights === 'approved' && page.src.startsWith('/images/facsimile-review/')) errors.push(key + ': approved media under review-only path');
    if (record.rights === 'approved' && !existsSync(file)) errors.push(key + ': approved media bytes missing');
    if (existsSync(file)) {
      const bytes = readFileSync(file);
      const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
      if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature)) {
        errors.push(key + ': image is not an intact PNG header');
      } else if (bytes.readUInt32BE(16) !== page.width || bytes.readUInt32BE(20) !== page.height) {
        errors.push(key + ': image dimensions disagree with archived source');
      }
      if (createHash('sha256').update(bytes).digest('hex') !== page.sha256) errors.push(key + ': original file SHA-256 mismatch');
    }

    if (record.rights === 'approved') {
      const section = provenance.split('  - path: ' + file + '\n')[1]?.split('\n  - path: ')[0] ?? '';
      if (!section || !section.includes('sha256: ' + page.sha256) || !section.includes('review_status: VERIFIED-PUBLIC-DOMAIN')) {
        errors.push(key + ': approved file has no matching source/rights/hash provenance entry');
      }
      if (!section.includes('accessed_at:') || !section.includes('source_url:') || !section.includes('license:')) {
        errors.push(key + ': approved provenance lacks source, license or access date');
      }
      if (page.originalUrl !== record.rightsEvidence) errors.push(key + ': public archive URL does not match the rights witness');
    }
  }
  if (record.rights === 'review' && visiblePoemFacsimile(id, 'production')) errors.push(id + ': review image leaked into production');
  if (record.rights === 'review' && !visiblePoemFacsimile(id, 'facsimile-preview')) errors.push(id + ': preview mode cannot open review image');
  if (record.rights === 'approved' && !visiblePoemFacsimile(id, 'production')) errors.push(id + ': license-cleared image hidden in production');
}
try {
  const tracked = execFileSync('git', ['ls-files', '--', 'public/images/facsimile-review'], { encoding: 'utf8' }).trim();
  if (tracked) errors.push('Unapproved review source images are tracked in Git: ' + tracked);
} catch (error) {
  errors.push('Cannot audit tracked review assets: ' + String(error));
}
if (errors.length) throw new Error('Poem facsimile source/rights contract FAILED:\n- ' + errors.join('\n- '));
console.log('Poem facsimile contract PASS: ' + approvedCount + ' source-cleared item(s), ' + reviewCount + ' review-only item(s), full-byte SHA-256 and provenance verified.');
