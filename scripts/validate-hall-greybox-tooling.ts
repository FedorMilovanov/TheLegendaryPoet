import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const contract = JSON.parse(read('docs/hall-v3/hall-v3-contract.json')) as any;
const reference = JSON.parse(read('docs/hall-v3/reference-bible.json')) as any;
const toolingPath = 'docs/hall-v3/greybox-tooling.json';
const candidatesPath = 'docs/hall-v3/greybox-candidates.json';
const tooling = JSON.parse(read(toolingPath)) as any;
const candidates = JSON.parse(read(candidatesPath)) as any;
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string,string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const workflow = read('.github/workflows/hall-greybox-tooling.yml');
const smokeScript = read('scripts/hall-greybox/blender-tooling-preflight.py');

expect(contract.laneId === 'TLP-HALL-001', 'Hall contract must remain owned by TLP-HALL-001');
expect(contract.phase === 'metricGreybox', 'tooling invariants apply while metricGreybox is active');
expect(contract.gates?.foundation === 'completed', 'foundation must remain completed');
expect(contract.gates?.referenceBible === 'completed', 'Reference Bible must remain completed');
expect(contract.gates?.metricGreybox === 'active', 'metricGreybox must remain active');
for (const gate of ['cameraApproval','materialLightingExportSpike','pushkinVerticalSlice','offlineVisualApproval','webVerticalSlice','fullMuseumScaleOut']) {
  expect(contract.gates?.[gate] === 'blocked', `later Hall gate must remain blocked during metricGreybox: ${gate}`);
}
expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain a placeholder during offline metric greybox');
expect(contract.productionRoute?.allowLegacyHallImports === false, 'metric greybox must not reactivate legacy Hall');
expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'metric greybox must not activate Three/R3F runtime');
expect(contract.productionRoute?.allowUnapprovedConceptArt === false, 'metric greybox must not publish unapproved concept art');
expect(contract.sourceAuthority?.greyboxTooling === toolingPath, 'Hall source authority must retain greybox tooling contract');
expect(contract.sourceAuthority?.greyboxCandidates === candidatesPath, 'Hall source authority must retain candidate manifest');

expect(reference.status === 'completed', 'Reference Bible must remain completed during greybox');
for (const [decision, value] of Object.entries(reference.decisions ?? {})) expect(value === null, `Reference Bible must not pre-approve ${decision}`);

expect(tooling.schemaVersion === 1 && tooling.laneId === contract.laneId, 'tooling identity must match Hall contract');
expect(tooling.phase === 'metricGreybox' && tooling.status === 'active', 'tooling contract must remain active in metricGreybox');
expect(tooling.blender?.releaseSeries === '4.5 LTS', 'Blender release series must remain 4.5 LTS');
expect(tooling.blender?.version === '4.5.12', 'Blender must remain pinned to 4.5.12 for this phase');
expect(tooling.blender?.platform === 'linux-x64', 'Blender CI platform must remain linux-x64');
expect(tooling.blender?.archiveFilename === 'blender-4.5.12-linux-x64.tar.xz', 'Blender archive filename must remain exact');
expect(tooling.blender?.archiveUrl === 'https://download.blender.org/release/Blender4.5/blender-4.5.12-linux-x64.tar.xz', 'Blender archive must use official pinned release URL');
expect(tooling.blender?.checksumIndexUrl === 'https://download.blender.org/release/Blender4.5/blender-4.5.12.sha256', 'Blender checksum index must use official release URL');
expect(tooling.blender?.autoUpdate === false, 'Blender runtime must not silently auto-update');
expect(JSON.stringify(tooling.blender?.requiredCli ?? []) === JSON.stringify(['--background','--disable-autoexec','--python-exit-code','--python']), 'headless Blender CLI contract must remain explicit');
expect(tooling.blender?.officialBuildIndex?.startsWith('https://builder.blender.org/'), 'tooling must retain official Blender build-index witness');
expect(tooling.blender?.officialManual?.startsWith('https://docs.blender.org/manual/'), 'tooling must retain official Blender manual witness');

