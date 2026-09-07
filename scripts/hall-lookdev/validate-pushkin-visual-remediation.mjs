import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const sha256 = (absolute) => `sha256:${crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex')}`;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const contractPath = 'docs/hall-v3/pushkin-visual-remediation.json';
const canonicalPath = 'docs/hall-v3/pushkin-offline-exhibit.json';
const budgetPolicyPath = 'docs/hall-v3/pushkin-offline-budget.json';
const roadmapPath = 'docs/hall-v3/OWNER_GATED_ROADMAP.md';
const visualAcceptancePath = 'docs/hall-v3/VISUAL_ACCEPTANCE.md';
const scriptPath = 'scripts/hall-lookdev/remediate-pushkin-visual.py';
const budgetScriptPath = 'scripts/hall-lookdev/build-pushkin-candidate-budget.mjs';
const sequenceScriptPath = 'scripts/hall-lookdev/render-pushkin-visual-sequence.py';
const workflowPath = '.github/workflows/hall-pushkin-visual-remediation.yml';

for (const required of [contractPath, canonicalPath, budgetPolicyPath, roadmapPath, visualAcceptancePath, scriptPath, budgetScriptPath, sequenceScriptPath, workflowPath]) {
  expect(fs.existsSync(path.join(root, required)), `missing visual-remediation authority: ${required}`);
}

const contract = JSON.parse(read(contractPath));
const canonical = JSON.parse(read(canonicalPath));
const budgetPolicy = JSON.parse(read(budgetPolicyPath));
const roadmap = read(roadmapPath);
const visualAcceptance = read(visualAcceptancePath);
const script = read(scriptPath);
const budgetScript = read(budgetScriptPath);
const sequenceScript = read(sequenceScriptPath);
const workflow = read(workflowPath);

expect(contract.schemaVersion === 1 && contract.issue === 440, 'visual-remediation contract must belong only to issue #440');
expect(contract.status === 'lookdev-candidate-authoring', 'visual-remediation contract must remain candidate authoring');
expect(contract.sourceAuthority?.canonicalExhibitContract === canonicalPath, 'candidate must derive from canonical offline exhibit contract');
expect(contract.sourceAuthority?.topology === 'H3', 'candidate must retain H3 topology authority');
expect(contract.sourceAuthority?.layoutFingerprint === canonical.source?.layoutFingerprint, 'candidate H3 layout fingerprint must equal canonical exhibit authority');
expect(contract.sourceAuthority?.meshGeometryFingerprint === canonical.source?.meshGeometryFingerprint, 'candidate H3 mesh fingerprint must equal canonical exhibit authority');
expect(contract.sourceAuthority?.approvedRig === canonical.source?.approvedRig && contract.sourceAuthority?.approvedRig === 'R1', 'candidate must retain R1 camera authority');
expect(contract.sourceAuthority?.productionLightingAuthority === canonical.source?.lightingBaseline && contract.sourceAuthority?.productionLightingAuthority === 'L0-minimal-runtime', 'candidate must retain L0 production lighting authority');
expect(contract.sourceAuthority?.surfaceUv === canonical.source?.surfaceUv && contract.sourceAuthority?.surfaceUv === 'UV0', 'candidate must retain UV0 surface authority');

for (const key of ['candidateOnly', 'canonicalGeneratorUnchanged']) {
  expect(contract.scope?.[key] === true, `scope.${key} must remain true`);
}
for (const key of [
  'frozenH3ArchitectureMayChange',
  'approvedCameraMayChange',
  'productionLightingAuthorityMayChange',
  'productionHallMayActivate',
  'productionWebglMayBegin',
  'offlineVisualApprovalMayPromote',
]) {
  expect(contract.scope?.[key] === false, `scope.${key} must remain false`);
}

