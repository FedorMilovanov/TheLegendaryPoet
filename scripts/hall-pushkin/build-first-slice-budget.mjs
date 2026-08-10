import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const values = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) fail(`unexpected argument: ${arg}`);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) fail(`missing value for ${arg}`);
    values.set(arg.slice(2), value);
    i += 1;
  }
  return Object.fromEntries(values);
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const sha256File = (filePath) => `sha256:${crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')}`;
const sum = (values) => values.reduce((total, value) => total + value, 0);

function parseGlb(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'glTF') fail(`${path.basename(filePath)} is not a GLB`);
  const version = bytes.readUInt32LE(4);
  const declaredLength = bytes.readUInt32LE(8);
  if (version !== 2) fail(`${path.basename(filePath)} must be glTF 2.0`);
  if (declaredLength !== bytes.length) fail(`${path.basename(filePath)} declared length does not match file bytes`);

  let offset = 12;
  let json = null;
  let binary = null;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) fail(`${path.basename(filePath)} has a truncated GLB chunk header`);
    const chunkLength = bytes.readUInt32LE(offset);
    const chunkType = bytes.readUInt32LE(offset + 4);
    offset += 8;
    if (offset + chunkLength > bytes.length) fail(`${path.basename(filePath)} has a truncated GLB chunk`);
    const chunk = bytes.subarray(offset, offset + chunkLength);
    offset += chunkLength;
    if (chunkType === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8').replace(/[\u0000\u0020]+$/u, ''));
    if (chunkType === 0x004e4942) binary = chunk;
  }
  if (!json || !binary) fail(`${path.basename(filePath)} must contain JSON and BIN chunks`);
  return { bytes, json, binary };
}

function pngDimensions(bytes) {
  if (bytes.length < 24 || bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null;
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

function jpegDimensions(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  const sof = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 4 <= bytes.length) {
    while (offset < bytes.length && bytes[offset] !== 0xff) offset += 1;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) break;
    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
    if (sof.has(marker)) {
      if (segmentLength < 7) break;
      const height = bytes.readUInt16BE(offset + 3);
      const width = bytes.readUInt16BE(offset + 5);
      return [width, height];
    }
    offset += segmentLength;
  }
  return null;
}

function imageDimensions(bytes, mimeType) {
  if (mimeType === 'image/png') return pngDimensions(bytes);
  if (mimeType === 'image/jpeg') return jpegDimensions(bytes);
  return null;
}

function embeddedImages(glb) {
  const views = Array.isArray(glb.json.bufferViews) ? glb.json.bufferViews : [];
  const images = Array.isArray(glb.json.images) ? glb.json.images : [];
  return images.map((image, index) => {
    if (!Number.isInteger(image.bufferView)) fail(`embedded image ${image.name ?? index} must use a GLB bufferView`);
    const view = views[image.bufferView];
    if (!view || !Number.isFinite(view.byteLength)) fail(`embedded image ${image.name ?? index} has invalid bufferView`);
    const start = Number(view.byteOffset ?? 0);
    const end = start + Number(view.byteLength);
    if (start < 0 || end > glb.binary.length) fail(`embedded image ${image.name ?? index} bufferView exceeds BIN chunk`);
    const imageBytes = glb.binary.subarray(start, end);
    const dimensions = imageDimensions(imageBytes, image.mimeType);
    if (!dimensions || dimensions.some((value) => !Number.isInteger(value) || value <= 0)) {
      fail(`cannot derive dimensions for embedded image ${image.name ?? index}`);
    }
    return {
      name: image.name ?? `image-${index}`,
      mimeType: image.mimeType ?? null,
      compressedBytes: imageBytes.length,
      dimensions,
      conservativeRgba8ResidentBytes: dimensions[0] * dimensions[1] * 4,
      sha256: `sha256:${crypto.createHash('sha256').update(imageBytes).digest('hex')}`,
    };
  });
}

