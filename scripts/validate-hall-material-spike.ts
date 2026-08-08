import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const sha256File = (absolute: string) => crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');

const contractPath = 'docs/hall-v3/hall-v3-contract.json';
const spikePath = 'docs/hall-v3/material-spike.json';
const promotionPath = 'docs/hall-v3/camera-gate-promotion.json';
const generatorPath = 'scripts/hall-material/generate-material-spike.py';
const validatorWrapperPath = 'scripts/hall-material/validate-gltf.mjs';
const workflowPath = '.github/workflows/hall-greybox-tooling.yml';

const contract = JSON.parse(read(contractPath)) as any;
const spike = JSON.parse(read(spikePath)) as any;
const promotion = JSON.parse(read(promotionPath)) as any;
const generator = read(generatorPath);
const validatorWrapper = read(validatorWrapperPath);
const workflow = read(workflowPath);
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string,string>, dependencies?: Record<string,string>, devDependencies?: Record<string,string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const hallPage = read('src/pages/HallPage.tsx');

const REQUIRED_EXPORT_NODES = [
  'ARCH_spike_floor',
  'ARCH_wall_016',
  'ARCH_wall_017',
  'EXHIBIT_alexander-pushkin',
  'EXHIBIT_DOC_CASE_01',
  'EXHIBIT_DOC_CASE_02',
  'CAM_R1_pushkinViewing',
];
const ARCH_NODES = ['ARCH_spike_floor','ARCH_wall_016','ARCH_wall_017'];
const EXPECTED_LAYOUT = '5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65';
const EXPECTED_MESH = 'b3de770858a423305db8fcab15b405414e66b3d3de93ab1deaa5b3b35b418777';

type GlbJson = Record<string, any>;
function parseGlbJson(filePath: string): GlbJson {
  const buffer = fs.readFileSync(filePath);
  expect(buffer.length >= 20, `${path.basename(filePath)} must be a non-empty GLB`);
  if (buffer.length < 20) return {};
  expect(buffer.toString('ascii', 0, 4) === 'glTF', `${path.basename(filePath)} must have glTF magic`);
  expect(buffer.readUInt32LE(4) === 2, `${path.basename(filePath)} must use glTF 2.0`);
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
  expect(false, `${path.basename(filePath)} must contain a JSON chunk`);
  return {};
}
function nodeByName(doc: GlbJson, name: string): any | undefined { return (doc.nodes ?? []).find((node: any) => node?.name === name); }
function materialByName(doc: GlbJson, name: string): any | undefined { return (doc.materials ?? []).find((material: any) => material?.name === name); }
function primitiveAttributes(doc: GlbJson, node: any): Record<string, number>[] {
  if (typeof node?.mesh !== 'number') return [];
  return (doc.meshes?.[node.mesh]?.primitives ?? []).map((primitive: any) => primitive?.attributes ?? {});
}
function validateGlbContract(label: string, filePath: string, optimized: boolean): GlbJson {
  const doc = parseGlbJson(filePath);
  expect(doc.asset?.version === '2.0', `${label}: asset version must be 2.0`);
  for (const name of REQUIRED_EXPORT_NODES) expect(Boolean(nodeByName(doc, name)), `${label}: missing required node ${name}`);
  const pushkin = nodeByName(doc, 'EXHIBIT_alexander-pushkin');
  expect(pushkin?.extras?.poetId === 'alexander-pushkin', `${label}: Pushkin poetId extra must survive`);
  const camera = nodeByName(doc, 'CAM_R1_pushkinViewing');
  expect(typeof camera?.camera === 'number', `${label}: R1 camera node must retain camera payload`);
  for (const name of ARCH_NODES) {
    const node = nodeByName(doc, name);
    const attributes = primitiveAttributes(doc, node);
    expect(attributes.length > 0, `${label}: ${name} must retain a mesh primitive`);
    for (const attrs of attributes) {
      expect(typeof attrs.TEXCOORD_0 === 'number', `${label}: ${name} must retain TEXCOORD_0`);
      expect(typeof attrs.TEXCOORD_1 === 'number', `${label}: ${name} must retain TEXCOORD_1`);
    }
  }
  const stone = materialByName(doc, 'MAT_STONE_PROOF');
  expect(Boolean(stone), `${label}: MAT_STONE_PROOF must remain named`);
  expect(Number(stone?.pbrMetallicRoughness?.metallicFactor ?? 1) === 0, `${label}: stone metallicFactor must be 0`);
  expect(typeof stone?.pbrMetallicRoughness?.baseColorTexture?.index === 'number', `${label}: stone baseColor texture must be exported`);
  expect(typeof stone?.pbrMetallicRoughness?.metallicRoughnessTexture?.index === 'number', `${label}: stone roughness texture must be exported`);
  expect(typeof stone?.normalTexture?.index === 'number', `${label}: stone normal texture must be exported`);
  expect(!(doc.extensionsUsed ?? []).includes('KHR_lights_punctual'), `${label}: exported spike must contain zero glTF lights`);
  if (optimized) expect((doc.extensionsUsed ?? []).includes('EXT_meshopt_compression'), `${label}: optimized GLB must use EXT_meshopt_compression`);
  return doc;
}

expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001', 'Hall contract identity must remain exact');
expect(contract.phase === 'materialLightingExportSpike', 'material spike validator applies only to materialLightingExportSpike');
expect(contract.gates?.foundation === 'completed' && contract.gates?.referenceBible === 'completed' && contract.gates?.metricGreybox === 'completed' && contract.gates?.cameraApproval === 'completed', 'all prior Hall gates must remain completed');
expect(contract.gates?.materialLightingExportSpike === 'active', 'materialLightingExportSpike must remain active during authoring');
for (const gate of ['pushkinVerticalSlice','offlineVisualApproval','webVerticalSlice','fullMuseumScaleOut']) expect(contract.gates?.[gate] === 'blocked', `${gate} must remain blocked during material spike`);
expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain placeholder');
expect(contract.productionRoute?.allowThreeRuntimeImports === false && contract.productionRoute?.allowLegacyHallImports === false && contract.productionRoute?.allowUnapprovedConceptArt === false, 'material spike must not reactivate runtime/legacy/concept art');
expect(contract.sourceAuthority?.materialSpike === spikePath, 'Hall contract must register material-spike authority');

expect(spike.schemaVersion === 1 && spike.laneId === contract.laneId && spike.phase === contract.phase && spike.status === 'authoring', 'material-spike identity/state must be exact');
expect(spike.source?.topology === 'H3' && spike.source?.approvedRig === 'R1', 'spike must derive only from H3/R1');
expect(spike.source?.layoutFingerprint === EXPECTED_LAYOUT && spike.source?.meshGeometryFingerprint === EXPECTED_MESH, 'spike must retain frozen H3 fingerprints');
expect(JSON.stringify(spike.source?.representativeWallNodes ?? []) === JSON.stringify(['ARCH_wall_016','ARCH_wall_017']), 'representative wall set must remain bounded');
expect(JSON.stringify(spike.bay?.exportNodes ?? []) === JSON.stringify(REQUIRED_EXPORT_NODES), 'representative export-node set must remain exact');
expect(spike.bay?.productionAsset === false && spike.bay?.documentaryAsset === false, 'spike bay must remain non-production and non-documentary');
expect(JSON.stringify(spike.approvedCameraWitness?.position ?? []) === JSON.stringify([8.0,2.5,1.6]) && JSON.stringify(spike.approvedCameraWitness?.target ?? []) === JSON.stringify([11.15,5.45,1.95]) && spike.approvedCameraWitness?.lensMm === 28, 'R1 witness must remain frozen');

