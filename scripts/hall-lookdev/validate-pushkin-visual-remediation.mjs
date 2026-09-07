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
const roadmapPath = 'docs/hall-v3/OWNER_GATED_ROADMAP.md';
const visualAcceptancePath = 'docs/hall-v3/VISUAL_ACCEPTANCE.md';
const scriptPath = 'scripts/hall-lookdev/remediate-pushkin-visual.py';
const workflowPath = '.github/workflows/hall-pushkin-visual-remediation.yml';

for (const required of [contractPath, canonicalPath, roadmapPath, visualAcceptancePath, scriptPath]) {
  expect(fs.existsSync(path.join(root, required)), `missing visual-remediation authority: ${required}`);
}

const contract = JSON.parse(read(contractPath));
const canonical = JSON.parse(read(canonicalPath));
const roadmap = read(roadmapPath);
const visualAcceptance = read(visualAcceptancePath);
const script = read(scriptPath);

expect(contract.schemaVersion === 1 && contract.issue === 440, 'visual-remediation contract must belong only to issue #440');
expect(contract.status === 'lookdev-candidate-authoring', 'visual-remediation contract must remain candidate authoring');
expect(contract.sourceAuthority?.canonicalExhibitContract === canonicalPath, 'candidate must derive from canonical offline exhibit contract');
expect(contract.sourceAuthority?.topology === 'H3', 'candidate must retain H3 topology authority');
expect(contract.sourceAuthority?.layoutFingerprint === canonical.source?.layoutFingerprint, 'candidate H3 layout fingerprint must equal canonical exhibit authority');
expect(contract.sourceAuthority?.meshGeometryFingerprint === canonical.source?.meshGeometryFingerprint, 'candidate H3 mesh fingerprint must equal canonical exhibit authority');
expect(contract.sourceAuthority?.approvedRig === canonical.source?.approvedRig && contract.sourceAuthority?.approvedRig === 'R1', 'candidate must retain R1 camera authority');
expect(contract.sourceAuthority?.productionLightingAuthority === canonical.source?.lightingBaseline && contract.sourceAuthority?.productionLightingAuthority === 'L0-minimal-runtime', 'candidate must retain L0 production lighting authority');
expect(contract.sourceAuthority?.surfaceUv === canonical.source?.surfaceUv && contract.sourceAuthority?.surfaceUv === 'UV0', 'candidate must retain UV0 surface authority');