expect(tooling.smokeScene?.unitSystem === 'METRIC' && tooling.smokeScene?.lengthUnit === 'METERS' && tooling.smokeScene?.scaleLength === 1, 'tooling smoke scene must keep one-unit-one-metre metric contract');
expect(tooling.smokeScene?.humanProxyHeightMetres === 1.75, 'tooling human proxy must remain 1.75 m');
expect(JSON.stringify(tooling.smokeScene?.requiredCollections ?? []) === JSON.stringify(['COLL_CORE','COLL_CAMERAS','COLL_EXPORT_HELPERS']), 'tooling collections must remain stable');
expect(JSON.stringify(tooling.smokeScene?.requiredObjects ?? []) === JSON.stringify(['TOOLING_FLOOR','HUMAN_PROXY','CAM_TOOLING_PREFLIGHT']), 'tooling objects must remain stable');
expect(tooling.smokeScene?.roundTripSaveReopen === true, 'tooling must prove save/reopen');
expect(tooling.smokeScene?.renderRequired === false && tooling.smokeScene?.materialsRequired === false && tooling.smokeScene?.lightsRequired === false, 'tooling smoke must remain pre-lookdev');
expect(tooling.evidence?.retainInGit === false, 'generated smoke evidence must remain CI artifact, not git authority');
expect(tooling.candidateManifest === candidatesPath, 'tooling must point to canonical candidate manifest');
expect((tooling.nonGoals?.length ?? 0) >= 8, 'tooling must retain strong non-goals');

expect(candidates.schemaVersion === 1 && candidates.laneId === contract.laneId, 'candidate manifest identity must match Hall contract');
expect(candidates.phase === 'metricGreybox' && candidates.status === 'active', 'candidate manifest must remain active');
expect(candidates.approvedCandidate === null, 'tooling/candidate authoring must not select a winner');
expect(candidates.cameraSet?.approvedRig === null, 'camera rig must remain unapproved');
const candidateStates = (candidates.candidates ?? []).map((candidate: any) => candidate.status);
const allUnbuilt = candidateStates.every((status: unknown) => status === 'unbuilt');
const allSourceDefined = candidateStates.every((status: unknown) => status === 'source-defined');
expect(allUnbuilt || allSourceDefined, 'candidate states must move together from unbuilt to source-defined');
if (allUnbuilt) {
  expect(candidates.cameraSet?.status === 'common-set-required-not-yet-approved', 'pre-authoring camera status must remain unselected');
  expect(JSON.stringify(candidates.cameraSet?.lensCandidatesMm ?? []) === '[]', 'pre-authoring lens set must remain empty');
} else if (allSourceDefined) {
  expect(candidates.cameraSet?.status === 'common-test-set-selected-not-approved', 'authoring must label comparison lens as test-only');
  expect(JSON.stringify(candidates.cameraSet?.lensCandidatesMm ?? []) === JSON.stringify([35]), 'authoring must use one shared provisional 35 mm comparison lens');
}
expect(JSON.stringify((candidates.candidates ?? []).map((candidate: any) => candidate.id)) === JSON.stringify(['H1','H2','H3']), 'candidate manifest must retain H1/H2/H3');
for (const candidate of candidates.candidates ?? []) {
  expect(candidate.sourceBlend === null && candidate.evidenceManifest === null, `${candidate.id}: generated evidence must not be committed as source authority`);
  expect(candidate.routeLengthMetres === null && candidate.forcedTurnCount === null, `${candidate.id}: measured metrics must remain generated evidence, not hand-entered source`);
  expect(candidate.rejected === false && (candidate.rejectionReasons?.length ?? 0) === 0, `${candidate.id}: candidate must not be pre-rejected by tooling`);
}

const comparison = candidates.equalComparison ?? {};
const metrics = reference.metricConstraints ?? {};
expect(comparison.unit === metrics.unit, 'candidate unit must inherit Reference Bible');
expect(comparison.neutralMaterialOnly === true, 'greybox candidates must remain neutral-material only');
for (const [name, value] of Object.entries({ornament:comparison.ornamentAllowed,bloom:comparison.bloomAllowed,fog:comparison.fogAllowed,particles:comparison.particlesAllowed,goldGlow:comparison.goldGlowAllowed,fps:comparison.fpsRequired})) expect(value === false, `candidate equality must keep ${name}=false`);
expect(comparison.commonHumanProxyHeightMetres === 1.75, 'candidate equality must retain common 1.75 m proxy');
expect(comparison.minimumClearances?.routeOneWay === metrics.routeOneWayMinimum, 'one-way clearance must inherit Reference Bible');
expect(comparison.minimumClearances?.routeTwoWayRecommended === metrics.routeTwoWayRecommendedMinimum, 'two-way clearance must inherit Reference Bible');
expect(comparison.minimumClearances?.viewingWidth === metrics.accessibleViewingClearance?.width && comparison.minimumClearances?.viewingDepth === metrics.accessibleViewingClearance?.depth, 'viewing clearance must inherit Reference Bible');
expect(comparison.minimumClearances?.headroom === metrics.clearHeadroomMinimum, 'headroom must inherit Reference Bible');
expect(JSON.stringify(comparison.requiredCameraWitnesses ?? []) === JSON.stringify(reference.greyboxEvidencePackage?.certifiedCameraWitnesses ?? []), 'camera witnesses must inherit Reference Bible exactly');
expect(comparison.mobileCropMinimum === reference.greyboxEvidencePackage?.mobileCropMinimum, 'mobile crop minimum must inherit Reference Bible');
expect(JSON.stringify(comparison.requiredOutputs ?? []) === JSON.stringify(reference.greyboxEvidencePackage?.requiredOutputs ?? []), 'required outputs must inherit Reference Bible');
expect((candidates.automaticRejectionRules?.length ?? 0) >= 8, 'automatic rejection rules must remain strong');

