import test from 'node:test';
import assert from 'node:assert/strict';
import { requireDocumentaryImages } from './documentary-inventory.mjs';

const hash = n => 'sha256:' + n.toString(16).padStart(64, '0');
const P = hash(1);
const O = hash(2);
const portrait = { assetId: 'pushkin-kiprensky-1827-portrait', file: 'kiprensky-1827-source.jpg', sha256: P };
const onegin = { assetId: 'pushkin-onegin-1833-title-page-offline-derivative', sha256: O };
const evidence = { sources: [portrait], derivatives: [onegin] };
const inventory = (...hashes) => [...hashes, ...Array.from({ length: 10 }, (_, i) => hash(i + 10))].map(sha256 => ({ sha256 }));

for (const hashes of [[P, O], [O, P]]) {
  test(`both exact sources accepted in order ${hashes[0] === P ? 'portrait first' : 'title page first'}`, () => {
    const images = inventory(...hashes);
    const result = requireDocumentaryImages(evidence, images);
    assert.deepEqual(result.documentaryHashes, new Set([P, O]));
    assert.deepEqual(result.documentaryImages, images.slice(0, 2));
    assert.equal(images.filter(item => !result.documentaryHashes.has(item.sha256)).length, 10);
  });
}

for (const [label, hashes, source, error] of [
  ['duplicated portrait', [P, P], evidence, /exactly one Kiprensky portrait/],
  ['duplicated title page', [O, O], evidence, /exactly one Kiprensky portrait/],
  ['missing title page', [P, hash(3)], evidence, /exactly one Onegin title page/],
  ['ambiguous portrait identity', [P, O], { ...evidence, sources: [portrait, portrait] }, /missing or ambiguous/],
  ['unrelated JPEG', [P, O], { ...evidence, sources: [{ ...portrait, assetId: 'unrelated' }] }, /missing or ambiguous/],
  ['identical source hashes', [P, P], { ...evidence, derivatives: [{ ...onegin, sha256: P }] }, /distinct exact SHA-256/],
  ['malformed hash', [P, 'bad'], { ...evidence, derivatives: [{ ...onegin, sha256: 'bad' }] }, /distinct exact SHA-256/],
  ['ambiguous title page', [P, O], { ...evidence, derivatives: [onegin, onegin] }, /missing or ambiguous/],
  ['extra duplicate with both present', [P, O, P], evidence, /exactly one Kiprensky portrait/],
  ['absent source records', [P, O], {}, /missing or ambiguous/],
]) {
  test(label, () => assert.throws(() => requireDocumentaryImages(source, inventory(...hashes)), error));
}
