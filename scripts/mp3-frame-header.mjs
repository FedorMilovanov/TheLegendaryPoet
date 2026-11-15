/** Read the first real pair of consecutive MPEG-1 Layer III audio frames.
 * An isolated sync word may occur in junk/metadata; never trust it alone.
 * Return null instead of trusting an unverified manifest description.
 */
const MPEG1_LAYER3_BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const MPEG1_SAMPLE_RATES = [44100, 48000, 32000];

function frameAt(bytes, offset) {
  if (offset < 0 || offset + 4 > bytes.length) return null;
  if (bytes[offset] !== 0xff || (bytes[offset + 1] & 0xe0) !== 0xe0) return null;
  const version = (bytes[offset + 1] >> 3) & 3;
  const layer = (bytes[offset + 1] >> 1) & 3;
  const bitrateIndex = (bytes[offset + 2] >> 4) & 15;
  const sampleIndex = (bytes[offset + 2] >> 2) & 3;
  if (version !== 3 || layer !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || sampleIndex === 3) return null;
  const sampleRateHz = MPEG1_SAMPLE_RATES[sampleIndex];
  const bitrateKbps = MPEG1_LAYER3_BITRATES[bitrateIndex];
  const padding = (bytes[offset + 2] >> 1) & 1;
  const frameLength = Math.floor((144000 * bitrateKbps) / sampleRateHz) + padding;
  return { sampleRateHz, channels: ((bytes[offset + 3] >> 6) & 3) === 3 ? 1 : 2, frameLength };
}

export function readMp3StreamInfo(bytes) {
  if (!bytes || bytes.length < 8) return null;
  let start = 0;
  if (bytes.subarray(0, 3).toString('ascii') === 'ID3') {
    if (bytes.length < 10) return null;
    if ([bytes[6], bytes[7], bytes[8], bytes[9]].some((v) => (v & 0x80) !== 0)) return null;
    const payloadLength = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
    const footerLength = (bytes[3] === 4 && (bytes[5] & 0x10) ? 10 : 0);
    start = 10 + payloadLength + footerLength;
  }
  const last = Math.min(bytes.length - 8, start + 65536);
  for (let offset = start; offset <= last; offset++) {
    const first = frameAt(bytes, offset);
    if (!first) continue;
    const second = frameAt(bytes, offset + first.frameLength);
    if (second && second.sampleRateHz === first.sampleRateHz && second.channels === first.channels) {
      return { sampleRateHz: first.sampleRateHz, channels: first.channels };
    }
  }
  return null;
}
