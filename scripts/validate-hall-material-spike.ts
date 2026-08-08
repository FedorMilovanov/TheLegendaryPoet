import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = (relative: string) => JSON.parse(read(relative)) as any;
const exists = (relative: string) => fs.existsSync(path.join(root, relative));
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const contractPath = 'docs/hall-v3/hall-v3-contract.json';
const configPath = 'docs/hall-v3/material-lighting-export-spike.json';
const layoutsPath = 'docs/hall-v3/greybox-layouts.json';
const decisionPath = 'docs/hall-v3/camera-decision.json';
const promotionPath = 'docs/hall-v3/camera-gate-promotion.json';
const validatorPath = 'scripts/validate-hall-material-spike.ts';
const generatorPath = 'scripts/hall-material-spike/generate-bay.py';
const gltfValidatorPath = 'scripts/hall-material-spike/validate-gltf.mjs';
const inspectorPath = 'scripts/hall-material-spike/inspect-glb.mjs';
const finalizerPath = 'scripts/hall-material-spike/finalize-evidence.mjs';
const viewerPath = 'qa/hall-material-spike/viewer.html';
const browserWitnessPath = 'qa/hall-material-spike/browser-witness.mjs';

const contract = readJson(contractPath);
const config = readJson(configPath);
const layouts = readJson(layoutsPath);
const decision = readJson(decisionPath);
const promotion = readJson(promotionPath);
const packageJson = readJson('package.json') as { scripts?: Record<string,string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const hallWorkflow = read('.github/workflows/hall-greybox-tooling.yml');
const currentState = read('docs/CURRENT_STATE.md');
const hallReadme = read('docs/hall-v3/README.md');

const EXPECTED_LAYOUT = '5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65';
const EXPECTED_SOURCE_GEOMETRY = 'b3de770858a423305db8fcab15b405414e66b3d3de93ab1deaa5b3b35b418777';
const EXPECTED_LAYOUTS_BLOB = 'b3def316d855a6539ffd280217ed63e22c6855d9';
const EXPECTED_CAMERA_DECISION_BLOB = 'fedf0c0d269822655a9db15b95914222c815769f';
const EXPECTED_MESHOPT_COMMIT = '9d9890c73011d75920af614485296d1e03e95448';
const EXPECTED_VALIDATOR_COMMIT = 'bcd52cc4ba5f333b2999a58f67cc05ddf28b4fb1';
const EXPECTED_VALIDATOR_RELEASE = 'gltf_validator-2.0.0-dev.3.10-linux64.tar.xz';
const APPROVED_R1 = {
  variableWitness: 'pushkinViewing',
  position: [8.0, 2.5, 1.60],
  target: [11.15, 5.45, 1.95],
  nextDestination: [11.15, 5.45, 1.95],
  lensMm: 28,
};
const CANDIDATES = ['L0_MINIMAL_REALTIME','L1_EXTERNAL_LIGHTMAP_UV1'];

expect(contract.phase === 'materialLightingExportSpike', 'Hall phase must remain materialLightingExportSpike during candidate authoring');
expect(contract.gates?.materialLightingExportSpike === 'active', 'materialLightingExportSpike must remain active');
for (const gate of ['pushkinVerticalSlice','offlineVisualApproval','webVerticalSlice','fullMuseumScaleOut']) {
  expect(contract.gates?.[gate] === 'blocked', `later Hall gate must remain blocked: ${gate}`);
}
expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain placeholder during the spike');
expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'production /hall must not activate Three/R3F during the spike');
expect(contract.sourceAuthority?.materialLightingExportSpike === configPath, 'Hall contract must register material spike source authority');

