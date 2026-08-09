import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const spike = JSON.parse(read('docs/hall-v3/material-spike.json')) as any;
const reexport = read('scripts/hall-material/reexport-with-tangents.py');
const workflow = read('.github/workflows/hall-greybox-tooling.yml');
const viewer = read('qa/hall-material-viewer/main.ts');
const browserWitness = read('scripts/hall-material/browser-witness.mjs');

const ARCH_NODES = ['ARCH_spike_floor','ARCH_wall_016','ARCH_wall_017'];
const EXPECTED_LIGHTMAP_RESIDENT_BYTES = 128 * 128 * 4 * 2;
const EXPECTED_TOTAL_LIGHTMAP_RESIDENT_BYTES = EXPECTED_LIGHTMAP_RESIDENT_BYTES * ARCH_NODES.length;

type GlbJson = Record<string, any>;
function parseGlbJson(filePath: string): GlbJson {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'glTF') return {};
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + length;
    if (end > buffer.length) break;
    if (type === 0x4E4F534A) return JSON.parse(buffer.subarray(start, end).toString('utf8').replace(/\u0000+$/g, '').trim());
    offset = end;
  }
  return {};
}
function nodeByName(doc: GlbJson, name: string): any | undefined { return (doc.nodes ?? []).find((node: any) => node?.name === name); }
function primitive(doc: GlbJson, node: any): any | undefined {
  if (typeof node?.mesh !== 'number') return undefined;
  return doc.meshes?.[node.mesh]?.primitives?.[0];
}
function positionBounds(doc: GlbJson, node: any): { min: number[]; max: number[] } | null {
  const attribute = primitive(doc, node)?.attributes?.POSITION;
  if (typeof attribute !== 'number') return null;
  const accessor = doc.accessors?.[attribute];
  if (!Array.isArray(accessor?.min) || !Array.isArray(accessor?.max)) return null;
  return { min: accessor.min.map(Number), max: accessor.max.map(Number) };
}
function closeArray(a: number[] | undefined, b: number[] | undefined, epsilon = 1e-5): boolean {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => Math.abs(value - b[index]) <= epsilon);
}
function warningCodes(reportPath: string): string[] {
  if (!fs.existsSync(reportPath)) return [];
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as any;
  return (report?.issues?.messages ?? []).filter((message: any) => Number(message?.severity) === 1).map((message: any) => String(message?.code ?? ''));
}

// Static transport contract.
expect(spike.materialProof?.normal?.requiresTangentAttribute === true, 'normal-mapped stone must require explicit tangent transport');
expect((spike.exportToolchain?.requiredPreservation ?? []).includes('TANGENT'), 'export preservation contract must include TANGENT');
expect(reexport.includes('export_tangents=True'), 'transport re-export must request Blender tangents');
expect(reexport.includes('contract["bay"]["exportNodes"]'), 'transport re-export must select nodes from machine contract');
expect(workflow.includes('scripts/hall-material/reexport-with-tangents.py'), 'Hall workflow must run tangent re-export before Khronos validation');
expect(viewer.includes("antialias: false") && viewer.includes('preserveDrawingBuffer: true'), 'pixel comparison viewer must disable antialias and preserve the drawing buffer');
expect(viewer.includes("requestedAsset === 'raw'") && viewer.includes('gl.readPixels') && viewer.includes("crypto.subtle.digest('SHA-256'"), 'viewer must support raw/optimized deterministic pixel witnesses');
expect(viewer.includes('gpuTextureResidentBytes') && viewer.includes('estimatedResidentBytes') && viewer.includes('generateMipmaps'), 'viewer must measure decoded GPU texture residency and mip policy');
expect(browserWitness.includes("key: 'rawL0'") && browserWitness.includes("key: 'optimizedL0'") && browserWitness.includes('compareSamples'), 'browser witness must compare raw L0 against optimized L0');
expect(browserWitness.includes('gpuMemoryComparison') && browserWitness.includes('lightmapEstimatedResidentBytes'), 'browser witness must persist L0/L1 GPU-memory comparison');
const visual = spike.browserWitness?.optimizationVisualEquivalence ?? {};
expect(JSON.stringify(visual.sampleGrid ?? []) === JSON.stringify([64,36]), 'visual equivalence sample grid must remain 64x36');
expect(visual.maximumMeanAbsoluteChannelDifference === 0.75, 'visual equivalence mean-difference threshold must remain explicit');
expect(visual.maximumChannelDifference === 8, 'visual equivalence max-channel threshold must remain explicit');
expect(visual.maximumChangedSampleRatioAbove2 === 0.05, 'visual equivalence changed-sample threshold must remain explicit');