const edge = contract.edgeTreatment ?? {};
const targets = edge.targetObjects ?? [];
expect(Array.isArray(targets) && targets.length === 16 && new Set(targets).size === targets.length, 'edge target inventory must contain exactly 16 unique exhibit-local objects');
expect(targets.every((name) => /^PUSHKIN_/.test(name)), 'edge treatment may target only PUSHKIN_* objects');
expect(targets.every((name) => !/^PUSHKIN_(HERO_PORTRAIT|ONEGIN_PAGE)$/.test(name)), 'source image planes may not receive geometry edge treatment');
expect(Number(edge.segments) === 3, 'edge treatment must retain three bevel segments');
expect(Number(edge.maximumWidthMeters) > 0 && Number(edge.maximumWidthMeters) <= 0.015, 'maximum exhibit bevel must remain within selected 0.015 m lookdev proof');
expect(Number(edge.minimumWidthMeters) >= 0.001 && Number(edge.minimumWidthMeters) < Number(edge.maximumWidthMeters), 'minimum exhibit bevel must remain bounded and positive');
expect(Number(edge.maximumFractionOfSmallestLocalDimension) > 0 && Number(edge.maximumFractionOfSmallestLocalDimension) <= 0.2, 'edge width may consume at most 20% of smallest local dimension');

const response = contract.materialResponse ?? {};
expect(Number(response.textureResolution) === 64, 'lookdev response textures must remain bounded 64x64 evidence maps');
expect(response.wrap === 'repeat' && same(response.maps, ['roughness', 'normal']), 'lookdev material response must be repeat roughness+normal only');
const materials = response.materials ?? {};
const expectedMaterials = [
  'MAT_PUSHKIN_CHARCOAL',
  'MAT_PUSHKIN_WARM_STONE',
  'MAT_PUSHKIN_LINEN',
  'MAT_PUSHKIN_PAPER',
  'MAT_PUSHKIN_BRASS',
];
expect(same(Object.keys(materials), expectedMaterials), 'bounded material-response inventory drifted');
for (const [name, spec] of Object.entries(materials)) {
  expect(Number(spec.baseRoughness) >= 0.2 && Number(spec.baseRoughness) <= 0.95, `${name}: base roughness outside physical evidence envelope`);
  expect(Number(spec.roughnessAmplitude) > 0 && Number(spec.roughnessAmplitude) <= 0.1, `${name}: roughness variation must remain subtle and bounded`);
  expect(Number(spec.normalAmplitude8Bit) > 0 && Number(spec.normalAmplitude8Bit) <= 12, `${name}: normal map amplitude must remain bounded`);
  expect(Number(spec.normalStrength) > 0 && Number(spec.normalStrength) <= 0.35, `${name}: normal strength must remain bounded`);
  expect(Number(spec.texturePeriodMeters) >= 0.1 && Number(spec.texturePeriodMeters) <= 0.5, `${name}: metre texture period outside bounded lookdev range`);
}

const transport = contract.transportPortability ?? {};
const forbiddenKhronosWarnings = transport.forbiddenKhronosWarningCodes ?? [];
expect(transport.issue === 442 && transport.status === 'tangent-space-hardening', 'transport portability hardening must belong only to issue #442');
expect(transport.explicitTangentsRequired === true, 'issue #442 must require explicit tangent export');
expect(transport.normalMappedPrimitivesRequireTangentAttribute === true, 'normal-mapped primitives must require TANGENT attributes');
expect(transport.meshoptMustPreserveTangents === true, 'Meshopt must preserve tangent attributes');
expect(same(forbiddenKhronosWarnings, ['MESH_PRIMITIVE_GENERATED_TANGENT_SPACE']), 'issue #442 forbidden Khronos warning inventory drifted');

expect(contract.evidence?.renderEngine === 'BLENDER_EEVEE_NEXT', 'candidate evidence must use Eevee Next');
expect((contract.evidence?.stillIds ?? []).length === 10, 'candidate must reproduce all ten canonical fixed still views');
expect(same(contract.evidence?.stillIds, (canonical.evidence?.stills ?? []).map((entry) => entry.id)), 'candidate still IDs must exactly mirror canonical evidence order');
for (const key of [
  'candidateRawGlbRequired',
  'candidateOptimizedGlbRequired',
  'khronosValidationRequired',
  'optimizedKhronosValidationRequired',
  'firstSliceBudgetEvidenceRequired',
  'contactSheetRequired',
  'walkthroughRequiredForFinalDisposition',
]) {
  expect(contract.evidence?.[key] === true, `evidence.${key} must remain required`);
}
expect(contract.evidence?.walkthroughMayBeDeferredDuringLookdevIterations === false, 'final #440 evidence may no longer defer the 24-second walkthrough');