expect(config.schemaVersion === 1 && config.laneId === 'TLP-HALL-001' && config.productIssue === 369, 'material spike config identity must be exact');
expect(config.phase === 'materialLightingExportSpike' && config.status === 'candidate-authoring', 'material spike config must remain candidate-authoring');
expect(config.selectedStrategy === null, 'candidate-authoring wave must not preselect a material/light strategy');
expect(config.frozenAuthority?.topology === 'H3', 'material spike may only use H3');
expect(config.frozenAuthority?.layoutFingerprint === EXPECTED_LAYOUT, 'material spike H3 layout fingerprint drifted');
expect(config.frozenAuthority?.meshGeometryFingerprint === EXPECTED_SOURCE_GEOMETRY, 'material spike H3 source geometry fingerprint drifted');
expect(config.frozenAuthority?.greyboxLayoutsBlob === EXPECTED_LAYOUTS_BLOB, 'material spike must pin frozen layout blob');
expect(config.frozenAuthority?.cameraDecisionBlob === EXPECTED_CAMERA_DECISION_BLOB, 'material spike must pin frozen camera decision blob');
expect(config.frozenAuthority?.cameraRig === 'R1' && same(config.frozenAuthority?.camera, APPROVED_R1), 'material spike must use exact approved R1 witness');
expect(decision.selectedTopology === 'H3' && decision.selectedRig === 'R1', 'camera decision authority must remain H3/R1');
expect(same(decision.approvedCamera, { rigId: 'R1', ...APPROVED_R1 }), 'camera decision coordinates/lens drifted');
expect(promotion.sourceDecision?.selectedTopology === 'H3' && promotion.sourceDecision?.selectedRig === 'R1', 'camera promotion must remain H3/R1');

const h3 = (layouts.candidates ?? []).find((item:any)=>item.id === 'H3');
expect(Boolean(h3), 'frozen H3 layout must exist');
if (h3) {
  expect(h3.ceilingZones.some((zone:any)=>same(zone, config.representativeBay?.ceilingZone)), 'representative ceiling zone must be literal H3 source');
  for (const segment of config.representativeBay?.wallSegments ?? []) {
    expect(h3.walls.some((wall:any)=>same(wall,segment)), `representative wall must be literal H3 source: ${JSON.stringify(segment)}`);
  }
  expect(same(h3.pushkin?.anchor, config.representativeBay?.pushkinAnchor), 'Pushkin proxy anchor must remain literal H3 source');
  expect(same(h3.pushkin?.documentCases, config.representativeBay?.documentCases), 'document proxy geometry must remain literal H3 source');
}

expect(config.representativeBay?.documentaryAssets === 'neutral-proxies-only', 'spike must use neutral documentary proxies only');
expect(config.representativeBay?.rightsClearedMediaRequired === false, 'spike must not require documentary media');
expect(config.materialContract?.baseColor?.sourceColorSpace === 'sRGB' && config.materialContract?.baseColor?.threeColorSpace === 'SRGBColorSpace', 'baseColor color-space contract must be sRGB');
expect(config.materialContract?.emissive?.sourceColorSpace === 'sRGB' && config.materialContract?.emissive?.threeColorSpace === 'SRGBColorSpace', 'emissive color-space contract must be sRGB');
for (const channel of ['normal','roughness','metalness','ao']) {
  expect(config.materialContract?.[channel]?.role === 'data', `${channel} must be data`);
  expect(config.materialContract?.[channel]?.sourceColorSpace === 'Non-Color', `${channel} Blender source must be Non-Color`);
  expect(config.materialContract?.[channel]?.threeColorSpace === 'NoColorSpace', `${channel} Three runtime semantics must be NoColorSpace`);
}
expect(config.materialContract?.metalness?.maximumValue === 0, 'stone/plaster metalness may not be used as a visual cheat');
expect(config.materialContract?.postProcessingRequired === false, 'spike must not require post-processing');
expect(config.uvContract?.uv0?.gltfAttribute === 'TEXCOORD_0' && config.uvContract?.uv0?.required === true, 'UV0 must remain required for surface materials');
expect(config.uvContract?.uv1?.gltfAttribute === 'TEXCOORD_1' && config.uvContract?.uv1?.required === true, 'UV1 must remain explicit for the lightmap candidate');
expect(config.uvContract?.lightMapThreeChannel === 1 && config.uvContract?.lightMapThreeColorSpace === 'LinearSRGBColorSpace', 'external lightMap must bind UV1 as linear irradiance');

expect(same((config.lightingCandidates ?? []).map((item:any)=>item.id), CANDIDATES), 'lighting comparison must contain exactly the bounded L0/L1 candidates');
for (const candidate of config.lightingCandidates ?? []) {
  expect(candidate.geometrySource === 'same-bay' && candidate.camera === 'R1', `${candidate.id} must use equal H3 geometry and R1 camera`);
  expect(candidate.shadowCastingLights === 0, `${candidate.id} may not depend on realtime shadow-casting lights`);
}
expect(config.lightingCandidates?.[0]?.externalLightMap === false, 'L0 must be the minimal realtime baseline');
expect(config.lightingCandidates?.[1]?.externalLightMap === true && config.lightingCandidates?.[1]?.lightMapUvChannel === 1, 'L1 must explicitly bind the external lightmap to UV1');

