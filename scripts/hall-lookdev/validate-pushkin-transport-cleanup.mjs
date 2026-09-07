import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const cleanupPath = 'docs/hall-v3/pushkin-transport-cleanup.json';
const visualPath = 'docs/hall-v3/pushkin-visual-remediation.json';
const scriptPath = 'scripts/hall-lookdev/cleanup-pushkin-transport.py';
const workflowPath = '.github/workflows/hall-pushkin-visual-remediation.yml';

for (const required of [cleanupPath, visualPath, scriptPath, workflowPath]) {
  expect(fs.existsSync(path.join(root, required)), `missing Pushkin transport-cleanup authority: ${required}`);
}

const cleanup = JSON.parse(read(cleanupPath));
const visual = JSON.parse(read(visualPath));
const script = read(scriptPath);
const workflow = read(workflowPath);

expect(cleanup.schemaVersion === 1 && cleanup.issue === 444, 'transport cleanup must belong only to issue #444');
expect(cleanup.status === 'redundant-uv-transport-cleanup', 'transport cleanup status drifted');
expect(cleanup.sourceAuthority?.visualRemediationContract === visualPath, 'transport cleanup must derive from the bounded visual-remediation contract');
expect(cleanup.sourceAuthority?.visualRemediationIssue === 440 && cleanup.sourceAuthority?.tangentPortabilityIssue === 442, 'transport cleanup must remain a follow-up to #440/#442');
expect(cleanup.sourceAuthority?.topology === 'H3' && cleanup.sourceAuthority?.approvedRig === 'R1', 'transport cleanup must retain H3/R1 authority');
expect(cleanup.sourceAuthority?.productionLightingAuthority === 'L0-minimal-runtime' && cleanup.sourceAuthority?.surfaceUv === 'UV0', 'transport cleanup must retain L0/UV0 authority');
expect(cleanup.cleanup?.targetInventory === 'visualRemediation.edgeTreatment.targetObjects', 'cleanup target inventory must derive from visual-remediation targets');
expect(Number(cleanup.cleanup?.expectedTargetCount) === 16 && (visual.edgeTreatment?.targetObjects ?? []).length === 16, 'cleanup must remain bounded to the 16 current lookdev targets');
expect(cleanup.cleanup?.authoritativeUvLayer === 'UV0' && cleanup.cleanup?.removeAllOtherUvLayersOnTargets === true, 'cleanup must retain only authoritative UV0 on targets');
expect(Number(cleanup.cleanup?.normalMappedTexturesMustUseTexcoord) === 0, 'normal-mapped textures must collapse to TEXCOORD_0 after cleanup');
expect(cleanup.cleanup?.normalMappedPrimitivesMustNotExportTexcoord1 === true, 'normal-mapped primitives must not retain TEXCOORD_1');
expect(cleanup.cleanup?.normalMappedPrimitivesRequireTangent === true, 'normal-mapped primitives must retain explicit TANGENT');
expect(same(cleanup.cleanup?.forbiddenKhronosInfoCodes, ['UNUSED_OBJECT']), 'cleanup forbidden Khronos info inventory drifted');
expect(cleanup.acceptedExporterInfo?.code === 'UNUSED_MESH_TANGENT' && Number(cleanup.acceptedExporterInfo?.expectedCount) === 2, 'accepted Blender tangent-overhead disposition drifted');
expect(cleanup.acceptedExporterInfo?.disposition === 'accepted-blender-exporter-overhead', 'accepted tangent-overhead disposition must remain explicit');

expect(cleanup.scope?.candidateOnly === true, 'transport cleanup must remain candidate-only');
for (const key of [
  'canonicalGeneratorMayChange',
  'frozenH3ArchitectureMayChange',
  'approvedCameraMayChange',
  'productionLightingAuthorityMayChange',
  'materialAppearanceMayChange',
  'documentaryMediaMayChange',
  'productionHallMayActivate',
  'productionWebglMayBegin',
  'offlineVisualApprovalMayPromote',
]) {
  expect(cleanup.scope?.[key] === false, `transport cleanup scope.${key} must remain false`);
}