for (const key of [
  'candidateOnly',
  'canonicalGeneratorUnchanged',
]) {
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

expect(contract.evidence?.renderEngine === 'BLENDER_EEVEE_NEXT', 'candidate evidence must use Eevee Next');
expect((contract.evidence?.stillIds ?? []).length === 10, 'candidate must reproduce all ten canonical fixed still views');
expect(same(contract.evidence?.stillIds, (canonical.evidence?.stills ?? []).map((entry) => entry.id)), 'candidate still IDs must exactly mirror canonical evidence order');
expect(contract.evidence?.candidateRawGlbRequired === true && contract.evidence?.khronosValidationRequired === true, 'candidate must retain raw GLB + Khronos proof');
expect(contract.evidence?.walkthroughRequiredForFinalDisposition === true && contract.evidence?.walkthroughMayBeDeferredDuringLookdevIterations === true, 'lookdev may defer walkthrough only before final disposition');

for (const key of ['productionAsset','productionManifestAllowed','productionWebglMayBegin','canonicalOfflineExhibitReplaced','offlineVisualApprovalPromoted']) {
  expect(contract.productionBoundary?.[key] === false, `productionBoundary.${key} must remain false`);
}
expect(contract.productionBoundary?.humanOwnerVisualDispositionRequired === true, 'human owner visual disposition must remain required');
expect(roadmap.includes('newly reproduced engineering defect on the then-current Product `main`'), 'owner-gated roadmap must retain engineering-defect entry condition');
expect(visualAcceptance.includes('roughness variation survives neutral light') && visualAcceptance.includes('bevels/normals read naturally'), 'visual acceptance must retain material-response requirements');

expect(script.includes('visual remediation must remain candidate-only'), 'remediation script must fail closed on candidate-only scope');
expect(script.includes('visual remediation mutated mesh/transform data outside the explicit target set'), 'remediation script must fingerprint untouched mesh authority');
expect(script.includes('export_apply=True'), 'candidate GLB export must explicitly apply bounded exhibit-local modifiers');
expect(script.includes('offlineVisualApprovalPromoted') && script.includes('humanOwnerVisualDispositionRequired'), 'candidate evidence must retain human-only visual disposition boundary');
expect(!script.includes('ARCH_') && !script.includes('EXHIBIT_alexander-pushkin'), 'remediation implementation must not contain direct architecture/proxy mutation targets');

if (fs.existsSync(path.join(root, workflowPath))) {
  const workflow = read(workflowPath);
  expect(workflow.includes('remediate-pushkin-visual.py'), 'dedicated workflow must execute the remediation candidate builder');
  expect(workflow.includes('validate-pushkin-visual-remediation.mjs'), 'dedicated workflow must execute remediation validator');
  expect(workflow.includes('blender-4.5.12-linux-x64.tar.xz') && workflow.includes('sha256sum -c'), 'dedicated workflow must pin and checksum Blender 4.5.12');
  expect(workflow.includes('gltf-validator@2.0.0-dev.3.10'), 'candidate workflow must pin Khronos glTF validator');
  expect(workflow.includes('visual-remediation-evidence.json') && workflow.includes('contact-sheet.png'), 'candidate workflow must upload semantic evidence and contact sheet');
}

const evidenceDirValue = process.env.HALL_PUSHKIN_VISUAL_REMEDIATION_EVIDENCE_DIR;
if (evidenceDirValue) {
  const evidenceDir = path.resolve(evidenceDirValue);
  const evidencePath = path.join(evidenceDir, 'visual-remediation-evidence.json');
  const gltfPath = path.join(evidenceDir, 'gltf-candidate-report.json');
  const contactSheetPath = path.join(evidenceDir, 'contact-sheet.png');
  for (const required of [evidencePath, gltfPath, contactSheetPath]) {
    expect(fs.existsSync(required), `generated remediation evidence missing: ${path.basename(required)}`);
  }
  if (fs.existsSync(evidencePath)) {
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    expect(evidence.issue === 440 && evidence.status === 'lookdev-candidate-generated-awaiting-human-disposition', 'generated candidate status/issue drifted');
    expect(evidence.runtime?.versionTuple?.[0] === 4 && evidence.runtime?.versionTuple?.[1] === 5 && evidence.runtime?.versionTuple?.[2] === 12, 'generated candidate must use Blender 4.5.12');
    expect(evidence.source?.topology === 'H3' && evidence.source?.layoutFingerprint === contract.sourceAuthority.layoutFingerprint && evidence.source?.meshGeometryFingerprint === contract.sourceAuthority.meshGeometryFingerprint, 'generated candidate source authority drifted');
    expect(evidence.source?.approvedRig === 'R1' && evidence.source?.productionLightingAuthority === 'L0-minimal-runtime' && evidence.source?.surfaceUv === 'UV0', 'generated candidate R1/L0/UV0 authority drifted');
    expect(evidence.integrity?.explicitTargetCount === targets.length, 'generated candidate edge target count drifted');
    expect(evidence.integrity?.untouchedMeshFingerprintMatched === true && evidence.integrity?.untouchedMeshFingerprintBefore === evidence.integrity?.untouchedMeshFingerprintAfter, 'generated candidate mutated non-target meshes');
    expect(Number(evidence.integrity?.maximumScaleApplyBoundsDeltaMeters) <= 0.00001, 'candidate scale normalization changed world bounds');
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
    expect(evidence.walkthrough?.status === 'deferred-during-lookdev-iteration' && evidence.walkthrough?.requiredForFinalDisposition === true, 'candidate may defer walkthrough only during iteration');
    expect(evidence.productionBoundary?.productionAsset === false && evidence.productionBoundary?.productionManifestAllowed === false && evidence.productionBoundary?.productionWebglMayBegin === false && evidence.productionBoundary?.canonicalOfflineExhibitReplaced === false && evidence.productionBoundary?.offlineVisualApprovalPromoted === false && evidence.productionBoundary?.humanOwnerVisualDispositionRequired === true, 'generated candidate crossed production/approval boundary');
    for (const file of Object.values(evidence.files ?? {})) {
      const absolute = path.join(evidenceDir, file.path ?? '');
      expect(fs.existsSync(absolute) && fs.statSync(absolute).size === Number(file.bytes), `candidate file evidence missing/drifted: ${file.path}`);
      if (fs.existsSync(absolute)) expect(sha256(absolute) === file.sha256, `candidate file hash drifted: ${file.path}`);
    }
  }
  if (fs.existsSync(gltfPath)) {
    const report = JSON.parse(fs.readFileSync(gltfPath, 'utf8'));
    expect(Number(report.issues?.numErrors ?? 0) === 0, 'candidate raw GLB must be Khronos error-free');
  }
}

if (failures.length) {
  console.error('Pushkin visual remediation validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Pushkin visual remediation validation passed.');
