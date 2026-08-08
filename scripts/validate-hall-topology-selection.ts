import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative: string) => fs.existsSync(path.join(root, relative));
const sha256File = (absolute: string) => crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');

const contractPath = 'docs/hall-v3/hall-v3-contract.json';
const toolingPath = 'docs/hall-v3/greybox-tooling.json';
const candidatesPath = 'docs/hall-v3/greybox-candidates.json';
const layoutsPath = 'docs/hall-v3/greybox-layouts.json';
const decisionPath = 'docs/hall-v3/greybox-decision.json';
const generatorPath = 'scripts/hall-greybox/generate-candidates.py';
const smokePath = 'scripts/hall-greybox/blender-tooling-preflight.py';
const validatorPath = 'scripts/validate-hall-topology-selection.ts';

const contract = JSON.parse(read(contractPath)) as any;
const reference = JSON.parse(read('docs/hall-v3/reference-bible.json')) as any;
const tooling = JSON.parse(read(toolingPath)) as any;
const candidates = JSON.parse(read(candidatesPath)) as any;
const layouts = JSON.parse(read(layoutsPath)) as any;
const decision = JSON.parse(read(decisionPath)) as any;
const generator = read(generatorPath);
const smoke = read(smokePath);
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string,string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const workflow = read('.github/workflows/hall-greybox-tooling.yml');

const IDS = ['H1','H2','H3'];
const CAMERAS = ['entryReveal','orientation','firstTransition','pushkinApproach','pushkinViewing','reverseExit'];
const MOBILE = ['entryReveal','pushkinApproach','pushkinViewing'];
const EXPECTED_METRICS: Record<string,{route:number;turns:number;fingerprint:string}> = {
  H1: {route:32.1462, turns:2, fingerprint:'4c2b886b0c6640edd87ecb457e96e6326adca3896f9eb865e81fcb9285206d6c'},
  H2: {route:53.8854, turns:8, fingerprint:'69ee2718c35f7b7d10ac408a321b5f2b59bb730fb9e8458d757baad4499cc4b7'},
  H3: {route:37.8327, turns:4, fingerprint:'5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65'},
};
const EXPECTED_OUTPUTS = [
  'dimensioned-plan.svg','section-x.svg','section-y.svg','sightlines.svg',
  ...CAMERAS.map(id => `desktop/${id}.png`),
  ...MOBILE.map(id => `mobile/${id}.png`),
];

type Point2 = [number,number];
const EPSILON = 1e-9;
const p2 = (value: number[]): Point2 => [Number(value[0]),Number(value[1])];
const orient = (a:Point2,b:Point2,c:Point2) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const within = (value:number,a:number,b:number) => value >= Math.min(a,b)-EPSILON && value <= Math.max(a,b)+EPSILON;
const onSegment = (a:Point2,b:Point2,p:Point2) => Math.abs(orient(a,b,p)) <= EPSILON && within(p[0],a[0],b[0]) && within(p[1],a[1],b[1]);
function segmentsIntersect(a:Point2,b:Point2,c:Point2,d:Point2) {
  const o1=orient(a,b,c), o2=orient(a,b,d), o3=orient(c,d,a), o4=orient(c,d,b);
  if (((o1>EPSILON&&o2<-EPSILON)||(o1<-EPSILON&&o2>EPSILON)) && ((o3>EPSILON&&o4<-EPSILON)||(o3<-EPSILON&&o4>EPSILON))) return true;
  return (Math.abs(o1)<=EPSILON&&onSegment(a,b,c)) || (Math.abs(o2)<=EPSILON&&onSegment(a,b,d)) || (Math.abs(o3)<=EPSILON&&onSegment(c,d,a)) || (Math.abs(o4)<=EPSILON&&onSegment(c,d,b));
}
function crossingWalls(from:number[],to:number[],walls:number[][]) {
  const a=p2(from), b=p2(to); const hits:number[]=[];
  walls.forEach((wall,index)=>{ if (segmentsIntersect(a,b,[Number(wall[0]),Number(wall[1])],[Number(wall[2]),Number(wall[3])])) hits.push(index+1); });
  return hits;
}

