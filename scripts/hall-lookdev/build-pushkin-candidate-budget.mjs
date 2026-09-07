import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) fail(`unexpected argument: ${arg}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) fail(`missing value for ${arg}`);
    values.set(arg.slice(2), value);
    index += 1;
  }
  return Object.fromEntries(values);
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const sha256Bytes = (bytes) => `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
const sha256File = (filePath) => sha256Bytes(fs.readFileSync(filePath));
const fileEvidence = (filePath) => ({
  path: path.basename(filePath),
  bytes: fs.statSync(filePath).size,
  sha256: sha256File(filePath),
});

function parseGlb(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'glTF') fail(`${path.basename(filePath)} is not a GLB`);
  if (bytes.readUInt32LE(4) !== 2) fail(`${path.basename(filePath)} must be glTF 2.0`);
  if (bytes.readUInt32LE(8) !== bytes.length) fail(`${path.basename(filePath)} declared length does not match bytes`);
  let offset = 12;
  let json = null;
  let binary = null;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) fail(`${path.basename(filePath)} has a truncated chunk header`);
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    offset += 8;
    if (offset + length > bytes.length) fail(`${path.basename(filePath)} has a truncated chunk`);
    const chunk = bytes.subarray(offset, offset + length);
    offset += length;
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8').replace(/[\u0000\u0020]+$/u, ''));
    if (type === 0x004e4942) binary = chunk;
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
  const sof = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
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
    if (sof.has(marker)) return [bytes.readUInt16BE(offset + 5), bytes.readUInt16BE(offset + 3)];
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
    if (!Number.isInteger(image.bufferView)) fail(`image ${image.name ?? index} must be embedded in GLB`);
    const view = views[image.bufferView];
    if (!view || !Number.isFinite(view.byteLength)) fail(`image ${image.name ?? index} has invalid bufferView`);
    const start = Number(view.byteOffset ?? 0);
    const end = start + Number(view.byteLength);
    if (start < 0 || end > glb.binary.length) fail(`image ${image.name ?? index} exceeds BIN chunk`);
    const bytes = glb.binary.subarray(start, end);
    const dimensions = imageDimensions(bytes, image.mimeType);
    if (!dimensions || dimensions.some((value) => !Number.isInteger(value) || value <= 0)) {
      fail(`cannot derive dimensions for embedded image ${image.name ?? index}`);
    }
    return {
      name: image.name ?? `image-${index}`,
      mimeType: image.mimeType ?? null,
      compressedBytes: bytes.length,
      dimensions,
      conservativeRgba8ResidentBytes: dimensions[0] * dimensions[1] * 4,
      sha256: sha256Bytes(bytes),
    };
  });
}

function triangleCount(glb) {
  const accessors = Array.isArray(glb.json.accessors) ? glb.json.accessors : [];
  let triangles = 0;
  for (const mesh of glb.json.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      const mode = primitive.mode ?? 4;
      if (mode !== 4) fail(`candidate budget supports TRIANGLES primitives only, got mode ${mode}`);
      const accessorIndex = Number.isInteger(primitive.indices) ? primitive.indices : primitive.attributes?.POSITION;
      if (!Number.isInteger(accessorIndex) || !accessors[accessorIndex]) fail('mesh primitive is missing countable index/POSITION accessor');
      const count = Number(accessors[accessorIndex].count);
      if (!Number.isInteger(count) || count <= 0 || count % 3 !== 0) fail(`triangle accessor count is invalid: ${count}`);
      triangles += count / 3;
    }
  }
  return triangles;
}

function inventory(glb, filePath) {
  const materialIds = new Set();
  for (const mesh of glb.json.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      if (Number.isInteger(primitive.material)) materialIds.add(primitive.material);
    }
  }
  return {
    path: path.basename(filePath),
    bytes: glb.bytes.length,
    sha256: sha256File(filePath),
    triangles: triangleCount(glb),
    drawMaterialCount: materialIds.size,
    meshes: Array.isArray(glb.json.meshes) ? glb.json.meshes.length : 0,
    images: embeddedImages(glb),
  };
}

