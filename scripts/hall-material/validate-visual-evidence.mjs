import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = (relative) => JSON.parse(read(relative));
const closeEnough = (left, right, tolerance = 1e-9) => Math.abs(Number(left) - Number(right)) <= tolerance;

const contract = readJson('docs/hall-v3/hall-v3-contract.json');
const spike = readJson('docs/hall-v3/material-spike.json');
const workflow = read('.github/workflows/hall-greybox-tooling.yml');
const preparer = read('scripts/hall-material/prepare-material-visual-evidence.py');
const reexport = read('scripts/hall-material/reexport-with-tangents.py');
const browserWitness = read('scripts/hall-material/browser-witness.mjs');
const visualViewer = read('qa/hall-material-viewer/visual.ts');
const hallPage = read('src/pages/HallPage.tsx');
const visual = spike.visualEvidence ?? {};
const ARCH_NODES = ['ARCH_spike_floor', 'ARCH_wall_016', 'ARCH_wall_017'];
const MATERIAL_ROLES = ['baseColor', 'normal', 'roughness'];

expect(contract.phase === 'materialLightingExportSpike', 'visual evidence applies only while materialLightingExportSpike is current');
expect(contract.gates?.materialLightingExportSpike === 'active', 'materialLightingExportSpike must remain active during visual repeat-spike');
for (const gate of ['pushkinVerticalSlice', 'offlineVisualApproval', 'webVerticalSlice', 'fullMuseumScaleOut']) {
  expect(contract.gates?.[gate] === 'blocked', `${gate} must remain blocked during material visual evidence`);
}
expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain a placeholder during material visual evidence');
expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'production /hall may not import Three during material visual evidence');
expect(spike.source?.topology === 'H3' && spike.source?.approvedRig === 'R1', 'material visual evidence must stay on frozen H3/R1');
for (const value of Object.values(spike.decision ?? {})) expect(value === null || value === false, 'visual repeat-spike may not pre-approve Gate 4 delivery decisions');

expect(visual.status === 'repeat-spike-authoring', 'visual evidence status must remain repeat-spike-authoring');
expect(visual.inspectionTarget === 'ARCH_wall_016', 'visual evidence inspection target must remain the bounded representative wall');
expect(visual.surfaceUvProjection === 'cube', 'visual evidence must use explicit box-style UV0 projection');
expect(closeEnough(visual.surfaceUvCubeSizeMeters, 1.5), 'visual UV0 cube scale must remain 1.5 metres');
expect(visual.proofTextureResolution === 256, 'visual proof textures must remain bounded at 256px');
expect(closeEnough(visual.lookdevBevelMeters, 0.015), 'visual lookdev bevel must remain 15 mm');
expect(visual.lookdevBevelSegments === 3 && visual.lookdevBevelLimit === 'ANGLE', 'visual lookdev bevel segments/limit must remain bounded');
expect(JSON.stringify(visual.variants ?? []) === JSON.stringify(['full', 'normal-off', 'roughness-flat']), 'visual material A/B variants must remain exact');
expect(visual.views?.materialMedium?.id === 'material-medium' && closeEnough(visual.views?.materialMedium?.distanceMeters, 2.2) && visual.views?.materialMedium?.lensMm === 45, 'medium material witness must remain exact');
expect(visual.views?.materialClose?.id === 'material-close' && closeEnough(visual.views?.materialClose?.distanceMeters, 0.85) && visual.views?.materialClose?.lensMm === 55, 'close material witness must remain exact');
expect(visual.requiresHumanArtDirection === true && visual.decisionMayAdvance === false, 'visual evidence must require human art direction and must not advance Gate 4');
expect(closeEnough(visual.readabilityReject?.lumaThreshold, 0.08) && closeEnough(visual.readabilityReject?.maximumDarkSampleRatio, 0.98), 'readability rejection thresholds must remain explicit');
expect(Number(visual.normalResponse?.minimumMeanAbsoluteChannelDifference) > 0 && Number(visual.normalResponse?.minimumChangedSampleRatioAbove2) > 0, 'normal response must have non-zero machine thresholds');
expect(Number(visual.roughnessResponse?.minimumMeanAbsoluteChannelDifference) > 0 && Number(visual.roughnessResponse?.minimumChangedSampleRatioAbove2) > 0, 'roughness response must have non-zero machine thresholds');

