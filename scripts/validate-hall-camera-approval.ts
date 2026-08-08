import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative: string) => fs.existsSync(path.join(root, relative));
const sha1GitBlob = (content: Buffer) => crypto.createHash('sha1').update(`blob ${content.byteLength}\0`).update(content).digest('hex');
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const contract = JSON.parse(read('docs/hall-v3/hall-v3-contract.json')) as any;
const candidates = JSON.parse(read('docs/hall-v3/greybox-candidates.json')) as any;
const decision = JSON.parse(read('docs/hall-v3/greybox-decision.json')) as any;
const rigsPath = 'docs/hall-v3/camera-rigs.json';
const generatorPath = 'scripts/hall-camera/generate-camera-candidates.py';
const rigs = JSON.parse(read(rigsPath)) as any;
const generator = read(generatorPath);
const layoutsBuffer = fs.readFileSync(path.join(root, 'docs/hall-v3/greybox-layouts.json'));
const frozenGeneratorBuffer = fs.readFileSync(path.join(root, 'scripts/hall-greybox/generate-candidates.py'));
const packageJson = JSON.parse(read('package.json')) as any;
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const hallWorkflow = read('.github/workflows/hall-greybox-tooling.yml');

const witnesses = ['entryReveal','orientation','firstTransition','pushkinApproach','pushkinViewing','reverseExit'];
const mobileWitnesses = ['entryReveal','pushkinApproach','pushkinViewing'];
const rigIds = ['R0','R1','R2','R3'];
const expectedLayoutBlob = 'b3def316d855a6539ffd280217ed63e22c6855d9';
const expectedGeneratorBlob = '7f5dbe64d61880031819a5d4e855e5c6b7285ef3';
const expectedH3Fingerprint = '5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65';