// Current staged authority: metric greybox is complete, topology is selected, camera approval is active but owns no rig yet.
expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001', 'Hall contract identity must remain TLP-HALL-001 schema 1');
expect(contract.phase === 'cameraApproval', 'Hall must advance to cameraApproval only after topology selection');
expect(contract.gates?.foundation === 'completed', 'foundation must remain completed');
expect(contract.gates?.referenceBible === 'completed', 'Reference Bible must remain completed');
expect(contract.gates?.metricGreybox === 'completed', 'metricGreybox must be completed by the topology decision');
expect(contract.gates?.cameraApproval === 'active', 'cameraApproval must be the only newly active gate');
for (const gate of ['materialLightingExportSpike','pushkinVerticalSlice','offlineVisualApproval','webVerticalSlice','fullMuseumScaleOut']) {
  expect(contract.gates?.[gate] === 'blocked', `later Hall gate must remain blocked during camera approval: ${gate}`);
}
expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain a DOM placeholder during camera approval');
expect(contract.productionRoute?.allowLegacyHallImports === false, 'camera approval must not reactivate Hall v2');
expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'camera approval must not activate Three/R3F runtime');
expect(contract.productionRoute?.allowUnapprovedConceptArt === false, 'camera approval must not publish unapproved concept art');
expect(contract.sourceAuthority?.greyboxTooling === toolingPath, 'Hall must retain greybox tooling authority');
expect(contract.sourceAuthority?.greyboxCandidates === candidatesPath, 'Hall must retain greybox candidate authority');
expect(contract.sourceAuthority?.greyboxLayouts === layoutsPath, 'Hall must retain greybox layout authority');
expect(contract.sourceAuthority?.greyboxDecision === decisionPath, 'Hall must register the topology decision record');

expect(reference.status === 'completed', 'Reference Bible must remain completed');
expect(tooling.schemaVersion === 1 && tooling.laneId === contract.laneId && tooling.phase === 'metricGreybox', 'tooling record must remain metric-greybox evidence');
expect(tooling.status === 'completed', 'greybox tooling must become completed evidence after topology selection');
expect(tooling.blender?.releaseSeries === '4.5 LTS' && tooling.blender?.version === '4.5.12' && tooling.blender?.platform === 'linux-x64', 'greybox runtime identity must remain Blender 4.5.12 LTS linux-x64');
expect(tooling.blender?.archiveUrl === 'https://download.blender.org/release/Blender4.5/blender-4.5.12-linux-x64.tar.xz', 'greybox archive URL must remain pinned');
expect(tooling.blender?.checksumIndexUrl === 'https://download.blender.org/release/Blender4.5/blender-4.5.12.sha256', 'greybox checksum URL must remain pinned');
expect(tooling.blender?.autoUpdate === false, 'greybox runtime must not auto-update');
expect(JSON.stringify(tooling.blender?.requiredCli ?? []) === JSON.stringify(['--background','--disable-autoexec','--python-exit-code','--python']), 'headless Blender CLI contract must remain explicit');
expect(tooling.smokeScene?.unitSystem === 'METRIC' && tooling.smokeScene?.lengthUnit === 'METERS' && tooling.smokeScene?.scaleLength === 1, 'tooling must preserve metre units');
expect(tooling.smokeScene?.humanProxyHeightMetres === 1.75, 'tooling must preserve the 1.75 m human proxy');
expect(tooling.smokeScene?.roundTripSaveReopen === true, 'tooling must preserve save/reopen proof');
expect(tooling.smokeScene?.renderRequired === false && tooling.smokeScene?.materialsRequired === false && tooling.smokeScene?.lightsRequired === false, 'tooling smoke must remain pre-lookdev');
expect(tooling.evidence?.retainInGit === false, 'generated Blender binaries must remain Actions evidence');
expect(tooling.candidateManifest === candidatesPath, 'tooling must retain candidate manifest link');

