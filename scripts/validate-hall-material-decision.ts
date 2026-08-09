import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const contractPath = 'docs/hall-v3/hall-v3-contract.json';
const spikePath = 'docs/hall-v3/material-spike.json';
const decisionPath = 'docs/hall-v3/material-decision.json';
const visualPreparerPath = 'scripts/hall-material/prepare-material-visual-evidence.py';
const browserWitnessPath = 'scripts/hall-material/browser-witness.mjs';
const visualValidatorPath = 'scripts/hall-material/validate-visual-evidence.mjs';

const contract = JSON.parse(read(contractPath)) as any;
const spike = JSON.parse(read(spikePath)) as any;
const decision = JSON.parse(read(decisionPath)) as any;
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string,string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const hallWorkflow = read('.github/workflows/hall-greybox-tooling.yml');
const hallPage = read('src/pages/HallPage.tsx');

function gitBlobSha(relative: string) {
  const bytes = fs.readFileSync(path.join(root, relative));
  const header = Buffer.from(`blob ${bytes.length}\0`, 'utf8');
  return crypto.createHash('sha1').update(Buffer.concat([header, bytes])).digest('hex');
}

expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001', 'Hall contract identity must remain exact');
expect(contract.phase === 'materialLightingExportSpike', 'material decision must remain inside materialLightingExportSpike until separate gate promotion');
expect(contract.gates?.materialLightingExportSpike === 'active', 'materialLightingExportSpike must remain active during decision transaction');
for (const gate of ['pushkinVerticalSlice','offlineVisualApproval','webVerticalSlice','fullMuseumScaleOut']) {
  expect(contract.gates?.[gate] === 'blocked', `${gate} must remain blocked until separate gate promotion`);
}
expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain a placeholder during material decision');
expect(contract.productionRoute?.allowLegacyHallImports === false, 'material decision must not reactivate Hall v2');
expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'material decision must not activate production Three/R3F runtime');
expect(contract.productionRoute?.allowUnapprovedConceptArt === false, 'material decision must not activate unapproved concept art');
expect(contract.sourceAuthority?.materialSpike === spikePath, 'material spike evidence source authority must remain registered');
expect(contract.sourceAuthority?.materialDecision === decisionPath, 'material decision authority must be registered separately');

// The evidence source stays authoring-only. Selection belongs to material-decision.json.
expect(spike.schemaVersion === 1 && spike.laneId === 'TLP-HALL-001', 'material spike identity must remain exact');
expect(spike.phase === 'materialLightingExportSpike' && spike.status === 'authoring', 'material spike must remain the merged authoring/evidence record');
for (const value of Object.values(spike.decision ?? {})) {
  expect(value === null || value === false, 'material spike evidence source must not be rewritten to masquerade as decision authority');
}
expect(gitBlobSha(spikePath) === decision.evidence?.materialSpikeBlob, 'material decision must freeze the exact merged material-spike Git blob');
expect(gitBlobSha(visualPreparerPath) === decision.evidence?.visualPreparerBlob, 'material decision must freeze exact visual-preparer guard blob');
expect(gitBlobSha(browserWitnessPath) === decision.evidence?.browserWitnessBlob, 'material decision must freeze exact browser-witness guard blob');
expect(gitBlobSha(visualValidatorPath) === decision.evidence?.visualEvidenceValidatorBlob, 'material decision must freeze exact visual-evidence validator blob');

