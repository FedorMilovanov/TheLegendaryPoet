import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const contract = JSON.parse(read('docs/hall-v3/hall-v3-contract.json')) as {
  laneId?: string;
  phase?: string;
  sourceAuthority?: Record<string, string>;
  gates?: Record<string, string>;
  productionRoute?: {
    mode?: string;
    allowLegacyHallImports?: boolean;
    allowThreeRuntimeImports?: boolean;
    allowUnapprovedConceptArt?: boolean;
  };
};

const bible = JSON.parse(read('docs/hall-v3/reference-bible.json')) as {
  schemaVersion?: number;
  laneId?: string;
  phase?: string;
  status?: string;
  allowedProblemTags?: string[];
  requiredPrimaryProblems?: string[];
  sources?: Array<{
    id?: string;
    institution?: string;
    title?: string;
    url?: string;
    primaryProblem?: string;
    secondaryProblems?: string[];
    take?: string[];
    avoid?: string[];
    why?: string;
  }>;
  metricConstraints?: {
    unit?: string;
    routeOneWayMinimum?: number;
    routeTwoWayRecommendedMinimum?: number;
    accessibleViewingClearance?: { width?: number; depth?: number };
    clearHeadroomMinimum?: number;
    sensitivePaperGuidance?: { nominalLux?: number; hardProductionSetpoint?: boolean; note?: string };
  };
  spatialHypotheses?: Array<{
    id?: string;
    name?: string;
    question?: string;
    mustTest?: string[];
    primaryFailureMode?: string;
  }>;
  greyboxEvidencePackage?: {
    certifiedCameraWitnesses?: string[];
    mobileCropMinimum?: number;
    requiredOutputs?: string[];
  };
  automaticRejectionRules?: string[];
  dataAuthority?: {
    canonical?: string[];
    reverifyBeforeUse?: string[];
    legacyVisualConceptNotAuthority?: string[];
    uiOnlyUnlessApproved?: string[];
  };
  toolingCandidate?: {
    name?: string;
    version?: string;
    headlessPythonCandidate?: boolean;
    permanentAuthority?: boolean;
  };
  decisions?: Record<string, unknown>;
};

const referenceBibleMd = read('docs/hall-v3/REFERENCE_BIBLE.md');
const spatialBriefMd = read('docs/hall-v3/SPATIAL_BRIEF.md');
const packageManifest = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');

expect(contract.laneId === 'TLP-HALL-001', 'Hall contract must remain owned by TLP-HALL-001');
expect(['referenceBible', 'metricGreybox'].includes(contract.phase ?? ''), 'Reference Bible invariants currently support referenceBible or metricGreybox phase');
expect(contract.gates?.foundation === 'completed', 'foundation gate must remain completed once Reference Bible exists');
if (contract.phase === 'referenceBible') {
  expect(contract.gates?.referenceBible === 'active', 'referenceBible gate must be active while Reference Bible is current phase');
  expect(contract.gates?.metricGreybox === 'blocked', 'metricGreybox must remain blocked while Reference Bible is current phase');
} else if (contract.phase === 'metricGreybox') {
  expect(contract.gates?.referenceBible === 'completed', 'Reference Bible must be completed before metricGreybox is active');
  expect(contract.gates?.metricGreybox === 'active', 'metricGreybox gate must be active in metricGreybox phase');
  for (const gate of [
    'cameraApproval',
    'materialLightingExportSpike',
    'pushkinVerticalSlice',
    'offlineVisualApproval',
    'webVerticalSlice',
    'fullMuseumScaleOut',
  ]) {
    expect(contract.gates?.[gate] === 'blocked', `later Hall gate must remain blocked during metric greybox: ${gate}`);
  }
}
expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain a placeholder while Reference Bible evidence is pre-runtime authority');
expect(contract.productionRoute?.allowLegacyHallImports === false, 'Reference Bible invariants must not reactivate legacy Hall imports');
expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'Reference Bible invariants must not activate Three/R3F runtime');
expect(contract.productionRoute?.allowUnapprovedConceptArt === false, 'Reference Bible invariants must not publish unapproved concept art');

const requiredAuthorities = {
  referenceBible: 'docs/hall-v3/REFERENCE_BIBLE.md',
  spatialBrief: 'docs/hall-v3/SPATIAL_BRIEF.md',
  referenceBibleData: 'docs/hall-v3/reference-bible.json',
};
for (const [key, expectedPath] of Object.entries(requiredAuthorities)) {
  expect(contract.sourceAuthority?.[key] === expectedPath, `Hall sourceAuthority.${key} must equal ${expectedPath}`);
  expect(fs.existsSync(path.join(root, expectedPath)), `Hall Reference Bible authority file must exist: ${expectedPath}`);
}