function glbInventory(glb, filePath) {
  return {
    path: path.basename(filePath),
    bytes: glb.bytes.length,
    sha256: sha256File(filePath),
    scenes: Array.isArray(glb.json.scenes) ? glb.json.scenes.length : 0,
    nodes: Array.isArray(glb.json.nodes) ? glb.json.nodes.length : 0,
    meshes: Array.isArray(glb.json.meshes) ? glb.json.meshes.length : 0,
    accessors: Array.isArray(glb.json.accessors) ? glb.json.accessors.length : 0,
    bufferViews: Array.isArray(glb.json.bufferViews) ? glb.json.bufferViews.length : 0,
    materials: Array.isArray(glb.json.materials) ? glb.json.materials.length : 0,
    textures: Array.isArray(glb.json.textures) ? glb.json.textures.length : 0,
    images: embeddedImages(glb),
  };
}

const args = parseArgs(process.argv.slice(2));
for (const required of ['policy', 'slice', 'evidence-dir', 'source-assets-evidence', 'output']) {
  if (!args[required]) fail(`required argument --${required} is missing`);
}

const policy = readJson(path.resolve(args.policy));
const slice = readJson(path.resolve(args.slice));
const evidenceDir = path.resolve(args['evidence-dir']);
const sourceAssetsPath = path.resolve(args['source-assets-evidence']);
const outputPath = path.resolve(args.output);
const evidencePath = path.join(evidenceDir, 'offline-exhibit-evidence.json');
const rawPath = path.join(evidenceDir, 'pushkin-offline-raw.glb');
const optimizedPath = path.join(evidenceDir, 'pushkin-offline-optimized.glb');

for (const requiredPath of [evidencePath, rawPath, optimizedPath, sourceAssetsPath]) {
  if (!fs.existsSync(requiredPath)) fail(`required first-slice budget input missing: ${requiredPath}`);
}
if (policy.schemaVersion !== 1 || policy.laneId !== 'TLP-HALL-001' || policy.phase !== 'pushkinVerticalSlice') fail('budget policy identity drifted');
if (slice.deliveryPreflight?.budgetReportRequired !== true) fail('Pushkin slice no longer requires a budget report');
if (slice.firstSliceBudgets?.status !== 'must-be-measured-on-source-offline-slice') fail('first-slice budget source status drifted');

const evidence = readJson(evidencePath);
const sourceAssets = readJson(sourceAssetsPath);
if (evidence.laneId !== 'TLP-HALL-001' || evidence.phase !== 'pushkinVerticalSlice') fail('offline exhibit evidence identity drifted');
if (evidence.productionBoundary?.productionAsset !== false || evidence.productionBoundary?.productionManifestAllowed !== false) fail('budget source evidence crossed the production boundary');
if (sourceAssets.purpose !== 'offline-source-evidence-only-not-production-media' || sourceAssets.productionManifestAllowed !== false) fail('source assets are not bounded offline evidence');

const raw = glbInventory(parseGlb(rawPath), rawPath);
const optimized = glbInventory(parseGlb(optimizedPath), optimizedPath);
const rawImageNames = raw.images.map((entry) => entry.name);
const optimizedImageNames = optimized.images.map((entry) => entry.name);
if (JSON.stringify(rawImageNames) !== JSON.stringify(optimizedImageNames)) fail('optimized GLB changed embedded documentary image identity/order');
for (let index = 0; index < raw.images.length; index += 1) {
  const left = raw.images[index];
  const right = optimized.images[index];
  if (left.sha256 !== right.sha256 || left.compressedBytes !== right.compressedBytes || JSON.stringify(left.dimensions) !== JSON.stringify(right.dimensions)) {
    fail(`optimized GLB changed documentary image bytes for ${left.name}`);
  }
}

