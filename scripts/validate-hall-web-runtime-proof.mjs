import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

const required = [
  'qa/hall-web-runtime/index.html',
  'qa/hall-web-runtime/main.ts',
  'qa/hall-web-runtime/styles.css',
  'qa/hall-web-runtime/vite.config.ts',
  'qa/hall-web-runtime/playwright.config.mjs',
  'qa/hall-web-runtime.spec.mjs',
  '.github/workflows/hall-web-runtime-proof.yml',
];
for (const file of required) expect(exists(file), `missing Hall web runtime proof source: ${file}`);

const hallPage = read('src/pages/HallPage.tsx');
const harness = read('qa/hall-web-runtime/main.ts');
const harnessHtml = read('qa/hall-web-runtime/index.html');
const harnessStyles = read('qa/hall-web-runtime/styles.css');
const proofWorkflow = read('.github/workflows/hall-web-runtime-proof.yml');
const legacyReadme = read('src/components/hall/README.md');
const greyboxDecision = JSON.parse(read('docs/hall-v3/greybox-decision.json'));
const cameraDecision = JSON.parse(read('docs/hall-v3/camera-decision.json'));
const materialDecision = JSON.parse(read('docs/hall-v3/material-decision.json'));
const hallContract = JSON.parse(read('docs/hall-v3/hall-v3-contract.json'));

expect(!hallPage.includes('@react-three/') && !hallPage.includes("from 'three'") && !hallPage.includes('from "three"'), 'production HallPage must remain free of Three/R3F imports');
expect(!hallPage.includes('hall-web-runtime'), 'production HallPage must not import or link the isolated web proof');
expect(hallContract.productionRoute?.mode === 'placeholder' && hallContract.productionRoute?.allowThreeRuntimeImports === false, 'production Hall route must remain placeholder/fail-closed');
expect(hallContract.gates?.webVerticalSlice === 'blocked' && hallContract.gates?.fullMuseumScaleOut === 'blocked', 'web/full scale-out gates may not be promoted by the proof transaction');

expect(greyboxDecision.selectedCandidate === 'H3', 'web proof requires frozen H3 topology authority');
expect(greyboxDecision.candidates?.H3?.layoutFingerprint === '5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65', 'H3 layout fingerprint drifted');
expect(cameraDecision.selectedTopology === 'H3' && cameraDecision.selectedRig === 'R1', 'web proof requires selected R1 camera authority');
expect(materialDecision.lightingDecision?.selected === 'L0-minimal-runtime', 'web proof requires selected L0 lighting authority');
expect(materialDecision.uvDecision?.surfaceMaterialUv === 'UV0', 'web proof requires UV0 surface authority');

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
  ['hall-web-runtime-proof-${{ env.TESTED_SHA }}', [proofWorkflow]],
]) expect(sources.some((source) => source.includes(token)), `Hall web proof missing required contract token: ${token}`);

expect(!harness.includes('src/components/hall') && !harness.includes('FirstPersonControls') && !harness.includes('HallOfPoets'), 'Hall v2 implementation may not become web proof authority');
expect(legacyReadme.includes('retired/dormant Hall v2 prototype'), 'legacy Hall boundary marker must remain explicit');
expect(!/https?:\/\//.test(harness), 'browser proof must not fetch remote documentary/runtime media');
expect(!/\.jpe?g|\.png|\.webp|\.avif|\.pdf|\.glb|\.gltf/i.test(harness), 'browser proof must not embed documentary/image/GLB asset paths in this transaction');
expect(!/PointerLockControls|FirstPerson|WASD|free.?walk/i.test(harness), 'web proof must remain guided and must not reintroduce FPS/free-walk controls');
expect(harness.includes('new THREE.HemisphereLight') && harness.includes('new THREE.AmbientLight'), 'L0 proof must use minimal non-shadow runtime lighting');
expect(harness.includes('activeRenderer.shadowMap.enabled = false'), 'web proof must keep realtime shadow maps disabled');
expect(harness.includes('proofState.metrics.drawCalls') && harness.includes('proofState.metrics.triangles') && harness.includes('proofState.metrics.textures'), 'web proof must expose measurable renderer metrics');
expect(harnessHtml.includes('noindex,nofollow'), 'isolated Hall proof document must remain non-indexable');

if (failures.length) {
  console.error('Hall web runtime proof validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall web runtime proof contract: OK — isolated H3/R1/L0/UV0 harness, guided camera, no documentary media, no legacy authority, production /hall unchanged.');
