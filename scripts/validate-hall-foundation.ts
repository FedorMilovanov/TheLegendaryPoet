import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };

const contractPath = 'docs/hall-v3/hall-v3-contract.json';
const ownerDirectionPath = 'docs/hall-v3/web-vertical-slice-owner-direction.json';
const hallPagePath = 'src/pages/HallPage.tsx';
const runtimePath = 'src/components/hall-v3/HallProductionRuntime.tsx';
const threeAdapterPath = 'src/components/hall-v3/three-runtime.ts';
const legacyHallDir = 'src/components/hall';
const routeRegistryPath = 'src/routes/routeModules.ts';
const stalePublicConceptPath = 'public/images/hall-preview.webp';

const contract = JSON.parse(read(contractPath)) as {
  schemaVersion?: number;
  laneId?: string;
  productIssue?: number;
  phase?: string;
  tracking?: Record<string, unknown>;
  productionRoute?: {
    path?: string;
    mode?: string;
    module?: string;
    runtimeModule?: string;
    maxRouteBytes?: number;
    allowLegacyHallImports?: boolean;
    allowThreeRuntimeImports?: boolean;
    allowUnapprovedConceptArt?: boolean;
    allowRightsPendingDocumentaryMedia?: boolean;
  };
  legacy?: { sourceDirectory?: string; currentAuthority?: boolean; historicalValidatorMandatory?: boolean };
  sourceAuthority?: Record<string, string>;
  gates?: Record<string, string>;
};
const ownerDirection = JSON.parse(read(ownerDirectionPath)) as {
  productIssue?: number;
  decisionOrigin?: string;
  status?: string;
  authority?: { topology?: string; cameraRig?: string; lighting?: string; surfaceUv?: string; browserProofMerge?: string };
  productionAuthorization?: Record<string, unknown>;
  preservedBoundaries?: Record<string, unknown>;
};
const routeContract = JSON.parse(read('src/routes/route-contract.json')) as {
  routes?: Array<{ id?: string; path?: string; page?: string; module?: string; budgetBytes?: number }>;
};
const projectContract = JSON.parse(read('docs/project-contract.json')) as {
  architecture?: { openLaneIds?: string[] };
  documentation?: { historical?: string[]; supersededTechnicalDocuments?: string[] };
};
const tsConfig = ts.parseConfigFileTextToJson('tsconfig.json', read('tsconfig.json')).config as { exclude?: string[] };

const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
function sourceFiles(relativeDir: string): string[] {
  const absolute = path.join(root, relativeDir);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) return sourceFiles(relative);
    return sourceExtensions.some((extension) => entry.name.endsWith(extension)) ? [relative] : [];
  });
}

function moduleSpecifiers(relativePath: string): string[] {
  const source = read(relativePath);
  const sourceFile = ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true, relativePath.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const specs: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) specs.push(node.moduleSpecifier.text);
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) specs.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const argument = node.arguments[0];
      if (argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) specs.push(argument.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specs;
}