const evidenceDirRelative = process.env.HALL_MATERIAL_SPIKE_EVIDENCE;
if (evidenceDirRelative) {
  const evidenceDir = path.join(root, evidenceDirRelative);
  const rawPath = path.join(evidenceDir, 'material-spike-raw.glb');
  const optimizedPath = path.join(evidenceDir, 'material-spike-optimized.glb');
  expect(fs.existsSync(rawPath) && fs.existsSync(optimizedPath), 'transport evidence requires both raw and optimized GLB');
  if (fs.existsSync(rawPath) && fs.existsSync(optimizedPath)) {
    const raw = parseGlbJson(rawPath);
    const optimized = parseGlbJson(optimizedPath);
    for (const name of ARCH_NODES) {
      const rawNode = nodeByName(raw, name);
      const optimizedNode = nodeByName(optimized, name);
      expect(Boolean(rawNode) && Boolean(optimizedNode), `${name}: raw/optimized node must survive`);
      const rawAttributes = primitive(raw, rawNode)?.attributes ?? {};
      const optimizedAttributes = primitive(optimized, optimizedNode)?.attributes ?? {};
      for (const attribute of ['POSITION','NORMAL','TANGENT','TEXCOORD_0','TEXCOORD_1']) {
        expect(typeof rawAttributes[attribute] === 'number', `${name}: raw GLB must contain ${attribute}`);
        expect(typeof optimizedAttributes[attribute] === 'number', `${name}: optimized GLB must contain ${attribute}`);
      }
      const rawBounds = positionBounds(raw, rawNode);
      const optimizedBounds = positionBounds(optimized, optimizedNode);
      expect(Boolean(rawBounds) && Boolean(optimizedBounds), `${name}: raw/optimized position bounds must be inspectable`);
      if (rawBounds && optimizedBounds) {
        expect(closeArray(rawBounds.min, optimizedBounds.min) && closeArray(rawBounds.max, optimizedBounds.max), `${name}: optimizer changed local position bounds`);
      }
    }
  }
  const rawWarnings = warningCodes(path.join(evidenceDir, 'gltf-raw-report.json'));
  const optimizedWarnings = warningCodes(path.join(evidenceDir, 'gltf-optimized-report.json'));
  expect(!rawWarnings.includes('MESH_PRIMITIVE_GENERATED_TANGENT_SPACE'), 'raw GLB must not rely on generated tangent space');
  expect(!optimizedWarnings.includes('MESH_PRIMITIVE_GENERATED_TANGENT_SPACE'), 'optimized GLB must not rely on generated tangent space');
}