expect(candidates.schemaVersion === 1 && candidates.laneId === contract.laneId && candidates.phase === 'metricGreybox', 'candidate manifest must remain metric-greybox evidence');
expect(candidates.status === 'selected', 'candidate manifest must record completed selection');
expect(candidates.approvedCandidate === 'H3', 'H3 must be the single selected topology');
expect(candidates.decisionRecord === decisionPath, 'candidate manifest must link the decision record');
expect(candidates.layoutSource === layoutsPath && candidates.generator === generatorPath, 'candidate source authority must remain unchanged');
expect(candidates.cameraSet?.status === 'topology-selected-camera-rig-unapproved', 'camera set must explicitly remain unapproved after topology selection');
expect(JSON.stringify(candidates.cameraSet?.lensCandidatesMm ?? []) === JSON.stringify([35]), '35 mm must remain only the authoring benchmark lens');
expect(candidates.cameraSet?.approvedRig === null, 'topology selection must not approve a camera rig');
expect(JSON.stringify((candidates.candidates ?? []).map((candidate:any)=>candidate.id)) === JSON.stringify(IDS), 'candidate manifest must retain H1/H2/H3');
const sourceCandidates = new Map((candidates.candidates ?? []).map((candidate:any)=>[candidate.id,candidate]));
expect(sourceCandidates.get('H1')?.status === 'reserve' && sourceCandidates.get('H1')?.disposition === 'reserve' && sourceCandidates.get('H1')?.rejected === false, 'H1 must be retained as reserve benchmark');
expect(sourceCandidates.get('H2')?.status === 'rejected' && sourceCandidates.get('H2')?.disposition === 'reject' && sourceCandidates.get('H2')?.rejected === true, 'H2 must be explicitly rejected');
expect((sourceCandidates.get('H2')?.rejectionReasons?.length ?? 0) >= 4, 'H2 rejection must retain concrete reasons');
expect(sourceCandidates.get('H3')?.status === 'selected' && sourceCandidates.get('H3')?.disposition === 'advance' && sourceCandidates.get('H3')?.rejected === false, 'H3 must be the advanced topology');
for (const candidate of candidates.candidates ?? []) {
  expect(candidate.sourceLayoutId === candidate.id, `${candidate.id}: sourceLayoutId must remain stable`);
  expect(candidate.sourceBlend === null && candidate.evidenceManifest === null, `${candidate.id}: generated binaries/manifests must not become git source authority`);
  expect(candidate.routeLengthMetres === null && candidate.forcedTurnCount === null, `${candidate.id}: measured results must remain in decision/generated evidence, not hand-authored candidate source`);
}

const comparison = candidates.equalComparison ?? {};
const refMetrics = reference.metricConstraints ?? {};
expect(comparison.unit === refMetrics.unit, 'candidate units must remain inherited from Reference Bible');
expect(comparison.neutralMaterialOnly === true, 'neutral comparison must remain neutral');
for (const value of [comparison.ornamentAllowed,comparison.bloomAllowed,comparison.fogAllowed,comparison.particlesAllowed,comparison.goldGlowAllowed,comparison.fpsRequired]) expect(value === false, 'neutral comparison may not gain effects/FPS requirements after selection');
expect(comparison.commonHumanProxyHeightMetres === 1.75, 'candidate comparison proxy must remain 1.75 m');
expect(comparison.minimumClearances?.routeOneWay === 0.915 && comparison.minimumClearances?.routeTwoWayRecommended === 1.525, 'route clearance evidence must remain unchanged');
expect(comparison.minimumClearances?.viewingWidth === 0.76 && comparison.minimumClearances?.viewingDepth === 1.22 && comparison.minimumClearances?.headroom === 2.03, 'viewing/headroom evidence must remain unchanged');
expect(JSON.stringify(comparison.requiredCameraWitnesses ?? []) === JSON.stringify(CAMERAS), 'candidate camera witnesses must remain exact');
expect(comparison.mobileCropMinimum === 3, 'candidate mobile witness minimum must remain three');