for (const key of ['productionAsset','productionManifestAllowed','productionWebglMayBegin','canonicalOfflineExhibitReplaced','offlineVisualApprovalPromoted']) {
  expect(contract.productionBoundary?.[key] === false, `productionBoundary.${key} must remain false`);
}
expect(contract.productionBoundary?.humanOwnerVisualDispositionRequired === true, 'human owner visual disposition must remain required');
expect(roadmap.includes('newly reproduced engineering defect on the then-current Product `main`'), 'owner-gated roadmap must retain engineering-defect entry condition');
expect(visualAcceptance.includes('roughness variation survives neutral light') && visualAcceptance.includes('bevels/normals read naturally'), 'visual acceptance must retain material-response requirements');
expect(budgetPolicy.schemaVersion === 1 && budgetPolicy.laneId === 'TLP-HALL-001' && budgetPolicy.phase === 'pushkinVerticalSlice', 'existing first-slice budget policy identity drifted');

expect(script.includes('visual remediation must remain candidate-only'), 'remediation script must fail closed on candidate-only scope');
expect(script.includes('visual remediation mutated mesh/transform data outside the explicit target set'), 'remediation script must fingerprint untouched mesh authority');
expect(script.includes('export_apply=True'), 'candidate GLB export must explicitly apply bounded exhibit-local modifiers');
expect(script.includes('export_tangents=True'), 'candidate GLB export must explicitly request tangent attributes');
expect(script.includes('Blender 4.5.12 glTF exporter does not expose export_tangents'), 'candidate exporter must fail closed if explicit tangent export is unavailable');
expect(script.includes('offlineVisualApprovalPromoted') && script.includes('humanOwnerVisualDispositionRequired'), 'candidate evidence must retain human-only visual disposition boundary');
expect(!script.includes('ARCH_') && !script.includes('EXHIBIT_alexander-pushkin'), 'remediation implementation must not contain direct architecture/proxy mutation targets');
expect(budgetScript.includes('optimized candidate changed embedded image bytes/dimensions'), 'candidate budget must fail closed if optimization changes embedded images');
expect(budgetScript.includes('candidate-first-slice-budget-measured-production-runtime-pending'), 'candidate budget must remain offline/non-production evidence');
expect(sequenceScript.includes('duration != 24') && sequenceScript.includes('render_samples != 8'), 'candidate walkthrough must lock canonical 24-second/8-sample evidence');
expect(sequenceScript.includes('offlineVisualApprovalPromoted'), 'candidate walkthrough must retain no-promotion boundary');

expect(workflow.includes('remediate-pushkin-visual.py'), 'dedicated workflow must execute the remediation candidate builder');
expect(workflow.includes('validate-pushkin-visual-remediation.mjs'), 'dedicated workflow must execute remediation validator');
expect(workflow.includes('blender-4.5.12-linux-x64.tar.xz') && workflow.includes('sha256sum -c'), 'dedicated workflow must pin and checksum Blender 4.5.12');
expect(workflow.includes('gltf-validator@2.0.0-dev.3.10') && workflow.includes('gltfpack@1.2.0'), 'candidate workflow must pin exact validation+optimization toolchain');
expect(workflow.includes('pushkin-lookdev-candidate-optimized.glb') && workflow.includes('-cc -kn -km -ke -kv -vpf'), 'candidate workflow must build preservation-safe optimized GLB');
expect((workflow.match(/validate-gltf\.mjs/g) ?? []).length >= 2, 'candidate workflow must Khronos-validate both raw and optimized GLBs');
expect(workflow.includes('build-pushkin-candidate-budget.mjs') && workflow.includes('first-slice-budget-report.json'), 'candidate workflow must measure existing first-slice budget contract');
expect(workflow.includes('render-pushkin-visual-sequence.py') && workflow.includes('ffprobe-sequence.json'), 'candidate workflow must render and probe final walkthrough');
expect(workflow.includes('contact-sheet.png') && workflow.includes('2448x564'), 'candidate workflow must retain audit-complete 5x2 contact sheet');
expect(workflow.includes('*.mp4') && workflow.includes('pushkin-lookdev-candidate-optimized.glb'), 'candidate artifact must include final video and optimized GLB');
expect(/timeout-minutes:\s*(9\d|[1-9]\d{2,})/.test(workflow), 'candidate workflow timeout must allow full still+walkthrough evidence cycle');