for (const token of ['dominant_axis_box_project_uv0', 'evaluated_get', 'SPIKE_VISUAL_BEVEL', 'matrixWorldUnchanged', 'maximumBoundsDeltaMeters', 'visualEvidenceOnly', 'decisionMayAdvance', 'assert_periodic_function', 'proofTexturePeriodicity', 'texel-centers-periodic']) {
  expect(preparer.includes(token), `visual DCC preparer lost required invariant: ${token}`);
}
for (const forbidden of ['bpy.ops.uv.cube_project', 'bpy.ops.object.modifier_apply', 'image.reload()', 'assert_tileable_edges']) {
  expect(!preparer.includes(forbidden), `headless visual DCC preparer must not use invalid/context-sensitive mutation or texel-edge proof: ${forbidden}`);
}
expect(reexport.includes('export_apply=export_apply'), 'tangent re-export must explicitly apply the bounded visual modifier only during visual authoring');
expect(reexport.includes('visual evidence export requires bounded bevel modifier'), 'tangent re-export must fail if the bounded visual bevel is missing');
for (const forbidden of ['Bloom', 'Vignette', 'MeshReflectorMaterial', 'FogExp2', 'GodRays']) {
  expect(!preparer.includes(forbidden) && !visualViewer.includes(forbidden), `visual evidence contains forbidden rescue token: ${forbidden}`);
}
for (const token of ['normal-off', 'roughness-flat', 'meanDisplayLuma', 'darkSampleRatio', 'materialResponses', 'automaticDisposition', 'minimumMeanDisplayLuma', 'rejectionReasons']) {
  expect(browserWitness.includes(token), `browser visual witness lost required invariant: ${token}`);
}
for (const token of ['faceNormalAxis', 'verticalAxis', 'tangentAxis', 'edgeRevealDegrees', 'dimensions.indexOf(Math.min(...dimensions))', 'surfaceNormal']) {
  expect(visualViewer.includes(token), `material inspection viewer lost wall-face framing invariant: ${token}`);
}
expect(visualViewer.includes('AmbientLight') && visualViewer.includes('DirectionalLight') && visualViewer.includes('shadowMap.enabled = false'), 'visual viewer must use bounded no-shadow neutral L0 lighting');
expect(visualViewer.includes("loadAsync('/generated/material-spike-optimized.glb')"), 'visual viewer must inspect the optimized delivery candidate');
expect(!hallPage.includes('hall-material-viewer') && !hallPage.includes('visualEvidence'), 'production HallPage must not load the material visual QA surface');
expect(workflow.includes('prepare-material-visual-evidence.py'), 'Hall workflow must run visual DCC preparation');
expect(workflow.includes('--contract docs/hall-v3/material-spike.json --base-url'), 'Hall workflow must bind browser visual witness to the exact material contract');
expect(workflow.includes('HALL_GREYBOX_CANDIDATE_EVIDENCE: qa-artifacts/hall-greybox-candidates/index.json'), 'visual wave must preserve the frozen H1/H2/H3 evidence barrier');

function parseGlbJson(absolutePath) {
  const buffer = fs.readFileSync(absolutePath);
  expect(buffer.length >= 20, `${path.basename(absolutePath)} must be a non-empty GLB`);
  if (buffer.length < 20) return {};
  expect(buffer.toString('ascii', 0, 4) === 'glTF', `${path.basename(absolutePath)} must have glTF magic`);
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
  expect(false, `${path.basename(absolutePath)} must contain a JSON chunk`);
  return {};
}

function nodeByName(doc, name) {
  return (doc.nodes ?? []).find((node) => node?.name === name);
}