expect(layouts.schemaVersion === 1 && layouts.laneId === contract.laneId && layouts.phase === 'metricGreybox', 'layout source must remain original metric-greybox authority');
expect(layouts.status === 'authoring', 'layout source is retained as the authored shootout source rather than rewritten by selection');
const common = layouts.common ?? {};
expect(common.unit === 'metres' && common.wallThickness === 0.25 && common.defaultWallHeight === 4.5, 'layout metric construction assumptions must remain unchanged');
expect(common.humanProxyHeightMetres === 1.75 && common.cameraEyeHeightMetres === 1.65 && common.comparisonLensMm === 35, 'layout comparison camera/proxy assumptions must remain unchanged');
expect(JSON.stringify(common.desktopResolution) === JSON.stringify([960,540]) && JSON.stringify(common.mobileResolution) === JSON.stringify([540,960]), 'comparison resolutions must remain unchanged');
expect(common.neutralRenderEngine === 'BLENDER_WORKBENCH', 'neutral evidence must remain Blender Workbench');
expect(JSON.stringify(common.mobileWitnesses ?? []) === JSON.stringify(MOBILE), 'mobile witness set must remain unchanged');
const layoutCandidates = layouts.candidates ?? [];
expect(JSON.stringify(layoutCandidates.map((candidate:any)=>candidate.id)) === JSON.stringify(IDS), 'layout source must retain H1/H2/H3 in shootout order');
for (const candidate of layoutCandidates) {
  expect((candidate.floorPolygon?.length ?? 0) >= 4 && (candidate.walls?.length ?? 0) >= 10 && (candidate.route?.length ?? 0) >= 7, `${candidate.id}: retained layout must remain substantive`);
  expect((candidate.clearanceProbes?.length ?? 0) >= 3, `${candidate.id}: retained layout must preserve clearance probes`);
  expect(candidate.viewingClearance?.size?.[0] >= 0.76 && candidate.viewingClearance?.size?.[1] >= 1.22, `${candidate.id}: retained Pushkin viewing pocket must preserve minimum source dimensions`);
  expect(JSON.stringify(Object.keys(candidate.cameras ?? {})) === JSON.stringify(CAMERAS), `${candidate.id}: retained layout must preserve six certified camera witnesses`);
  for (let index=0; index<(candidate.route?.length ?? 0)-1; index+=1) {
    const hits = crossingWalls(candidate.route[index],candidate.route[index+1],candidate.walls ?? []);
    expect(hits.length === 0, `${candidate.id}: retained route segment ${index+1} crosses walls ${hits.join(',')}`);
  }
  for (const cameraId of CAMERAS) {
    const camera = candidate.cameras?.[cameraId];
    const hits = Array.isArray(camera?.position) && Array.isArray(camera?.nextDestination) ? crossingWalls(camera.position,camera.nextDestination,candidate.walls ?? []) : [-1];
    expect(hits.length === 0, `${candidate.id}/${cameraId}: retained certified source sightline crosses walls ${hits.join(',')}`);
  }
}

