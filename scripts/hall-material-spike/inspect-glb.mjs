import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith('--') || value === undefined) throw new Error(`invalid argument near ${key ?? '<end>'}`);
    result[key.slice(2)] = value;
  }
  return result;
}

function readGlbJson(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 20 || buffer.readUInt32LE(0) !== 0x46546c67) throw new Error(`${filePath} is not a GLB`);
  const version = buffer.readUInt32LE(4);
  if (version !== 2) throw new Error(`${filePath} has unsupported GLB version ${version}`);
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + length;
    if (end > buffer.length) throw new Error(`${filePath} has truncated GLB chunk`);
    if (type === 0x4e4f534a) {
      const text = buffer.subarray(start, end).toString('utf8').replace(/\u0000+$/g, '').trim();
      return { json: JSON.parse(text), bytes: buffer.length };
    }
    offset = end;
  }
  throw new Error(`${filePath} has no JSON chunk`);
}

function accessorCount(json, accessorIndex) {
  if (!Number.isInteger(accessorIndex)) return 0;
  return json.accessors?.[accessorIndex]?.count ?? 0;
}

function snapshot(filePath) {
  const { json, bytes } = readGlbJson(filePath);
  const nodes = (json.nodes ?? []).map((node, index) => ({ index, name: node.name ?? null, mesh: node.mesh ?? null, camera: node.camera ?? null, extras: node.extras ?? null }));
  const meshes = (json.meshes ?? []).map((mesh, meshIndex) => ({
    index: meshIndex,
    name: mesh.name ?? null,
    primitives: (mesh.primitives ?? []).map((primitive) => ({
      attributes: Object.keys(primitive.attributes ?? {}).sort(),
      material: primitive.material ?? null,
      triangles: Number.isInteger(primitive.indices)
        ? Math.floor(accessorCount(json, primitive.indices) / 3)
        : Math.floor(accessorCount(json, primitive.attributes?.POSITION) / 3),
      extras: primitive.extras ?? null,
    })),
  }));
  const materials = (json.materials ?? []).map((material, index) => ({
    index,
    name: material.name ?? null,
    extras: material.extras ?? null,
    hasBaseColorTexture: Number.isInteger(material.pbrMetallicRoughness?.baseColorTexture?.index),
    hasMetallicRoughnessTexture: Number.isInteger(material.pbrMetallicRoughness?.metallicRoughnessTexture?.index),
    hasNormalTexture: Number.isInteger(material.normalTexture?.index),
    hasOcclusionTexture: Number.isInteger(material.occlusionTexture?.index),
    hasEmissiveTexture: Number.isInteger(material.emissiveTexture?.index),
    metallicFactor: material.pbrMetallicRoughness?.metallicFactor ?? 1,
    roughnessFactor: material.pbrMetallicRoughness?.roughnessFactor ?? 1,
  }));
  return {
    file: filePath,
    bytes,
    extensionsUsed: [...(json.extensionsUsed ?? [])].sort(),
    extensionsRequired: [...(json.extensionsRequired ?? [])].sort(),
    nodes,
    meshes,
    materials,
    cameras: (json.cameras ?? []).map((camera, index) => ({ index, name: camera.name ?? null, type: camera.type })),
    textureCount: (json.textures ?? []).length,
    imageCount: (json.images ?? []).length,
    totalTriangles: meshes.reduce((sum, mesh) => sum + mesh.primitives.reduce((inner, primitive) => inner + primitive.triangles, 0), 0),
  };
}

function requiredNodeMap(snapshotValue) {
  return new Map(snapshotValue.nodes.filter((node) => node.name).map((node) => [node.name, node]));
}

function meshForNode(snapshotValue, nodeName) {
  const node = snapshotValue.nodes.find((entry) => entry.name === nodeName);
  if (!node || !Number.isInteger(node.mesh)) return null;
  return snapshotValue.meshes[node.mesh] ?? null;
}