const args = parseArgs(process.argv.slice(2));
for (const key of ['policy', 'candidate-evidence', 'raw', 'optimized', 'raw-report', 'optimized-report', 'source-assets-evidence', 'output']) {
  if (!args[key]) fail(`required argument --${key} is missing`);
}

const policyPath = path.resolve(args.policy);
const evidencePath = path.resolve(args['candidate-evidence']);
const rawPath = path.resolve(args.raw);
const optimizedPath = path.resolve(args.optimized);
const rawReportPath = path.resolve(args['raw-report']);
const optimizedReportPath = path.resolve(args['optimized-report']);
const sourceAssetsPath = path.resolve(args['source-assets-evidence']);
const outputPath = path.resolve(args.output);
for (const requiredPath of [policyPath, evidencePath, rawPath, optimizedPath, rawReportPath, optimizedReportPath, sourceAssetsPath]) {
  if (!fs.existsSync(requiredPath)) fail(`candidate budget input missing: ${requiredPath}`);
}

const policy = readJson(policyPath);
const evidence = readJson(evidencePath);
const sourceAssets = readJson(sourceAssetsPath);
const rawReport = readJson(rawReportPath);
const optimizedReport = readJson(optimizedReportPath);

if (policy.schemaVersion !== 1 || policy.laneId !== 'TLP-HALL-001' || policy.phase !== 'pushkinVerticalSlice') fail('first-slice budget policy identity drifted');
const requiredMeasurements = new Set(policy.report?.requiredMeasurements ?? []);
for (const measurement of [
  'raw-and-optimized-glb-transfer-bytes',
  'embedded-documentary-compressed-bytes',
  'embedded-documentary-dimensions',
  'conservative-rgba8-decoded-texture-residency-estimate',
  'exhibit-triangle-count',
  'draw-material-count',
]) {
  if (!requiredMeasurements.has(measurement)) fail(`budget policy no longer requires ${measurement}`);
}
if (evidence.issue !== 440 || evidence.productionBoundary?.productionAsset !== false || evidence.productionBoundary?.productionManifestAllowed !== false || evidence.productionBoundary?.productionWebglMayBegin !== false) {
  fail('candidate evidence crossed issue or production boundary');
}
if (sourceAssets.purpose !== 'offline-source-evidence-only-not-production-media' || sourceAssets.productionManifestAllowed !== false) fail('source assets are not bounded offline evidence');
if (Number(rawReport.issues?.numErrors ?? 0) !== 0 || Number(optimizedReport.issues?.numErrors ?? 0) !== 0) fail('budget may only be measured from Khronos error-free raw+optimized GLBs');

const raw = inventory(parseGlb(rawPath), rawPath);
const optimized = inventory(parseGlb(optimizedPath), optimizedPath);
if (raw.triangles !== optimized.triangles) fail(`Meshopt changed candidate triangle count: raw=${raw.triangles} optimized=${optimized.triangles}`);
if (raw.drawMaterialCount !== optimized.drawMaterialCount) fail(`Meshopt changed candidate draw-material count: raw=${raw.drawMaterialCount} optimized=${optimized.drawMaterialCount}`);

const rawImageMultiset = raw.images.map((item) => `${item.sha256}:${item.compressedBytes}:${item.dimensions.join('x')}`).sort();
const optimizedImageMultiset = optimized.images.map((item) => `${item.sha256}:${item.compressedBytes}:${item.dimensions.join('x')}`).sort();
if (JSON.stringify(rawImageMultiset) !== JSON.stringify(optimizedImageMultiset)) fail('optimized candidate changed embedded image bytes/dimensions');

const portraitHash = sourceAssets.sources?.find((item) => String(item.file ?? '').endsWith('.jpg'))?.sha256;
const oneginHash = sourceAssets.derivatives?.find((item) => item.assetId === 'pushkin-onegin-1833-title-page-offline-derivative')?.sha256;
if (!portraitHash || !oneginHash) fail('documentary source hashes are missing from source-assets evidence');
const documentaryHashes = new Set([portraitHash, oneginHash]);
const documentaryImages = optimized.images.filter((item) => documentaryHashes.has(item.sha256));
if (documentaryImages.length !== 2) fail(`optimized candidate must retain exactly two documentary images, found ${documentaryImages.length}`);
const lookdevImages = optimized.images.filter((item) => !documentaryHashes.has(item.sha256));
if (lookdevImages.length !== 10) fail(`optimized candidate must retain ten bounded roughness/normal maps, found ${lookdevImages.length}`);