function pngDimensions(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 24 || bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null;
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

function parseGlbJson(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${path.basename(filePath)} is not a GLB`);
  if (bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error(`${path.basename(filePath)} GLB header is invalid`);
  let offset = 12;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) throw new Error(`${path.basename(filePath)} has a truncated chunk header`);
    const chunkLength = bytes.readUInt32LE(offset);
    const chunkType = bytes.readUInt32LE(offset + 4);
    offset += 8;
    if (offset + chunkLength > bytes.length) throw new Error(`${path.basename(filePath)} has a truncated chunk`);
    const chunk = bytes.subarray(offset, offset + chunkLength);
    offset += chunkLength;
    if (chunkType === 0x4e4f534a) return JSON.parse(chunk.toString('utf8').replace(/[\u0000\u0020]+$/u, ''));
  }
  throw new Error(`${path.basename(filePath)} has no JSON chunk`);
}

function tangentCoverage(filePath) {
  const gltf = parseGlbJson(filePath);
  const normalMappedMaterials = new Set();
  for (const [index, material] of (gltf.materials ?? []).entries()) {
    if (material?.normalTexture && Number.isInteger(material.normalTexture.index)) normalMappedMaterials.add(index);
  }
  let normalMappedPrimitives = 0;
  let primitivesWithTangents = 0;
  const missing = [];
  for (const [meshIndex, mesh] of (gltf.meshes ?? []).entries()) {
    for (const [primitiveIndex, primitive] of (mesh.primitives ?? []).entries()) {
      if (!Number.isInteger(primitive.material) || !normalMappedMaterials.has(primitive.material)) continue;
      normalMappedPrimitives += 1;
      if (Number.isInteger(primitive.attributes?.TANGENT)) {
        primitivesWithTangents += 1;
      } else {
        missing.push(`/meshes/${meshIndex}/primitives/${primitiveIndex}`);
      }
    }
  }
  return { normalMappedMaterials: normalMappedMaterials.size, normalMappedPrimitives, primitivesWithTangents, missing };
}

function forbiddenWarningCodes(report) {
  const forbidden = new Set(forbiddenKhronosWarnings);
  return (report.issues?.messages ?? []).filter((entry) => forbidden.has(entry.code)).map((entry) => entry.code);
}

const evidenceDirValue = process.env.HALL_PUSHKIN_VISUAL_REMEDIATION_EVIDENCE_DIR;
if (evidenceDirValue) {
  const evidenceDir = path.resolve(evidenceDirValue);
  const evidencePath = path.join(evidenceDir, 'visual-remediation-evidence.json');
  const rawPath = path.join(evidenceDir, 'pushkin-lookdev-candidate-raw.glb');
  const rawReportPath = path.join(evidenceDir, 'gltf-candidate-raw-report.json');
  const optimizedPath = path.join(evidenceDir, 'pushkin-lookdev-candidate-optimized.glb');
  const optimizedReportPath = path.join(evidenceDir, 'gltf-candidate-optimized-report.json');
  const budgetPath = path.join(evidenceDir, 'first-slice-budget-report.json');
  const contactSheetPath = path.join(evidenceDir, 'contact-sheet.png');
  const ffprobePath = path.join(evidenceDir, 'ffprobe-sequence.json');
  for (const required of [evidencePath, rawPath, rawReportPath, optimizedPath, optimizedReportPath, budgetPath, contactSheetPath, ffprobePath]) {
    expect(fs.existsSync(required), `generated remediation evidence missing: ${path.basename(required)}`);
  }

  let evidence = null;
  if (fs.existsSync(evidencePath)) {
    evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    expect(evidence.issue === 440 && evidence.status === 'lookdev-candidate-generated-awaiting-human-disposition', 'generated candidate status/issue drifted');
    expect(/^[0-9a-f]{40}$/.test(String(evidence.testedSha ?? '')), 'generated candidate must record exact 40-char tested SHA');
    expect(evidence.runtime?.versionTuple?.[0] === 4 && evidence.runtime?.versionTuple?.[1] === 5 && evidence.runtime?.versionTuple?.[2] === 12, 'generated candidate must use Blender 4.5.12');
    expect(evidence.source?.topology === 'H3' && evidence.source?.layoutFingerprint === contract.sourceAuthority.layoutFingerprint && evidence.source?.meshGeometryFingerprint === contract.sourceAuthority.meshGeometryFingerprint, 'generated candidate source authority drifted');
    expect(evidence.source?.approvedRig === 'R1' && evidence.source?.productionLightingAuthority === 'L0-minimal-runtime' && evidence.source?.surfaceUv === 'UV0', 'generated candidate R1/L0/UV0 authority drifted');
    expect(evidence.integrity?.explicitTargetCount === targets.length, 'generated candidate edge target count drifted');
    expect(evidence.integrity?.untouchedMeshFingerprintMatched === true && evidence.integrity?.untouchedMeshFingerprintBefore === evidence.integrity?.untouchedMeshFingerprintAfter, 'generated candidate mutated non-target meshes');
    expect(Number(evidence.integrity?.maximumScaleApplyBoundsDeltaMeters) <= 0.00001, 'candidate scale normalization changed world bounds');
    expect(evidence.transport?.tangentPortabilityIssue === 442 && evidence.transport?.explicitTangentsRequested === true, 'generated candidate did not record explicit tangent portability evidence');
    expect(Array.isArray(evidence.edgeTreatment) && evidence.edgeTreatment.length === targets.length, 'candidate must prove every bounded edge target');
    for (const item of evidence.edgeTreatment ?? []) {
      expect(targets.includes(item.object), `unexpected generated edge target ${item.object}`);
      expect(Number(item.widthMeters) >= Number(edge.minimumWidthMeters) && Number(item.widthMeters) <= Number(edge.maximumWidthMeters), `${item.object}: generated bevel width outside contract`);
      expect(Number(item.segments) === Number(edge.segments), `${item.object}: generated bevel segments drifted`);
    }
    expect(Array.isArray(evidence.materialResponse) && evidence.materialResponse.length === expectedMaterials.length, 'candidate must prove all bounded material responses');
    expect(Array.isArray(evidence.stills) && same(evidence.stills.map((entry) => entry.id), contract.evidence.stillIds), 'candidate still inventory drifted');
    for (const still of evidence.stills ?? []) {
      const absolute = path.join(evidenceDir, still.path ?? '');
      expect(fs.existsSync(absolute) && fs.statSync(absolute).size === Number(still.bytes) && Number(still.bytes) > 20_000, `${still.id}: candidate still missing/trivial`);
      if (fs.existsSync(absolute)) expect(sha256(absolute) === still.sha256, `${still.id}: candidate still hash drifted`);
    }
    expect(evidence.walkthrough?.status === 'rendered', 'final candidate must include rendered walkthrough evidence');
    expect(Number(evidence.walkthrough?.durationSeconds) === 24 && Number(evidence.walkthrough?.renderSamples) === 8, 'candidate walkthrough must be exact 24-second/8-sample evidence');
    expect(Number(evidence.walkthrough?.frameCount) > 500 && Number(evidence.walkthrough?.bytes) > 100_000, 'candidate walkthrough evidence is trivial/incomplete');
    const videoPath = path.join(evidenceDir, evidence.walkthrough?.path ?? '');
    expect(fs.existsSync(videoPath) && fs.statSync(videoPath).size === Number(evidence.walkthrough?.bytes), 'candidate walkthrough file bytes drifted');
    if (fs.existsSync(videoPath)) expect(sha256(videoPath) === evidence.walkthrough?.sha256, 'candidate walkthrough hash drifted');
    expect(evidence.budget?.status === 'measured-against-existing-first-slice-contract' && Number(evidence.budget?.rawBytes) > 0 && Number(evidence.budget?.optimizedBytes) > 0, 'candidate budget evidence missing/drifted');
    expect(evidence.productionBoundary?.productionAsset === false && evidence.productionBoundary?.productionManifestAllowed === false && evidence.productionBoundary?.productionWebglMayBegin === false && evidence.productionBoundary?.canonicalOfflineExhibitReplaced === false && evidence.productionBoundary?.offlineVisualApprovalPromoted === false && evidence.productionBoundary?.humanOwnerVisualDispositionRequired === true, 'generated candidate crossed production/approval boundary');
    for (const file of Object.values(evidence.files ?? {})) {
      const absolute = path.join(evidenceDir, file.path ?? '');
      expect(fs.existsSync(absolute) && fs.statSync(absolute).size === Number(file.bytes), `candidate file evidence missing/drifted: ${file.path}`);
      if (fs.existsSync(absolute)) expect(sha256(absolute) === file.sha256, `candidate file hash drifted: ${file.path}`);
    }
  }

  for (const glbPath of [rawPath, optimizedPath]) {
    if (fs.existsSync(glbPath)) {
      try {
        const coverage = tangentCoverage(glbPath);
        expect(coverage.normalMappedMaterials > 0 && coverage.normalMappedPrimitives > 0, `${path.basename(glbPath)} must contain substantive normal-mapped material usage`);
        expect(coverage.missing.length === 0 && coverage.primitivesWithTangents === coverage.normalMappedPrimitives, `${path.basename(glbPath)} normal-mapped primitives missing explicit TANGENT: ${coverage.missing.join(', ')}`);
      } catch (error) {
        expect(false, `${path.basename(glbPath)} tangent coverage parse failed: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  for (const reportPath of [rawReportPath, optimizedReportPath]) {
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      expect(Number(report.issues?.numErrors ?? 0) === 0, `${path.basename(reportPath)} must be Khronos error-free`);
      expect(forbiddenWarningCodes(report).length === 0, `${path.basename(reportPath)} contains forbidden tangent-space portability warning`);
      expect(report._hallToolchain?.gltfValidator?.version === '2.0.0-dev.3.10', `${path.basename(reportPath)} validator version drifted`);
      expect(report._hallToolchain?.gltfpack?.version === '1.2.0', `${path.basename(reportPath)} gltfpack version drifted`);
    }
  }

  if (fs.existsSync(budgetPath)) {
    const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
    expect(budget.schemaVersion === 1 && budget.issue === 440 && budget.phase === 'pushkinVisualRemediationCandidate', 'candidate first-slice budget report identity drifted');
    expect(budget.status === 'candidate-first-slice-budget-measured-production-runtime-pending', 'candidate budget must remain offline/non-production evidence');
    expect(Number(budget.delivery?.rawGlb?.bytes) > 0 && Number(budget.delivery?.optimizedGlb?.bytes) > 0, 'candidate budget must measure raw and optimized transfer bytes');
    expect(Number(budget.scene?.exhibitTriangles) > 0 && Number(budget.scene?.drawMaterialCount) > 0, 'candidate budget must measure triangles and draw materials');
    expect(Number(budget.scene?.embeddedDocumentaryTextureCount) === 2 && Number(budget.scene?.boundedLookdevTextureCount) === 10, 'candidate budget texture inventory drifted');
    expect(Number(budget.scene?.conservativeRgba8DecodedTextureResidentBytes) > 0, 'candidate budget must measure conservative decoded texture residency');
    expect(budget.productionBoundary?.productionAsset === false && budget.productionBoundary?.approvedBudgetLimit === false && budget.productionBoundary?.productionManifestAllowed === false && budget.productionBoundary?.productionWebglMayBegin === false && budget.productionBoundary?.offlineVisualApprovalPromoted === false, 'candidate budget crossed production/approval boundary');
  }

  if (fs.existsSync(contactSheetPath)) {
    expect(same(pngDimensions(contactSheetPath), [2448, 564]), 'candidate contact sheet must be exact 2448x564 5x2 evidence');
  }

  if (fs.existsSync(ffprobePath) && evidence) {
    const ffprobe = JSON.parse(fs.readFileSync(ffprobePath, 'utf8'));
    const duration = Number(ffprobe.format?.duration ?? 0);
    const size = Number(ffprobe.format?.size ?? 0);
    const stream = (ffprobe.streams ?? [])[0] ?? {};
    expect(duration >= 23.9 && duration <= 24.2, `candidate ffprobe duration must be ~24s, got ${duration}`);
    expect(size === Number(evidence.walkthrough?.bytes), 'candidate ffprobe size must match semantic walkthrough evidence');
    expect(stream.codec_name === 'h264' && Number(stream.width) > 0 && Number(stream.height) > 0, 'candidate walkthrough must be non-trivial H264 video');
  }
}

if (failures.length) {
  console.error('Pushkin visual remediation validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Pushkin visual remediation validation passed.');