function resolveLocal(importer: string, specifier: string): string | null {
  const clean = specifier.split(/[?#]/, 1)[0];
  let base: string | null = null;
  if (clean.startsWith('@/')) base = path.posix.join('src', clean.slice(2));
  else if (clean.startsWith('.')) base = path.posix.normalize(path.posix.join(path.posix.dirname(importer), clean));
  if (!base) return null;
  const candidates = [base, ...sourceExtensions.map((ext) => `${base}${ext}`), ...sourceExtensions.map((ext) => path.posix.join(base, `index${ext}`))];
  return candidates.find((candidate) => fs.existsSync(path.join(root, candidate)) && fs.statSync(path.join(root, candidate)).isFile()) ?? null;
}

const hallPage = read(hallPagePath);
const runtime = read(runtimePath);
const threeAdapter = read(threeAdapterPath);
const viteConfig = read('vite.config.ts');
const routeRegistry = read(routeRegistryPath);
const hallRoute = routeContract.routes?.find((route) => route.id === 'hall');

expect(contract.schemaVersion === 1, 'Hall contract schemaVersion must remain 1');
expect(contract.laneId === 'TLP-HALL-001', 'Hall historical root identity must remain TLP-HALL-001');
expect(contract.productIssue === 369, 'Hall historical root must remain Product #369');
expect(contract.phase === 'webVerticalSlice', 'Hall phase must be webVerticalSlice for the owner-directed production slice');

for (const gate of ['foundation', 'referenceBible', 'metricGreybox', 'cameraApproval', 'materialLightingExportSpike', 'pushkinVerticalSlice']) {
  expect(contract.gates?.[gate] === 'completed', `Hall gate ${gate} must be completed before production web slice`);
}
expect(contract.gates?.offlineVisualApproval === 'blocked', 'documentary offlineVisualApproval must not be fabricated by the production runtime transaction');
expect(contract.gates?.webVerticalSlice === 'active', 'webVerticalSlice must be the active Hall gate');
expect(contract.gates?.fullMuseumScaleOut === 'blocked', 'full museum scale-out must remain blocked during the first production web slice');

expect(ownerDirection.productIssue === 465, 'web slice owner direction must be owned by Product #465');
expect(ownerDirection.decisionOrigin === 'explicit-project-owner-instruction', 'web slice must retain explicit owner direction provenance');
expect(ownerDirection.status === 'owner-directed-production-web-slice-authorized', 'web slice owner direction status drifted');
expect(ownerDirection.authority?.topology === 'H3', 'production web slice must retain H3 topology');
expect(ownerDirection.authority?.cameraRig === 'R1', 'production web slice must retain R1 camera');
expect(ownerDirection.authority?.lighting === 'L0-minimal-runtime', 'production web slice must retain L0 lighting');
expect(ownerDirection.authority?.surfaceUv === 'UV0', 'production web slice must retain UV0 authority');
expect(ownerDirection.authority?.browserProofMerge === '060103d081485074bbf59e1bf16a2bae1a5d6e29', 'production web slice must retain the certified browser-proof merge anchor');
expect(ownerDirection.productionAuthorization?.threeWebglRuntimeAllowed === true, 'owner direction must explicitly authorize Three/WebGL runtime');
expect(ownerDirection.productionAuthorization?.rightsPendingDocumentaryMediaAllowed === false, 'owner direction must keep rights-pending documentary media excluded');
expect(ownerDirection.productionAuthorization?.fullMuseumScaleOutAuthorized === false, 'owner direction must not silently authorize full museum scale-out');
expect(ownerDirection.preservedBoundaries?.documentaryRightsApprovedByThisDecision === false, 'owner direction must not fabricate documentary rights approval');
expect(ownerDirection.preservedBoundaries?.offlineVisualApprovalPromotedByThisDecision === false, 'owner direction must not fabricate offline visual approval');

expect(contract.productionRoute?.path === '/hall', 'production Hall route must remain /hall');
expect(contract.productionRoute?.mode === 'web-vertical-slice', 'production /hall must be in web-vertical-slice mode');
expect(contract.productionRoute?.module === hallPagePath, 'production Hall route must remain owned by HallPage');
expect(contract.productionRoute?.runtimeModule === runtimePath, 'production Hall runtime module must be explicit in the machine contract');
expect(contract.productionRoute?.allowLegacyHallImports === false, 'production Hall must continue to forbid legacy Hall imports');
expect(contract.productionRoute?.allowThreeRuntimeImports === true, 'web vertical slice must explicitly allow its bounded Three runtime');
expect(contract.productionRoute?.allowUnapprovedConceptArt === false, 'unapproved concept art must remain excluded');
expect(contract.productionRoute?.allowRightsPendingDocumentaryMedia === false, 'rights-pending documentary media must remain excluded');
expect(contract.legacy?.currentAuthority === false, 'legacy Hall v2 must remain non-authoritative');
expect(contract.legacy?.historicalValidatorMandatory === false, 'legacy Hall validator must remain historical only');
expect(tsConfig.exclude?.includes(legacyHallDir) === true, 'legacy Hall v2 must remain excluded from the current TypeScript contract');

expect(hallRoute?.path === '/hall' && hallRoute.page === 'HallPage' && hallRoute.module === hallPagePath, 'route contract Hall identity drifted');
expect(typeof hallRoute?.budgetBytes === 'number' && typeof contract.productionRoute?.maxRouteBytes === 'number' && hallRoute.budgetBytes <= contract.productionRoute.maxRouteBytes, 'Hall route budget must remain within the machine-contract maximum');
expect(routeRegistry.includes("HallPage: () => import('../pages/HallPage')"), 'HallPage must remain route-level lazy-loaded');
expect(hallPage.includes("../components/hall-v3/HallProductionRuntime"), 'HallPage must mount the Hall v3 production runtime');
expect(!moduleSpecifiers(hallPagePath).some((specifier) => specifier === 'three' || specifier.startsWith('@react-three/')), 'HallPage must not eagerly import the Three/R3F runtime');

expect(runtime.includes("await import('three')"), 'Hall production runtime must load Three through a secondary dynamic import');
expect(runtime.includes("greybox-layouts.json"), 'Hall production runtime must derive geometry from canonical greybox authority');
expect(runtime.includes("camera-decision.json"), 'Hall production runtime must derive camera from canonical R1 authority');
expect(runtime.includes("material-decision.json"), 'Hall production runtime must derive L0/UV0 authority from material decision');
expect(runtime.includes('EXHIBIT_alexander-pushkin_NEUTRAL_PROXY'), 'production slice must use an explicitly neutral Pushkin proxy while documentary media is excluded');
expect(runtime.includes("documentaryMedia = 'excluded'"), 'production runtime must mark exhibit proxies as documentary-media excluded');
expect(runtime.includes('webglcontextlost'), 'production Hall must provide WebGL context-loss fallback');
expect(runtime.includes("matchMedia('(prefers-reduced-motion: reduce)')"), 'production Hall must retain deterministic reduced-motion behavior');
expect(runtime.includes("fallback('webgl-unavailable')"), 'production Hall must provide semantic fallback when WebGL is unavailable');
for (const forbiddenRuntimeToken of ['TextureLoader', 'CubeTextureLoader', 'DataTexture', 'CanvasTexture', 'VideoTexture', 'KTX2Loader', 'PointerLockControls', 'OrbitControls']) {
  expect(!runtime.includes(forbiddenRuntimeToken), `production Hall slice must not introduce ${forbiddenRuntimeToken}`);
}
for (const forbiddenMediaToken of ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.pdf']) {
  expect(!runtime.toLowerCase().includes(forbiddenMediaToken), `production Hall runtime must not embed documentary/media asset token ${forbiddenMediaToken}`);
}

expect(threeAdapter.includes("from 'three/src/Three.js'"), 'Hall Three adapter must source the canonical Three module without importing the full bare namespace');
for (const requiredExport of ['WebGLRenderer','Scene','PerspectiveCamera','Mesh','BufferGeometry','MeshStandardMaterial','Vector3']) {
  expect(threeAdapter.includes(requiredExport), `Hall Three adapter must retain required runtime export: ${requiredExport}`);
}
expect(viteConfig.includes('{ find: /^three$/, replacement: path.resolve(__dirname, \'src/components/hall-v3/three-runtime.ts\') }'), 'production Vite must alias only the exact bare Three specifier to the narrow Hall adapter');

const allowedThreeRuntimeFiles = new Set([runtimePath, threeAdapterPath]);
for (const relativePath of sourceFiles('src')) {
  if (relativePath === legacyHallDir || relativePath.startsWith(`${legacyHallDir}/`)) continue;
  for (const specifier of moduleSpecifiers(relativePath)) {
    const resolved = resolveLocal(relativePath, specifier);
    const reachesLegacy = specifier.includes('/components/hall/') || resolved === legacyHallDir || resolved?.startsWith(`${legacyHallDir}/`) === true;
    expect(!reachesLegacy, `current production source must not import legacy Hall v2: ${relativePath} -> ${specifier}`);
    const isThree = specifier === 'three' || specifier.startsWith('three/') || specifier.startsWith('@react-three/') || specifier === 'postprocessing' || specifier.startsWith('postprocessing/');
    if (isThree) expect(allowedThreeRuntimeFiles.has(relativePath), `Three/R3F runtime imports are bounded to the exact Hall runtime allowlist: found ${relativePath} -> ${specifier}`);
  }
}

expect(!fs.existsSync(path.join(root, stalePublicConceptPath)), 'unapproved Hall concept art must not return under public/');
for (const requiredPath of [contractPath, ownerDirectionPath, 'docs/hall-v3/web-runtime-proof.json', threeAdapterPath, ...Object.values(contract.sourceAuthority ?? {})]) {
  expect(fs.existsSync(path.join(root, requiredPath)), `Hall authority/runtime file must exist: ${requiredPath}`);
}
expect(projectContract.architecture?.openLaneIds?.includes('TLP-HALL-001') === false, 'closed historical Hall root must not re-enter project-contract openLaneIds');
for (const legacyDoc of ['docs/HALL_RESEARCH.md', 'docs/UPGRADE_NOTES.md']) {
  expect(projectContract.documentation?.historical?.includes(legacyDoc) === true, `superseded Hall document must remain historical: ${legacyDoc}`);
  expect(projectContract.documentation?.supersededTechnicalDocuments?.includes(legacyDoc) === true, `superseded Hall document must remain superseded: ${legacyDoc}`);
}

if (failures.length) {
  console.error('\nHall v3 production web-slice validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall v3 production web-slice invariants passed: H3/R1/L0/UV0 authority, exact two-file Three transport allowlist, semantic fallbacks, neutral documentary-free proxies and owner-directed gate state are consistent.');
