import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative: string) => fs.existsSync(path.join(root, relative));
const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

const contract = JSON.parse(read('docs/hall-v3/hall-v3-contract.json')) as {
  laneId?: string;
  phase?: string;
  sourceAuthority?: Record<string, string>;
  gates?: Record<string, string>;
  productionRoute?: { mode?: string; allowThreeRuntimeImports?: boolean };
};
const manifestPath = 'docs/hall-v3/greybox-candidates.json';
const layoutsPath = 'docs/hall-v3/greybox-layouts.json';
const generatorPath = 'scripts/hall-greybox/generate-candidates.py';
const manifest = JSON.parse(read(manifestPath)) as any;
const layouts = JSON.parse(read(layoutsPath)) as any;
const generator = read(generatorPath);
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const toolingWorkflow = read('.github/workflows/hall-greybox-tooling.yml');

const ids = ['H1', 'H2', 'H3'];
const cameras = ['entryReveal', 'orientation', 'firstTransition', 'pushkinApproach', 'pushkinViewing', 'reverseExit'];
const mobile = ['entryReveal', 'pushkinApproach', 'pushkinViewing'];

type Point2 = [number, number];
const EPSILON = 1e-9;
const point2 = (value: number[]): Point2 => [Number(value[0]), Number(value[1])];
const orient = (a: Point2, b: Point2, c: Point2) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const within = (value: number, a: number, b: number) => value >= Math.min(a, b) - EPSILON && value <= Math.max(a, b) + EPSILON;
const onSegment = (a: Point2, b: Point2, p: Point2) => Math.abs(orient(a, b, p)) <= EPSILON && within(p[0], a[0], b[0]) && within(p[1], a[1], b[1]);
function segmentsIntersect(a: Point2, b: Point2, c: Point2, d: Point2) {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  if (((o1 > EPSILON && o2 < -EPSILON) || (o1 < -EPSILON && o2 > EPSILON))
      && ((o3 > EPSILON && o4 < -EPSILON) || (o3 < -EPSILON && o4 > EPSILON))) return true;
  return (Math.abs(o1) <= EPSILON && onSegment(a, b, c))
    || (Math.abs(o2) <= EPSILON && onSegment(a, b, d))
    || (Math.abs(o3) <= EPSILON && onSegment(c, d, a))
    || (Math.abs(o4) <= EPSILON && onSegment(c, d, b));
}
function crossingWalls(from: number[], to: number[], walls: number[][]) {
  const a = point2(from);
  const b = point2(to);
  const hits: number[] = [];
  walls.forEach((wall, index) => {
    if (segmentsIntersect(a, b, [Number(wall[0]), Number(wall[1])], [Number(wall[2]), Number(wall[3])])) hits.push(index + 1);
  });
  return hits;
}

expect(contract.laneId === 'TLP-HALL-001', 'candidate evidence must remain owned by TLP-HALL-001');
expect(contract.phase === 'metricGreybox', 'candidate authoring must remain inside metricGreybox phase');
expect(contract.gates?.foundation === 'completed', 'foundation must remain completed');
expect(contract.gates?.referenceBible === 'completed', 'Reference Bible must remain completed');
expect(contract.gates?.metricGreybox === 'active', 'metricGreybox must remain active');
for (const gate of ['cameraApproval','materialLightingExportSpike','pushkinVerticalSlice','offlineVisualApproval','webVerticalSlice','fullMuseumScaleOut']) {
  expect(contract.gates?.[gate] === 'blocked', `later Hall gate must remain blocked during candidate authoring: ${gate}`);
}
expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain a placeholder during offline greybox authoring');
expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'candidate authoring must not activate Three/R3F runtime');

expect(manifest.layoutSource === layoutsPath, `candidate manifest must point to ${layoutsPath}`);
expect(manifest.generator === generatorPath, `candidate manifest must point to ${generatorPath}`);
expect(manifest.approvedCandidate === null, 'candidate-authoring transaction must not preselect a winner');
expect(manifest.cameraSet?.status === 'common-test-set-selected-not-approved', '35 mm must remain a common test lens, not camera approval');
expect(JSON.stringify(manifest.cameraSet?.lensCandidatesMm ?? []) === JSON.stringify([35]), 'all candidate evidence must use the same provisional 35 mm lens');
expect(manifest.cameraSet?.approvedRig === null, 'camera rig must remain unapproved');
expect(JSON.stringify((manifest.candidates ?? []).map((candidate: any) => candidate.id)) === JSON.stringify(ids), 'candidate manifest must retain H1/H2/H3 only');
for (const candidate of manifest.candidates ?? []) {
  expect(candidate.status === 'source-defined', `${candidate.id}: source must be defined but evidence not yet declared in git`);
  expect(candidate.sourceLayoutId === candidate.id, `${candidate.id}: sourceLayoutId must match candidate id`);
  expect(candidate.sourceBlend === null && candidate.evidenceManifest === null, `${candidate.id}: generated binaries/manifests must remain Actions evidence, not committed source authority`);
  expect(candidate.routeLengthMetres === null && candidate.forcedTurnCount === null, `${candidate.id}: measured metrics must not be hand-entered before Blender generation`);
  expect(candidate.rejected === false && (candidate.rejectionReasons?.length ?? 0) === 0, `${candidate.id}: no candidate may be pre-rejected`);
}