expect(decision.schemaVersion === 1 && decision.laneId === contract.laneId && decision.decision === 'topology-select-reject', 'decision record identity must be exact');
expect(decision.status === 'approved-for-camera-evaluation', 'decision must only approve topology for camera evaluation');
expect(decision.phaseTransition?.from === 'metricGreybox' && decision.phaseTransition?.to === 'cameraApproval', 'decision phase transition must be metricGreybox → cameraApproval');
expect(decision.selectedCandidate === 'H3' && decision.reserveCandidate === 'H1', 'decision must advance H3 and retain H1 reserve');
expect(JSON.stringify(decision.rejectedCandidates ?? []) === JSON.stringify(['H2']), 'decision must reject only H2');
expect(decision.candidateEvidence?.productPr === 376, 'decision must cite candidate-authoring PR #376');
expect(decision.candidateEvidence?.testedHead === '70aeb9c1aca4414d9cade3cb9cdcfb887b7ea806', 'decision must cite the exact tested candidate head');
expect(decision.candidateEvidence?.resultingMain === '66dabcdcff5fa0fc8ad8fde44544432e4a144e4d', 'decision must cite the resulting candidate-authoring main');
expect(decision.candidateEvidence?.artifactId === 9021765090, 'decision must cite the exact candidate artifact ID');
expect(decision.candidateEvidence?.artifactDigest === 'sha256:598b2a60df72d9457e9b7620b5b7ea94fb59af8e0db60e11d334fbaaa94e8318', 'decision must cite the candidate artifact digest');
expect(decision.candidateEvidence?.testedHeadWitness === 'tested_commit=70aeb9c1aca4414d9cade3cb9cdcfb887b7ea806', 'decision must cite embedded tested-head witness');
expect(decision.candidateEvidence?.blenderVersion === '4.5.12 LTS' && decision.candidateEvidence?.blenderBuildHash === '84afd5f785f7', 'decision must cite exact Blender evidence');
expect(decision.candidateEvidence?.comparisonLensMm === 35 && decision.candidateEvidence?.humanProxyHeightMetres === 1.75, 'decision must retain equal comparison instrumentation');
expect(decision.candidateEvidence?.certifiedCameraWitnessCount === 18 && decision.candidateEvidence?.portraitMobileWitnessCount === 9 && decision.candidateEvidence?.pixelStableWitnessCount === 27, 'decision must retain evidence completeness counts');
expect(decision.candidateEvidence?.materials === 0 && decision.candidateEvidence?.lights === 0, 'decision must come from neutral evidence');
for (const id of IDS) {
  const recorded = decision.candidates?.[id]; const expected = EXPECTED_METRICS[id];
  expect(recorded?.routeLengthMetres === expected.route && recorded?.forcedTurnCount === expected.turns, `${id}: decision metrics must match exact Blender evidence`);
  expect(recorded?.layoutFingerprint === expected.fingerprint, `${id}: decision fingerprint must match exact Blender evidence`);
  expect((recorded?.reason?.length ?? 0) >= 80, `${id}: disposition must retain substantive rationale`);
}
expect(decision.candidates?.H1?.disposition === 'reserve', 'H1 decision disposition must be reserve');
expect(decision.candidates?.H2?.disposition === 'reject', 'H2 decision disposition must be reject');
expect(decision.candidates?.H3?.disposition === 'advance', 'H3 decision disposition must be advance');
expect(decision.candidates?.H2?.routeLengthMetres > decision.candidates?.H3?.routeLengthMetres && decision.candidates?.H2?.forcedTurnCount > decision.candidates?.H3?.forcedTurnCount, 'H2 rejection must retain its higher route/turn cost evidence');
expect(decision.cameraBoundary?.approvedRig === null, 'topology decision must not approve a camera rig');
expect(decision.cameraBoundary?.comparisonLensMm === 35 && decision.cameraBoundary?.comparisonLensStatus === 'benchmark-only-not-approved', '35 mm must remain benchmark-only');
expect((decision.cameraBoundary?.knownIssues ?? []).includes('pushkin-viewing-portrait-too-close-flat'), 'camera boundary must retain the known Pushkin portrait framing defect');
expect((decision.cameraBoundary?.nextRequiredWitnesses?.length ?? 0) >= 8, 'camera approval must define its next evidence package');
for (const [name,value] of Object.entries(decision.nonDecisions ?? {})) expect(value === null, `selection must keep later decision null: ${name}`);
expect((decision.selectionRules ?? []).includes('no-geometry-edits-inside-selection-transaction'), 'selection record must prohibit geometry edits inside the decision transaction');
expect((decision.selectionRules ?? []).includes('topology-selection-does-not-approve-camera'), 'selection record must keep camera approval separate');
expect((decision.selectionRules ?? []).includes('topology-selection-does-not-open-lookdev'), 'selection record must keep lookdev blocked');

for (const token of ['EXPECTED_VERSION = (4, 5, 12)','scene.render.engine = "BLENDER_WORKBENCH"','len(bpy.data.materials) != 0','len(bpy.data.lights) != 0','bpy.ops.wm.save_as_mainfile','bpy.ops.wm.open_mainfile','layoutFingerprint']) expect(generator.includes(token), `candidate generator lost neutral invariant: ${token}`);
for (const forbidden of ['bpy.data.materials.new','bpy.data.lights.new','BLENDER_EEVEE','BLENDER_EEVEE_NEXT','CYCLES','Bloom','bloom','fog','particle']) expect(!generator.includes(forbidden), `candidate generator must remain pre-lookdev: ${forbidden}`);
for (const token of ['EXPECTED_VERSION = (4, 5, 12)','bpy.app.background','read_factory_settings(use_empty=True)','scene.unit_settings.system = "METRIC"','scene.unit_settings.scale_length = 1.0','save_as_mainfile','open_mainfile']) expect(smoke.includes(token), `tooling smoke lost invariant: ${token}`);
expect(!smoke.includes('bpy.ops.render') && !smoke.includes('bpy.data.materials.new') && !smoke.includes('bpy.data.lights.new'), 'tooling smoke must remain pre-render/pre-lookdev');

