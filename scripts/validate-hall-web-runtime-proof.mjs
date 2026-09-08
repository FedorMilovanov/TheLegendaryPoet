import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

const required = [
  'docs/hall-v3/web-runtime-proof.json',
  'docs/hall-v3/web-vertical-slice-owner-direction.json',
  'qa/hall-web-runtime/index.html',
  'qa/hall-web-runtime/main.ts',
  'qa/hall-web-runtime/styles.css',
  'qa/hall-web-runtime/vite.config.ts',
  'qa/hall-web-runtime/tsconfig.json',
  'qa/hall-web-runtime/playwright.config.mjs',
  'qa/hall-web-runtime.spec.mjs',
  'qa/hall-production-route.spec.mjs',
  'src/pages/HallPage.tsx',
  'src/components/hall-v3/HallProductionRuntime.tsx',
  '.github/workflows/hall-web-runtime-proof.yml',
];
for (const file of required) expect(exists(file), `missing Hall web runtime source: ${file}`);

const hallPage = read('src/pages/HallPage.tsx');
const productionRuntime = read('src/components/hall-v3/HallProductionRuntime.tsx');
const harness = read('qa/hall-web-runtime/main.ts');
const harnessHtml = read('qa/hall-web-runtime/index.html');
const harnessStyles = read('qa/hall-web-runtime/styles.css');
const harnessTsconfig = read('qa/hall-web-runtime/tsconfig.json');
const productionSpec = read('qa/hall-production-route.spec.mjs');
const proofWorkflow = read('.github/workflows/hall-web-runtime-proof.yml');
const legacyReadme = read('src/components/hall/README.md');
const greyboxDecision = JSON.parse(read('docs/hall-v3/greybox-decision.json'));
const cameraDecision = JSON.parse(read('docs/hall-v3/camera-decision.json'));
const materialDecision = JSON.parse(read('docs/hall-v3/material-decision.json'));
const hallContract = JSON.parse(read('docs/hall-v3/hall-v3-contract.json'));
const webProofContract = JSON.parse(read('docs/hall-v3/web-runtime-proof.json'));
const ownerDirection = JSON.parse(read('docs/hall-v3/web-vertical-slice-owner-direction.json'));

expect(webProofContract.schemaVersion === 1 && webProofContract.laneId === 'TLP-HALL-WEB-PROOF-001' && webProofContract.productIssue === 463, 'isolated web runtime proof contract identity must remain exact');
expect(webProofContract.productionBoundary?.productionRouteActivated === false && webProofContract.productionBoundary?.productionAcceptance === false, 'historical isolated proof contract must remain non-production evidence');
expect(webProofContract.productionBoundary?.documentaryMediaAllowed === false && webProofContract.runtimeContract?.documentaryMedia === 'excluded', 'isolated proof must continue to exclude documentary media');
expect(webProofContract.runtimeContract?.freeWalkAllowed === false && webProofContract.runtimeContract?.reducedMotionBehavior === 'deterministic-cut', 'isolated proof must remain guided and reduced-motion deterministic');
expect(webProofContract.thresholds?.applicationTextureSourcesMax === 0 && webProofContract.thresholds?.rendererTexturesMax === 1, 'isolated proof texture budgets drifted');

expect(ownerDirection.productIssue === 465 && ownerDirection.status === 'owner-directed-production-web-slice-authorized', 'production activation must have a separate explicit owner-direction record');
expect(ownerDirection.productionAuthorization?.threeWebglRuntimeAllowed === true, 'owner direction must explicitly allow bounded production Three/WebGL');
expect(ownerDirection.productionAuthorization?.rightsPendingDocumentaryMediaAllowed === false, 'owner direction must keep rights-pending documentary media excluded');
expect(ownerDirection.preservedBoundaries?.documentaryRightsApprovedByThisDecision === false, 'production activation must not fabricate documentary rights approval');
expect(ownerDirection.preservedBoundaries?.offlineVisualApprovalPromotedByThisDecision === false, 'production activation must not fabricate documentary visual approval');

expect(hallContract.phase === 'webVerticalSlice', 'Hall machine contract must advance to webVerticalSlice for Product #465');
expect(hallContract.productionRoute?.mode === 'web-vertical-slice' && hallContract.productionRoute?.allowThreeRuntimeImports === true, 'production Hall route must explicitly own the web vertical slice');
expect(hallContract.productionRoute?.allowRightsPendingDocumentaryMedia === false, 'production Hall contract must keep rights-pending documentary media excluded');
expect(hallContract.gates?.webVerticalSlice === 'active' && hallContract.gates?.fullMuseumScaleOut === 'blocked', 'web slice must be active while full scale-out remains blocked');
expect(hallContract.gates?.offlineVisualApproval === 'blocked', 'documentary offline visual approval must remain unpromoted');