const evidenceRelative = process.env.HALL_MATERIAL_SPIKE_EVIDENCE;
if (evidenceRelative) {
  const evidenceDir = path.join(root, evidenceRelative);
  const sourceEvidencePath = path.join(evidenceDir, 'source-evidence.json');
  const visualEvidencePath = path.join(evidenceDir, 'visual-lookdev-evidence.json');
  const rawPath = path.join(evidenceDir, 'material-spike-raw.glb');
  const optimizedPath = path.join(evidenceDir, 'material-spike-optimized.glb');
  for (const file of [sourceEvidencePath, visualEvidencePath, rawPath, optimizedPath]) expect(fs.existsSync(file), `visual evidence missing ${path.basename(file)}`);

  if (fs.existsSync(visualEvidencePath)) {
    const dcc = JSON.parse(fs.readFileSync(visualEvidencePath, 'utf8'));
    expect(dcc.status === 'repeat-spike-visual-evidence' && dcc.sourceTopology === 'H3' && dcc.approvedRig === 'R1', 'DCC visual evidence must remain H3/R1 repeat-spike');
    expect(dcc.r1MatrixUnchanged === true && dcc.productionAsset === false && dcc.decisionMayAdvance === false, 'DCC visual evidence must not change R1, production authority, or decision state');
    expect(dcc.inspectionTarget === visual.inspectionTarget, 'DCC visual evidence inspection target must match contract');
    expect(dcc.proofTextureResolution === visual.proofTextureResolution, 'DCC visual evidence texture resolution must match contract');
    expect(closeEnough(dcc.surfaceUvCubeSizeMeters, visual.surfaceUvCubeSizeMeters), 'DCC visual evidence UV scale must match contract');
    expect(closeEnough(dcc.lookdevBevelMeters, visual.lookdevBevelMeters) && dcc.lookdevBevelSegments === visual.lookdevBevelSegments, 'DCC visual evidence bevel must match contract');
    expect(dcc.bevelExportMode === 'gltf-export-apply-modifiers', 'DCC visual evidence must keep bevel non-destructive until glTF export');
    for (const role of MATERIAL_ROLES) {
      const periodic = dcc.proofTexturePeriodicity?.[role];
      expect(periodic?.periodic === true, `${role}: proof texture continuous material function must be periodic`);
      expect(Number(periodic?.boundarySamplePairs) === visual.proofTextureResolution * 2, `${role}: periodicity proof must sample both continuous boundaries densely`);
      expect(Number(periodic?.leftRightMaxAbsDifference ?? Infinity) <= Number(periodic?.tolerance ?? 0), `${role}: u=0/1 periodicity delta must stay within recorded tolerance`);
      expect(Number(periodic?.topBottomMaxAbsDifference ?? Infinity) <= Number(periodic?.tolerance ?? 0), `${role}: v=0/1 periodicity delta must stay within recorded tolerance`);
      expect(Number(periodic?.tolerance) > 0 && Number(periodic?.tolerance) <= 1e-9, `${role}: periodicity tolerance must remain strict`);
      expect(periodic?.rasterSampling === 'texel-centers-periodic' && periodic?.wrapContract === 'repeat', `${role}: raster must sample periodic function at texel centers for repeat wrapping`);
    }
    for (const name of ARCH_NODES) {
      const item = dcc.objects?.[name];
      expect(Boolean(item), `DCC visual evidence missing ${name}`);
      expect(item?.bevel?.matrixWorldUnchanged === true, `${name}: lookdev bevel must not change object transform`);
      expect(item?.bevel?.implementation === 'non-destructive-modifier-export-apply', `${name}: bevel must remain non-destructive before export`);
      expect(Number(item?.bevel?.maximumBoundsDeltaMeters ?? 1) <= 0.00005, `${name}: lookdev bevel may not expand frozen H3 bounds`);
      expect(JSON.stringify(item?.uvSetsAfter ?? []) === JSON.stringify(['UV0', 'UV1']), `${name}: lookdev must preserve exactly UV0/UV1`);
      expect(item?.uv0?.implementation === 'dominant-axis-loop-data', `${name}: UV0 must use direct headless loop-data projection`);
      expect(closeEnough(item?.uv0?.medianMetersPerUvUnit, visual.surfaceUvCubeSizeMeters, visual.surfaceUvCubeSizeMeters * 0.04), `${name}: UV0 median metre scale must match contract`);
    }
  }

  if (fs.existsSync(sourceEvidencePath)) {
    const source = JSON.parse(fs.readFileSync(sourceEvidencePath, 'utf8'));
    expect(source.source?.candidateId === 'H3', 'source visual evidence must still derive from H3');
    expect(source.camera?.name === 'CAM_R1_pushkinViewing' && source.camera?.lensMm === 28, 'source visual evidence must preserve frozen R1 authority');
    expect(source.material?.proofTextureResolution === visual.proofTextureResolution, 'source evidence must record proof texture resolution');
    expect(source.material?.proofTexturePeriodic === true, 'source evidence must record continuous periodic proof-texture delivery');
    expect(source.material?.proofTextureRasterSampling === 'texel-centers-periodic', 'source evidence must record texel-center periodic raster sampling');
    expect(source.material?.surfaceUvProjection === visual.surfaceUvProjection && closeEnough(source.material?.surfaceUvCubeSizeMeters, visual.surfaceUvCubeSizeMeters), 'source evidence must record metre-scaled UV0 contract');
    expect(closeEnough(source.material?.lookdevBevelMeters, visual.lookdevBevelMeters) && source.material?.lookdevBevelSegments === visual.lookdevBevelSegments, 'source evidence must record bounded lookdev bevel');
    expect(source.material?.bevelExportMode === 'gltf-export-apply-modifiers', 'source evidence must record evaluated glTF bevel export mode');
    expect(source.visualLookdev?.decisionMayAdvance === false, 'source evidence may not claim Gate 4 decision advancement');
  }

  for (const [label, glbPath] of [['raw', rawPath], ['optimized', optimizedPath]]) {
    if (!fs.existsSync(glbPath)) continue;
    const doc = parseGlbJson(glbPath);
    for (const name of ARCH_NODES) {
      const node = nodeByName(doc, name);
      expect(Boolean(node), `${label}: missing architecture node ${name}`);
      expect(node?.extras?.visualEvidenceOnly === true, `${label}: ${name} must retain visualEvidenceOnly extra`);
      expect(closeEnough(node?.extras?.lookdevBevelMeters, visual.lookdevBevelMeters), `${label}: ${name} must retain bevel width extra`);
      expect(node?.extras?.lookdevBevelSegments === visual.lookdevBevelSegments, `${label}: ${name} must retain bevel segment extra`);
      expect(closeEnough(node?.extras?.surfaceUvCubeSizeMeters, visual.surfaceUvCubeSizeMeters), `${label}: ${name} must retain metre UV scale extra`);
    }
  }
}

