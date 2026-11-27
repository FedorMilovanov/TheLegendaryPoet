import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertWebPContainer, validateImage, selectDecoder, imageFiles } from '../validate-image-integrity.mjs';
import { readIntrinsicSize, figureLayoutWidth } from '../lib/image-metrics.mjs';

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

const png = fs.readFileSync('public/brand-emblem.png');
const jpeg = fs.readFileSync('public/images/pushkin.jpg');

test('intrinsic size is read from the headers of every shipped container', () => {
  assert.deepEqual(readIntrinsicSize(good), { width: 300, height: 423 });
  assert.deepEqual(readIntrinsicSize(fs.readFileSync('public/images/essays/yesenin/yesenin-part-2-editorial.webp')), { width: 1920, height: 1080 });
  assert.deepEqual(readIntrinsicSize(png), { width: 320, height: 320 });
  assert.deepEqual(readIntrinsicSize(jpeg), { width: 1000, height: 1250 });
});

test('a truncated file has no readable frame size', () => {
  assert.throws(() => readIntrinsicSize(good.subarray(0, 100)), /RIFF length/);
});

test('a file that is not a raster has no readable frame size', () => {
  assert.throws(() => readIntrinsicSize(Buffer.from('just prose, not pixels')), /unrecognised raster container/);
});

test('a zeroed frame header is reported as an unreadable size, not as 0x0', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tlp-image-size-'));
  try {
    const bytes = Buffer.from(good);
    bytes.fill(0, 20);
    const file = path.join(dir, 'zeroed.webp');
    fs.writeFileSync(file, bytes);
    assertWebPContainer(bytes); // container lengths are still self-consistent
    assert.throws(() => validateImage(file, selectDecoder()), /full decode failed/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the figure layout widths are the ones the renderer paints', () => {
  assert.equal(figureLayoutWidth('portrait'), 576);
  assert.equal(figureLayoutWidth('wide'), 768);
  assert.equal(figureLayoutWidth('cinematic'), 768);
});

// Real tiny images encoded with Pillow; no fixture files or decoder dependency.
const gif = Buffer.from('R0lGODdhEAAKAIEAACh4vgAAAAAAAAAAACwAAAAAEAAKAAAIFwABCBxIsKDBgwgTKlzIsKHDhxAjHgwIADs=', 'base64');
const avif = Buffer.from('AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAKgAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAEAAAAAoAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAMm1kYXQSAAoJGAz+WiAhoNCAMhsUx4eGZQIIIJ5QAAAAOtxBfmJT+NZ+j7A6RHg=', 'base64');
test('valid GIF and AVIF have readable intrinsic dimensions', () => {
  assert.deepEqual(readIntrinsicSize(gif), { width: 16, height: 10 });
  assert.deepEqual(readIntrinsicSize(avif), { width: 16, height: 10 });
});
test('AVIF follows the primary item association and rejects malformed bounds', () => {
  // Header-only test: the first spatial extent belongs to a different item.
  const box = (type, ...parts) => {
    const header = Buffer.alloc(8);
    header.writeUInt32BE(8 + parts.reduce((sum, part) => sum + part.length, 0));
    header.write(type, 4, 'ascii');
    return Buffer.concat([header, ...parts]);
  };
  const extent = (width, height) => {
    const payload = Buffer.alloc(12);
    payload.writeUInt32BE(width, 4);
    payload.writeUInt32BE(height, 8);
    return box('ispe', payload);
  };
  const primary = box('pitm', Buffer.from([0, 0, 0, 0, 0, 2]));
  const associations = box('ipma', Buffer.from([0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 1, 1, 0, 2, 1, 2]));
  const metadata = box('meta', Buffer.alloc(4), primary, box('iprp', box('ipco', extent(3, 4), extent(16, 10)), associations));
  const header = Buffer.concat([avif.subarray(0, 32), metadata]);
  assert.deepEqual(readIntrinsicSize(header), { width: 16, height: 10 });
  const bad = Buffer.from(header);
  bad[bad.length - 1] = 3;
  assert.throws(() => readIntrinsicSize(bad), /invalid AVIF property index/);
  assert.throws(() => readIntrinsicSize(avif.subarray(0, -1)), /invalid AVIF box length/);
});

test('raster extension must agree with the actual container', () => {
  assert.throws(() => readIntrinsicSize(png, '.jpg'), /raster extension/);
  assert.throws(() => readIntrinsicSize(jpeg, '.png'), /raster extension/);
  assert.deepEqual(readIntrinsicSize(jpeg, '.JPG'), readIntrinsicSize(jpeg));
  const otherBrand = Buffer.from(avif);
  otherBrand.write('mif1', 8, 'ascii');
  otherBrand.write('mif1', 16, 'ascii');
  assert.throws(() => readIntrinsicSize(otherBrand, '.avif'), /AVIF requires an avif or avis brand/);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tlp-raster-type-'));
  try {
    const file = path.join(dir, 'wrong.jpg');
    fs.writeFileSync(file, png);
    assert.throws(() => validateImage(file, selectDecoder()), /raster extension|full decode failed/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('complete standalone GIF and JPEG retain their terminal markers', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tlp-raster-trailer-'));
  try {
    const decoder = selectDecoder();
    for (const [name, bytes, message] of [
      ['image.gif', gif, /GIF missing final trailer|full decode failed/],
      ['image.jpg', jpeg, /JPEG missing final EOI marker|full decode failed/],
    ]) {
      const file = path.join(dir, name);
      fs.writeFileSync(file, bytes);
      assert.deepEqual(validateImage(file, decoder), readIntrinsicSize(bytes));
      fs.writeFileSync(file, bytes.subarray(0, -1));
      assert.throws(() => validateImage(file, decoder), message);
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('PNG chunks retain their CRC and a complete terminal IEND', () => {
  // Native FFmpeg can decode these CRC-only mutations without diagnostics.
  const fixture = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAKCAYAAAC9vt6cAAAADnRFWHRzb3VyY2UAZml4dHVyZSrejbQAAAAZSURBVHicY9So2PefgQLARInmUQNGDYABABUcAnF/LD4WAAAAAElFTkSuQmCC', 'base64');
  assert.deepEqual(readIntrinsicSize(fixture, '.png'), { width: 16, height: 10 });
  for (let offset = 8; offset < fixture.length;) {
    const end = offset + 8 + fixture.readUInt32BE(offset);
    const tag = fixture.toString('ascii', offset + 4, offset + 8);
    const broken = Buffer.from(fixture);
    broken[end] ^= 1;
    assert.throws(() => readIntrinsicSize(broken, '.png'), new RegExp(`PNG ${tag} CRC mismatch`));
    offset = end + 4;
  }
  assert.throws(() => readIntrinsicSize(fixture.subarray(0, -12)), /missing final IEND/);
  assert.throws(() => readIntrinsicSize(fixture.subarray(0, -1)), /truncated PNG/);
  assert.throws(() => readIntrinsicSize(Buffer.concat([fixture, Buffer.from('extra')])), /invalid PNG final IEND/);
  const oversized = Buffer.from(fixture);
  oversized.writeUInt32BE(0xffffffff, 33);
  assert.throws(() => readIntrinsicSize(oversized), /truncated PNG/);
});
