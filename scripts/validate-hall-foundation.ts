import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative: string) => fs.existsSync(path.join(root, relative));

const foundationPath = 'docs/HALL_V3_FOUNDATION.md';
const legacyReadmePath = 'src/components/hall/README.md';
const hallPagePath = 'src/pages/HallPage.tsx';
const routeContractPath = 'src/routes/route-contract.json';
const routeRuntimePath = 'src/routes/routeModules.ts';

for (const required of [foundationPath, legacyReadmePath, hallPagePath, routeContractPath, routeRuntimePath]) {
  expect(exists(required), `Hall foundation required path is missing: ${required}`);
}

const projectContract = JSON.parse(read('docs/project-contract.json')) as {
  architecture?: {
    openLaneIds?: unknown;
    hallFoundationContract?: unknown;
  };
  documentation?: { authoritative?: unknown };
};
const openLaneIds = Array.isArray(projectContract.architecture?.openLaneIds)
  ? projectContract.architecture.openLaneIds
  : [];
const authoritativeDocs = Array.isArray(projectContract.documentation?.authoritative)
  ? projectContract.documentation.authoritative
  : [];

expect(openLaneIds.includes('TLP-HALL-001'), 'project contract must register active architecture lane TLP-HALL-001');
expect(
  projectContract.architecture?.hallFoundationContract === foundationPath,
  `project contract must point architecture.hallFoundationContract at ${foundationPath}`,
);
expect(authoritativeDocs.includes(foundationPath), `${foundationPath} must be an authoritative current document`);

const currentState = read('docs/CURRENT_STATE.md');
expect(currentState.includes('`TLP-HALL-001`'), 'CURRENT_STATE must register TLP-HALL-001');
expect(currentState.includes('src/components/hall/*'), 'CURRENT_STATE must name the legacy Hall directory boundary');
expect(currentState.includes(foundationPath), 'CURRENT_STATE must name the Hall v3 foundation authority');

const foundation = read(foundationPath);
for (const token of [
  'TLP-HALL-001',
  'legacy implementation evidence',
  'ANNOTATED_REFERENCES',
  'METRIC_GREYBOX',
  'CAMERA_APPROVAL',
  'UV0',
  'UV1',
  'sRGB',
  'linear/non-color data',
  'APPROVED-PRODUCTION',
  'AI-generated or AI-assisted',
  'GLB',
  'KTX2',
  'PUSHKIN_VERTICAL_SLICE',
  'OFFLINE_VISUAL_APPROVAL',
  'MINIMAL_WEB_RUNTIME',
  '8,000 bytes',
  'source SHA-256',
  'optimized production SHA-256',
]) {
  expect(foundation.includes(token), `${foundationPath} is missing required contract token: ${token}`);
}
for (const forbidden of [
  'FPS/free-walk and pointer lock are defaults',
  'Drive file is publication-safe',
  'AI-generated material may masquerade as archival',
]) {
  expect(!foundation.includes(forbidden), `${foundationPath} contains a forbidden Hall v3 shortcut: ${forbidden}`);
}

const legacyReadme = read(legacyReadmePath);
for (const token of ['LEGACY / NON-AUTHORITATIVE', 'NOT A PRODUCTION IMPORT TARGET', foundationPath]) {
  expect(legacyReadme.includes(token), `${legacyReadmePath} is missing legacy boundary text: ${token}`);
}

const hallPage = read(hallPagePath);
for (const forbidden of [
  "../components/hall",
  '@react-three',
  "from 'three'",
  'HallOfPoets',
  'hall-preview.webp',
  'Храм русской поэзии',
  'Храм Русской Поэзии',
  'Золотой век',
  'Серебряный век',
  'советская и современная поэзия',
  'купольный пантеон',
]) {
  expect(!hallPage.includes(forbidden), `${hallPagePath} still carries legacy/unapproved Hall authority: ${forbidden}`);
}
expect(hallPage.includes("titleCase('Зал поэтов')"), 'Hall placeholder must use the neutral Зал поэтов identity');
expect(hallPage.includes('страница не'), 'Hall placeholder must explicitly avoid promising the final spatial form');

const routeContract = JSON.parse(read(routeContractPath)) as {
  routes?: Array<Record<string, unknown>>;
};
const hallRoute = routeContract.routes?.find((route) => route.id === 'hall');
expect(Boolean(hallRoute), 'route contract must retain the hall route');
if (hallRoute) {
  expect(hallRoute.path === '/hall', 'hall route path must remain /hall');
  expect(hallRoute.page === 'HallPage', 'hall route must remain owned by HallPage');
  expect(hallRoute.module === hallPagePath, 'hall route module must remain the lightweight HallPage');
  expect(hallRoute.audit === 'utility', 'hall route must remain a utility route during foundation');
  expect(hallRoute.sitemap === false, 'hall placeholder must remain outside sitemap during foundation');
  expect(hallRoute.budgetBytes === 8000, 'Hall foundation must not raise the existing 8,000-byte route budget');
}

const routeRuntime = read(routeRuntimePath);
expect(routeRuntime.includes("HallPage: () => import('../pages/HallPage')"), 'route runtime must lazy-load the lightweight HallPage');
expect(!routeRuntime.includes('components/hall'), 'route runtime must not import the legacy Hall scene');
expect(!routeRuntime.includes('HallOfPoets'), 'route runtime must not name the retired HallOfPoets runtime');

const legacyDir = path.resolve(root, 'src/components/hall');
const sourceRoot = path.resolve(root, 'src');

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });
}

function importSpecifiers(source: string) {
  const specifiers: string[] = [];
  for (const pattern of [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
  ]) {
    for (const match of source.matchAll(pattern)) specifiers.push(match[1]);
  }
  return specifiers;
}

for (const absolute of walk(sourceRoot)) {
  if (absolute === legacyDir || absolute.startsWith(`${legacyDir}${path.sep}`)) continue;
  const relative = path.relative(root, absolute).split(path.sep).join('/');
  const source = fs.readFileSync(absolute, 'utf8');
  for (const specifier of importSpecifiers(source)) {
    let resolved: string | null = null;
    if (specifier.startsWith('.')) resolved = path.resolve(path.dirname(absolute), specifier);
    else if (specifier.includes('components/hall')) resolved = legacyDir;
    if (resolved && (resolved === legacyDir || resolved.startsWith(`${legacyDir}${path.sep}`))) {
      failures.push(`${relative} imports retired Hall v2 module: ${specifier}`);
    }
  }
}

const packageManifest = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
const interactionCommand = packageManifest.scripts?.['validate:interaction-runtime'] ?? '';
expect(
  interactionCommand.includes('tsx scripts/validate-hall-foundation.ts'),
  'validate:interaction-runtime must execute the Hall foundation validator',
);
expect(
  !interactionCommand.includes('validate-hall-audio-runtime'),
  'validate:interaction-runtime must not preserve Hall-v2 audio/FPS/dust authority',
);
expect(
  !exists('scripts/validate-hall-audio-runtime.ts'),
  'retired validate-hall-audio-runtime.ts must be removed after the foundation validator replaces it',
);

if (failures.length) {
  console.error('\nHall v3 foundation validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall v3 foundation validation passed: lightweight route, legacy isolation, source/rights/export gates and unchanged route budget are enforced.');