expect(script.includes('expected exactly one reproduced redundant UV layer'), 'cleanup script must fail closed on the reproduced one-layer-per-target defect');
expect(script.includes('mesh data is shared with non-target objects'), 'cleanup script must reject shared mesh mutation outside the bounded target set');
expect(script.includes('material does not use the authoritative'), 'cleanup script must prove material UV authority before pruning');
expect(script.includes('geometry/transform fingerprint') && script.includes('world bounds'), 'cleanup script must prove geometry and world bounds are unchanged');
expect(script.includes('remediation.export_candidate_glb') && script.includes('remediation.render_stills'), 'cleanup must regenerate GLB and fixed still evidence from the cleaned blend');
expect(script.includes('acceptedExporterInfo'), 'cleanup evidence must preserve the explicit tangent-overhead disposition');
expect(workflow.includes('cleanup-pushkin-transport.py'), 'Hall workflow must run bounded UV cleanup before Khronos validation');
expect(workflow.includes('validate-pushkin-transport-cleanup.mjs'), 'Hall workflow must execute the transport-cleanup validator');

function parseGlbJson(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${path.basename(filePath)} is not a GLB`);
  if (bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error(`${path.basename(filePath)} GLB header is invalid`);
  let offset = 12;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) throw new Error(`${path.basename(filePath)} has a truncated chunk header`);
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    offset += 8;
    if (offset + length > bytes.length) throw new Error(`${path.basename(filePath)} has a truncated chunk`);
    const chunk = bytes.subarray(offset, offset + length);
    offset += length;
    if (type === 0x4e4f534a) return JSON.parse(chunk.toString('utf8').replace(/[\u0000\u0020]+$/u, ''));
  }
  throw new Error(`${path.basename(filePath)} has no JSON chunk`);
}

function inspectTransport(filePath) {
  const gltf = parseGlbJson(filePath);
  const normalMappedMaterials = new Set();
  for (const [index, material] of (gltf.materials ?? []).entries()) {
    if (!material?.normalTexture || !Number.isInteger(material.normalTexture.index)) continue;
    normalMappedMaterials.add(index);
    expect(Number(material.normalTexture.texCoord ?? 0) === 0, `${path.basename(filePath)} material ${material.name ?? index} normalTexture must use TEXCOORD_0`);
    const mr = material.pbrMetallicRoughness?.metallicRoughnessTexture;
    if (mr) expect(Number(mr.texCoord ?? 0) === 0, `${path.basename(filePath)} material ${material.name ?? index} roughness texture must use TEXCOORD_0`);
  }

  let normalMappedPrimitives = 0;
  let documentaryTangents = 0;
  const bad = [];
  for (const [meshIndex, mesh] of (gltf.meshes ?? []).entries()) {
    for (const [primitiveIndex, primitive] of (mesh.primitives ?? []).entries()) {
      const pointer = `/meshes/${meshIndex}/primitives/${primitiveIndex}`;
      const isNormalMapped = Number.isInteger(primitive.material) && normalMappedMaterials.has(primitive.material);
      if (isNormalMapped) {
        normalMappedPrimitives += 1;
        if (!Number.isInteger(primitive.attributes?.TEXCOORD_0)) bad.push(`${pointer}: missing TEXCOORD_0`);
        if (primitive.attributes && Object.prototype.hasOwnProperty.call(primitive.attributes, 'TEXCOORD_1')) bad.push(`${pointer}: retained TEXCOORD_1`);
        if (!Number.isInteger(primitive.attributes?.TANGENT)) bad.push(`${pointer}: missing TANGENT`);
      } else if (Number.isInteger(primitive.attributes?.TANGENT)) {
        documentaryTangents += 1;
      }
    }
  }
  return { normalMappedMaterials: normalMappedMaterials.size, normalMappedPrimitives, documentaryTangents, bad };
}

function inspectReport(filePath) {
  const report = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const messages = report.issues?.messages ?? [];
  const infoCounts = new Map();
  for (const message of messages) infoCounts.set(message.code, (infoCounts.get(message.code) ?? 0) + 1);
  expect(Number(report.issues?.numErrors ?? 0) === 0, `${path.basename(filePath)} must remain Khronos error-free`);
  expect(Number(report.issues?.numWarnings ?? 0) === 0, `${path.basename(filePath)} must remain Khronos warning-free`);
  for (const code of cleanup.cleanup.forbiddenKhronosInfoCodes) {
    expect((infoCounts.get(code) ?? 0) === 0, `${path.basename(filePath)} still contains forbidden ${code} infos`);
  }
  expect((infoCounts.get(cleanup.acceptedExporterInfo.code) ?? 0) === Number(cleanup.acceptedExporterInfo.expectedCount), `${path.basename(filePath)} accepted tangent-overhead count drifted`);
}

const evidenceDirValue = process.env.HALL_PUSHKIN_VISUAL_REMEDIATION_EVIDENCE_DIR;
if (evidenceDirValue) {
  const evidenceDir = path.resolve(evidenceDirValue);
  const evidencePath = path.join(evidenceDir, 'visual-remediation-evidence.json');
  const rawPath = path.join(evidenceDir, 'pushkin-lookdev-candidate-raw.glb');
  const optimizedPath = path.join(evidenceDir, 'pushkin-lookdev-candidate-optimized.glb');
  const rawReportPath = path.join(evidenceDir, 'gltf-candidate-raw-report.json');
  const optimizedReportPath = path.join(evidenceDir, 'gltf-candidate-optimized-report.json');
  for (const required of [evidencePath, rawPath, optimizedPath, rawReportPath, optimizedReportPath]) {
    expect(fs.existsSync(required), `generated UV-cleanup evidence missing: ${path.basename(required)}`);
  }

  if (fs.existsSync(evidencePath)) {
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    expect(evidence.transportCleanup?.issue === 444 && evidence.transportCleanup?.status === 'redundant-uv-transport-cleaned', 'generated UV-cleanup evidence identity/status drifted');
    expect(Number(evidence.transportCleanup?.targetCount) === 16 && Number(evidence.transportCleanup?.removedUvLayerCount) === 16, 'generated cleanup must remove one redundant UV layer from each of 16 targets');
    expect(evidence.transportCleanup?.authoritativeUvLayer === 'UV0', 'generated cleanup must retain UV0 authority');
    expect(evidence.transportCleanup?.acceptedExporterInfo?.disposition === 'accepted-blender-exporter-overhead', 'generated evidence lost tangent-overhead disposition');
    for (const item of evidence.transportCleanup?.objects ?? []) {
      expect(same(item.uvLayersAfter, ['UV0']), `${item.object}: generated cleanup did not leave only UV0`);
      expect(Array.isArray(item.removedUvLayers) && item.removedUvLayers.length === 1, `${item.object}: generated cleanup removal count drifted`);
      expect(item.geometryFingerprintMatched === true && Number(item.worldBoundsDeltaMeters) <= 0.0000001, `${item.object}: cleanup changed geometry/world bounds`);
    }
  }

  for (const glbPath of [rawPath, optimizedPath]) {
    if (!fs.existsSync(glbPath)) continue;
    try {
      const result = inspectTransport(glbPath);
      expect(result.normalMappedMaterials === 5 && result.normalMappedPrimitives === 16, `${path.basename(glbPath)} normal-mapped inventory drifted`);
      expect(result.documentaryTangents === 2, `${path.basename(glbPath)} documentary tangent-overhead inventory drifted`);
      expect(result.bad.length === 0, `${path.basename(glbPath)} UV/tangent cleanup failed: ${result.bad.join(', ')}`);
    } catch (error) {
      expect(false, `${path.basename(glbPath)} cleanup parse failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  for (const reportPath of [rawReportPath, optimizedReportPath]) {
    if (fs.existsSync(reportPath)) inspectReport(reportPath);
  }
}

if (failures.length) {
  console.error('Pushkin transport cleanup validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Pushkin transport cleanup validation passed.');
