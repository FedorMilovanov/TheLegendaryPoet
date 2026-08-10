import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative: string) => fs.existsSync(path.join(root, relative));
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const sha256File = (absolute: string) => `sha256:${crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex')}`;

const contractPath = 'docs/hall-v3/pushkin-offline-exhibit.json';
const ownerPath = 'docs/hall-v3/pushkin-owner-disposition.json';
const slicePath = 'docs/hall-v3/pushkin-slice.json';
const acquisitionPath = 'docs/hall-v3/pushkin-acquisition.json';
const hallContractPath = 'docs/hall-v3/hall-v3-contract.json';
const prepScriptPath = 'scripts/hall-pushkin/prepare-offline-source-assets.mjs';
const libraryScriptPath = 'scripts/hall-pushkin/generate-offline-exhibit.py';
const runnerScriptPath = 'scripts/hall-pushkin/run-offline-exhibit.py';
const sequenceScriptPath = 'scripts/hall-pushkin/render-offline-sequence.py';
const validatorPath = 'scripts/validate-hall-pushkin-offline-exhibit.ts';
const workflowPath = '.github/workflows/hall-pushkin-offline-exhibit.yml';

for (const required of [contractPath, ownerPath, slicePath, acquisitionPath, hallContractPath, prepScriptPath, libraryScriptPath, runnerScriptPath, sequenceScriptPath, validatorPath]) {
  expect(exists(required), `missing Pushkin offline exhibit authority: ${required}`);
}

const contract = JSON.parse(read(contractPath)) as any;
const owner = JSON.parse(read(ownerPath)) as any;
const slice = JSON.parse(read(slicePath)) as any;
const acquisition = JSON.parse(read(acquisitionPath)) as any;
const hallContract = JSON.parse(read(hallContractPath)) as any;
const runner = read(runnerScriptPath);
const sequenceRunner = read(sequenceScriptPath);
const prep = read(prepScriptPath);
const library = read(libraryScriptPath);
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const EXPECTED_H3_LAYOUT = '5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65';
const EXPECTED_H3_GEOMETRY = 'b3de770858a423305db8fcab15b405414e66b3d3de93ab1deaa5b3b35b418777';
const PORTRAIT_HASH = 'sha256:316d5f366a46f23cd0a181e570f2d09a6b0d12bc368dab18fdb394b8b8b8bf4b';
const ONEGIN_HASH = 'sha256:d629c10943cbf6428eabb194ee5c17c1b763c27108a2238eaf72fadb275643e5';
const EXPECTED_R1 = { id: 'R1-pushkinViewing', position: [8.0,2.5,1.6], target: [11.15,5.45,1.95], lensMm: 28 };
const EXPECTED_STILL_IDS = [
  '01-r1-hero','02-approach','03-portrait-close','04-frame-material','05-onegin-medium',
  '06-onegin-close','07-room-context','08-side-light','09-mobile-portrait','10-mobile-onegin',
];

expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001' && contract.productIssue === 369, 'offline exhibit contract identity must remain exact');
expect(contract.phase === 'pushkinVerticalSlice' && contract.status === 'offline-exhibit-authoring', 'offline exhibit contract must remain in authoring state until human visual approval');
expect(contract.source?.topology === 'H3' && contract.source?.layoutFingerprint === EXPECTED_H3_LAYOUT && contract.source?.meshGeometryFingerprint === EXPECTED_H3_GEOMETRY, 'offline exhibit must derive from frozen H3 authority');
expect(contract.source?.approvedRig === 'R1' && contract.source?.lightingBaseline === 'L0-minimal-runtime' && contract.source?.surfaceUv === 'UV0', 'offline exhibit must retain R1/L0/UV0 authority');
expect(contract.source?.ownerAuthority === ownerPath && contract.source?.sliceAuthority === slicePath, 'offline exhibit must bind owner/slice authority');
expect(same(contract.approvedCameraWitness, EXPECTED_R1), 'offline exhibit primary R1 witness drifted');
expect(contract.exhibit?.nodeName === 'EXHIBIT_alexander-pushkin', 'offline exhibit canonical Pushkin node drifted');
expect(same(contract.exhibit?.anchor?.center, [11.15,5.45,2.0]) && Number(contract.exhibit?.anchor?.rotationZ) === -1.30, 'offline exhibit anchor must remain at frozen H3 Pushkin location');
expect((contract.exhibit?.documentCases ?? []).length === 2, 'offline exhibit must retain two frozen H3 document case anchors');
expect(contract.exhibit?.heroPortrait?.assetId === 'pushkin-kiprensky-1827-portrait' && contract.exhibit?.heroPortrait?.sourceHash === PORTRAIT_HASH, 'hero portrait must bind exact verified Kiprensky source');
expect(contract.exhibit?.oneginTitlePage?.assetId === 'pushkin-onegin-1833-edition' && contract.exhibit?.oneginTitlePage?.sourceHash === ONEGIN_HASH && contract.exhibit?.oneginTitlePage?.sourcePdfPageIndex === 0, 'Onegin display must bind exact verified PDF and title page index');
expect(contract.exhibit?.contextCase?.mode === 'editorial-context-only-no-facsimile', 'context case may not fabricate documentary facsimile');
expect((contract.artDirection?.forbidden ?? []).includes('fake-autograph') && (contract.artDirection?.forbidden ?? []).includes('generated-historical-facsimile'), 'art direction must forbid fake autograph/facsimile');
expect(contract.offlineLighting?.evidenceOnly === true && contract.offlineLighting?.productionLightingAuthorityUnchanged === 'L0-minimal-runtime', 'offline lookdev lights may not become production lighting authority');
expect((contract.offlineLighting?.lights ?? []).length === 3, 'offline exhibit should retain bounded three-light art-direction rig');
expect(contract.evidence?.renderEngine === 'BLENDER_EEVEE_NEXT', 'offline exhibit evidence must use deterministic Eevee Next renderer');
expect(contract.evidence?.stillCount === 10 && (contract.evidence?.stills ?? []).length === 10, 'offline exhibit must require exactly ten fixed evidence stills');
expect(same((contract.evidence?.stills ?? []).map((entry: any) => entry.id), EXPECTED_STILL_IDS), 'offline exhibit still evidence IDs drifted');
expect(same(contract.evidence?.desktopResolution, [1280,720]) && same(contract.evidence?.mobileResolution, [720,1280]), 'offline exhibit still resolutions drifted');
expect(contract.evidence?.cameraSequence?.durationSeconds === 24 && contract.evidence?.cameraSequence?.fps === 24 && same(contract.evidence?.cameraSequence?.resolution, [960,540]), 'offline exhibit camera sequence must remain 24s/24fps/960x540');
expect((contract.evidence?.cameraSequence?.keyframes ?? []).length === 5, 'offline exhibit camera sequence must retain five authored waypoints');
expect(contract.evidence?.rawGlbRequired === true && contract.evidence?.optimizedGlbRequired === true && contract.evidence?.khronosBeforeAndAfter === true, 'offline exhibit delivery proof must require raw+optimized Khronos validation');
expect(contract.evidence?.visualInspectionRequired === true && contract.evidence?.humanOwnerApprovalRequired === true, 'offline exhibit cannot self-promote visual approval');
expect(contract.productionBoundary?.productionAsset === false && contract.productionBoundary?.documentaryProductionShippingAllowed === false && contract.productionBoundary?.productionWebglMayBegin === false && contract.productionBoundary?.offlineVisualApprovalMayPromoteFromGenerator === false, 'offline exhibit contract may not promote production/runtime/gates');

