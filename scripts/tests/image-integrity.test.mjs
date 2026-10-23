import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertWebPContainer, validateImage, selectDecoder, imageFiles } from '../validate-image-integrity.mjs';

const good = fs.readFileSync('public/images/essays/briks/lilya-brik-1914.webp');

test('complete recovered WebP passes container checks', () => assertWebPContainer(good));
test('truncation is rejected, even with a retained original header', () => {
  assert.throws(() => assertWebPContainer(good.subarray(0, 100)), /RIFF length/);
});
test('trailing bytes cannot be hidden after a valid RIFF', () => {
  assert.throws(() => assertWebPContainer(Buffer.concat([good, Buffer.from('extra')])), /RIFF length/);
});
test('false container signature is rejected', () => {
  assert.throws(() => assertWebPContainer(Buffer.alloc(32)), /invalid WebP header/);
});
test('repairing only the RIFF size cannot repair a missing VP8 tail', () => {
  const bytes = Buffer.from(good.subarray(0, 100));
  bytes.writeUInt32LE(bytes.length - 8, 4);
  assert.throws(() => assertWebPContainer(bytes), /truncated WebP/);
});
test('a chunk-only container cannot masquerade as an image', () => {
  const bytes = Buffer.from(good);
  bytes.write('JUNK', 12, 'ascii');
  assert.throws(() => assertWebPContainer(bytes), /no image payload/);
});
test('full decoder rejects corrupt pixels even with consistent container lengths', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tlp-image-integrity-'));
  try {
    const bytes = Buffer.from(good);
    bytes.fill(0, 20);
    const file = path.join(dir, 'corrupt.webp');
    fs.writeFileSync(file, bytes);
    assertWebPContainer(bytes);
    assert.throws(() => validateImage(file, selectDecoder()), /full decode failed/);
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'not an image');
    assert.deepEqual(imageFiles(dir), [file]);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('unavailable decoder fails closed rather than accepting a header-only check', () => {
  assert.throws(() => validateImage('public/images/essays/briks/lilya-brik-1914.webp', 'tlp-no-such-decoder'), /full decode failed/);
});