const scripts = packageJson.scripts ?? {};
expect(scripts['validate:hall-topology-selection'] === `tsx ${validatorPath}`, 'package scripts must expose persistent topology-selection validator');
expect(scripts.check?.includes('validate:hall-topology-selection') === true, 'normal project check must run topology-selection validator');
expect(!scripts.check?.includes('validate:hall-greybox-tooling') && !scripts.check?.includes('validate:hall-greybox-candidates'), 'normal project check must not run superseded authoring-only validators');
expect(ci.includes('npm run validate:hall-topology-selection'), 'primary CI must run topology-selection validator');
expect(projectContracts.includes('npm run validate:hall-topology-selection'), 'Project contracts must independently run topology-selection validator');
expect(workflow.includes(`'${decisionPath}'`) || workflow.includes(`- '${decisionPath}'`), 'Hall workflow paths must include topology decision record');
expect(workflow.includes(`'${validatorPath}'`) || workflow.includes(`- '${validatorPath}'`), 'Hall workflow paths must include persistent selection validator');
expect(workflow.includes('TESTED_SHA: ${{ github.event.pull_request.head.sha || github.sha }}'), 'Hall workflow must derive literal exact PR head');
expect(workflow.includes('ref: ${{ env.TESTED_SHA }}') && workflow.includes('git rev-parse HEAD') && workflow.includes('hall-greybox-tested-head.txt'), 'Hall workflow must prove and retain exact checkout identity');
expect(workflow.includes('sha256sum -c') && workflow.includes('libegl1'), 'Hall workflow must preserve vendor checksum and minimal headless EGL dependency');
expect(workflow.includes('npm run validate:hall-topology-selection'), 'Hall workflow must use persistent selection validator');

const toolingEvidenceRelative = process.env.HALL_GREYBOX_TOOLING_EVIDENCE;
if (toolingEvidenceRelative) {
  expect(exists(toolingEvidenceRelative), `tooling evidence must exist: ${toolingEvidenceRelative}`);
  if (exists(toolingEvidenceRelative)) {
    const evidence = JSON.parse(read(toolingEvidenceRelative)) as any;
    expect(evidence.schemaVersion === 1 && evidence.laneId === contract.laneId && evidence.phase === 'metricGreybox', 'generated tooling evidence identity must remain metricGreybox');
    expect(JSON.stringify(evidence.runtime?.versionTuple ?? []) === JSON.stringify([4,5,12]) && evidence.runtime?.buildHash === '84afd5f785f7' && evidence.runtime?.background === true, 'generated tooling evidence must prove exact Blender runtime');
    expect(evidence.scene?.unitSystem === 'METRIC' && evidence.scene?.lengthUnit === 'METERS' && evidence.scene?.scaleLength === 1 && evidence.scene?.humanProxyHeightMetres === 1.75, 'generated tooling evidence must prove metre scale/proxy');
    expect(evidence.scene?.materials === 0 && evidence.scene?.lights === 0 && evidence.roundTripSaveReopen === true && evidence.rendered === false, 'generated tooling smoke must remain neutral save/reopen evidence');
  }
}

