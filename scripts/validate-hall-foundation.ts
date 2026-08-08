import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

const hallDocsPath = 'docs/hall-v3/README.md';
const hallContractPath = 'docs/hall-v3/hall-v3-contract.json';
const stalePublicConceptPath = 'public/images/hall-preview.webp';
const sharedRouteRegistryPath = 'src/routes/routeModules.ts';
const supersededHallDocs = ['docs/HALL_RESEARCH.md', 'docs/UPGRADE_NOTES.md'] as const;
const hallContract = JSON.parse(read(hallContractPath)) as {
  schemaVersion?: number;
  laneId?: string;
  productIssue?: number;
  phase?: string;
  productionRoute?: {
    path?: string;
    mode?: string;
    module?: string;
    maxRouteBytes?: number;
    allowLegacyHallImports?: boolean;
    allowThreeRuntimeImports?: boolean;
    allowUnapprovedConceptArt?: boolean;
  };
  legacy?: {
    sourceDirectory?: string;
    currentAuthority?: boolean;
    historicalValidator?: string;
    historicalValidatorMandatory?: boolean;
  };
  sourceAuthority?: Record<string, string>;
  gates?: Record<string, string>;
};

const hallPagePath = hallContract.productionRoute?.module ?? 'src/pages/HallPage.tsx';
const legacyHallDir = hallContract.legacy?.sourceDirectory ?? 'src/components/hall';
const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
const MAX_RESOLVE_DEPTH = 12;

type BindingEntry = {
  initializer: ts.Expression;
  scope: ts.Node;
};
type BindingMap = Map<string, BindingEntry[]>;

type ModuleReference = {
  specifier: string | null;
  kind: 'static' | 'dynamic' | 'require';
};

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

function bindingScope(node: ts.Node): ts.Node {
  let current: ts.Node | undefined = node.parent;
  while (current) {
    if (ts.isSourceFile(current) || ts.isBlock(current) || ts.isModuleBlock(current) || ts.isCaseBlock(current)) return current;
    current = current.parent;
  }
  return node.getSourceFile();
}