expect(decision.schemaVersion === 1 && decision.laneId === 'TLP-HALL-001' && decision.productIssue === 369, 'material decision identity must remain exact');
expect(decision.phase === 'materialLightingExportSpike' && decision.status === 'selected', 'material decision must be selected while Gate 4 remains active');
expect(decision.evidence?.testedHead === '600f28efd2aa59b6d31086b64aeb42da7b03a48e', 'decision must cite accepted exact tested material head');
expect(decision.evidence?.resultingMain === '0ce2e17f6eaa8b1af9c87257b20c9967616b8e4b', 'decision must cite resulting merged material-evidence main');
expect(decision.evidence?.hallRunId === 31307136214, 'decision must cite accepted Hall run');
expect(decision.evidence?.artifactId === 9036351234, 'decision must cite accepted material artifact ID');
expect(decision.evidence?.artifactDigest === 'sha256:dc33af96ba747175794f9f31775c534c224a35645d9943302424459e0bf8cc95', 'decision must cite accepted material artifact digest');
expect(decision.evidence?.blenderVersion === '4.5.12 LTS', 'decision must preserve Blender version');
expect(decision.evidence?.selectedLayoutFingerprint === spike.source?.layoutFingerprint, 'decision must preserve H3 layout fingerprint');
expect(decision.evidence?.meshGeometryFingerprint === spike.source?.meshGeometryFingerprint, 'decision must preserve H3 mesh fingerprint');
expect(decision.evidence?.rawGlb?.bytes === 200672 && decision.evidence?.rawGlb?.sha256 === '10da27398d69397b77298e549af0b399eb2edf53ba430bfbb81a7937082fca7e', 'decision must freeze accepted raw GLB identity');
expect(decision.evidence?.optimizedGlb?.bytes === 141896 && decision.evidence?.optimizedGlb?.sha256 === '810865870e5c240af681eab5aa8765a2fc6de44c69c823c8971a097a973ce089', 'decision must freeze accepted optimized GLB identity');
expect(decision.evidence?.khronos?.rawErrors === 0 && decision.evidence?.khronos?.rawWarnings === 0 && decision.evidence?.khronos?.optimizedErrors === 0 && decision.evidence?.khronos?.optimizedWarnings === 0, 'decision must preserve zero-error/warning Khronos evidence');
expect(decision.evidence?.khronos?.sourceEvidenceIdentityMatched === true, 'decision must preserve final raw-GLB source-evidence identity match');
expect(Number(decision.evidence?.rawOptimizedVisualEquivalence?.meanAbsoluteChannelDifference) <= Number(spike.browserWitness?.optimizationVisualEquivalence?.maximumMeanAbsoluteChannelDifference), 'accepted raw/optimized mean pixel delta must remain inside spike limit');
expect(Number(decision.evidence?.rawOptimizedVisualEquivalence?.maximumChannelDifference) <= Number(spike.browserWitness?.optimizationVisualEquivalence?.maximumChannelDifference), 'accepted raw/optimized max pixel delta must remain inside spike limit');
expect(Number(decision.evidence?.rawOptimizedVisualEquivalence?.changedSampleRatioAbove2) <= Number(spike.browserWitness?.optimizationVisualEquivalence?.maximumChangedSampleRatioAbove2), 'accepted raw/optimized changed-sample ratio must remain inside spike limit');

const falseGreen = decision.evidence?.rejectedFalseGreenArtifacts ?? [];
expect(falseGreen.length === 2, 'decision must retain both manually rejected machine-green artifacts');
expect(falseGreen[0]?.artifactId === 9036028517 && String(falseGreen[0]?.reason ?? '').includes('wrong local wall axis'), 'first false-green artifact must preserve framing rejection');
expect(falseGreen[1]?.artifactId === 9036170327 && String(falseGreen[1]?.reason ?? '').includes('repeated-texture seam'), 'second false-green artifact must preserve repeat-seam rejection');

const l0 = (spike.lightingCandidates ?? []).find((candidate: any) => candidate.id === 'L0-minimal-runtime');
const l1 = (spike.lightingCandidates ?? []).find((candidate: any) => candidate.id === 'L1-external-lightmap');
expect(Boolean(l0) && Boolean(l1), 'material evidence must retain L0 and L1 candidates');
expect(decision.lightingDecision?.selected === 'L0-minimal-runtime', 'L0 must be selected as Pushkin vertical-slice lighting baseline');
expect(decision.lightingDecision?.scope === 'Pushkin vertical-slice baseline', 'lighting selection scope must remain bounded to the next slice');
expect(decision.lightingDecision?.externalLightmapRequired === false, 'selected baseline may not require external lightmap');
expect(decision.lightingDecision?.realtimeShadowLights === 0 && l0?.realtimeShadowLights === 0, 'selected L0 baseline must retain zero realtime shadow lights in decision evidence');
expect(l0?.externalLightmap === false, 'selected L0 evidence candidate must not use external lightmap');
expect(decision.lightingDecision?.selectedEvidence?.disposition === 'eligible-for-human-review', 'selected L0 evidence must remain reviewable, not falsely called final approval');
expect(Number(decision.lightingDecision?.selectedEvidence?.meanDisplayLuma) >= Number(spike.visualEvidence?.readabilityReject?.lumaThreshold), 'selected L0 mean luma must clear the spike darkness threshold');
const rejectedL1 = (decision.lightingDecision?.rejected ?? []).find((item: any) => item.id === 'L1-external-lightmap');
expect(Boolean(rejectedL1), 'current L1 bake must be explicitly rejected');
expect(rejectedL1?.disposition === 'reject-current-bake', 'current L1 bake disposition must remain reject-current-bake');
expect(l1?.externalLightmap === true, 'rejected L1 evidence candidate must remain the external-lightmap candidate');
expect(Number(rejectedL1?.meanDisplayLuma) < Number(spike.visualEvidence?.readabilityReject?.lumaThreshold), 'rejected L1 mean luma must remain below the darkness threshold');
expect(rejectedL1?.incrementalLightmapResidentBytes === 393216, 'rejected L1 must preserve measured incremental GPU lightmap residency');