expect(spike.materialProof?.stoneMetallicFactor === 0, 'stone proof must remain non-metallic');
expect(spike.materialProof?.baseColor?.colorSpace === 'sRGB' && spike.materialProof?.baseColor?.uvChannel === 0, 'baseColor must remain sRGB on UV0');
expect(spike.materialProof?.normal?.colorSpace === 'Non-Color' && spike.materialProof?.normal?.uvChannel === 0, 'normal must remain non-color on UV0');
expect(spike.materialProof?.roughness?.colorSpace === 'Non-Color' && spike.materialProof?.roughness?.uvChannel === 0, 'roughness must remain non-color on UV0');
expect(spike.materialProof?.lightmaps?.colorSpace === 'LinearSRGBColorSpace' && spike.materialProof?.lightmaps?.uvChannel === 1 && spike.materialProof?.lightmaps?.encoding === 'OpenEXR-Linear', 'lightmaps must remain linear illuminance on UV1');
expect(spike.lightingCandidates?.length === 2 && spike.lightingCandidates?.[0]?.id === 'L0-minimal-runtime' && spike.lightingCandidates?.[1]?.id === 'L1-external-lightmap', 'lighting comparison must remain exactly L0/L1');
for (const candidate of spike.lightingCandidates ?? []) expect(candidate.realtimeShadowLights === 0, `${candidate.id}: realtime shadow lights must remain zero`);
expect(spike.exportToolchain?.format === 'glTF-2.0-GLB' && spike.exportToolchain?.blender === '4.5.12 LTS', 'spike export format/Blender pin must remain exact');
expect(spike.exportToolchain?.validator?.package === 'gltf-validator' && spike.exportToolchain?.validator?.version === '2.0.0-dev.3.10', 'Khronos validator must remain pinned');
expect(spike.exportToolchain?.optimizer?.package === 'gltfpack' && spike.exportToolchain?.optimizer?.version === '1.2.0', 'gltfpack must remain pinned');
expect(JSON.stringify(spike.exportToolchain?.optimizer?.args ?? []) === JSON.stringify(['-cc','-kn','-km','-ke']), 'base optimizer flags must preserve names/materials/extras');
expect(JSON.stringify(spike.exportToolchain?.optimizer?.additionalPreservationArgs ?? []) === JSON.stringify(['-kv','-vpf']), 'optimizer must retain unused UV1 and avoid hidden dequantization transforms');
expect(spike.browserWitness?.productionRouteTouched === false && spike.browserWitness?.surface === 'qa-only-vite-viewer', 'browser witness must remain QA-only');
for (const value of Object.values(spike.decision ?? {})) expect(value === null || value === false, 'material authoring PR must not pre-approve a strategy or later gate');

expect(promotion.sourceDecision?.selectedTopology === 'H3' && promotion.sourceDecision?.selectedRig === 'R1', 'camera promotion must still freeze H3/R1');
expect(promotion.nextGateScope?.allowed?.includes('one-small-h3-architectural-bay'), 'promotion must authorize representative bay');
expect(promotion.nextGateScope?.forbidden?.includes('production-three-r3f-webgl-hall'), 'promotion must still forbid production Three/R3F/WebGL');

for (const token of ['EXPECTED_VERSION = (4, 5, 12)','geometry_fingerprint()','contract["source"]["representativeWallNodes"]','contract["materialProof"]["stoneMaterial"]','CAM_R1_pushkinViewing','UV0','UV1','OPEN_EXR','LinearSRGBColorSpace','export_scene.gltf','export_extras=True','export_cameras=True']) expect(generator.includes(token), `material generator lost required invariant: ${token}`);
for (const forbidden of ['MeshReflectorMaterial','Bloom','Vignette']) expect(!generator.includes(forbidden), `material generator contains forbidden rescue token: ${forbidden}`);
expect(validatorWrapper.includes('gltf-validator') && validatorWrapper.includes('validateBytes'), 'glTF validator wrapper must call Khronos validator');