expect(layouts.schemaVersion === 1 && layouts.laneId === 'TLP-HALL-001', 'greybox layouts must use schema 1 and Hall lane ownership');
expect(layouts.phase === 'metricGreybox' && layouts.status === 'authoring', 'greybox layouts must be an authoring source for metricGreybox');
const common = layouts.common ?? {};
expect(common.unit === 'metres', 'candidate layouts must use metres');
expect(common.wallThickness === 0.25, 'candidate layouts must share wall thickness');
expect(common.defaultWallHeight === 4.5, 'candidate layouts must share baseline wall height');
expect(common.humanProxyHeightMetres === 1.75, 'candidate layouts must share 1.75 m human proxy');
expect(common.cameraEyeHeightMetres === 1.65, 'candidate layouts must share provisional camera eye height');
expect(common.comparisonLensMm === 35, 'candidate layouts must share 35 mm comparison lens');
expect(JSON.stringify(common.desktopResolution) === JSON.stringify([960,540]), 'candidate desktop evidence must share 960x540 resolution');
expect(JSON.stringify(common.mobileResolution) === JSON.stringify([540,960]), 'candidate mobile evidence must share 540x960 portrait resolution');
expect(common.neutralRenderEngine === 'BLENDER_WORKBENCH', 'candidate evidence must use neutral Blender Workbench');
expect(JSON.stringify(common.mobileWitnesses ?? []) === JSON.stringify(mobile), 'candidate mobile witness cameras must remain identical');
expect(common.minimumClearances?.routeOneWay === 0.915, 'one-way route witness must remain 0.915 m');
expect(common.minimumClearances?.routeTwoWayRecommended === 1.525, 'two-way route witness must remain 1.525 m');
expect(common.minimumClearances?.viewingWidth === 0.76 && common.minimumClearances?.viewingDepth === 1.22, 'viewing clearance witness must remain 0.76x1.22 m');
expect(common.minimumClearances?.headroom === 2.03, 'headroom witness must remain 2.03 m');

const layoutCandidates = layouts.candidates ?? [];
expect(JSON.stringify(layoutCandidates.map((candidate: any) => candidate.id)) === JSON.stringify(ids), 'layout source must contain H1/H2/H3 in comparison order');
const fingerprints = new Set<string>();
for (const candidate of layoutCandidates) {
  expect((candidate.floorPolygon?.length ?? 0) >= 4, `${candidate.id}: floor polygon must be defined`);
  expect((candidate.walls?.length ?? 0) >= 10, `${candidate.id}: must contain a meaningful wall layout`);
  expect((candidate.ceilingZones?.length ?? 0) >= 4, `${candidate.id}: must contain multiple spatial height zones`);
  expect((candidate.route?.length ?? 0) >= 7, `${candidate.id}: baseline route must contain multiple journey points`);
  expect((candidate.clearanceProbes?.length ?? 0) >= 3, `${candidate.id}: must define at least three clearance probes`);
  expect(candidate.viewingClearance?.size?.[0] >= 0.76 && candidate.viewingClearance?.size?.[1] >= 1.22, `${candidate.id}: Pushkin viewing clearance source must meet inherited minimum dimensions`);
  expect(candidate.pushkin?.anchor && (candidate.pushkin?.documentCases?.length ?? 0) === 2, `${candidate.id}: must use the same Pushkin anchor + two document-case proxy grammar`);
  expect(JSON.stringify(Object.keys(candidate.cameras ?? {})) === JSON.stringify(cameras), `${candidate.id}: must define the exact six common camera witnesses in order`);
  for (let index = 0; index < (candidate.route?.length ?? 0) - 1; index += 1) {
    const hits = crossingWalls(candidate.route[index], candidate.route[index + 1], candidate.walls ?? []);
    expect(hits.length === 0, `${candidate.id}: baseline route segment ${index + 1} crosses wall segments ${hits.join(',')}`);
  }
  for (const cameraId of cameras) {
    const camera = candidate.cameras?.[cameraId];
    expect(Array.isArray(camera?.position) && camera.position.length === 3, `${candidate.id}/${cameraId}: camera position must be 3D`);
    expect(Array.isArray(camera?.target) && camera.target.length === 3, `${candidate.id}/${cameraId}: camera target must be 3D`);
    expect(Array.isArray(camera?.nextDestination) && camera.nextDestination.length === 3, `${candidate.id}/${cameraId}: next-destination witness must be 3D`);
    expect((camera?.note?.length ?? 0) >= 5, `${candidate.id}/${cameraId}: camera witness must explain visible destination`);
    if (Array.isArray(camera?.position) && Array.isArray(camera?.nextDestination)) {
      const hits = crossingWalls(camera.position, camera.nextDestination, candidate.walls ?? []);
      expect(hits.length === 0, `${candidate.id}/${cameraId}: certified sightline crosses wall segments ${hits.join(',')}`);
    }
  }
  const fingerprint = sha256(JSON.stringify({floorPolygon:candidate.floorPolygon,walls:candidate.walls,route:candidate.route,ceilingZones:candidate.ceilingZones}));
  fingerprints.add(fingerprint);
}
expect(fingerprints.size === 3, 'H1/H2/H3 source layouts must be materially distinct');