expect(decision.uvDecision?.surfaceMaterialUv === 'UV0' && decision.uvDecision?.surfaceUvChannel === 0, 'surface material strategy must select UV0');
expect(decision.uvDecision?.surfaceScaleModel === 'metre-scaled-box-projection', 'surface UV scale model must remain explicit');
expect(Number(decision.uvDecision?.surfaceUvCubeSizeMeters) === Number(spike.visualEvidence?.surfaceUvCubeSizeMeters), 'surface UV metre scale must equal accepted visual evidence');
expect(decision.uvDecision?.staticBakeUv === 'UV1' && decision.uvDecision?.staticBakeUvChannel === 1, 'static-bake reserve must remain UV1');
expect(decision.uvDecision?.staticBakeDisposition === 'reserved-not-required' && decision.uvDecision?.mandatoryLightmap === false, 'UV1 may remain reserved but lightmap cannot become mandatory');
expect(spike.materialProof?.baseColor?.uvChannel === 0 && spike.materialProof?.normal?.uvChannel === 0 && spike.materialProof?.roughness?.uvChannel === 0, 'surface material evidence must still use UV0');
expect(spike.materialProof?.lightmaps?.uvChannel === 1, 'lightmap evidence must still use separate UV1');

const selectedOptimizer = decision.optimizerDecision ?? {};
expect(selectedOptimizer.selected === 'gltfpack-preservation-safe', 'decision must name the proved preservation-safe optimizer path');
expect(selectedOptimizer.package === spike.exportToolchain?.optimizer?.package && selectedOptimizer.version === spike.exportToolchain?.optimizer?.version, 'optimizer package/version must match evidence source');
expect(JSON.stringify(selectedOptimizer.args ?? []) === JSON.stringify([...(spike.exportToolchain?.optimizer?.args ?? []), ...(spike.exportToolchain?.optimizer?.additionalPreservationArgs ?? [])]), 'optimizer args must exactly combine the proved base and preservation flags');
expect(selectedOptimizer.khronosBeforeOptimization === true && selectedOptimizer.khronosAfterOptimization === true, 'decision must require Khronos validation before and after optimization');
expect(JSON.stringify(selectedOptimizer.requiredPreservation ?? []) === JSON.stringify(spike.exportToolchain?.requiredPreservation ?? []), 'decision must preserve the exact semantic-preservation set');

const texture = decision.texturePolicyDecision ?? {};
expect(texture.baseColor?.semantic === 'color' && texture.baseColor?.colorSpace === spike.materialProof?.baseColor?.colorSpace && texture.baseColor?.uv === 'UV0', 'baseColor decision must preserve color/sRGB/UV0 ownership');
expect(texture.normal?.semantic === 'data' && texture.normal?.colorSpace === spike.materialProof?.normal?.colorSpace && texture.normal?.uv === 'UV0' && texture.normal?.requiresTangents === true, 'normal decision must preserve data/non-color/UV0/tangent ownership');
expect(texture.roughness?.semantic === 'data' && texture.roughness?.colorSpace === spike.materialProof?.roughness?.colorSpace && texture.roughness?.uv === 'UV0', 'roughness decision must preserve data/non-color/UV0 ownership');
expect(texture.stoneMetallicFactor === 0 && texture.stoneMetallicFactor === spike.materialProof?.stoneMetallicFactor, 'stone must remain non-metallic');
expect(texture.lightmapIfReintroduced?.semantic === 'linear-illuminance' && texture.lightmapIfReintroduced?.colorSpace === spike.materialProof?.lightmaps?.colorSpace && texture.lightmapIfReintroduced?.uv === 'UV1', 'any future lightmap must preserve linear UV1 semantics');
expect(texture.qaProofMaps?.encoding === 'PNG-8bit' && texture.qaProofMaps?.resolution === 256 && texture.qaProofMaps?.productionAssets === false, 'QA proof maps must remain explicit non-production evidence');
expect(texture.productionTextureEncoding === 'deferred-to-pushkin-vertical-slice', 'production texture encoding must remain honestly deferred');
expect(texture.ktx2 === 'deferred-not-default', 'KTX2 may not be made default without vertical-slice evidence');