type Point2 = [number, number];
const EPSILON = 1e-9;
const p2 = (value: number[]): Point2 => [Number(value[0]), Number(value[1])];
const orient = (a: Point2, b: Point2, c: Point2) => (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
const within = (v: number, a: number, b: number) => v >= Math.min(a,b)-EPSILON && v <= Math.max(a,b)+EPSILON;
const onSegment = (a: Point2,b: Point2,p: Point2) => Math.abs(orient(a,b,p)) <= EPSILON && within(p[0],a[0],b[0]) && within(p[1],a[1],b[1]);
function segmentsIntersect(a: Point2,b: Point2,c: Point2,d: Point2) {
  const o1=orient(a,b,c), o2=orient(a,b,d), o3=orient(c,d,a), o4=orient(c,d,b);
  if (((o1>EPSILON&&o2<-EPSILON)||(o1<-EPSILON&&o2>EPSILON)) && ((o3>EPSILON&&o4<-EPSILON)||(o3<-EPSILON&&o4>EPSILON))) return true;
  return (Math.abs(o1)<=EPSILON&&onSegment(a,b,c)) || (Math.abs(o2)<=EPSILON&&onSegment(a,b,d)) || (Math.abs(o3)<=EPSILON&&onSegment(c,d,a)) || (Math.abs(o4)<=EPSILON&&onSegment(c,d,b));
}
function crossingWalls(from: number[], to: number[], walls: number[][]) {
  const a=p2(from), b=p2(to); const hits:number[]=[];
  walls.forEach((wall,index)=>{ if (segmentsIntersect(a,b,[Number(wall[0]),Number(wall[1])],[Number(wall[2]),Number(wall[3])])) hits.push(index+1); });
  return hits;
}
function cameraCore(camera: any) {
  return { position: camera?.position, target: camera?.target, nextDestination: camera?.nextDestination, lensMm: Number(camera?.lensMm) };
}
function frozenCameraCore(camera: any) {
  return { position: camera?.position, target: camera?.target, nextDestination: camera?.nextDestination, lensMm: 35 };
}

expect(contract.laneId === 'TLP-HALL-001' && contract.phase === 'cameraApproval', 'camera validator requires TLP-HALL-001 cameraApproval phase');
expect(contract.gates?.foundation === 'completed' && contract.gates?.referenceBible === 'completed' && contract.gates?.metricGreybox === 'completed', 'earlier Hall gates must remain completed');
expect(contract.gates?.cameraApproval === 'active', 'cameraApproval gate must remain active during candidate authoring');
for (const gate of ['materialLightingExportSpike','pushkinVerticalSlice','offlineVisualApproval','webVerticalSlice','fullMuseumScaleOut']) expect(contract.gates?.[gate] === 'blocked', `later Hall gate must remain blocked during camera approval: ${gate}`);
expect(contract.productionRoute?.mode === 'placeholder' && contract.productionRoute?.allowThreeRuntimeImports === false, 'camera approval must not activate production Hall/WebGL');
expect(contract.sourceAuthority?.cameraRigs === rigsPath, 'Hall source authority must point to camera-rigs.json');
expect(candidates.approvedCandidate === 'H3', 'Camera Approval must operate only on selected H3 topology');
expect(candidates.cameraSet?.approvedRig === null, 'candidate manifest must keep approvedRig=null until Camera Approval decision');
expect(decision.selectedCandidate === 'H3', 'topology decision must retain H3 selection');

expect(sha1GitBlob(layoutsBuffer) === expectedLayoutBlob, 'Camera Approval must not mutate frozen greybox-layouts.json');
expect(sha1GitBlob(frozenGeneratorBuffer) === expectedGeneratorBlob, 'Camera Approval must not mutate frozen greybox generator');
expect(rigs.schemaVersion === 1 && rigs.laneId === 'TLP-HALL-001' && rigs.phase === 'cameraApproval', 'camera rig manifest identity mismatch');
expect(rigs.status === 'candidate-authoring' && rigs.selectedTopology === 'H3' && rigs.approvedRig === null, 'camera candidate source must remain unapproved H3-only authoring');
expect(rigs.frozenTopologyAuthority?.layoutBlob === expectedLayoutBlob && rigs.frozenTopologyAuthority?.generatorBlob === expectedGeneratorBlob, 'camera source must cite frozen topology blobs');
expect(rigs.frozenTopologyAuthority?.selectedLayoutFingerprint === expectedH3Fingerprint, 'camera source must cite selected H3 fingerprint');
expect(rigs.cameraGenerator === generatorPath, 'camera source must point to canonical camera generator');
expect(same(rigs.render?.desktopResolution,[960,540]) && same(rigs.render?.mobileResolution,[540,960]), 'camera render resolutions must remain 960x540 / 540x960');
expect(same(rigs.render?.desktopWitnesses,witnesses) && same(rigs.render?.mobileWitnesses,mobileWitnesses), 'camera witness sets drifted');
for (const key of ['geometryMayChange','materialsMayChange','lightsMayChange','exhibitProxyMayChange','freeLookAllowed','fpsRequired']) expect(rigs.comparisonRules?.[key] === false, `camera comparison rule must keep ${key}=false`);
expect(rigs.comparisonRules?.baselineFiveWitnessesFrozen === true && rigs.comparisonRules?.reducedMotionRequiresDirectDestinations === true && rigs.comparisonRules?.humanApprovalRequired === true, 'camera comparison must freeze five witnesses and retain reduced-motion/human approval');
expect(rigs.knownBaselineFailure?.rigId === 'R0' && rigs.knownBaselineFailure?.witness === 'pushkinViewing', 'known R0 viewing failure must remain explicit');
expect(same((rigs.rigs ?? []).map((rig:any)=>rig.id),rigIds), 'camera source must compare R0/R1/R2/R3 in order');

const frozenLayouts = JSON.parse(layoutsBuffer.toString('utf8')) as any;
const h3 = (frozenLayouts.candidates ?? []).find((candidate:any)=>candidate.id === 'H3');
expect(Boolean(h3), 'frozen layout source must retain H3');
const r0 = rigs.rigs?.[0];
for (const rig of rigs.rigs ?? []) {
  expect(['benchmark','candidate','rejected'].includes(rig.status), `${rig.id}: invalid camera rig status`);
  if (rig.status === 'rejected') {
    expect((rig.rejectionReasons?.length ?? 0) >= 1, `${rig.id}: rejected rig must retain an explicit rejection reason`);
    expect(rig.expectedFailure?.witness === 'pushkinViewing' && rig.expectedFailure?.hitObject === 'HUMAN_PROXY', `${rig.id}: rejected rig must retain the reproduced HUMAN_PROXY occlusion witness`);
  } else {
    expect(rig.rejectionReasons === undefined && rig.expectedFailure === undefined, `${rig.id}: non-rejected rig must not carry rejection metadata`);
  }
  expect(same(Object.keys(rig.cameras ?? {}),witnesses), `${rig.id}: must define six witnesses in canonical order`);
  for (const witness of witnesses) {
    const camera = rig.cameras?.[witness];
    expect(Array.isArray(camera?.position) && camera.position.length === 3, `${rig.id}/${witness}: position must be 3D`);
    expect(Array.isArray(camera?.target) && camera.target.length === 3, `${rig.id}/${witness}: target must be 3D`);
    expect(Array.isArray(camera?.nextDestination) && camera.nextDestination.length === 3, `${rig.id}/${witness}: nextDestination must be 3D`);
    expect(Number(camera?.lensMm) >= 24 && Number(camera?.lensMm) <= 50, `${rig.id}/${witness}: lens must stay in bounded 24–50 mm study range`);
    expect((camera?.note?.length ?? 0) >= 8, `${rig.id}/${witness}: camera note is required`);
    if (rig.id === 'R0') expect(same(cameraCore(camera),frozenCameraCore(h3?.cameras?.[witness])), `R0/${witness}: benchmark camera geometry/lens must equal frozen H3 witness`);
    if (witness !== 'pushkinViewing' && rig.id !== 'R0') expect(same(cameraCore(camera),cameraCore(r0?.cameras?.[witness])), `${rig.id}/${witness}: proven H3 camera geometry/lens drifted from R0`);
    if (witness !== 'pushkinViewing') {
      const hits = crossingWalls(camera.position,camera.nextDestination,h3?.walls ?? []);
      expect(hits.length === 0, `${rig.id}/${witness}: camera-to-next-destination segment crosses walls ${hits.join(',')}`);
    }
  }
  const viewing = rig.cameras?.pushkinViewing;
  if (viewing && h3?.pushkin?.anchor?.center) {
    const hits = crossingWalls(viewing.position,h3.pushkin.anchor.center,h3.walls ?? []);
    expect(hits.length === 0, `${rig.id}/pushkinViewing: source sightline to Pushkin anchor crosses walls ${hits.join(',')}`);
  }
}
const viewingFingerprints = new Set((rigs.rigs ?? []).map((rig:any)=>JSON.stringify(cameraCore(rig.cameras?.pushkinViewing))));
expect(viewingFingerprints.size === 4, 'R0/R1/R2/R3 must retain four materially distinct Pushkin viewing cameras');

for (const token of ['EXPECTED_VERSION = (4, 5, 12)','bpy.ops.wm.open_mainfile','geometry_fingerprint()','camera candidate generation mutated frozen H3 geometry','scene.render.engine != "BLENDER_WORKBENCH"','len(bpy.data.materials) != 0','len(bpy.data.lights) != 0','world_to_camera_view','pushkinViewingFraming','CAMERA_COLLECTION = "COLL_CAMERA_APPROVAL"']) expect(generator.includes(token), `camera generator lost required invariant: ${token}`);
for (const forbidden of ['bpy.ops.mesh.','bpy.data.meshes.new','bpy.data.materials.new','bpy.data.lights.new','save_as_mainfile','BLENDER_EEVEE','CYCLES']) expect(!generator.includes(forbidden), `camera generator must not mutate geometry/lookdev or save a new scene: ${forbidden}`);

const scripts = packageJson.scripts ?? {};
expect(scripts['validate:hall-camera-approval'] === 'tsx scripts/validate-hall-camera-approval.ts', 'package scripts must expose camera approval validator');
expect(scripts.check?.includes('validate:hall-camera-approval') === true, 'normal check must run camera approval validator');
expect(ci.includes('npm run validate:hall-camera-approval'), 'primary CI must run camera approval validator');
expect(projectContracts.includes('npm run validate:hall-camera-approval'), 'Project contracts must run camera approval validator');
expect(hallWorkflow.includes(generatorPath) && hallWorkflow.includes('HALL_CAMERA_APPROVAL_EVIDENCE'), 'Hall Blender workflow must generate and validate camera evidence');
expect(hallWorkflow.includes('hall-camera-candidates-${{ github.event.pull_request.head.sha || github.sha }}'), 'Hall Blender workflow must upload exact-head camera artifact');

const evidenceRelative = process.env.HALL_CAMERA_APPROVAL_EVIDENCE;
if (evidenceRelative) {
  expect(exists(evidenceRelative), `camera evidence index must exist: ${evidenceRelative}`);
  if (exists(evidenceRelative)) {
    const indexPath = path.join(root,evidenceRelative);
    const evidenceRoot = path.dirname(indexPath);
    const index = JSON.parse(fs.readFileSync(indexPath,'utf8')) as any;
    expect(index.schemaVersion === 1 && index.laneId === 'TLP-HALL-001' && index.phase === 'cameraApproval', 'camera evidence index identity mismatch');
    expect(index.status === 'candidate-evidence' && index.selectedTopology === 'H3' && index.approvedRig === null, 'generated camera evidence must remain unapproved H3 evidence');
    expect(same(index.runtime?.versionTuple,[4,5,12]) && (index.runtime?.buildHash?.length ?? 0) >= 8, 'camera evidence runtime must be Blender 4.5.12 with build hash');
    expect(index.sourceLayoutFingerprint === expectedH3Fingerprint && same(index.candidateOrder,rigIds), 'camera evidence source/order mismatch');
    const geometryFingerprints = new Set<string>();
    const viewingSummaries = new Set<string>();
    for (const rigId of rigIds) {
      const sourceRig = (rigs.rigs ?? []).find((rig:any)=>rig.id === rigId);
      const manifestPath = path.join(evidenceRoot,rigId,'manifest.json');
      expect(fs.existsSync(manifestPath), `${rigId}: camera manifest missing`);
      if (!fs.existsSync(manifestPath)) continue;
      const manifest = JSON.parse(fs.readFileSync(manifestPath,'utf8')) as any;
      expect(manifest.rigId === rigId && manifest.selectedTopology === 'H3' && manifest.approvedRig === null, `${rigId}: generated identity mismatch`);
      expect(manifest.rigStatus === sourceRig?.status, `${rigId}: generated disposition must match camera source`);
      expect(manifest.source?.layoutFingerprint === expectedH3Fingerprint, `${rigId}: source topology fingerprint drifted`);
      expect(manifest.source?.geometryFingerprintBefore === manifest.source?.geometryFingerprintAfter, `${rigId}: frozen geometry changed during camera evidence`);
      geometryFingerprints.add(manifest.source?.geometryFingerprintBefore);
      expect(manifest.source?.materials === 0 && manifest.source?.lights === 0, `${rigId}: camera evidence introduced materials/lights`);
      expect(same(manifest.render?.desktopWitnesses,witnesses) && same(manifest.render?.mobileWitnesses,mobileWitnesses), `${rigId}: render witness set drifted`);
      expect(same(manifest.render?.desktopResolution,[960,540]) && same(manifest.render?.mobileResolution,[540,960]), `${rigId}: render resolution drifted`);
      for (const witness of witnesses) {
        const generatedWitness = manifest.cameraWitnesses?.[witness];
        const expectedFailure = sourceRig?.status === 'rejected' && witness === sourceRig?.expectedFailure?.witness;
        if (expectedFailure) {
          expect(generatedWitness?.visible === false, `${rigId}/${witness}: rejected witness unexpectedly became visible`);
          expect(generatedWitness?.hitObject === sourceRig?.expectedFailure?.hitObject, `${rigId}/${witness}: rejected witness must reproduce ${sourceRig?.expectedFailure?.hitObject}`);
        } else {
          expect(generatedWitness?.visible === true, `${rigId}/${witness}: generated camera witness is occluded`);
        }
      }
      for (const mode of ['desktop','mobile']) {
        const framing = manifest.pushkinViewingFraming?.[mode];
        expect(typeof framing?.anchor?.visibleAreaFraction === 'number' && typeof framing?.anchor?.fullyInsideFrame === 'boolean', `${rigId}/${mode}: anchor framing metrics missing`);
        expect(typeof framing?.documentCase01?.visibleAreaFraction === 'number' && typeof framing?.documentCase02?.visibleAreaFraction === 'number', `${rigId}/${mode}: document framing metrics missing`);
      }
      const outputPaths = new Set((manifest.outputs ?? []).map((output:any)=>output.path));
      for (const witness of witnesses) expect(outputPaths.has(`desktop/${witness}.png`), `${rigId}: missing desktop/${witness}.png`);
      for (const witness of mobileWitnesses) expect(outputPaths.has(`mobile/${witness}.png`), `${rigId}: missing mobile/${witness}.png`);
      viewingSummaries.add(JSON.stringify({lens:manifest.cameraWitnesses?.pushkinViewing?.lensMm,distance:manifest.cameraWitnesses?.pushkinViewing?.distanceMetres,desktop:manifest.pushkinViewingFraming?.desktop?.anchor,mobile:manifest.pushkinViewingFraming?.mobile?.anchor}));
    }
    expect(geometryFingerprints.size === 1, 'all camera rigs must use one identical frozen H3 geometry fingerprint');
    expect(viewingSummaries.size === 4, 'generated R0/R1/R2/R3 viewing evidence must remain materially distinct');
  }
}

if (failures.length) {
  console.error('\nHall v3 Camera Approval validation failed:');
  failures.forEach((failure)=>console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Hall v3 Camera Approval invariants passed: frozen H3 topology, camera-only R0/R1/R2/R3 comparison with explicit R2 rejection, approvedRig=null${evidenceRelative ? ', generated Blender evidence verified' : ''}.`);