const optimizerArgs = config.toolchain?.optimizer?.arguments ?? [];
for (const flag of ['-kn','-km','-ke','-kv','-vpf','-vtf','-cc']) {
  expect(optimizerArgs.includes(flag), `controlled gltfpack path must retain ${flag}`);
}
expect(config.toolchain?.optimizer?.tool === 'gltfpack' && config.toolchain?.optimizer?.version === '1.2', 'gltfpack version must remain pinned to v1.2');
expect(config.toolchain?.optimizer?.sourceRepo === 'zeux/meshoptimizer', 'gltfpack must come from the upstream meshoptimizer repository');
expect(config.toolchain?.optimizer?.sourceCommit === EXPECTED_MESHOPT_COMMIT, 'gltfpack must be built from the exact upstream v1.2 commit');
expect(config.toolchain?.optimizer?.build === 'make -j2 config=release gltfpack', 'gltfpack native build contract drifted');
expect(config.toolchain?.gltfValidator?.tool === 'gltf_validator' && config.toolchain?.gltfValidator?.version === '2.0.0-dev.3.10', 'Khronos validator version must remain pinned');
expect(config.toolchain?.gltfValidator?.sourceRepo === 'KhronosGroup/glTF-Validator', 'validator must come from KhronosGroup/glTF-Validator');
expect(config.toolchain?.gltfValidator?.sourceCommit === EXPECTED_VALIDATOR_COMMIT, 'validator release must bind the exact upstream version commit');
expect(config.toolchain?.gltfValidator?.releaseAsset === EXPECTED_VALIDATOR_RELEASE, 'validator Linux release asset must remain exact');

expect(config.productionBoundary?.hallRouteRemainsPlaceholder === true, 'production Hall placeholder boundary must remain true');
for (const key of ['threeRuntimeMayActivate','spikeAssetsMayEnterPublic','finalPushkinMediaMayEnterSpike','h3TopologyMayChange','r1CameraMayChange','fullHallLookdevMayStart','laterGateMayAdvanceInThisWave']) {
  expect(config.productionBoundary?.[key] === false, `production boundary must keep ${key}=false`);
}
expect(config.evidenceContract?.generatedRoot === 'qa-artifacts/hall-material-spike', 'spike evidence must stay in QA artifacts');
expect(config.evidenceContract?.commitGeneratedArtifacts === false, 'generated spike artifacts must not be committed as runtime assets');
for (const requiredEvidence of ['gltfpack-source-head','gltf-validator-release-sha256']) {
  expect(config.evidenceContract?.required?.includes(requiredEvidence), `evidence contract must retain ${requiredEvidence}`);
}

for (const relative of [generatorPath,gltfValidatorPath,inspectorPath,finalizerPath,viewerPath,browserWitnessPath]) {
  expect(exists(relative), `material spike source missing: ${relative}`);
}
const scripts = packageJson.scripts ?? {};
expect(scripts['validate:hall-material-spike'] === `tsx ${validatorPath}`, 'package must expose current material spike validator');
expect((scripts.check ?? '').includes('validate:hall-material-spike'), 'normal check must run material spike source validator');
expect(ci.includes('npm run validate:hall-material-spike'), 'primary CI must enforce material spike source contract');
expect(projectContracts.includes('npm run validate:hall-material-spike'), 'Project contracts must enforce material spike source contract');
expect(hallWorkflow.includes('npm run validate:hall-material-spike'), 'Hall workflow must enforce material spike validator');
for (const trigger of [configPath, 'scripts/hall-material-spike/**', 'qa/hall-material-spike/**', validatorPath]) {
  expect(hallWorkflow.includes(`'${trigger}'`), `Hall workflow must trigger on ${trigger}`);
}
expect(hallWorkflow.includes(EXPECTED_MESHOPT_COMMIT), 'Hall workflow must checkout the exact meshoptimizer v1.2 source commit');
expect(hallWorkflow.includes('make -C .tools/meshoptimizer -j2 config=release gltfpack'), 'Hall workflow must build native gltfpack from pinned source');
expect(hallWorkflow.includes(EXPECTED_VALIDATOR_RELEASE), 'Hall workflow must download the exact Khronos validator release asset');
expect(hallWorkflow.includes('gltf-validator-release.sha256'), 'Hall workflow must record the Khronos release archive SHA-256');
expect(hallWorkflow.includes('"$GLTFPACK_BIN"') && hallWorkflow.includes('"$GLTF_VALIDATOR_BIN"'), 'Hall workflow must execute the pinned native binaries');
expect(hallWorkflow.includes('-kn -km -ke -kv -vpf -vtf -cc'), 'Hall workflow optimizer invocation must preserve identity/extras/UV1');
expect(hallWorkflow.includes('npx playwright install --with-deps chromium'), 'Hall workflow must install a real Chromium witness');
expect(!/npm\s+(?:install|i)\b/.test(hallWorkflow), 'Hall workflow must not mutate Node dependencies or hide ephemeral tooling');
expect(!hallWorkflow.includes('--no-save') && !hallWorkflow.includes('--package-lock=false') && !hallWorkflow.includes('--no-package-lock'), 'Hall workflow must not contain forbidden ephemeral dependency flags');
expect(currentState.includes('materialLightingExportSpike') && currentState.includes('H3') && currentState.includes('R1'), 'CURRENT_STATE must describe active H3/R1 material spike');
expect(hallReadme.includes('material / lighting / export spike') && hallReadme.includes('candidate'), 'Hall README must document the candidate-authoring spike');

