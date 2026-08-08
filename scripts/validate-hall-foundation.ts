import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

const hallPagePath = 'src/pages/HallPage.tsx';
const legacyHallDir = 'src/components/hall';
const hallDocsPath = 'docs/hall-v3/README.md';

function sourceFiles(relativeDir: string): string[] {
  const absoluteDir = path.join(root, relativeDir);
  const files: string[] = [];
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = path.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...sourceFiles(relativePath));
      continue;
    }
    if (/\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) files.push(relativePath);
  }
  return files;
}

function importSpecifiers(source: string) {
  return [...source.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

const hallPage = read(hallPagePath);
const routeRuntime = read('src/routes/routeModules.ts');
const routeContract = JSON.parse(read('src/routes/route-contract.json')) as {
  routes?: Array<{ id?: string; path?: string; page?: string; module?: string; budgetBytes?: number }>;
};
const projectContract = JSON.parse(read('docs/project-contract.json')) as {
  architecture?: { openLaneIds?: string[] };
  documentation?: { authoritative?: string[] };
};
const currentState = read('docs/CURRENT_STATE.md');
const packageManifest = JSON.parse(read('package.json')) as {
  scripts?: Record<string, string>;
};

const hallRoute = routeContract.routes?.find((route) => route.id === 'hall');
const hallBudgetBytes = hallRoute?.budgetBytes;
expect(Boolean(hallRoute), 'route contract must retain one hall route');
expect(hallRoute?.path === '/hall', 'hall route path must remain /hall');
expect(hallRoute?.page === 'HallPage', 'hall route must remain owned by HallPage');
expect(hallRoute?.module === hallPagePath, 'hall route module must remain the lightweight HallPage shell');
expect(
  typeof hallBudgetBytes === 'number' && Number.isInteger(hallBudgetBytes) && hallBudgetBytes <= 8_000,
  'dormant Hall shell must retain the <= 8000-byte route budget',
);

for (const specifier of importSpecifiers(hallPage)) {
  expect(
    !specifier.includes('/components/hall') && !specifier.includes('components/hall/'),
    `HallPage must not import the dormant Hall v2 runtime: ${specifier}`,
  );
  expect(
    !['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'].includes(specifier),
    `HallPage must not import a 3D runtime dependency while dormant: ${specifier}`,
  );
}

for (const relativePath of sourceFiles('src')) {
  if (relativePath === legacyHallDir || relativePath.startsWith(`${legacyHallDir}/`)) continue;
  for (const specifier of importSpecifiers(read(relativePath))) {
    const resolvedRelativeImport = specifier.startsWith('.')
      ? path.posix.normalize(path.posix.join(path.posix.dirname(relativePath), specifier))
      : null;
    const importsLegacyHall = specifier.includes('/components/hall')
      || specifier.startsWith('components/hall/')
      || resolvedRelativeImport === legacyHallDir
      || resolvedRelativeImport?.startsWith(`${legacyHallDir}/`) === true;
    expect(!importsLegacyHall, `production source must not import legacy Hall v2: ${relativePath} -> ${specifier}`);
  }
}

expect(
  routeRuntime.includes("HallPage: () => import('../pages/HallPage')"),
  'route runtime must lazy-load the HallPage shell through the canonical route registry',
);

for (const retiredPromise of [
  'Храм русской поэзии',
  'Храм Русской Поэзии',
  'советская и современная поэзия',
  'Золотой век, Серебряный век',
]) {
  expect(!hallPage.includes(retiredPromise), `public Hall placeholder must not promise unapproved architecture: ${retiredPromise}`);
}
expect(
  hallPage.includes('не обещание финальной архитектуры'),
  'Hall placeholder must state that the concept backdrop is not the final architecture',
);

const requiredHallDocs = [
  hallDocsPath,
  'docs/hall-v3/ART_DIRECTION.md',
  'docs/hall-v3/SCENE_CONTRACT.md',
  'docs/hall-v3/ASSET_PIPELINE.md',
  'docs/hall-v3/VISUAL_ACCEPTANCE.md',
  'docs/hall-v3/AI_USAGE_POLICY.md',
  'docs/hall-v3/PERFORMANCE_BUDGET.md',
  'docs/hall-v3/RIGHTS_REGISTER.md',
  'docs/hall-v3/LEGACY_RETIREMENT.md',
];
for (const relativePath of requiredHallDocs) {
  expect(fs.existsSync(path.join(root, relativePath)), `Hall v3 contract document must exist: ${relativePath}`);
}
expect(fs.existsSync(path.join(root, legacyHallDir, 'README.md')), 'legacy Hall directory must declare its non-authoritative status');
expect(
  projectContract.architecture?.openLaneIds?.includes('TLP-HALL-001') === true,
  'project contract must register TLP-HALL-001 while the Hall architecture lane is open',
);
expect(currentState.includes('`TLP-HALL-001`'), 'CURRENT_STATE must register the TLP-HALL-001 lane');
expect(
  projectContract.documentation?.authoritative?.includes(hallDocsPath) === true,
  'project contract must register the Hall v3 README as an authoritative architecture entrypoint',
);

const scripts = packageManifest.scripts ?? {};
expect(
  scripts['validate:hall-foundation'] === 'tsx scripts/validate-hall-foundation.ts',
  'package scripts must expose the Hall foundation validator',
);
expect(
  scripts['validate:interaction-runtime']?.includes('validate-hall-audio-runtime') === false,
  'mandatory interaction validation must not preserve Hall-v2 FPS/audio behavior as current architecture',
);
expect(
  scripts.check?.includes('validate:hall-foundation') === true,
  'normal project check must run the Hall foundation validator',
);

if (failures.length > 0) {
  console.error('\nHall v3 foundation validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall v3 foundation validation passed: lightweight route, full legacy isolation and architecture-lane ownership are enforced.');
