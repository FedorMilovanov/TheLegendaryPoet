// Container and intrinsic-size reading for the raster formats the site ships.
//
// Everything here reads bytes only: no decoder, no native tool, no dependency.
// That is deliberate. A checklist that needs a working ImageMagick to notice a
// half-written file is a checklist that goes quiet the day the tool is missing,
// so the structural pass below runs first and the full native decode (see
// validate-image-integrity.mjs) is layered on top of it, never instead of it.

const IMAGE_EXTENSIONS = /\.(?:avif|gif|jpe?g|png|webp)$/i;

/**
 * Walk the RIFF chunks of a WebP, yielding every chunk's tag and body bounds.
 * The walk is what makes truncation visible: a truncated file either declares a
 * RIFF size the bytes do not reach, or ends a chunk past the end of the buffer.
 */
export function webpChunks(bytes) {
  if (bytes.length < 20
    || bytes.toString('ascii', 0, 4) !== 'RIFF'
    || bytes.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('invalid WebP header');
  }
  const declared = bytes.readUInt32LE(4) + 8;
  if (declared !== bytes.length) {
    throw new Error(`RIFF length ${declared} != stored ${bytes.length}`);
  }

  const chunks = [];
  let offset = 12;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) throw new Error('truncated WebP chunk header');
    const tag = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const end = offset + 8 + size + (size % 2);
    if (end > bytes.length) throw new Error(`truncated WebP ${tag} payload`);
    chunks.push({ tag, start: offset + 8, size, end });
    offset = end;
  }
  return chunks;
}

/** A successful native browser decode can still accept a truncated VP8 stream. */
export function assertWebPContainer(bytes) {
  const chunks = webpChunks(bytes);
  if (!chunks.some((chunk) => ['VP8 ', 'VP8L', 'ANMF'].includes(chunk.tag))) {
    throw new Error('WebP has no image payload');
  }
  return chunks;
}

function pngSize(bytes) {
  if (bytes.toString('ascii', 12, 16) !== 'IHDR') throw new Error('PNG IHDR is not the first chunk');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function jpegSize(bytes) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    // Standalone markers carry no length payload of their own.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    const length = bytes.readUInt16BE(offset + 2);
    const isFrameHeader = marker >= 0xc0 && marker <= 0xcf
      && marker !== 0xc4 /* DHT */
      && marker !== 0xc8 /* JPG */
      && marker !== 0xcc; /* DAC */
    if (isFrameHeader) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    if (marker === 0xda) break; // start of scan: no frame header before it
    offset += 2 + length;
  }
  throw new Error('JPEG has no frame header (SOF)');
}

function webpSize(bytes) {
  const chunks = assertWebPContainer(bytes);
  for (const chunk of chunks) {
    if (chunk.tag === 'VP8X' && chunk.size >= 10) {
      return {
        width: (bytes.readUIntLE(chunk.start + 4, 3)) + 1,
        height: (bytes.readUIntLE(chunk.start + 7, 3)) + 1,
      };
    }
  }
  for (const chunk of chunks) {
    if (chunk.tag === 'VP8 ' && chunk.size >= 10) {
      return {
        width: bytes.readUInt16LE(chunk.start + 6) & 0x3fff,
        height: bytes.readUInt16LE(chunk.start + 8) & 0x3fff,
      };
    }
    if (chunk.tag === 'VP8L' && chunk.size >= 5) {
      const bits = bytes.readUInt32LE(chunk.start + 1);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
  }
  throw new Error('WebP carries no readable frame size');
}

function ispeSize(bytes) {
  // ISO-BMFF: walk top-level boxes for meta, then its children for ispe.
  const readBoxes = (start, end, onBox) => {
    let offset = start;
    while (offset + 8 <= end) {
      const size = bytes.readUInt32BE(offset);
      const type = bytes.toString('ascii', offset + 4, offset + 8);
      if (size === 0 || offset + size > end) break;
      if (onBox(type, offset + 8, offset + size)) return true;
      offset += size;
    }
    return false;
  };
  let found = null;
  readBoxes(0, bytes.length, (type, start, end) => {
    if (type !== 'meta') return false;
    readBoxes(start + 4, end, (childType, childStart) => {
      if (childType !== 'ispe') return false;
      found = {
        width: bytes.readUInt32BE(childStart + 4),
        height: bytes.readUInt32BE(childStart + 8),
      };
      return true;
    });
    return Boolean(found);
  });
  if (!found) throw new Error('AVIF/HEIF carries no readable ispe box');
  return found;
}

/**
 * The pixel size the file really holds, read from its headers. Throws when the
 * container is damaged or the size cannot be read — callers get a hard failure
 * rather than a silent 0x0 that would let a broken asset pass as "unknown".
 */
export function readIntrinsicSize(bytes) {
  if (bytes.length < 16) throw new Error('file is too short to be a raster image');
  if (bytes.readUInt32BE(0) === 0x89504e47) return pngSize(bytes);
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return jpegSize(bytes);
  if (bytes.toString('ascii', 0, 4) === 'RIFF') return webpSize(bytes);
  if (bytes.toString('ascii', 4, 8) === 'ftyp') return ispeSize(bytes);
  throw new Error('unrecognised raster container');
}

/**
 * Which layout width an essay figure asks for, mirroring the frame in
 * src/components/essay/blocks.tsx. Exported so the check that forbids painting
 * a raster above its own pixels and the component that does the painting read
 * the same numbers from one place.
 */
export function figureLayoutWidth(layout) {
  return layout === 'portrait' ? 576 : 768;
}

export { IMAGE_EXTENSIONS };