const scripts = packageJson.scripts ?? {};
expect(scripts['validate:hall-material-spike'] === 'tsx scripts/validate-hall-material-spike.ts', 'package scripts must expose material spike validator');
expect(scripts.check?.includes('validate:hall-material-spike') === true, 'normal check must run material spike validator');
expect(ci.includes('npm run validate:hall-material-spike') && projectContracts.includes('npm run validate:hall-material-spike') && workflow.includes('npm run validate:hall-material-spike'), 'all mandatory traces must run material spike validator');
expect(workflow.includes('gltf-validator@2.0.0-dev.3.10') && workflow.includes('gltfpack@1.2.0'), 'Hall workflow must install exact validation/optimization tools');
expect(workflow.includes('-cc -kn -km -ke -kv -vpf'), 'Hall workflow must preserve UV1 and metric node transforms through gltfpack');
expect(!packageJson.dependencies?.['gltf-validator'] && !packageJson.devDependencies?.['gltf-validator'] && !packageJson.dependencies?.gltfpack && !packageJson.devDependencies?.gltfpack, 'spike-only glTF tools must not become permanent Product dependencies');
expect(!hallPage.includes('hall-material') && !hallPage.includes('material-spike'), 'production HallPage must not import spike assets/viewer');

const evidenceDirRelative = process.env.HALL_MATERIAL_SPIKE_EVIDENCE;
if (evidenceDirRelative) {
  const evidenceDir = path.join(root, evidenceDirRelative);
  const sourceEvidencePath = path.join(evidenceDir, 'source-evidence.json');
  const bindingsPath = path.join(evidenceDir, 'lightmap-bindings.json');
  const rawPath = path.join(evidenceDir, 'material-spike-raw.glb');
  const optimizedPath = path.join(evidenceDir, 'material-spike-optimized.glb');
  const rawReportPath = path.join(evidenceDir, 'gltf-raw-report.json');
  const optimizedReportPath = path.join(evidenceDir, 'gltf-optimized-report.json');
  for (const file of [sourceEvidencePath,bindingsPath,rawPath,optimizedPath,rawReportPath,optimizedReportPath]) expect(fs.existsSync(file), `generated spike evidence missing ${path.basename(file)}`);
  if (fs.existsSync(sourceEvidencePath)) {
    const evidence = JSON.parse(fs.readFileSync(sourceEvidencePath,'utf8')) as any;
    expect(evidence.source?.candidateId === 'H3' && evidence.source?.layoutFingerprint === EXPECTED_LAYOUT && evidence.source?.meshGeometryFingerprintBeforeSpike === EXPECTED_MESH, 'generated evidence must prove frozen H3 before lookdev');
    expect(JSON.stringify(evidence.camera?.position ?? []) === JSON.stringify([8.0,2.5,1.6]) && evidence.camera?.lensMm === 28, 'generated evidence must prove frozen R1');
    expect(evidence.material?.metallicFactor === 0, 'generated stone material must be non-metallic');
    expect(evidence.material?.baseColorColorSpace === 'sRGB' && evidence.material?.normalColorSpace === 'Non-Color' && evidence.material?.roughnessColorSpace === 'Non-Color' && evidence.material?.lightmapRuntimeColorSpace === 'LinearSRGBColorSpace', 'generated texture color spaces must be exact');
    expect(evidence.scene?.unitSystem === 'METRIC' && evidence.scene?.lengthUnit === 'METERS' && evidence.scene?.scaleLength === 1 && evidence.scene?.lights === 0, 'generated export scene must remain metric with zero lights');
    for (const name of ARCH_NODES) expect(JSON.stringify(evidence.architectureUvSets?.[name] ?? []) === JSON.stringify(['UV0','UV1']), `${name}: generated evidence must retain exactly UV0/UV1`);
    expect(evidence.productionAsset === false && evidence.documentaryAsset === false, 'generated spike must remain non-production/non-documentary');
  }
  if (fs.existsSync(bindingsPath)) {
    const bindings = JSON.parse(fs.readFileSync(bindingsPath,'utf8')) as any;
    expect(bindings.strategy === 'L1-external-lightmap' && bindings.sourceTopology === 'H3' && bindings.approvedRig === 'R1', 'lightmap bindings must target H3/R1 L1');
    expect((bindings.bindings ?? []).length === 3, 'three architecture nodes must receive external lightmaps');
    for (const binding of bindings.bindings ?? []) {
      expect(ARCH_NODES.includes(binding.node), `unexpected lightmap binding node ${binding.node}`);
      expect(binding.uvChannel === 1 && binding.runtimeColorSpace === 'LinearSRGBColorSpace' && binding.sourceEncoding === 'OpenEXR-Linear', `${binding.node}: lightmap must use UV1 + linear-sRGB`);
      const lightmapPath = path.join(evidenceDir,'lightmaps',binding.texture);
      expect(fs.existsSync(lightmapPath) && fs.statSync(lightmapPath).size === binding.bytes && sha256File(lightmapPath) === binding.sha256, `${binding.node}: lightmap file hash/bytes must match binding`);
    }
  }
  let rawDoc: GlbJson = {}, optimizedDoc: GlbJson = {};
  if (fs.existsSync(rawPath)) rawDoc = validateGlbContract('raw', rawPath, false);
  if (fs.existsSync(optimizedPath)) optimizedDoc = validateGlbContract('optimized', optimizedPath, true);
  if (fs.existsSync(rawPath) && fs.existsSync(optimizedPath)) {
    expect(fs.statSync(optimizedPath).size < fs.statSync(rawPath).size, 'optimized GLB must be smaller than raw GLB for this spike');
    expect((optimizedDoc.nodes ?? []).length <= (rawDoc.nodes ?? []).length, 'optimization may not invent nodes');
  }
  for (const [label, reportPath] of [['raw',rawReportPath],['optimized',optimizedReportPath]] as const) {
    if (!fs.existsSync(reportPath)) continue;
    const report = JSON.parse(fs.readFileSync(reportPath,'utf8')) as any;
    expect(Number(report?.issues?.numErrors ?? 1) === 0, `${label}: Khronos validator must report zero errors`);
  }
}