expect(Number(decision.materialResponseEvidence?.normalClose?.meanAbsoluteChannelDifference) >= Number(spike.visualEvidence?.normalResponse?.minimumMeanAbsoluteChannelDifference), 'selected evidence must retain measurable close normal response');
expect(Number(decision.materialResponseEvidence?.normalClose?.changedSampleRatioAbove2) >= Number(spike.visualEvidence?.normalResponse?.minimumChangedSampleRatioAbove2), 'selected evidence must retain sufficient close normal changed-sample ratio');
expect(Number(decision.materialResponseEvidence?.roughnessMedium?.meanAbsoluteChannelDifference) >= Number(spike.visualEvidence?.roughnessResponse?.minimumMeanAbsoluteChannelDifference), 'selected evidence must retain measurable medium roughness response');
expect(Number(decision.materialResponseEvidence?.roughnessMedium?.changedSampleRatioAbove2) >= Number(spike.visualEvidence?.roughnessResponse?.minimumChangedSampleRatioAbove2), 'selected evidence must retain sufficient medium roughness changed-sample ratio');
expect(decision.materialResponseEvidence?.lookdevBevelMeters === spike.visualEvidence?.lookdevBevelMeters && decision.materialResponseEvidence?.lookdevBevelSegments === spike.visualEvidence?.lookdevBevelSegments, 'decision must preserve accepted lookdev bevel evidence');
expect(decision.materialResponseEvidence?.repeatTexturePeriodicityTolerance === 1e-9, 'decision must preserve strict repeat-texture periodicity tolerance');

expect(decision.frozenAfterDecision?.topology === 'H3' && decision.frozenAfterDecision?.approvedRig === 'R1', 'H3/R1 must remain frozen after material decision');
expect(decision.frozenAfterDecision?.geometryMayChange === false, 'material decision cannot authorize H3 geometry changes');
expect(decision.frozenAfterDecision?.cameraMayChangeWithoutNewCameraApproval === false, 'material decision cannot authorize R1 drift');
expect(decision.frozenAfterDecision?.productionHallMayActivate === false, 'material decision cannot activate production Hall runtime');
expect(decision.frozenAfterDecision?.fullHallLookdevMayStart === false, 'material decision cannot start full-Hall lookdev');
expect(decision.frozenAfterDecision?.currentL1BakeMayBeReusedAsApproved === false, 'rejected L1 bake may not silently become approved later');

expect(decision.gateBoundary?.materialContractSelected === true, 'decision must mark the material contract selected');
expect(decision.gateBoundary?.pushkinVerticalSliceActive === false, 'decision transaction must not activate Pushkin vertical slice');
expect(decision.gateBoundary?.gatePromotionMayProceed === true, 'selected material contract may authorize a later promotion transaction');
expect(decision.gateBoundary?.decisionTransactionMayPromoteGate === false, 'decision transaction itself may not promote the gate');
expect(decision.gateBoundary?.nextTransaction === 'materialLightingExportSpike-to-pushkinVerticalSlice-gate-promotion', 'decision must name the separate next gate-promotion transaction');

for (const required of [
  'final-production-texture-encoding',
  'final-pushkin-portrait-and-document-assets',
  'full-hall-lookdev',
  'full-hall-static-lighting',
  'production-webgl-runtime',
  'offline-visual-approval',
  'web-vertical-slice-approval',
  'full-museum-scale-out',
]) {
  expect((decision.nonDecisions ?? []).includes(required), `material decision must preserve non-decision: ${required}`);
}
expect(!hallPage.includes('material-decision') && !hallPage.includes('material-spike'), 'production HallPage must not load decision/spike authority');

const scripts = packageJson.scripts ?? {};
expect(scripts['validate:hall-material-decision'] === 'tsx scripts/validate-hall-material-decision.ts', 'package scripts must expose material decision validator');
expect((scripts.check ?? '').includes('validate:hall-material-decision'), 'normal check must run material decision validator');
expect(ci.includes('npm run validate:hall-material-decision'), 'primary CI must run material decision validator explicitly');
expect(projectContracts.includes('npm run validate:hall-material-decision'), 'Project contracts must run material decision validator explicitly');
expect(hallWorkflow.includes('npm run validate:hall-material-decision'), 'Hall Blender workflow must run material decision validator explicitly');
expect(hallWorkflow.includes("'docs/hall-v3/material-decision.json'") && hallWorkflow.includes("'scripts/validate-hall-material-decision.ts'"), 'Hall workflow must trigger on material decision authority changes');

if (failures.length) {
  console.error('Hall material decision validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall material decision validation passed.');
console.log(`Selected lighting baseline: ${decision.lightingDecision.selected}; current L1: ${rejectedL1.disposition}.`);
console.log(`UV: ${decision.uvDecision.surfaceMaterialUv} surface / ${decision.uvDecision.staticBakeUv} ${decision.uvDecision.staticBakeDisposition}.`);
console.log(`Production texture encoding: ${decision.texturePolicyDecision.productionTextureEncoding}.`);