for (const token of [
  'EXPECTED_VERSION = (4, 5, 12)',
  'scene.render.engine = "BLENDER_WORKBENCH"',
  'scene.display.shading.color_type = "SINGLE"',
  'len(bpy.data.materials) != 0',
  'len(bpy.data.lights) != 0',
  'bpy.ops.wm.save_as_mainfile',
  'bpy.ops.wm.open_mainfile',
  'render_camera(camera, desktop_dir',
  'render_camera(camera, mobile_dir',
  'dimensioned-plan.svg',
  'section-x.svg',
  'section-y.svg',
  'sightlines.svg',
  'layoutFingerprint',
  'approvedCandidate": None',
]) {
  expect(generator.includes(token), `greybox generator is missing required invariant: ${token}`);
}
for (const forbidden of ['bpy.data.materials.new', 'bpy.data.lights.new', 'BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT', 'CYCLES', 'Bloom', 'bloom', 'fog', 'particle']) {
  expect(!generator.includes(forbidden), `neutral greybox generator must not introduce lookdev/effects token: ${forbidden}`);
}

const scripts = packageJson.scripts ?? {};
expect(scripts['validate:hall-greybox-candidates'] === 'tsx scripts/validate-hall-greybox-candidates.ts', 'package scripts must expose candidate validator');
expect(scripts.check?.includes('validate:hall-greybox-candidates') === true, 'normal project check must run candidate source validator');
expect(ci.includes('npm run validate:hall-greybox-candidates'), 'primary CI must run candidate source validator');
expect(projectContracts.includes('npm run validate:hall-greybox-candidates'), 'Project contracts must independently run candidate source validator');
expect(toolingWorkflow.includes(generatorPath), 'Hall greybox workflow must run the canonical candidate generator');
expect(toolingWorkflow.includes('HALL_GREYBOX_CANDIDATE_EVIDENCE'), 'Hall greybox workflow must validate generated candidate evidence');
expect(toolingWorkflow.includes('hall-greybox-candidates-${{ github.event.pull_request.head.sha || github.sha }}'), 'Hall greybox workflow must upload an exact-head candidate artifact');