expect(!hallPage.includes('@react-three/') && !hallPage.includes("from 'three'") && !hallPage.includes('from "three"'), 'HallPage must remain free of eager Three/R3F imports');
expect(hallPage.includes('HallProductionRuntime'), 'HallPage must mount the bounded Hall v3 production runtime');
expect(productionRuntime.includes("await import('three')"), 'production runtime must secondary-lazy-load Three after route mount');
expect(productionRuntime.includes("greybox-layouts.json") && productionRuntime.includes("camera-decision.json") && productionRuntime.includes("material-decision.json"), 'production runtime must consume canonical H3/R1/L0/UV0 authority');
expect(productionRuntime.includes('EXHIBIT_alexander-pushkin_NEUTRAL_PROXY'), 'production runtime must use neutral non-facsimile exhibit proxy');
expect(productionRuntime.includes("documentaryMedia = 'excluded'"), 'production runtime must mark documentary media excluded');
expect(productionRuntime.includes('webglcontextlost') && productionRuntime.includes("fallback('webgl-unavailable')"), 'production runtime must own unavailable/context-loss fallbacks');
expect(productionRuntime.includes("matchMedia('(prefers-reduced-motion: reduce)')"), 'production runtime must respect reduced motion');
expect(!/https?:\/\//.test(productionRuntime), 'production runtime must not fetch remote documentary media');
expect(!/\.jpe?g|\.png|\.webp|\.avif|\.pdf|\.glb|\.gltf/i.test(productionRuntime), 'production runtime must not embed documentary/image/GLB asset paths in Product #465');
expect(!/\b(?:TextureLoader|CubeTextureLoader|DataTexture|CanvasTexture|VideoTexture|CompressedTexture|KTX2Loader)\b/.test(productionRuntime), 'production runtime must not create application/documentary texture sources');
expect(!/PointerLockControls|FirstPerson|WASD|OrbitControls/i.test(productionRuntime), 'production runtime must remain guided and must not introduce free-walk controls');

expect(greyboxDecision.selectedCandidate === webProofContract.authority?.topology, 'isolated proof topology must match frozen H3 authority');
expect(greyboxDecision.candidates?.H3?.layoutFingerprint === webProofContract.authority?.layoutFingerprint, 'isolated proof layout fingerprint must match H3 authority');
expect(cameraDecision.selectedTopology === 'H3' && cameraDecision.selectedRig === webProofContract.authority?.cameraRig, 'isolated proof camera must match R1 authority');
expect(materialDecision.lightingDecision?.selected === webProofContract.authority?.lighting, 'isolated proof lighting must match L0 authority');
expect(materialDecision.uvDecision?.surfaceMaterialUv === webProofContract.authority?.surfaceUv, 'isolated proof UV must match UV0 authority');

for (const [token, sources] of [
  ["from '../../docs/hall-v3/greybox-layouts.json'", [harness]],
  ["from '../../docs/hall-v3/camera-decision.json'", [harness]],
  ["from '../../docs/hall-v3/material-decision.json'", [harness]],
  ["documentaryMedia: 'excluded'", [harness]],
  ["cameraStopNames = ['entryReveal', 'orientation', 'firstTransition', 'pushkinApproach', 'pushkinViewing', 'reverseExit']", [harness]],
  ['forceWebglFailure', [harness]],
  ['webglcontextlost', [harness]],
  ['prefers-reduced-motion: reduce', [harnessStyles]],
  ['TESTED_SHA:', [proofWorkflow]],
  ['qa/hall-production-route.spec.mjs', [proofWorkflow]],
  ['--project=chromium-core --project=android-pixel7 --project=iphone-safari', [proofWorkflow]],
  ['hall-web-runtime-proof-${{ env.TESTED_SHA }}', [proofWorkflow]],
]) expect(sources.some((source) => source.includes(token)), `Hall web proof missing required contract token: ${token}`);

expect(harnessTsconfig.includes('"extends": "../../tsconfig.json"'), 'isolated Hall proof must inherit repository TypeScript contract');
expect(!harness.includes('src/components/hall') && !harness.includes('FirstPersonControls') && !harness.includes('HallOfPoets'), 'Hall v2 must not become isolated proof authority');
expect(legacyReadme.includes('retired/dormant Hall v2 prototype'), 'legacy Hall boundary marker must remain explicit');
expect(harnessHtml.includes('noindex,nofollow'), 'isolated Hall proof document must remain non-indexable');
expect(productionSpec.includes("`${BASE_URL}/hall`"), 'production browser acceptance must target the real /hall route');
expect(productionSpec.includes('semantic fallback when WebGL is unavailable'), 'production browser acceptance must certify WebGL-unavailable fallback');
expect(productionSpec.includes('real WebGL context loss'), 'production browser acceptance must certify real context-loss behavior');

if (failures.length) {
  console.error('Hall web runtime proof validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall web runtime proof contract: OK — historical isolated proof remains immutable evidence; owner-directed production /hall activation is separately bounded, documentary-free, guided, lazy and browser-certified.');