const browserEvidenceRelative = process.env.HALL_MATERIAL_BROWSER_EVIDENCE;
if (browserEvidenceRelative) {
  const browserPath = path.join(root, browserEvidenceRelative);
  expect(fs.existsSync(browserPath), `browser transport evidence must exist: ${browserEvidenceRelative}`);
  if (fs.existsSync(browserPath)) {
    const evidence = JSON.parse(fs.readFileSync(browserPath, 'utf8')) as any;
    const raw = evidence.rawControl;
    const optimized = evidence.modes?.['L0-minimal-runtime'];
    const lit = evidence.modes?.['L1-external-lightmap'];
    expect(raw?.asset === 'raw' && raw?.mode === 'L0-minimal-runtime', 'raw control must render raw GLB under L0');
    expect(optimized?.asset === 'optimized' && optimized?.mode === 'L0-minimal-runtime', 'optimized control must render optimized GLB under same L0');
    expect(lit?.asset === 'optimized' && lit?.mode === 'L1-external-lightmap', 'L1 witness must use optimized GLB');
    expect(JSON.stringify(raw?.sampleGrid ?? []) === JSON.stringify([64,36]) && JSON.stringify(optimized?.sampleGrid ?? []) === JSON.stringify([64,36]), 'raw/optimized pixel samples must share 64x36 grid');
    const comparison = evidence.optimizationVisualEquivalence ?? {};
    expect(Number(comparison.sampleBytes) === 64 * 36 * 4, 'visual equivalence must compare complete 64x36 RGBA sample');
    expect(Number(comparison.meanAbsoluteChannelDifference) <= visual.maximumMeanAbsoluteChannelDifference, `optimizer visual mean difference too high: ${comparison.meanAbsoluteChannelDifference}`);
    expect(Number(comparison.maximumChannelDifference) <= visual.maximumChannelDifference, `optimizer visual max-channel difference too high: ${comparison.maximumChannelDifference}`);
    expect(Number(comparison.changedSampleRatioAbove2) <= visual.maximumChangedSampleRatioAbove2, `optimizer changed too many sampled channels: ${comparison.changedSampleRatioAbove2}`);

    for (const witness of [raw, optimized, lit]) {
      expect(Number(witness?.gpuTextureResidentBytes) > 0, `${witness?.asset}/${witness?.mode}: decoded GPU texture residency must be measured`);
      expect(Array.isArray(witness?.gpuTextures) && witness.gpuTextures.length > 0, `${witness?.asset}/${witness?.mode}: decoded GPU texture inventory must be present`);
    }
    const gpu = evidence.gpuMemoryComparison ?? {};
    expect(Number(gpu.l0EstimatedResidentBytes) === Number(optimized?.gpuTextureResidentBytes), 'GPU comparison L0 total must match optimized L0 witness');
    expect(Number(gpu.l1EstimatedResidentBytes) === Number(lit?.gpuTextureResidentBytes), 'GPU comparison L1 total must match optimized L1 witness');
    expect(Number(gpu.incrementalEstimatedResidentBytes) > 0, 'L1 must report its incremental decoded GPU texture cost');
    expect(Number(gpu.lightmapTextureCount) === ARCH_NODES.length, 'L1 must load exactly one external lightmap per representative architecture node');
    expect(Number(gpu.lightmapEstimatedResidentBytes) === EXPECTED_TOTAL_LIGHTMAP_RESIDENT_BYTES, `three 128x128 RGBA HalfFloat lightmaps must occupy ${EXPECTED_TOTAL_LIGHTMAP_RESIDENT_BYTES} decoded bytes`);
    expect(Number(gpu.incrementalEstimatedResidentBytes) >= EXPECTED_TOTAL_LIGHTMAP_RESIDENT_BYTES, 'L1 incremental GPU texture cost must include all decoded lightmaps');
    for (const texture of gpu.lightmaps ?? []) {
      expect(Number(texture.width) === 128 && Number(texture.height) === 128, 'L1 lightmap witness must retain 128x128 bake resolution');
      expect(texture.type === 'HalfFloatType', 'Three r184 EXR lightmap must decode as HalfFloatType');
      expect(texture.format === 'RGBAFormat', 'Three r184 EXR lightmap must decode as RGBAFormat');
      expect(texture.generateMipmaps === false, 'EXR DataTexture lightmap must not silently allocate mipmaps');
      expect(Number(texture.channel) === 1, 'external lightmap must bind UV1/channel 1');
      expect(Number(texture.estimatedResidentBytes) === EXPECTED_LIGHTMAP_RESIDENT_BYTES, `each decoded lightmap must report ${EXPECTED_LIGHTMAP_RESIDENT_BYTES} resident bytes`);
    }
  }
}

if (failures.length) {
  console.error('\nHall material transport validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Hall material transport contract passed${evidenceDirRelative ? ' with GLB evidence' : ''}${browserEvidenceRelative ? ' and raw/optimized browser equivalence plus GPU residency' : ''}.`);