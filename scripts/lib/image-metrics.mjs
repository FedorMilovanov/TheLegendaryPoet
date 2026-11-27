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
  // AVIF item dimensions belong to the primary item, not an arbitrary
  // thumbnail or auxiliary image: meta/pitm + iprp/ipco and ipma.
  const boxes = (start, end) => {
    const result = [];
    for (let offset = start; offset < end;) {
      if (end - offset < 8) throw new Error('truncated AVIF box header');
      let size = bytes.readUInt32BE(offset);
      let header = 8;
      if (size === 1) {
        if (end - offset < 16) throw new Error('truncated AVIF extended box header');
        const extended = bytes.readBigUInt64BE(offset + 8);
        if (extended > BigInt(end - offset)) throw new Error('invalid AVIF box length');
        size = Number(extended);
        header = 16;
      } else if (size === 0) {
        size = end - offset;
      }
      if (size < header || size > end - offset) throw new Error('invalid AVIF box length');
      result.push({ type: bytes.toString('ascii', offset + 4, offset + 8), start: offset + header, end: offset + size });
      offset += size;
    }
    return result;
  };
  const one = (items, type) => {
    const matches = items.filter(box => box.type === type);
    if (matches.length !== 1) throw new Error(`AVIF requires one ${type} box`);
    return matches[0];
  };
  const read = (box, offset, length) => {
    if (offset + length > box.end) throw new Error(`truncated AVIF ${box.type} payload`);
    return bytes.readUIntBE(offset, length);
  };
  const top = boxes(0, bytes.length);
  const ftyp = one(top, 'ftyp');
  if (ftyp.end - ftyp.start < 8 || (ftyp.end - ftyp.start) % 4) throw new Error('invalid AVIF ftyp payload');
  const brands = [bytes.toString('ascii', ftyp.start, ftyp.start + 4)];
  for (let offset = ftyp.start + 8; offset < ftyp.end; offset += 4) brands.push(bytes.toString('ascii', offset, offset + 4));
  if (!brands.some(brand => brand === 'avif' || brand === 'avis')) throw new Error('AVIF requires an avif or avis brand');
  const meta = one(top, 'meta');
  if (read(meta, meta.start, 4) !== 0) throw new Error('unsupported AVIF meta version/flags');
  const children = boxes(meta.start + 4, meta.end);
  const pitm = one(children, 'pitm');
  const pitmVersion = read(pitm, pitm.start, 1);
  if (pitmVersion > 1) throw new Error('unsupported AVIF pitm version');
  const primary = read(pitm, pitm.start + 4, pitmVersion ? 4 : 2);
  const iprp = one(children, 'iprp');
  const propertyBoxes = boxes(iprp.start, iprp.end);
  const ipco = one(propertyBoxes, 'ipco');
  const properties = boxes(ipco.start, ipco.end);
  const associated = new Set();
  for (const ipma of propertyBoxes.filter(box => box.type === 'ipma')) {
    const version = read(ipma, ipma.start, 1);
    const flags = read(ipma, ipma.start + 1, 3);
    if (version > 1 || flags > 1) throw new Error('unsupported AVIF ipma version/flags');
    const idBytes = version ? 4 : 2;
    const indexBytes = flags ? 2 : 1;
    const mask = flags ? 0x7fff : 0x7f;
    const entries = read(ipma, ipma.start + 4, 4);
    let offset = ipma.start + 8;
    for (let i = 0; i < entries; i++) {
      const id = read(ipma, offset, idBytes);
      offset += idBytes;
      const count = read(ipma, offset++, 1);
      for (let j = 0; j < count; j++, offset += indexBytes) {
        const index = read(ipma, offset, indexBytes) & mask;
        if (index > properties.length) throw new Error('invalid AVIF property index');
        if (id === primary && index) associated.add(index);
      }
    }
    if (offset !== ipma.end) throw new Error('invalid AVIF ipma payload length');
  }
  const extent = one([...associated].map(index => properties[index - 1]), 'ispe');
  if (read(extent, extent.start, 4) !== 0) throw new Error('unsupported AVIF ispe version/flags');
  return { width: read(extent, extent.start + 4, 4), height: read(extent, extent.start + 8, 4) };
}

/**
 * The pixel size the file really holds, read from its headers. Throws when the
 * container is damaged or the size cannot be read — callers get a hard failure
 * rather than a silent 0x0 that would let a broken asset pass as "unknown".
 */
export function readIntrinsicSize(bytes, extension) {
  if (bytes.length < 16) throw new Error('file is too short to be a raster image');
  let format, size;
  if (bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) {
    format = 'png'; size = pngSize;
  } else if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    format = 'jpeg'; size = jpegSize;
  } else if (['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))) {
    format = 'gif'; size = data => ({ width: data.readUInt16LE(6), height: data.readUInt16LE(8) });
  } else if (bytes.toString('ascii', 0, 4) === 'RIFF') {
    format = 'webp'; size = webpSize;
  } else if (bytes.toString('ascii', 4, 8) === 'ftyp') {
    format = 'avif'; size = ispeSize;
  } else {
    throw new Error('unrecognised raster container');
  }
  if (extension !== undefined && extension.toLowerCase().replace(/^\./, '').replace(/^jpg$/, 'jpeg') !== format) {
    throw new Error(`raster extension ${extension} does not match ${format} container`);
  }
  return size(bytes);
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