function collectConstBindings(sourceFile: ts.SourceFile): BindingMap {
  const bindings: BindingMap = new Map();
  const visit = (node: ts.Node) => {
    if (ts.isVariableStatement(node) && (node.declarationList.flags & ts.NodeFlags.Const) !== 0) {
      for (const declaration of node.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
        const entries = bindings.get(declaration.name.text) ?? [];
        entries.push({ initializer: declaration.initializer, scope: bindingScope(declaration) });
        bindings.set(declaration.name.text, entries);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return bindings;
}

function resolveBinding(identifier: ts.Identifier, bindings: BindingMap): ts.Expression | undefined {
  const entries = bindings.get(identifier.text);
  if (!entries) return undefined;
  let current: ts.Node | undefined = identifier;
  while (current) {
    const entry = entries.find((candidate) => candidate.scope === current);
    if (entry) return entry.initializer;
    current = current.parent;
  }
  return undefined;
}

function resolveStringLiteral(expression: ts.Expression, bindings: BindingMap, depth = 0): string | undefined {
  if (depth >= MAX_RESOLVE_DEPTH) return undefined;
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return expression.text;
  if (ts.isParenthesizedExpression(expression)) return resolveStringLiteral(expression.expression, bindings, depth + 1);
  if (ts.isIdentifier(expression)) {
    const bound = resolveBinding(expression, bindings);
    return bound ? resolveStringLiteral(bound, bindings, depth + 1) : undefined;
  }
  return undefined;
}

function moduleReferences(source: string, fileName: string): ModuleReference[] {
  const scriptKind = fileName.endsWith('.tsx') || fileName.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKind);
  const bindings = collectConstBindings(sourceFile);
  const references: ModuleReference[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      references.push({ specifier: node.moduleSpecifier.text, kind: 'static' });
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      references.push({ specifier: node.moduleSpecifier.text, kind: 'static' });
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      const expression = node.moduleReference.expression;
      references.push({ specifier: expression ? resolveStringLiteral(expression, bindings) ?? null : null, kind: 'static' });
    } else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const argument = node.arguments[0];
        references.push({ specifier: argument ? resolveStringLiteral(argument, bindings) ?? null : null, kind: 'dynamic' });
      } else if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
        const argument = node.arguments[0];
        references.push({ specifier: argument ? resolveStringLiteral(argument, bindings) ?? null : null, kind: 'require' });
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return references;
}

function isForbiddenThreeRuntime(specifier: string) {
  return specifier === 'three'
    || specifier.startsWith('three/')
    || specifier === 'postprocessing'
    || specifier.startsWith('postprocessing/')
    || specifier.startsWith('@react-three/');
}

function resolveLocalSource(importer: string, rawSpecifier: string) {
  const specifier = rawSpecifier.split(/[?#]/, 1)[0];
  let base: string | null = null;
  if (specifier.startsWith('@/')) base = path.posix.join('src', specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.posix.normalize(path.posix.join(path.posix.dirname(importer), specifier));
  if (!base) return null;

  const candidates = [
    base,
    ...sourceExtensions.map((extension) => `${base}${extension}`),
    ...sourceExtensions.map((extension) => path.posix.join(base, `index${extension}`)),
  ];
  return candidates.find((candidate) => fs.existsSync(path.join(root, candidate)) && fs.statSync(path.join(root, candidate)).isFile()) ?? null;
}

function validateDormantRouteDependencyGraph(entry: string) {
  const visited = new Set<string>();
  const pending = [entry];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    for (const reference of moduleReferences(read(current), current)) {
      expect(reference.specifier !== null, `dormant Hall dependency graph must not contain unresolved ${reference.kind} imports: ${current}`);
      if (!reference.specifier) continue;

      expect(!isForbiddenThreeRuntime(reference.specifier), `dormant Hall dependency graph must not reach 3D runtime: ${current} -> ${reference.specifier}`);
      const resolved = resolveLocalSource(current, reference.specifier);
      if (!resolved) continue;
      const reachesLegacyHall = resolved === legacyHallDir || resolved.startsWith(`${legacyHallDir}/`);
      expect(!reachesLegacyHall, `dormant Hall dependency graph must not reach legacy Hall v2: ${current} -> ${resolved}`);
      if (reachesLegacyHall) continue;

      if (reference.kind === 'dynamic') {
        if (current === sharedRouteRegistryPath) continue;
        expect(false, `dormant Hall static dependency graph must not introduce a local dynamic import: ${current} -> ${resolved}`);
        continue;
      }
      pending.push(resolved);
    }
  }
}

const hallPage = read(hallPagePath);
const routeRuntime = read(sharedRouteRegistryPath);
const routeContract = JSON.parse(read('src/routes/route-contract.json')) as {
  routes?: Array<{ id?: string; path?: string; page?: string; module?: string; budgetBytes?: number }>;
};
const projectContract = JSON.parse(read('docs/project-contract.json')) as {
  architecture?: { openLaneIds?: string[] };
  documentation?: { authoritative?: string[]; historical?: string[]; supersededTechnicalDocuments?: string[] };
};
const parsedTsConfig = ts.parseConfigFileTextToJson('tsconfig.json', read('tsconfig.json'));
if (parsedTsConfig.error) {
  failures.push(`tsconfig.json: TypeScript config parser failed: ${ts.flattenDiagnosticMessageText(parsedTsConfig.error.messageText, '\n')}`);
}
const tsConfig = (parsedTsConfig.config ?? {}) as { exclude?: string[] };
const currentState = read('docs/CURRENT_STATE.md');
const packageManifest = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };

expect(hallContract.schemaVersion === 1, 'Hall v3 machine contract schemaVersion must remain 1');
expect(hallContract.laneId === 'TLP-HALL-001', 'Hall v3 machine contract must remain owned by TLP-HALL-001');
expect(hallContract.productIssue === 369, 'Hall v3 machine contract must point to Product #369');
expect(['foundation', 'referenceBible', 'metricGreybox'].includes(hallContract.phase ?? ''), `Hall foundation invariant validator does not recognize phase: ${hallContract.phase ?? '<missing>'}`);

if (hallContract.phase === 'foundation') {
  expect(hallContract.gates?.foundation === 'active', 'foundation phase must keep foundation gate active');
  for (const [gate, status] of Object.entries(hallContract.gates ?? {})) {
    if (gate !== 'foundation') expect(status === 'blocked', `later Hall gate must remain blocked during foundation: ${gate}`);
  }
}
if (hallContract.phase === 'referenceBible') {
  expect(hallContract.gates?.foundation === 'completed', 'Reference Bible phase must preserve completed foundation status');
  expect(hallContract.gates?.referenceBible === 'active', 'Reference Bible phase must mark referenceBible active');
  for (const gate of ['metricGreybox', 'cameraApproval', 'materialLightingExportSpike', 'pushkinVerticalSlice', 'offlineVisualApproval', 'webVerticalSlice', 'fullMuseumScaleOut']) {
    expect(hallContract.gates?.[gate] === 'blocked', `later Hall gate must remain blocked while Reference Bible is active: ${gate}`);
  }
}
if (hallContract.phase === 'metricGreybox') {
  expect(hallContract.gates?.foundation === 'completed', 'metricGreybox phase must preserve completed foundation status');
  expect(hallContract.gates?.referenceBible === 'completed', 'metricGreybox phase must preserve completed Reference Bible status');
  expect(hallContract.gates?.metricGreybox === 'active', 'metricGreybox phase must mark metricGreybox active');
  for (const gate of ['cameraApproval', 'materialLightingExportSpike', 'pushkinVerticalSlice', 'offlineVisualApproval', 'webVerticalSlice', 'fullMuseumScaleOut']) {
    expect(hallContract.gates?.[gate] === 'blocked', `later Hall gate must remain blocked while metricGreybox is active: ${gate}`);
  }
}

expect(hallContract.productionRoute?.mode === 'placeholder', 'production /hall must remain a placeholder before an approved web vertical slice');
expect(hallContract.productionRoute?.allowLegacyHallImports === false, 'Hall foundation invariant must forbid legacy Hall imports');
expect(hallContract.productionRoute?.allowThreeRuntimeImports === false, 'Hall foundation invariant must forbid Three/R3F runtime imports before a later runtime gate');
expect(hallContract.productionRoute?.allowUnapprovedConceptArt === false, 'Hall foundation invariant must keep unapproved concept art off /hall');
expect(hallContract.legacy?.currentAuthority === false, 'Hall v2 must remain non-authoritative');
expect(hallContract.legacy?.historicalValidatorMandatory === false, 'Hall v2 validator must remain non-mandatory');
expect(tsConfig.exclude?.includes(legacyHallDir) === true, 'legacy Hall v2 source must remain outside the current TypeScript contract while retained as forensic evidence');

const hallRoute = routeContract.routes?.find((route) => route.id === 'hall');
const hallBudgetBytes = hallRoute?.budgetBytes;
const maxRouteBytes = hallContract.productionRoute?.maxRouteBytes;
expect(Boolean(hallRoute), 'route contract must retain one hall route');
expect(hallRoute?.path === hallContract.productionRoute?.path, 'Hall route path must match the Hall machine contract');
expect(hallRoute?.page === 'HallPage', 'Hall route must remain owned by HallPage');
expect(hallRoute?.module === hallPagePath, 'Hall route module must match the Hall machine contract');
expect(typeof hallBudgetBytes === 'number' && typeof maxRouteBytes === 'number' && Number.isInteger(hallBudgetBytes) && hallBudgetBytes <= maxRouteBytes, 'dormant Hall shell must remain within the machine-contract route budget');

validateDormantRouteDependencyGraph(hallPagePath);

for (const relativePath of sourceFiles('src')) {
  if (relativePath === legacyHallDir || relativePath.startsWith(`${legacyHallDir}/`)) continue;
  for (const reference of moduleReferences(read(relativePath), relativePath)) {
    if (!reference.specifier) continue;
    const resolvedRelativeImport = resolveLocalSource(relativePath, reference.specifier);
    const importsLegacyHall = reference.specifier.includes('/components/hall')
      || reference.specifier.startsWith('components/hall/')
      || resolvedRelativeImport === legacyHallDir
      || resolvedRelativeImport?.startsWith(`${legacyHallDir}/`) === true;
    expect(!importsLegacyHall, `production source must not import legacy Hall v2: ${relativePath} -> ${reference.specifier}`);
  }
}

expect(routeRuntime.includes("HallPage: () => import('../pages/HallPage')"), 'route runtime must lazy-load HallPage through the canonical route registry');
for (const retiredPromise of ['Храм русской поэзии', 'Храм Русской Поэзии', 'советская и современная поэзия', 'Золотой век, Серебряный век']) {
  expect(!hallPage.includes(retiredPromise), `public Hall placeholder must not promise unapproved architecture: ${retiredPromise}`);
}
expect(!hallPage.includes('hall-preview.webp'), 'dormant Hall route must not reference stale concept artwork');
expect(!fs.existsSync(path.join(root, stalePublicConceptPath)), 'unapproved Hall concept art must not remain under public/');
expect(hallPage.includes('без выдачи ранних концептов за финальную архитектуру'), 'Hall placeholder must state that early concepts are not final architecture');

const requiredHallDocs = [hallDocsPath, hallContractPath, ...Object.values(hallContract.sourceAuthority ?? {})];
for (const relativePath of new Set(requiredHallDocs)) {
  expect(fs.existsSync(path.join(root, relativePath)), `Hall authority document must exist: ${relativePath}`);
}
expect(fs.existsSync(path.join(root, legacyHallDir, 'README.md')), 'legacy Hall directory must declare its non-authoritative status');
expect(projectContract.architecture?.openLaneIds?.includes(hallContract.laneId ?? '') === true, 'project contract must register the open Hall lane');
expect(currentState.includes(`\`${hallContract.laneId}\``), 'CURRENT_STATE must register the open Hall lane');
expect(projectContract.documentation?.authoritative?.includes(hallDocsPath) === true, 'project contract must register Hall v3 README as authoritative entrypoint');
for (const legacyDoc of supersededHallDocs) {
  expect(projectContract.documentation?.historical?.includes(legacyDoc) === true, `superseded Hall document must remain historical: ${legacyDoc}`);
  expect(projectContract.documentation?.supersededTechnicalDocuments?.includes(legacyDoc) === true, `superseded Hall document must not regain current authority: ${legacyDoc}`);
}

const scripts = packageManifest.scripts ?? {};
expect(scripts['validate:hall-foundation'] === 'tsx scripts/validate-hall-foundation.ts && node scripts/validate-hall-public-promises.mjs', 'package scripts must expose foundation invariants plus public-promise guard');
expect(scripts['validate:interaction-runtime']?.includes('validate-hall-audio-runtime') === false, 'mandatory interaction validation must not preserve Hall-v2 FPS/audio behavior');
expect(scripts.check?.includes('validate:hall-foundation') === true, 'normal project check must retain Hall foundation invariants');

if (failures.length > 0) {
  console.error('\nHall v3 foundation invariant validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Hall v3 foundation invariants passed in phase ${hallContract.phase}: lightweight route, semantic 3D/legacy isolation, public concept exclusion, typecheck isolation, superseded-doc isolation and architecture ownership remain enforced.`);