expect(owner.status === 'owner-offline-authoring-authorized' && owner.offlineAuthoring?.authorized === true && owner.offlineAuthoring?.productionShippingAuthorizedByThisDecision === false, 'offline exhibit requires exact owner authoring authority without production shipping');
expect(slice.status === 'offline-authoring-authorized-production-rights-pending' && slice.productionBoundary?.offlineSourceEvidenceMediaAllowed === true && slice.productionBoundary?.productionManifestAllowed === false, 'slice must allow offline evidence while production remains blocked');
expect(acquisition.currentOutcome?.offlineBlenderSourceEvidenceAllowed === true && acquisition.currentOutcome?.productionManifestAllowed === false && acquisition.currentOutcome?.productionWebglMayBegin === false, 'acquisition authority must allow only bounded offline source evidence');
expect(hallContract.productionRoute?.mode === 'placeholder' && hallContract.productionRoute?.allowThreeRuntimeImports === false, 'production /hall must remain lightweight placeholder during offline exhibit authoring');

expect(prep.includes("hostname !== 'upload.wikimedia.org'") && prep.includes('source hash mismatch'), 'offline source preparation must re-download exact Wikimedia bytes and verify hashes');
expect(prep.includes("pdftoppm") && prep.includes("'-f', '1'") && prep.includes("'-r', '240'"), 'Onegin offline title page must be deterministic page-1 240 DPI derivative');
expect(runner.includes('bpy.ops.file.pack_all()') && runner.includes('productionManifestAllowed') && runner.includes('humanOwnerVisualApprovalRequired'), 'offline exhibit runner must pack source textures and retain fail-closed production boundary');
expect(sequenceRunner.includes('packed blend hash does not match still evidence') && sequenceRunner.includes('offline-exhibit-generated-awaiting-human-visual-approval'), 'separate sequence runner must bind the packed still scene before final evidence');
expect(library.includes('PUSHKIN_HERO_PORTRAIT') && library.includes('PUSHKIN_ONEGIN_PAGE') && library.includes('editorial-context'), 'offline exhibit library must author real portrait/publication/context geometry');
expect(!library.includes('fake-autograph') && !library.includes('AI-generated historical'), 'offline exhibit generator must not author fake documentary material');

if (exists(workflowPath)) {
  const workflow = read(workflowPath);
  expect(workflow.includes('prepare-offline-source-assets.mjs') && workflow.includes('run-offline-exhibit.py') && workflow.includes('render-offline-sequence.py'), 'offline exhibit workflow must run exact source preparation, still authoring and the separate sequence renderer');
  expect(workflow.includes('blender-4.5.12-linux-x64.tar.xz') && workflow.includes('sha256sum -c'), 'offline exhibit workflow must pin/checksum Blender 4.5.12');
  expect(workflow.includes('gltf-validator@2.0.0-dev.3.10') && workflow.includes('gltfpack@1.2.0'), 'offline exhibit workflow must pin isolated glTF tools');
  expect(workflow.includes('ffprobe-sequence.json') && workflow.includes('validate-hall-pushkin-offline-exhibit') && workflow.includes('Upload Pushkin offline exhibit evidence'), 'offline exhibit workflow must probe, validate and upload final walkthrough evidence');
}