const candidateEvidenceRelative = process.env.HALL_GREYBOX_CANDIDATE_EVIDENCE;
if (candidateEvidenceRelative) {
  expect(exists(candidateEvidenceRelative), `candidate evidence index must exist: ${candidateEvidenceRelative}`);
  if (exists(candidateEvidenceRelative)) {
    const evidenceRoot = path.dirname(path.join(root,candidateEvidenceRelative));
    const index = JSON.parse(read(candidateEvidenceRelative)) as any;
    expect(index.schemaVersion === 1 && index.laneId === contract.laneId && index.phase === 'metricGreybox', 'generated candidate artifact must remain neutral metric-greybox evidence');
    expect(JSON.stringify(index.runtime?.versionTuple ?? []) === JSON.stringify([4,5,12]) && index.runtime?.buildHash === '84afd5f785f7', 'generated candidates must use exact Blender runtime');
    expect(index.comparisonLensMm === 35 && index.approvedCandidate === null, 'generated shootout must remain 35 mm neutral evidence with no winner embedded');
    expect(JSON.stringify(index.candidateOrder ?? []) === JSON.stringify(IDS), 'generated candidate order must remain H1/H2/H3');
    for (const id of IDS) {
      expect(index.routeLengthsMetres?.[id] === EXPECTED_METRICS[id].route, `${id}: generated route length must match selected evidence`);
      expect(index.forcedTurnCounts?.[id] === EXPECTED_METRICS[id].turns, `${id}: generated forced-turn count must match selected evidence`);
      const manifestPath = path.join(evidenceRoot,id,'manifest.json');
      expect(fs.existsSync(manifestPath), `${id}: generated manifest must exist`);
      if (!fs.existsSync(manifestPath)) continue;
      const generated = JSON.parse(fs.readFileSync(manifestPath,'utf8')) as any;
      expect(generated.layoutFingerprint === EXPECTED_METRICS[id].fingerprint, `${id}: current layout must reproduce the exact selected fingerprint`);
      expect(generated.route?.lengthMetres === EXPECTED_METRICS[id].route && generated.route?.forcedTurnCount === EXPECTED_METRICS[id].turns, `${id}: generated metrics must reproduce decision evidence`);
      expect(generated.runtime?.buildHash === '84afd5f785f7' && generated.runtime?.background === true, `${id}: generated manifest must retain exact Blender runtime/background`);
      expect(generated.scene?.unitSystem === 'METRIC' && generated.scene?.lengthUnit === 'METERS' && generated.scene?.scaleLength === 1, `${id}: generated scene must remain metric after save/reopen`);
      expect(generated.scene?.comparisonLensMm === 35 && generated.scene?.humanProxyHeightMetres === 1.75, `${id}: generated scene must retain common comparison instrumentation`);
      expect(generated.scene?.materials === 0 && generated.scene?.lights === 0, `${id}: generated scene must remain neutral`);
      for (const probe of generated.clearanceProbes ?? []) {
        expect(probe.clear === true && probe.measuredWidthMetres >= 0.915, `${id}/${probe.id}: generated clearance probe must remain clear and at least one-way minimum`);
      }
      expect(generated.viewingClearance?.clear === true && generated.viewingClearance?.meetsMinimumWitness === true, `${id}: Pushkin viewing pocket must remain clear/minimum compliant`);
      for (const cameraId of CAMERAS) {
        const witness = generated.cameraWitnesses?.[cameraId];
        expect(witness?.visible === true && witness?.occluder === null, `${id}/${cameraId}: generated certified sightline must remain valid`);
      }
      expect(generated.cameraWitnesses?.pushkinViewing?.expectedVisibleObject === 'EXHIBIT_alexander-pushkin' && generated.cameraWitnesses?.pushkinViewing?.hitObject === 'EXHIBIT_alexander-pushkin', `${id}: Pushkin viewing ray must first hit the intended exhibit proxy`);
      expect(generated.render?.engine === 'BLENDER_WORKBENCH' && generated.render?.lookdev === false, `${id}: generated render must remain neutral Workbench evidence`);
      const outputs = new Map((generated.outputs ?? []).map((entry:any)=>[entry.path,entry]));
      expect(outputs.has(`${id}.blend`), `${id}: generated .blend witness must exist`);
      for (const relative of EXPECTED_OUTPUTS) expect(outputs.has(relative), `${id}: generated output missing ${relative}`);
      for (const [relative,entry] of outputs) {
        const absolute = path.join(evidenceRoot,id,String(relative));
        expect(fs.existsSync(absolute), `${id}: output file missing on disk: ${relative}`);
        if (fs.existsSync(absolute)) {
          expect((entry as any).bytes === fs.statSync(absolute).size && (entry as any).sha256 === sha256File(absolute), `${id}: output hash/size mismatch: ${relative}`);
        }
      }
    }
  }
}

if (failures.length) {
  console.error('\nHall v3 topology-selection validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Hall v3 topology selection passed: H3 selected, H1 reserve, H2 rejected; camera rig remains unapproved.');