const browserRelative = process.env.HALL_MATERIAL_BROWSER_EVIDENCE;
if (browserRelative) {
  const browserPath = path.join(root, browserRelative);
  expect(fs.existsSync(browserPath), `material browser visual evidence must exist: ${browserRelative}`);
  if (fs.existsSync(browserPath)) {
    const browser = JSON.parse(fs.readFileSync(browserPath, 'utf8'));
    const visualEvidence = browser.visualEvidence ?? {};
    expect(visualEvidence.status === 'repeat-spike-visual-evidence', 'browser visual evidence status must remain repeat-spike');
    expect(visualEvidence.inspectionTarget === visual.inspectionTarget, 'browser visual inspection target must match contract');
    expect(visualEvidence.humanArtDirectionRequired === true && visualEvidence.decisionMayAdvance === false, 'browser visual evidence cannot self-approve Gate 4');
    const witnessKeys = Object.keys(visualEvidence.witnesses ?? {}).sort();
    expect(JSON.stringify(witnessKeys) === JSON.stringify(['materialCloseFull', 'materialCloseNormalOff', 'materialMediumFull', 'materialMediumRoughnessFlat'].sort()), 'browser visual evidence must contain exact close/medium A/B witnesses');
    for (const [key, witness] of Object.entries(visualEvidence.witnesses ?? {})) {
      expect(witness.loadComplete === true && Number(witness.drawCalls) > 0 && Number(witness.triangles) > 0, `${key}: visual witness must render measurable work`);
      expect((witness.errors ?? []).length === 0, `${key}: visual witness must have zero runtime errors`);
      expect(witness.transport?.uv0 === true && witness.transport?.uv1 === true && witness.transport?.visualEvidenceOnly === true, `${key}: visual witness must preserve UV0/UV1 and QA-only extra`);
      expect(closeEnough(witness.transport?.lookdevBevelMeters, visual.lookdevBevelMeters) && witness.transport?.lookdevBevelSegments === visual.lookdevBevelSegments, `${key}: visual witness bevel transport must match contract`);
      expect(closeEnough(witness.transport?.surfaceUvCubeSizeMeters, visual.surfaceUvCubeSizeMeters), `${key}: visual witness metre UV scale must match contract`);
      const camera = witness.camera ?? {};
      const axes = [camera.faceNormalAxis, camera.verticalAxis, camera.tangentAxis];
      const normal = camera.surfaceNormal ?? [];
      const normalLength = normal.length === 3 ? Math.hypot(...normal.map(Number)) : 0;
      expect(new Set(axes).size === 3 && axes.every((axis) => [0, 1, 2].includes(axis)), `${key}: inspection camera must resolve three distinct local wall axes`);
      expect(Number(camera.edgeRevealDegrees) > 0 && Number(camera.edgeRevealDegrees) < 30, `${key}: inspection camera must use a bounded edge-reveal angle`);
      expect(Math.abs(normalLength - 1) <= 1e-5, `${key}: inspection camera surface normal must be unit length`);
    }
    const normal = visualEvidence.materialResponses?.normal;
    const roughness = visualEvidence.materialResponses?.roughness;
    expect(Number(normal?.meanAbsoluteChannelDifference ?? 0) >= Number(visual.normalResponse.minimumMeanAbsoluteChannelDifference), 'normal map must have measurable close-view visual response');
    expect(Number(normal?.changedSampleRatioAbove2 ?? 0) >= Number(visual.normalResponse.minimumChangedSampleRatioAbove2), 'normal map response must alter enough close-view samples');
    expect(Number(roughness?.meanAbsoluteChannelDifference ?? 0) >= Number(visual.roughnessResponse.minimumMeanAbsoluteChannelDifference), 'roughness map must have measurable medium-view visual response');
    expect(Number(roughness?.changedSampleRatioAbove2 ?? 0) >= Number(visual.roughnessResponse.minimumChangedSampleRatioAbove2), 'roughness map response must alter enough medium-view samples');

    const l0 = browser.candidateReadability?.['L0-minimal-runtime'];
    const l1 = browser.candidateReadability?.['L1-external-lightmap'];
    for (const [mode, result] of [['L0-minimal-runtime', l0], ['L1-external-lightmap', l1]]) {
      const threshold = Number(visual.readabilityReject.lumaThreshold);
      const maximumDark = Number(visual.readabilityReject.maximumDarkSampleRatio);
      const darkRatioReject = Number(result?.darkSampleRatio ?? 1) > maximumDark;
      const meanLumaReject = Number(result?.meanDisplayLuma ?? 0) < threshold;
      const expectedDisposition = darkRatioReject || meanLumaReject ? 'reject-current-bake' : 'eligible-for-human-review';
      const expectedReasons = [
        ...(darkRatioReject ? ['dark-sample-ratio'] : []),
        ...(meanLumaReject ? ['mean-display-luma'] : []),
      ];
      expect(result?.automaticDisposition === expectedDisposition, `${mode}: readability disposition must derive from explicit darkness checks`);
      expect(closeEnough(result?.minimumMeanDisplayLuma, threshold), `${mode}: readability evidence must record the minimum mean display luma`);
      expect(JSON.stringify(result?.rejectionReasons ?? []) === JSON.stringify(expectedReasons), `${mode}: readability rejection reasons must match measured evidence`);
    }
    expect(l0?.automaticDisposition !== 'reject-current-bake', 'L0 neutral baseline must remain visually reviewable');

    const browserDir = path.dirname(browserPath);
    for (const screenshot of spike.browserWitness?.screenshots ?? []) expect(fs.existsSync(path.join(browserDir, screenshot)), `browser visual evidence missing screenshot ${screenshot}`);
  }
}

if (failures.length) {
  console.error('\nHall v3 material visual evidence validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Hall v3 material visual evidence contract passed${evidenceRelative ? ' with DCC/export evidence' : ''}${browserRelative ? ' and close/medium browser evidence' : ''}.`);
