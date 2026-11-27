import assert from 'node:assert/strict';
import { materializeMemoryPlaces } from './memory-place-artifacts';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readIntrinsicSize } from './lib/image-metrics.mjs';
import { poets } from '../src/data/poets';
import { memoryPlaces, getMemoryPlaces } from '../src/data/memory-places';
import { isMemoryPreviewFrame } from '../src/data/memory-places/previewFrame';

const ids = new Set<string>();
const assets = new Set<string>();
const poetIds = new Set(poets.map((poet) => poet.id));
const licenses = new Set([
  'https://creativecommons.org/licenses/by-sa/4.0',
  'https://creativecommons.org/licenses/by-sa/3.0',
  'https://creativecommons.org/licenses/by/4.0',
  'https://creativecommons.org/licenses/by/3.0',
  'https://creativecommons.org/publicdomain/zero/1.0/',
  'https://creativecommons.org/publicdomain/mark/1.0/',
]);
const https = (url: string) => new URL(url).protocol === 'https:';
assert(memoryPlaces.length > 0);
for (const place of memoryPlaces) {
  assert.match(place.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert(!ids.has(place.id), 'Duplicate place: ' + place.id);
  ids.add(place.id);
  assert(poetIds.has(place.poetId), 'Unknown poet: ' + place.poetId);
  assert(getMemoryPlaces(place.poetId).includes(place));
  assert(place.title.trim() && place.location.trim() && place.date.trim() && place.intro.trim());
  assert(place.sources.length >= 2);
  assert(new Set(place.sources.map((source) => source.url)).size === place.sources.length);
  for (const source of place.sources) assert(source.label.trim() && https(source.url));
  assert(place.timeline.length && place.facts.length && place.photos.length);
  for (const event of place.timeline) assert(event.date.trim() && event.text.trim());
  for (const fact of place.facts) assert(fact.label.trim() && fact.value.trim());
  if (place.literaryConnection) assert(place.literaryConnection.lines.length && place.literaryConnection.attribution.trim() && https(place.literaryConnection.url));
  let size = 0;
  for (const photo of place.photos) {
    assert.match(photo.src, /^\/images\/memory-places\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/);
    assert(!assets.has(photo.src), 'Duplicate asset: ' + photo.src);
    assets.add(photo.src);
    assert(photo.alt?.trim() && photo.caption?.trim() && photo.credit.trim() && photo.sourceLabel.trim() && photo.changes.trim());
    assert(https(photo.source) && photo.license.trim() && licenses.has(photo.licenseUrl));
    assert.match(photo.originalSha256, /^[a-f0-9]{64}$/);
    assert.match(photo.sha256, /^[a-f0-9]{64}$/);
    assert(Number.isInteger(photo.width) && photo.width > 0 && photo.width <= 1600);
    assert(Number.isInteger(photo.height) && photo.height > 0 && photo.height <= 1600);
    const bytes = readFileSync(resolve('public', photo.src.slice(1)));
    assert.equal(bytes.length, photo.bytes, photo.src);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), photo.sha256, photo.src);
    assert(bytes.length <= 350_000, 'Image budget: ' + photo.src);
    size += bytes.length;
    if (photo.preview) {
      const preview = photo.preview;
      assert.match(preview.src, /^\/images\/memory-places\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/);
      assert(!assets.has(preview.src), 'Duplicate preview asset: ' + preview.src);
      assets.add(preview.src);
      assert(preview.changes.trim());
      assert(preview.frame === undefined || isMemoryPreviewFrame(preview.frame, photo.width, photo.height), 'Invalid preview frame: ' + preview.src);
      assert.match(preview.sha256, /^[a-f0-9]{64}$/);
      const derivative = readFileSync(resolve('public', preview.src.slice(1)));
      assert.equal(derivative.length, preview.bytes, preview.src);
      assert.equal(createHash('sha256').update(derivative).digest('hex'), preview.sha256, preview.src);
      assert.deepEqual(readIntrinsicSize(derivative, '.webp'), { width: photo.width, height: photo.height }, 'Preview must share original canvas: ' + preview.src);
      assert(derivative.length <= 350_000, 'Image budget: ' + preview.src);
      size += derivative.length;
    }
  }
  assert(size <= 750_000, 'Exhibit budget: ' + place.id);
}
assert.equal(getMemoryPlaces('unknown-poet').length, 0);
for (const poetId of poetIds) assert(getMemoryPlaces(poetId).length > 0, 'Missing exhibit: ' + poetId);
console.log('Memory places:', ids.size, 'exhibits;', assets.size, 'verified assets.');

materializeMemoryPlaces(true);