expect(bible.schemaVersion === 1, 'Reference Bible schemaVersion must be 1');
expect(bible.laneId === contract.laneId, 'Reference Bible lane must match Hall contract');
expect(bible.phase === 'referenceBible', 'Reference Bible data must retain referenceBible provenance');
expect(
  bible.status === (contract.phase === 'referenceBible' ? 'active' : 'completed'),
  `Reference Bible status must match current Hall phase: ${contract.phase}`,
);

const allowedTags = new Set(bible.allowedProblemTags ?? []);
const requiredProblems = bible.requiredPrimaryProblems ?? [];
const sources = bible.sources ?? [];
expect(allowedTags.size >= 10, 'Reference Bible must retain a broad problem taxonomy');
expect(sources.length >= 10, 'Reference Bible must contain at least ten annotated institutional/conservation references');
expect(requiredProblems.length >= 6, 'Reference Bible must define at least six required primary problem classes');

const sourceIds = new Set<string>();
const sourceUrls = new Set<string>();
const coveredPrimary = new Set<string>();
for (const source of sources) {
  expect(Boolean(source.id), 'every Reference Bible source must have an id');
  expect(Boolean(source.institution), `Reference Bible source ${source.id ?? '<unknown>'} must name an institution`);
  expect(Boolean(source.title), `Reference Bible source ${source.id ?? '<unknown>'} must have a title`);
  expect(Boolean(source.url?.startsWith('https://')), `Reference Bible source ${source.id ?? '<unknown>'} must have an https URL`);
  expect(Boolean(source.primaryProblem && allowedTags.has(source.primaryProblem)), `Reference Bible source ${source.id ?? '<unknown>'} must use an allowed primary problem`);
  for (const tag of source.secondaryProblems ?? []) {
    expect(allowedTags.has(tag), `Reference Bible source ${source.id ?? '<unknown>'} uses unknown secondary problem: ${tag}`);
  }
  expect((source.take?.length ?? 0) >= 1, `Reference Bible source ${source.id ?? '<unknown>'} must contain TAKE guidance`);
  expect((source.avoid?.length ?? 0) >= 1, `Reference Bible source ${source.id ?? '<unknown>'} must contain AVOID guidance`);
  expect((source.why?.trim().length ?? 0) >= 20, `Reference Bible source ${source.id ?? '<unknown>'} must explain WHY`);

  if (source.id) {
    expect(!sourceIds.has(source.id), `duplicate Reference Bible source id: ${source.id}`);
    sourceIds.add(source.id);
  }
  if (source.url) {
    expect(!sourceUrls.has(source.url), `duplicate Reference Bible source URL: ${source.url}`);
    sourceUrls.add(source.url);
  }
  if (source.primaryProblem) coveredPrimary.add(source.primaryProblem);
}
for (const problem of requiredProblems) {
  expect(allowedTags.has(problem), `required Reference Bible problem is missing from taxonomy: ${problem}`);
  expect(coveredPrimary.has(problem), `Reference Bible lacks a primary source for required problem: ${problem}`);
}

const metrics = bible.metricConstraints ?? {};
expect(metrics.unit === 'metres', 'Reference Bible greybox unit must be metres');
expect(metrics.routeOneWayMinimum === 0.915, 'one-way accessible route witness must remain 0.915 m');
expect(metrics.routeTwoWayRecommendedMinimum === 1.525, 'two-way/stopping-friendly route witness must remain 1.525 m');
expect(metrics.accessibleViewingClearance?.width === 0.76, 'accessible viewing clearance width must remain 0.76 m');
expect(metrics.accessibleViewingClearance?.depth === 1.22, 'accessible viewing clearance depth must remain 1.22 m');
expect(metrics.clearHeadroomMinimum === 2.03, 'clear headroom witness must remain 2.03 m');
expect(metrics.sensitivePaperGuidance?.nominalLux === 50, 'sensitive paper evidence guide must retain nominal 50 lux');
expect(metrics.sensitivePaperGuidance?.hardProductionSetpoint === false, '50 lux must remain evidence guidance, not a hard universal production setpoint');

