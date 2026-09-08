import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const gitBlobSha = (relative: string) => {
  const body = fs.readFileSync(path.join(root, relative));
  return createHash('sha1').update(Buffer.from(`blob ${body.length}\0`)).update(body).digest('hex');
};

const contract = JSON.parse(read('docs/hall-v3/hall-v3-contract.json')) as any;
const bible = JSON.parse(read('docs/hall-v3/reference-bible.json')) as any;
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');

const FROZEN_REFERENCE_AUTHORITY: Record<string, string> = {
  'docs/hall-v3/reference-bible.json': 'c98398019936b93620d7c67e3df8bbaa94b494c6',
  'docs/hall-v3/REFERENCE_BIBLE.md': '1426234c2bce8077c501f2ce812ca7ebe10f64ab',
  'docs/hall-v3/SPATIAL_BRIEF.md': '60e7e915fce610b2121f79e19299794357b6965b',
};
for (const [relative, expected] of Object.entries(FROZEN_REFERENCE_AUTHORITY)) {
  expect(fs.existsSync(path.join(root, relative)), `frozen Reference Bible authority missing: ${relative}`);
  if (fs.existsSync(path.join(root, relative))) expect(gitBlobSha(relative) === expected, `frozen Reference Bible authority drifted: ${relative}`);
}

expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001' && contract.productIssue === 369, 'Hall contract identity must remain exact');
const supportedPhases = ['referenceBible','metricGreybox','cameraApproval','materialLightingExportSpike','pushkinVerticalSlice','offlineVisualApproval','webVerticalSlice','fullMuseumScaleOut'];
expect(supportedPhases.includes(contract.phase), `Reference Bible invariant validator does not recognize Hall phase: ${contract.phase ?? '<missing>'}`);
expect(contract.gates?.foundation === 'completed', 'foundation gate must remain completed once Reference Bible exists');
expect(contract.gates?.referenceBible === (contract.phase === 'referenceBible' ? 'active' : 'completed'), 'Reference Bible gate must be active only in its own phase and completed afterwards');
if (contract.phase === 'metricGreybox') expect(contract.gates?.metricGreybox === 'active', 'metricGreybox must be active in metricGreybox phase');
else if (contract.phase !== 'referenceBible') expect(contract.gates?.metricGreybox === 'completed', 'metricGreybox must remain completed after its phase');

const webPhase = contract.phase === 'webVerticalSlice';
if (webPhase) {
  expect(contract.gates?.pushkinVerticalSlice === 'completed', 'webVerticalSlice must preserve completed Pushkin slice authority');
  expect(contract.gates?.offlineVisualApproval === 'blocked', 'technical web slice may not fabricate documentary offline visual approval');
  expect(contract.gates?.webVerticalSlice === 'active', 'webVerticalSlice gate must be active in the owner-directed production slice');
  expect(contract.gates?.fullMuseumScaleOut === 'blocked', 'full museum scale-out must remain blocked');
  expect(contract.tracking?.ownerDirectedWebSliceProductIssue === 465, 'production web slice must bind explicit owner direction #465');
  expect(contract.productionRoute?.mode === 'web-vertical-slice', '/hall must expose the bounded production web-slice mode');
  expect(contract.productionRoute?.allowThreeRuntimeImports === true, 'owner-directed web slice must explicitly authorize bounded Three runtime');
  expect(contract.productionRoute?.allowRightsPendingDocumentaryMedia === false, 'rights-pending documentary media must remain excluded from production Hall');
} else {
  expect(contract.productionRoute?.mode === 'placeholder', 'pre-web Hall phases must retain the lightweight production placeholder');
  expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'pre-web Hall phases must keep Three/R3F disabled');
}
expect(contract.productionRoute?.allowLegacyHallImports === false, 'legacy Hall imports may never regain current authority');
expect(contract.productionRoute?.allowUnapprovedConceptArt === false, 'unapproved concept art may not ship');

const authorities = {
  referenceBible: 'docs/hall-v3/REFERENCE_BIBLE.md',
  spatialBrief: 'docs/hall-v3/SPATIAL_BRIEF.md',
  referenceBibleData: 'docs/hall-v3/reference-bible.json',
};
for (const [key, expected] of Object.entries(authorities)) expect(contract.sourceAuthority?.[key] === expected, `Hall sourceAuthority.${key} must remain ${expected}`);

expect(bible.schemaVersion === 1 && bible.laneId === 'TLP-HALL-001' && bible.phase === 'referenceBible', 'Reference Bible provenance identity must remain exact');
expect(bible.status === (contract.phase === 'referenceBible' ? 'active' : 'completed'), 'Reference Bible status must track current Hall phase monotonically');
expect(Array.isArray(bible.sources) && bible.sources.length >= 10, 'Reference Bible must retain at least ten annotated sources');
expect(JSON.stringify((bible.spatialHypotheses ?? []).map((item: any) => item.id)) === JSON.stringify(['H1','H2','H3']), 'H1/H2/H3 neutral comparison authority must remain exact');
expect(bible.metricConstraints?.unit === 'metres', 'Hall metric authority must remain in metres');
expect(bible.metricConstraints?.routeOneWayMinimum === 0.915, 'one-way route witness must remain 0.915 m');
expect(bible.metricConstraints?.routeTwoWayRecommendedMinimum === 1.525, 'two-way route witness must remain 1.525 m');
expect(bible.metricConstraints?.accessibleViewingClearance?.width === 0.76 && bible.metricConstraints?.accessibleViewingClearance?.depth === 1.22, 'accessible viewing clearance must remain 0.76 × 1.22 m');
expect(bible.metricConstraints?.clearHeadroomMinimum === 2.03, 'clear headroom witness must remain 2.03 m');
expect(bible.metricConstraints?.sensitivePaperGuidance?.nominalLux === 50 && bible.metricConstraints?.sensitivePaperGuidance?.hardProductionSetpoint === false, '50 lux must remain guidance rather than a universal hard setpoint');
expect(bible.toolingCandidate?.name === 'Blender' && bible.toolingCandidate?.version === '4.5 LTS' && bible.toolingCandidate?.permanentAuthority === false, 'Reference Bible must retain Blender 4.5 LTS as evaluated candidate, not permanent authority');

expect(packageJson.scripts?.['validate:hall-reference-bible'] === 'tsx scripts/validate-hall-reference-bible.ts', 'package scripts must expose the Reference Bible validator');
expect((packageJson.scripts?.check ?? '').includes('validate:hall-reference-bible'), 'normal project check must run the Reference Bible validator');
expect(ci.includes('npm run validate:hall-reference-bible'), 'primary CI must run the Reference Bible validator');
expect(projectContracts.includes('npm run validate:hall-reference-bible'), 'Project contracts must independently run the Reference Bible validator');

if (failures.length) {
  console.error('\nHall v3 Reference Bible validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Hall v3 Reference Bible invariants passed through ${contract.phase}: frozen reference authority is byte-identical, early gates remain monotonic, and the owner-directed web phase does not reopen historical design authority.`);