for (const token of ['EXPECTED_VERSION = (4, 5, 12)','bpy.app.background','read_factory_settings(use_empty=True)','scene.unit_settings.system = "METRIC"','scene.unit_settings.scale_length = 1.0','save_as_mainfile','open_mainfile']) expect(smokeScript.includes(token), `Blender smoke script lost invariant: ${token}`);
expect(!smokeScript.includes('bpy.ops.render'), 'tooling smoke must not render');
expect(!smokeScript.includes('bpy.data.materials.new') && !smokeScript.includes('bpy.data.lights.new'), 'tooling smoke must not create lookdev materials/lights');

expect(workflow.includes(tooling.blender?.archiveUrl ?? '<missing>'), 'greybox workflow must download exact pinned Blender release');
expect(workflow.includes(tooling.blender?.checksumIndexUrl ?? '<missing>'), 'greybox workflow must download vendor checksum index');
expect(workflow.includes('sha256sum -c'), 'greybox workflow must verify Blender SHA-256');
for (const token of ['--background','--disable-autoexec','--python-exit-code 17','scripts/hall-greybox/blender-tooling-preflight.py','HALL_GREYBOX_TOOLING_EVIDENCE']) expect(workflow.includes(token), `greybox workflow lost tooling witness token: ${token}`);

const scripts = packageJson.scripts ?? {};
expect(scripts['validate:hall-greybox-tooling'] === 'tsx scripts/validate-hall-greybox-tooling.ts', 'package scripts must expose tooling validator');
expect(scripts.check?.includes('validate:hall-greybox-tooling') === true, 'normal check must retain tooling validator');
expect(ci.includes('npm run validate:hall-greybox-tooling'), 'primary CI must retain tooling validator');
expect(projectContracts.includes('npm run validate:hall-greybox-tooling'), 'Project contracts must retain tooling validator');

const evidenceRelative = process.env.HALL_GREYBOX_TOOLING_EVIDENCE;
if (evidenceRelative) {
  const evidencePath = path.join(root, evidenceRelative);
  expect(fs.existsSync(evidencePath), `generated tooling evidence must exist: ${evidenceRelative}`);
  if (fs.existsSync(evidencePath)) {
    const evidence = JSON.parse(fs.readFileSync(evidencePath,'utf8')) as any;
    expect(evidence.schemaVersion === 1 && evidence.laneId === contract.laneId && evidence.phase === 'metricGreybox', 'generated tooling evidence identity must match Hall');
    expect(JSON.stringify(evidence.runtime?.versionTuple ?? []) === JSON.stringify([4,5,12]), 'generated tooling evidence must prove Blender 4.5.12');
    expect((evidence.runtime?.buildHash?.length ?? 0) >= 8 && evidence.runtime?.background === true, 'generated tooling evidence must record build hash and background mode');
    expect(evidence.scene?.unitSystem === 'METRIC' && evidence.scene?.lengthUnit === 'METERS' && evidence.scene?.scaleLength === 1, 'generated tooling evidence must prove metric scene');
    expect(evidence.scene?.humanProxyHeightMetres === 1.75, 'generated tooling evidence must prove human proxy height');
    for (const name of tooling.smokeScene?.requiredCollections ?? []) expect(evidence.scene?.collections?.includes(name) === true, `generated tooling evidence lost collection ${name}`);
    for (const name of tooling.smokeScene?.requiredObjects ?? []) expect(evidence.scene?.objects?.includes(name) === true, `generated tooling evidence lost object ${name}`);
    expect(evidence.scene?.materials === 0 && evidence.scene?.lights === 0, 'generated tooling smoke scene must remain without materials/lights');
    expect(evidence.roundTripSaveReopen === true && evidence.rendered === false && evidence.blendFile === 'tooling-smoke.blend', 'generated tooling evidence must prove save/reopen without render');
  }
}

if (failures.length) {
  console.error('\nHall v3 metric-greybox tooling validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Hall v3 metric-greybox tooling invariants passed with candidate state ${allSourceDefined ? 'source-defined' : 'unbuilt'}.`);