const documentaryCompressedBytes = sum(optimized.images.map((entry) => entry.compressedBytes));
const conservativeRgba8ResidentBytes = sum(optimized.images.map((entry) => entry.conservativeRgba8ResidentBytes));
const rawTransferBytes = raw.bytes;
const optimizedTransferBytes = optimized.bytes;
const savedBytes = rawTransferBytes - optimizedTransferBytes;
const savedPercent = rawTransferBytes > 0 ? Number(((savedBytes / rawTransferBytes) * 100).toFixed(4)) : 0;

const report = {
  schemaVersion: 1,
  laneId: 'TLP-HALL-001',
  productIssue: 369,
  phase: 'pushkinVerticalSlice',
  status: 'offline-source-slice-measured-production-runtime-pending',
  purpose: 'first-slice-budget-evidence-not-approved-production-limit',
  source: {
    budgetPolicy: path.relative(process.cwd(), path.resolve(args.policy)).replaceAll('\\', '/'),
    sliceAuthority: path.relative(process.cwd(), path.resolve(args.slice)).replaceAll('\\', '/'),
    exhibitEvidence: path.basename(evidencePath),
    sourceAssetsEvidence: path.basename(sourceAssetsPath),
    topology: evidence.source?.topology,
    approvedRig: evidence.source?.approvedRig,
    lightingBaseline: evidence.source?.lightingBaseline,
  },
  delivery: {
    rawGlb: raw,
    optimizedGlb: optimized,
    optimization: {
      savedBytes,
      savedPercent,
      documentaryCompressedBytes,
      optimizedNonDocumentaryBytes: optimizedTransferBytes - documentaryCompressedBytes,
      documentaryShareOfOptimizedTransferPercent: optimizedTransferBytes > 0
        ? Number(((documentaryCompressedBytes / optimizedTransferBytes) * 100).toFixed(4))
        : 0,
    },
  },
  scene: {
    exhibitTriangles: Number(evidence.scene?.exhibitTriangles),
    drawMaterialCount: Number(evidence.scene?.materials),
    exhibitMeshObjects: Number(evidence.scene?.exhibitMeshObjects),
    embeddedDocumentaryTextureCount: optimized.images.length,
    conservativeRgba8DecodedTextureResidentBytes: conservativeRgba8ResidentBytes,
    largestEmbeddedTextureDimensions: optimized.images.reduce(
      (largest, entry) => (entry.dimensions[0] * entry.dimensions[1] > largest[0] * largest[1] ? entry.dimensions : largest),
      [0, 0],
    ),
  },
  productionUnknowns: {
    productionGpuTextureResidentBytes: null,
    webRendererInfo: null,
    webFrameTimeMs: null,
    mobileFrameTimeMs: null,
    assetDecodeLoadTimeMs: null,
    productionTextureEncodingDecision: null,
    reason: 'offline Blender/GLB evidence cannot prove browser GPU residency, renderer.info, decode time or frame time; those remain webVerticalSlice measurements',
  },
  productionBoundary: {
    productionAsset: false,
    approvedBudgetLimit: false,
    productionManifestAllowed: false,
    documentaryProductionShippingAllowed: false,
    productionWebglMayBegin: false,
    offlineVisualApprovalPromoted: false,
  },
};

if (!Number.isInteger(report.scene.exhibitTriangles) || report.scene.exhibitTriangles <= 0) fail('budget report requires a positive exhibit triangle count');
if (!Number.isInteger(report.scene.drawMaterialCount) || report.scene.drawMaterialCount <= 0) fail('budget report requires a positive draw-material count');
if (report.delivery.optimizedGlb.bytes <= 0 || report.delivery.rawGlb.bytes <= 0) fail('budget report requires non-empty raw and optimized GLBs');
if (report.scene.embeddedDocumentaryTextureCount < 2) fail('budget report must include both documentary texture sources');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`First-slice offline budget report written: raw=${rawTransferBytes} B optimized=${optimizedTransferBytes} B documentary=${documentaryCompressedBytes} B conservativeRGBA8=${conservativeRgba8ResidentBytes} B`);