const browserEvidenceRelative = process.env.HALL_MATERIAL_BROWSER_EVIDENCE;
if (browserEvidenceRelative) {
  const browserPath = path.join(root,browserEvidenceRelative);
  expect(fs.existsSync(browserPath), `browser evidence must exist: ${browserEvidenceRelative}`);
  if (fs.existsSync(browserPath)) {
    const browser = JSON.parse(fs.readFileSync(browserPath,'utf8')) as any;
    expect(browser.schemaVersion === 1 && browser.laneId === contract.laneId && browser.phase === contract.phase, 'browser evidence identity must match material spike');
    expect(JSON.stringify(Object.keys(browser.modes ?? {}).sort()) === JSON.stringify(['L0-minimal-runtime','L1-external-lightmap']), 'browser evidence must contain L0/L1');
    for (const [mode, metrics] of Object.entries(browser.modes ?? {}) as [string,any][]) {
      expect(metrics.loadComplete === true, `${mode}: browser viewer must load completely`);
      expect(Number(metrics.drawCalls) > 0 && Number(metrics.triangles) > 0, `${mode}: browser metrics must report non-zero render work`);
      expect(Number(metrics.rawBytes) > 0 && Number(metrics.optimizedBytes) > 0, `${mode}: browser evidence must record asset bytes`);
      expect((metrics.errors ?? []).length === 0, `${mode}: browser viewer must report zero runtime errors`);
    }
  }
}

if (failures.length) {
  console.error('\nHall v3 material/light/export spike validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Hall v3 material spike contract passed${evidenceDirRelative ? ' with generated export evidence' : ''}${browserEvidenceRelative ? ' and browser evidence' : ''}.`);