const sum = (values) => values.reduce((total, value) => total + value, 0);
const documentaryCompressedBytes = sum(documentaryImages.map((item) => item.compressedBytes));
const lookdevCompressedBytes = sum(lookdevImages.map((item) => item.compressedBytes));
const conservativeRgba8ResidentBytes = sum(optimized.images.map((item) => item.conservativeRgba8ResidentBytes));
const savedBytes = raw.bytes - optimized.bytes;
const savedPercent = raw.bytes > 0 ? Number(((savedBytes / raw.bytes) * 100).toFixed(4)) : 0;

const report = {
  schemaVersion: 1,
  issue: 440,
  laneId: 'TLP-HALL-001',
  phase: 'pushkinVisualRemediationCandidate',
  status: 'candidate-first-slice-budget-measured-production-runtime-pending',
  purpose: policy.report?.purpose,
  source: {
    budgetPolicy: path.relative(process.cwd(), policyPath).replaceAll('\\', '/'),
    candidateEvidence: path.basename(evidencePath),
    sourceAssetsEvidence: path.basename(sourceAssetsPath),
    topology: evidence.source?.topology,
    approvedRig: evidence.source?.approvedRig,
    productionLightingAuthority: evidence.source?.productionLightingAuthority,
    surfaceUv: evidence.source?.surfaceUv,
  },
  delivery: {
    rawGlb: raw,
    optimizedGlb: optimized,
    optimization: {
      savedBytes,
      savedPercent,
      documentaryCompressedBytes,
      lookdevCompressedBytes,
      optimizedNonImageBytes: optimized.bytes - documentaryCompressedBytes - lookdevCompressedBytes,
    },
  },
  scene: {
    exhibitTriangles: optimized.triangles,
    drawMaterialCount: optimized.drawMaterialCount,
    embeddedDocumentaryTextureCount: documentaryImages.length,
    boundedLookdevTextureCount: lookdevImages.length,
    conservativeRgba8DecodedTextureResidentBytes: conservativeRgba8ResidentBytes,
    documentaryImages,
  },
  productionUnknowns: {
    productionGpuTextureResidentBytes: null,
    webRendererInfo: null,
    webFrameTimeMs: null,
    mobileFrameTimeMs: null,
    assetDecodeLoadTimeMs: null,
    productionTextureEncodingDecision: null,
    reason: 'candidate offline Blender/GLB evidence cannot prove browser GPU residency, renderer.info, decode time or frame time; those remain webVerticalSlice measurements',
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

if (!Number.isInteger(report.scene.exhibitTriangles) || report.scene.exhibitTriangles <= 0) fail('candidate budget requires a positive triangle count');
if (!Number.isInteger(report.scene.drawMaterialCount) || report.scene.drawMaterialCount <= 0) fail('candidate budget requires a positive draw-material count');
if (optimized.bytes <= 0 || raw.bytes <= 0) fail('candidate budget requires non-empty raw and optimized GLBs');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
const updatedEvidence = readJson(evidencePath);
updatedEvidence.files = {
  ...(updatedEvidence.files ?? {}),
  optimizedGlb: fileEvidence(optimizedPath),
  rawValidationReport: fileEvidence(rawReportPath),
  optimizedValidationReport: fileEvidence(optimizedReportPath),
  firstSliceBudgetReport: fileEvidence(outputPath),
};
updatedEvidence.budget = {
  status: 'measured-against-existing-first-slice-contract',
  report: path.basename(outputPath),
  rawBytes: raw.bytes,
  optimizedBytes: optimized.bytes,
  savedBytes,
  savedPercent,
  exhibitTriangles: optimized.triangles,
  drawMaterialCount: optimized.drawMaterialCount,
};
fs.writeFileSync(evidencePath, `${JSON.stringify(updatedEvidence, null, 2)}\n`, 'utf8');
console.log(`Pushkin candidate budget measured: raw=${raw.bytes} B optimized=${optimized.bytes} B triangles=${optimized.triangles} materials=${optimized.drawMaterialCount}`);