const evidenceRoot = process.env.HALL_MATERIAL_SPIKE_EVIDENCE;
if (evidenceRoot) {
  const evidencePath = (name:string) => path.join(evidenceRoot,name);
  for (const required of [
    'source-manifest.json','h3-material-spike.blend','h3-bay.raw.glb','h3-bay.optimized.glb','h3-bay-lightmap-uv1.png',
    'raw-validator.json','optimized-validator.json','asset-contract.json','sha256-manifest.json',
    'gltfpack-source-head.txt','gltf-validator-release.sha256','gltf-validator-version.txt',
    'L0_MINIMAL_REALTIME/browser-witness.json','L0_MINIMAL_REALTIME/desktop.png','L0_MINIMAL_REALTIME/mobile.png',
    'L1_EXTERNAL_LIGHTMAP_UV1/browser-witness.json','L1_EXTERNAL_LIGHTMAP_UV1/desktop.png','L1_EXTERNAL_LIGHTMAP_UV1/mobile.png',
  ]) {
    expect(exists(evidencePath(required)), `generated material spike evidence missing: ${required}`);
  }

  if (exists(evidencePath('gltfpack-source-head.txt'))) {
    expect(read(evidencePath('gltfpack-source-head.txt')).trim() === EXPECTED_MESHOPT_COMMIT, 'generated evidence must prove exact meshoptimizer/gltfpack source commit');
  }
  if (exists(evidencePath('gltf-validator-version.txt'))) {
    expect(read(evidencePath('gltf-validator-version.txt')).includes('2.0.0-dev.3.10'), 'generated evidence must prove exact Khronos validator version');
  }
  if (exists(evidencePath('gltf-validator-release.sha256'))) {
    expect(/^[a-f0-9]{64}\s+/.test(read(evidencePath('gltf-validator-release.sha256')).trim()), 'generated evidence must record a valid SHA-256 for the Khronos validator release archive');
  }

  if (exists(evidencePath('source-manifest.json'))) {
    const manifest = readJson(evidencePath('source-manifest.json'));
    expect(same(manifest.runtime?.versionTuple,[4,5,12]) && manifest.runtime?.background === true, 'spike evidence must come from Blender 4.5.12 headless');
    expect(manifest.runtime?.unitSystem === 'METRIC' && manifest.runtime?.scaleLength === 1, 'spike evidence must remain metre-scale');
    expect(manifest.sourceAuthority?.topology === 'H3' && manifest.sourceAuthority?.layoutFingerprint === EXPECTED_LAYOUT, 'generated bay must retain H3 authority');
    expect(manifest.sourceAuthority?.sourceGeometryFingerprint === EXPECTED_SOURCE_GEOMETRY, 'generated bay must bind the frozen H3 geometry fingerprint');
    expect(manifest.sourceAuthority?.cameraRig === 'R1' && same(manifest.sourceAuthority?.camera, APPROVED_R1), 'generated bay must retain exact R1');
    expect(manifest.generatedBay?.rightsClearedMediaUsed === false && manifest.generatedBay?.documentaryMediaUsed === false, 'generated bay may not contain documentary media');
    expect(same(manifest.generatedBay?.uvLayers,['UV0','UV1']), 'generated architecture must expose UV0 and UV1');
    expect(manifest.generatedBay?.metallicTextureMaximum === 0, 'generated stone metalness must remain zero');
    expect(manifest.textureSemantics?.baseColor?.sourceColorSpace === 'sRGB', 'generated baseColor must be sRGB');
    expect(manifest.textureSemantics?.emissive?.sourceColorSpace === 'sRGB', 'generated emissive must be sRGB');
    expect(manifest.textureSemantics?.normal?.sourceColorSpace === 'Non-Color', 'generated normal must be Non-Color');
    expect(manifest.textureSemantics?.orm?.sourceColorSpace === 'Non-Color', 'generated ORM must be Non-Color');
    expect(manifest.textureSemantics?.lightMap?.sourceColorSpace === 'Non-Color' && manifest.textureSemantics?.lightMap?.uvChannel === 1, 'generated lightmap must be linear source data bound to UV1');
  }

  for (const name of ['raw-validator.json','optimized-validator.json']) {
    if (exists(evidencePath(name))) {
      const report = readJson(evidencePath(name));
      expect(report.issues?.numErrors === 0, `${name} must have zero Khronos validation errors`);
      expect(report._hallWitness?.validatorBinary === 'gltf_validator' && report._hallWitness?.exitStatus === 0, `${name} must be produced by the pinned Khronos native binary`);
    }
  }

  if (exists(evidencePath('asset-contract.json'))) {
    const report = readJson(evidencePath('asset-contract.json'));
    expect(report.status === 'passed', 'raw→optimized asset preservation contract must pass');
    expect(report.preservation?.nodeNamesAndExtras === true, 'optimizer must preserve required node names/extras');
    expect(report.preservation?.uv0AndUv1 === true, 'optimizer must preserve UV0 and UV1');
    expect(report.preservation?.pbrBindings === true, 'optimizer must preserve PBR texture semantics');
    expect(report.preservation?.trianglesUnchanged === true, 'candidate-authoring optimization may not simplify geometry');
    expect(report.optimized?.extensionsRequired?.includes('EXT_meshopt_compression'), 'optimized asset must prove EXT_meshopt_compression path');
  }

  for (const candidate of CANDIDATES) {
    const reportPath = evidencePath(`${candidate}/browser-witness.json`);
    if (!exists(reportPath)) continue;
    const report = readJson(reportPath);
    expect(report.strategy === candidate, `browser witness strategy mismatch for ${candidate}`);
    expect((report.consoleErrors ?? []).length === 0 && (report.pageErrors ?? []).length === 0, `${candidate} browser witness must have no console/page errors`);
    for (const viewport of ['desktop','mobile']) {
      const witness = report.witnesses?.[viewport];
      expect(witness?.ok === true, `${candidate}/${viewport} browser witness must be ready`);
      expect(Object.values(witness?.assertions ?? {}).every(Boolean), `${candidate}/${viewport} material/color-space assertions must all pass`);
      expect(witness?.renderer?.shadowCastingLights === 0, `${candidate}/${viewport} may not use shadow-casting realtime lights`);
      expect(witness?.renderer?.postProcessingPasses === 0, `${candidate}/${viewport} may not depend on post-processing`);
      expect(witness?.camera?.name === 'CAM_H3_R1_pushkinViewing', `${candidate}/${viewport} must render the frozen R1 camera`);
    }
  }

  if (exists(evidencePath('sha256-manifest.json'))) {
    const hashes = readJson(evidencePath('sha256-manifest.json'));
    for (const required of ['h3-material-spike.blend','h3-bay.raw.glb','h3-bay.optimized.glb','h3-bay-lightmap-uv1.png','asset-contract.json','gltfpack-source-head.txt','gltf-validator-release.sha256']) {
      expect(typeof hashes.files?.[required] === 'string' && hashes.files[required].length === 64, `final SHA-256 manifest must bind ${required}`);
    }
  }
}

if (failures.length) {
  console.error('Hall material/light/export spike validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Hall material/light/export spike source contract passed${evidenceRoot ? ' with generated evidence' : ''}: frozen H3/R1, bounded L0/L1 candidates, native pinned glTF toolchain, no production activation.`);