const hypotheses = bible.spatialHypotheses ?? [];
const hypothesisIds = hypotheses.map((hypothesis) => hypothesis.id);
expect(hypotheses.length === 3, 'Reference Bible must retain exactly three initial hypotheses for greybox comparison');
expect(JSON.stringify(hypothesisIds) === JSON.stringify(['H1', 'H2', 'H3']), 'initial spatial hypotheses must remain H1, H2, H3 in comparison order');
for (const hypothesis of hypotheses) {
  expect((hypothesis.name?.length ?? 0) >= 10, `${hypothesis.id ?? 'hypothesis'} must have a descriptive name`);
  expect((hypothesis.question?.length ?? 0) >= 30, `${hypothesis.id ?? 'hypothesis'} must state its test question`);
  expect((hypothesis.mustTest?.length ?? 0) >= 4, `${hypothesis.id ?? 'hypothesis'} must define at least four equal-comparison tests`);
  expect((hypothesis.primaryFailureMode?.length ?? 0) >= 15, `${hypothesis.id ?? 'hypothesis'} must state a primary failure mode`);
}

const evidencePackage = bible.greyboxEvidencePackage ?? {};
const requiredCameras = ['entryReveal', 'orientation', 'firstTransition', 'pushkinApproach', 'pushkinViewing', 'reverseExit'];
expect(JSON.stringify(evidencePackage.certifiedCameraWitnesses ?? []) === JSON.stringify(requiredCameras), 'greybox camera witnesses must remain identical across candidates');
expect((evidencePackage.mobileCropMinimum ?? 0) >= 3, 'greybox shootout must require at least three mobile portrait crops');
expect((evidencePackage.requiredOutputs?.length ?? 0) >= 12, 'greybox evidence package must retain at least twelve comparable outputs');
expect((bible.automaticRejectionRules?.length ?? 0) >= 8, 'Reference Bible must retain a strong automatic rejection list');

expect(bible.dataAuthority?.canonical?.some((item) => item.includes('src/data/library')) === true, 'canonical Hall data authority must point to the poet library');
expect(bible.dataAuthority?.legacyVisualConceptNotAuthority?.includes('src/data/poetMuseumMeta.ts') === true, 'poetMuseumMeta must remain explicitly non-authoritative for Hall visual design');
expect(bible.dataAuthority?.uiOnlyUnlessApproved?.includes('src/data/epochColors.ts') === true, 'epochColors must remain UI-only unless explicitly approved');

expect(bible.toolingCandidate?.name === 'Blender', 'Reference Bible tooling candidate must remain Blender');
expect(bible.toolingCandidate?.version === '4.5 LTS', 'Reference Bible must retain the originally evaluated Blender LTS series rather than becoming the exact runtime pin');
expect(bible.toolingCandidate?.headlessPythonCandidate === true, 'Blender tooling candidate must retain headless Python capability');
expect(bible.toolingCandidate?.permanentAuthority === false, 'Reference Bible must not become permanent tooling authority');

for (const [decision, value] of Object.entries(bible.decisions ?? {})) {
  expect(value === null, `Reference Bible must not pre-approve ${decision}`);
}

for (const requiredText of ['TAKE', 'AVOID', 'WHY', 'Current non-decisions', 'Data authority boundary']) {
  expect(referenceBibleMd.includes(requiredText), `REFERENCE_BIBLE.md must retain section/token: ${requiredText}`);
}
for (const requiredText of ['H1', 'H2', 'H3', '0.915 m', '1.525 m', '0.76 × 1.22 m', '2.03 m', 'Automatic rejection']) {
  expect(spatialBriefMd.includes(requiredText), `SPATIAL_BRIEF.md must retain comparison evidence: ${requiredText}`);
}

for (const forbiddenExtension of ['.blend', '.glb', '.gltf']) {
  const hallFiles = fs.readdirSync(path.join(root, 'docs/hall-v3'));
  expect(!hallFiles.some((name) => name.toLowerCase().endsWith(forbiddenExtension)), `Hall contract documents must not contain generated geometry/runtime assets: ${forbiddenExtension}`);
}

const scripts = packageManifest.scripts ?? {};
expect(scripts['validate:hall-reference-bible'] === 'tsx scripts/validate-hall-reference-bible.ts', 'package scripts must expose the Reference Bible validator');
expect(scripts.check?.includes('validate:hall-reference-bible') === true, 'normal project check must run the Reference Bible validator');
expect(ci.includes('npm run validate:hall-reference-bible'), 'primary CI must run the Reference Bible validator');
expect(projectContracts.includes('npm run validate:hall-reference-bible'), 'Project contracts must independently run the Reference Bible validator');

if (failures.length > 0) {
  console.error('\nHall v3 Reference Bible validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Hall v3 Reference Bible validation passed as ${bible.status}: ${sources.length} annotated sources, H1/H2/H3 neutral comparison, metric accessibility witnesses, camera/mobile evidence and legacy-data boundaries remain enforced.`);