const args = parseArgs(process.argv.slice(2));
if (!args.raw || !args.optimized || !args.out) throw new Error('Usage: node inspect-glb.mjs --raw raw.glb --optimized optimized.glb --out report.json');

const raw = snapshot(args.raw);
const optimized = snapshot(args.optimized);
const requiredNames = [
  'ARCH_H3_SPIKE_BAY',
  'EXHIBIT_alexander-pushkin',
  'EXHIBIT_DOC_CASE_01',
  'EXHIBIT_DOC_CASE_02',
  'ARCH_H3_SPIKE_EMISSIVE_MARKER',
  'CAM_H3_R1_pushkinViewing',
];

const failures = [];
const rawNodes = requiredNodeMap(raw);
const optimizedNodes = requiredNodeMap(optimized);
for (const name of requiredNames) {
  if (!rawNodes.has(name)) failures.push(`raw GLB missing required node ${name}`);
  if (!optimizedNodes.has(name)) failures.push(`optimized GLB missing required node ${name}`);
  const before = rawNodes.get(name);
  const after = optimizedNodes.get(name);
  if (before && after && JSON.stringify(before.extras) !== JSON.stringify(after.extras)) failures.push(`extras drifted for ${name}`);
}

for (const [label, value] of [['raw', raw], ['optimized', optimized]]) {
  const arch = meshForNode(value, 'ARCH_H3_SPIKE_BAY');
  if (!arch) {
    failures.push(`${label} GLB missing architecture mesh`);
    continue;
  }
  for (const primitive of arch.primitives) {
    if (!primitive.attributes.includes('TEXCOORD_0')) failures.push(`${label} architecture primitive lost TEXCOORD_0`);
    if (!primitive.attributes.includes('TEXCOORD_1')) failures.push(`${label} architecture primitive lost TEXCOORD_1`);
  }
  const surface = value.materials.find((material) => material.name === 'MAT_H3_SPIKE_STONE');
  if (!surface) failures.push(`${label} GLB missing MAT_H3_SPIKE_STONE`);
  else {
    if (!surface.hasBaseColorTexture) failures.push(`${label} surface material missing baseColor texture`);
    if (!surface.hasMetallicRoughnessTexture) failures.push(`${label} surface material missing metallicRoughness texture`);
    if (!surface.hasNormalTexture) failures.push(`${label} surface material missing normal texture`);
    if (!surface.hasOcclusionTexture) failures.push(`${label} surface material missing AO/occlusion texture`);
  }
  const emissive = value.materials.find((material) => material.name === 'MAT_H3_SPIKE_EMISSIVE_CALIBRATION');
  if (!emissive?.hasEmissiveTexture) failures.push(`${label} GLB missing emissive calibration texture`);
}

if (raw.totalTriangles !== optimized.totalTriangles) failures.push(`triangle count changed without a simplification contract: ${raw.totalTriangles} -> ${optimized.totalTriangles}`);

const report = {
  schemaVersion: 1,
  status: failures.length ? 'failed' : 'passed',
  requiredNames,
  raw,
  optimized,
  preservation: {
    nodeNamesAndExtras: failures.every((item) => !item.includes('required node') && !item.includes('extras drifted')),
    uv0AndUv1: failures.every((item) => !item.includes('TEXCOORD_')),
    pbrBindings: failures.every((item) => !item.includes('surface material') && !item.includes('AO/occlusion') && !item.includes('emissive')),
    trianglesUnchanged: raw.totalTriangles === optimized.totalTriangles,
  },
  sizeReductionBytes: raw.bytes - optimized.bytes,
  sizeReductionRatio: raw.bytes > 0 ? (raw.bytes - optimized.bytes) / raw.bytes : 0,
  failures,
};

fs.mkdirSync(path.dirname(args.out), { recursive: true });
fs.writeFileSync(args.out, `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) {
  console.error('Hall material spike GLB preservation check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Hall material spike GLB preservation passed: ${raw.bytes} -> ${optimized.bytes} bytes`);