const evidenceRelative = process.env.HALL_GREYBOX_CANDIDATE_EVIDENCE;
if (evidenceRelative) {
  expect(exists(evidenceRelative), `candidate evidence index must exist: ${evidenceRelative}`);
  if (exists(evidenceRelative)) {
    const evidenceRoot = path.dirname(path.join(root, evidenceRelative));
    const index = JSON.parse(fs.readFileSync(path.join(root, evidenceRelative), 'utf8')) as any;
    expect(index.schemaVersion === 1 && index.laneId === 'TLP-HALL-001' && index.phase === 'metricGreybox', 'candidate evidence index identity must match Hall metricGreybox');
    expect(JSON.stringify(index.runtime?.versionTuple ?? []) === JSON.stringify([4,5,12]), 'candidate evidence must come from exact Blender 4.5.12');
    expect((index.runtime?.buildHash?.length ?? 0) >= 8, 'candidate evidence must record Blender build hash');
    expect(index.comparisonLensMm === 35, 'all generated evidence must use 35 mm comparison lens');
    expect(JSON.stringify(index.candidateOrder ?? []) === JSON.stringify(ids), 'candidate evidence order must be H1/H2/H3');
    expect(index.approvedCandidate === null, 'evidence generation must not select a winner');

    const runtimeFingerprints = new Set<string>();
    for (const candidateId of ids) {
      const manifestFile = path.join(evidenceRoot, candidateId, 'manifest.json');
      expect(fs.existsSync(manifestFile), `${candidateId}: generated manifest must exist`);
      if (!fs.existsSync(manifestFile)) continue;
      const generated = JSON.parse(fs.readFileSync(manifestFile, 'utf8')) as any;
      expect(generated.candidateId === candidateId, `${candidateId}: manifest id must match`);
      expect(JSON.stringify(generated.runtime?.versionTuple ?? []) === JSON.stringify([4,5,12]), `${candidateId}: runtime must be Blender 4.5.12`);
      expect(generated.runtime?.background === true, `${candidateId}: Blender must run headlessly`);
      expect(generated.scene?.unitSystem === 'METRIC' && generated.scene?.lengthUnit === 'METERS' && generated.scene?.scaleLength === 1, `${candidateId}: generated .blend must round-trip metric units`);
      expect(generated.scene?.comparisonLensMm === 35, `${candidateId}: generated cameras must share 35 mm lens`);
      expect(generated.scene?.humanProxyHeightMetres === 1.75, `${candidateId}: generated human proxy must be 1.75 m`);
      expect(generated.scene?.materials === 0 && generated.scene?.lights === 0, `${candidateId}: generated scene must contain zero materials/lights`);
      expect(generated.scene?.cameraObjects === 6, `${candidateId}: generated scene must contain exactly six witness cameras`);
      expect(generated.route?.lengthMetres > 5, `${candidateId}: measured baseline route length must be meaningful`);
      expect(Number.isInteger(generated.route?.forcedTurnCount) && generated.route.forcedTurnCount >= 0, `${candidateId}: forced-turn count must be measured`);
      expect((generated.clearanceProbes?.length ?? 0) >= 3, `${candidateId}: runtime must measure all source clearance probes`);
      const probeWidths = (generated.clearanceProbes ?? []).map((probe: any) => probe.measuredWidthMetres ?? 0);
      expect((generated.clearanceProbes ?? []).every((probe: any) => probe.clear === true && probe.measuredWidthMetres >= 0.915), `${candidateId}: every declared route clearance probe must be clear and at least 0.915 m`);
      expect(probeWidths.filter((width: number) => width >= 1.525).length >= 2, `${candidateId}: at least two route witnesses must support 1.525 m stopping/two-way clearance`);
      expect(generated.viewingClearance?.clear === true && generated.viewingClearance?.meetsMinimumWitness === true, `${candidateId}: Pushkin viewing clearance must be unobstructed and meet minimum dimensions`);
      expect(JSON.stringify(Object.keys(generated.cameraWitnesses ?? {})) === JSON.stringify(cameras), `${candidateId}: runtime must report all six camera witnesses`);
      expect((generated.cameraWitnesses ? Object.values(generated.cameraWitnesses) : []).every((witness: any) => witness.visible === true), `${candidateId}: every certified camera must see its declared next destination without occlusion`);
      expect(generated.render?.engine === 'BLENDER_WORKBENCH' && generated.render?.lookdev === false, `${candidateId}: evidence must remain neutral Workbench, not lookdev`);
      expect(JSON.stringify(generated.render?.desktopResolution) === JSON.stringify([960,540]), `${candidateId}: desktop render resolution must be equal`);
      expect(JSON.stringify(generated.render?.mobileResolution) === JSON.stringify([540,960]), `${candidateId}: mobile render resolution must be equal`);
      expect(JSON.stringify(generated.render?.mobileWitnesses) === JSON.stringify(mobile), `${candidateId}: mobile witness set must be equal`);
      const outputPaths = new Set((generated.outputs ?? []).map((output: any) => output.path));
      for (const cameraId of cameras) expect(outputPaths.has(`desktop/${cameraId}.png`), `${candidateId}: missing desktop evidence ${cameraId}`);
      for (const cameraId of mobile) expect(outputPaths.has(`mobile/${cameraId}.png`), `${candidateId}: missing mobile evidence ${cameraId}`);
      for (const required of [`${candidateId}.blend`,'dimensioned-plan.svg','section-x.svg','section-y.svg','sightlines.svg']) expect(outputPaths.has(required), `${candidateId}: missing generated output ${required}`);
      expect((generated.outputs ?? []).every((output: any) => output.bytes > 0 && /^[0-9a-f]{64}$/.test(output.sha256 ?? '')), `${candidateId}: every generated output must have bytes and SHA-256`);
      if (generated.layoutFingerprint) runtimeFingerprints.add(generated.layoutFingerprint);
    }
    expect(runtimeFingerprints.size === 3, 'generated H1/H2/H3 must retain three distinct layout fingerprints');
  }
}

if (failures.length > 0) {
  console.error('\nHall v3 greybox candidate validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Hall v3 greybox candidate validation passed${evidenceRelative ? ' with generated Blender evidence' : ' (static source contract)'}.`);
