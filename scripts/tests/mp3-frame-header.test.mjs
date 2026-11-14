import assert from 'node:assert/strict';
import test from 'node:test';
import { readMp3StreamInfo } from '../mp3-frame-header.mjs';

function frames({ rate = 48000, mode = 'stereo', count = 2 } = {}) {
  const sampleIndex = ({ 44100: 0, 48000: 1, 32000: 2 })[rate];
  const bitRateIndex = 9; // 128 kbps MPEG-1 Layer III
  const frameLength = Math.floor(144000 * 128 / rate);
  const out = Buffer.alloc(frameLength * count);
  for (let index = 0; index < count; index++) {
    const offset = index * frameLength;
    out[offset] = 0xff;
    out[offset + 1] = 0xfb; // MPEG-1 Layer III, no CRC
    out[offset + 2] = (bitRateIndex << 4) | (sampleIndex << 2);
    out[offset + 3] = mode === 'mono' ? 0xc0 : 0;
  }
  return out;
}

test('recognizes 44.1 and 48 kHz stereo from consecutive MPEG frames', () => {
  assert.deepEqual(readMp3StreamInfo(frames({ rate: 44100 })), { sampleRateHz: 44100, channels: 2 });
  assert.deepEqual(readMp3StreamInfo(frames()), { sampleRateHz: 48000, channels: 2 });
});

test('rejects mono falsely labelled stereo', () => {
  assert.deepEqual(readMp3StreamInfo(frames({ mode: 'mono' })), { sampleRateHz: 48000, channels: 1 });
});

test('skips correctly sized ID3v2 payload and an optional v2.4 footer', () => {
  const header = Buffer.from([0x49, 0x44, 0x33, 4, 0, 0x10, 0, 0, 0, 20]);
  const tagPayload = Buffer.alloc(20, 0xfb);
  const footer = Buffer.alloc(10, 0);
  assert.deepEqual(readMp3StreamInfo(Buffer.concat([header, tagPayload, footer, frames()])), { sampleRateHz: 48000, channels: 2 });
});

test('does not accept an isolated sync-like byte sequence as an MP3 stream', () => {
  const forged = Buffer.concat([Buffer.from([0xff, 0xfb, 0x94, 0]), Buffer.alloc(100, 0)]);
  assert.equal(readMp3StreamInfo(forged), null);
  assert.deepEqual(readMp3StreamInfo(Buffer.concat([forged, frames()])), { sampleRateHz: 48000, channels: 2 });
});

test('rejects truncated, invalid and unsupported MPEG versions', () => {
  assert.equal(readMp3StreamInfo(Buffer.alloc(100)), null);
  assert.equal(readMp3StreamInfo(frames({ count: 1 })), null);
  const unsupported = frames();
  unsupported[1] = 0xf3; // MPEG-2 Layer III
  unsupported[Math.floor(144000 * 128 / 48000) + 1] = 0xf3;
  assert.equal(readMp3StreamInfo(unsupported), null);
});