const evidenceDirValue = process.env.HALL_PUSHKIN_OFFLINE_EVIDENCE_DIR;
if (evidenceDirValue) {
  const evidenceDir = path.resolve(evidenceDirValue);
  const evidencePath = path.join(evidenceDir, 'offline-exhibit-evidence.json');
  const rawReportPath = path.join(evidenceDir, 'gltf-raw-report.json');
  const optimizedReportPath = path.join(evidenceDir, 'gltf-optimized-report.json');
  const optimizedGlbPath = path.join(evidenceDir, 'pushkin-offline-optimized.glb');
  const contactSheetPath = path.join(evidenceDir, 'contact-sheet.png');
  const ffprobePath = path.join(evidenceDir, 'ffprobe-sequence.json');
  for (const required of [evidencePath, rawReportPath, optimizedReportPath, optimizedGlbPath, contactSheetPath, ffprobePath]) {
    expect(fs.existsSync(required), `generated offline exhibit evidence missing: ${path.basename(required)}`);
  }
  if (fs.existsSync(evidencePath)) {
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    expect(evidence.status === 'offline-exhibit-generated-awaiting-human-visual-approval', 'generated exhibit must stop before human visual approval');
    expect(evidence.runtime?.versionTuple?.[0] === 4 && evidence.runtime?.versionTuple?.[1] === 5 && evidence.runtime?.versionTuple?.[2] === 12, 'generated exhibit must use Blender 4.5.12');
    expect(evidence.runtime?.renderEngine === 'BLENDER_EEVEE_NEXT', 'generated exhibit renderer drifted');
    expect(evidence.source?.topology === 'H3' && evidence.source?.layoutFingerprint === EXPECTED_H3_LAYOUT && evidence.source?.meshGeometryFingerprint === EXPECTED_H3_GEOMETRY, 'generated exhibit source H3 fingerprints drifted');
    expect(evidence.source?.approvedRig === 'R1' && evidence.source?.portraitSourceHash === PORTRAIT_HASH && evidence.source?.oneginSourceHash === ONEGIN_HASH, 'generated exhibit exact source/R1 authority drifted');
    expect(SHA256.test(evidence.source?.oneginDerivativeHash ?? ''), 'generated Onegin derivative must have exact hash');
    expect(evidence.source?.oneginSourcePdfPageIndex === 0, 'generated Onegin derivative must remain title-page index 0');
    expect(Number(evidence.scene?.exhibitMeshObjects) >= 15 && Number(evidence.scene?.exhibitTriangles) > 0, 'generated exhibit must contain substantive authored mesh geometry');
    expect(Number(evidence.scene?.materials) >= 6 && Number(evidence.scene?.offlineLights) === 3 && Number(evidence.scene?.stillCameras) === 10, 'generated exhibit material/light/camera inventory drifted');
    const stills = Array.isArray(evidence.stills) ? evidence.stills : [];
    expect(stills.length === 10 && same(stills.map((entry: any) => entry.id), EXPECTED_STILL_IDS), 'generated exhibit must produce ten ordered stills');
    for (const still of stills) {
      const stillPath = path.join(evidenceDir, still.path ?? '');
      expect(fs.existsSync(stillPath), `missing generated still ${still.id}`);
      if (fs.existsSync(stillPath)) {
        expect(Number(still.bytes) === fs.statSync(stillPath).size && Number(still.bytes) > 20_000, `${still.id} must be a non-trivial evidence PNG`);
        expect(still.sha256 === sha256File(stillPath), `${still.id} evidence hash drifted`);
      }
    }
    const videoPath = path.join(evidenceDir, evidence.cameraSequence?.path ?? '');
    expect(fs.existsSync(videoPath), 'offline camera sequence video missing');
    if (fs.existsSync(videoPath)) {
      const actualVideoBytes = fs.statSync(videoPath).size;
      expect(evidence.cameraSequence?.status === 'rendered', 'offline camera sequence evidence must be rendered before final validation');
      expect(Number(evidence.cameraSequence?.bytes) === actualVideoBytes && actualVideoBytes > 100_000, 'offline camera sequence must be a non-trivial MP4');
      expect(evidence.cameraSequence?.sha256 === sha256File(videoPath), 'offline camera sequence hash drifted');
      expect(Number(evidence.cameraSequence?.durationSeconds) === 24 && Number(evidence.cameraSequence?.fps) === 24, 'offline camera sequence semantic duration/fps drifted');
      expect(Number(evidence.cameraSequence?.frameCount) >= 576 && Number(evidence.cameraSequence?.frameCount) <= 577, 'offline camera sequence frame count drifted beyond authored 24s boundary');
      if (fs.existsSync(ffprobePath)) {
        const probe = JSON.parse(fs.readFileSync(ffprobePath, 'utf8')) as any;
        const streams = Array.isArray(probe.streams) ? probe.streams : [];
        const videoStream = streams.find((entry: any) => entry.codec_name === 'h264') ?? streams[0];
        const probeWidth = Number(videoStream?.width);
        const probeHeight = Number(videoStream?.height);
        const [rateNumerator, rateDenominator] = String(videoStream?.r_frame_rate ?? '').split('/').map(Number);
        const probeFps = rateDenominator ? rateNumerator / rateDenominator : Number.NaN;
        const probeFrames = Number(videoStream?.nb_frames);
        const probeDuration = Number(probe.format?.duration);
        const probeBytes = Number(probe.format?.size);
        expect(videoStream?.codec_name === 'h264', 'ffprobe must independently identify the walkthrough codec as H.264');
        expect(probeWidth === 960 && probeHeight === 540, 'ffprobe walkthrough dimensions must be exactly 960x540');
        expect(Number.isFinite(probeFps) && Math.abs(probeFps - 24) < 0.001, 'ffprobe walkthrough frame rate must be 24 fps');
        expect(Number.isFinite(probeFrames) && probeFrames >= 576 && probeFrames <= 577, 'ffprobe walkthrough frame count must remain within the authored 24s boundary');
        expect(probeFrames === Number(evidence.cameraSequence?.frameCount), 'ffprobe frame count must match the independently recorded Blender evidence');
        expect(Number.isFinite(probeDuration) && probeDuration >= 23.95 && probeDuration <= 24.10, 'ffprobe walkthrough duration must be approximately 24 seconds');
        expect(probeBytes === actualVideoBytes && probeBytes === Number(evidence.cameraSequence?.bytes), 'ffprobe byte size must match the actual MP4 and Blender evidence');
      }
    }
    const blendPath = path.join(evidenceDir, evidence.files?.blend?.path ?? '');
    const rawGlbPath = path.join(evidenceDir, evidence.files?.rawGlb?.path ?? '');
    for (const [label, filePath, declared] of [['blend',blendPath,evidence.files?.blend],['rawGlb',rawGlbPath,evidence.files?.rawGlb]] as const) {
      expect(fs.existsSync(filePath), `offline exhibit ${label} missing`);
      if (fs.existsSync(filePath)) {
        expect(Number(declared?.bytes) === fs.statSync(filePath).size && declared?.sha256 === sha256File(filePath), `offline exhibit ${label} identity drifted`);
      }
    }
    expect(evidence.files?.blend?.packedSourceImages === true, 'offline exhibit .blend must pack source images');
    expect(evidence.productionBoundary?.productionAsset === false && evidence.productionBoundary?.productionManifestAllowed === false && evidence.productionBoundary?.documentaryProductionShippingAllowed === false && evidence.productionBoundary?.productionWebglMayBegin === false && evidence.productionBoundary?.offlineVisualApprovalPromoted === false && evidence.productionBoundary?.humanOwnerVisualApprovalRequired === true, 'generated evidence may not self-promote production or visual approval');
  }
  for (const reportPath of [rawReportPath, optimizedReportPath]) {
    if (!fs.existsSync(reportPath)) continue;
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    expect(Number(report?.issues?.numErrors ?? 999) === 0, `${path.basename(reportPath)} must have zero Khronos errors`);
    expect(Number(report?.issues?.numWarnings ?? 999) === 0, `${path.basename(reportPath)} must have zero Khronos warnings`);
  }
  if (fs.existsSync(optimizedGlbPath)) {
    expect(fs.statSync(optimizedGlbPath).size > 0 && SHA256.test(sha256File(optimizedGlbPath)), 'optimized exhibit GLB must have exact non-empty identity');
  }
}

if (failures.length) {
  console.error('Hall Pushkin offline exhibit validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Hall Pushkin offline exhibit authority passed${evidenceDirValue ? ': exact H3/R1 source scene, ten stills, ffprobe-verified 24s sequence, packed blend and raw/optimized Khronos evidence remain bounded before human visual approval' : ': source/owner/art-direction/evidence contract is internally consistent and production remains blocked'}.`);
