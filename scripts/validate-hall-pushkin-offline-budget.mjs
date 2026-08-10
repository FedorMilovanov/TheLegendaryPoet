import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = (relative) => JSON.parse(read(relative));
const sha256File = (absolute) => `sha256:${crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex')}`;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const policyPath = 'docs/hall-v3/pushkin-offline-budget.json';
const slicePath = 'docs/hall-v3/pushkin-slice.json';
const acquisitionPath = 'docs/hall-v3/pushkin-acquisition.json';
const hallContractPath = 'docs/hall-v3/hall-v3-contract.json';
const builderPath = 'scripts/hall-pushkin/build-first-slice-budget.mjs';
const validatorPath = 'scripts/validate-hall-pushkin-offline-budget.mjs';
const workflowPath = '.github/workflows/hall-pushkin-offline-exhibit.yml';

for (const required of [policyPath, slicePath, acquisitionPath, hallContractPath, builderPath, validatorPath, workflowPath]) {
  expect(exists(required), `missing first-slice budget authority: ${required}`);
}

const policy = exists(policyPath) ? readJson(policyPath) : {};
const slice = exists(slicePath) ? readJson(slicePath) : {};
const acquisition = exists(acquisitionPath) ? readJson(acquisitionPath) : {};
const hallContract = exists(hallContractPath) ? readJson(hallContractPath) : {};
const builder = exists(builderPath) ? read(builderPath) : '';
const workflow = exists(workflowPath) ? read(workflowPath) : '';

expect(policy.schemaVersion === 1 && policy.laneId === 'TLP-HALL-001' && policy.productIssue === 369 && policy.phase === 'pushkinVerticalSlice', 'first-slice budget policy identity drifted');
expect(policy.status === 'offline-first-slice-budget-evidence-required', 'first-slice budget policy must remain evidence-required');
expect(policy.report?.fileName === 'first-slice-budget-report.json' && policy.report?.schemaVersion === 1, 'first-slice budget report filename/schema drifted');
expect(policy.report?.purpose === 'first-slice-budget-evidence-not-approved-production-limit', 'first-slice budget report purpose must remain non-promotional');
expect(policy.measurementSemantics?.offlineGlbTransferBytesAreProductionBudget === false, 'offline GLB bytes may not be promoted to an approved production budget');
expect(policy.measurementSemantics?.conservativeRgba8DecodedTextureResidentBytesAreMeasuredGpuResidency === false, 'RGBA8 estimate may not claim measured GPU residency');
expect(policy.measurementSemantics?.documentaryAndNonDocumentaryTransferMustBeSeparated === true, 'budget report must separate documentary transfer from the remaining GLB');
expect(policy.measurementSemantics?.productionTextureEncodingDecisionMayBeInferredOffline === false, 'offline report may not infer production texture encoding');
expect(policy.productionBoundary?.reportIsProductionAsset === false && policy.productionBoundary?.reportApprovesBudgetLimit === false && policy.productionBoundary?.reportAllowsProductionManifest === false && policy.productionBoundary?.reportAllowsDocumentaryShipping === false && policy.productionBoundary?.reportAllowsProductionWebgl === false && policy.productionBoundary?.reportPromotesOfflineVisualApproval === false, 'budget policy crossed a production/gate boundary');

expect(slice.deliveryPreflight?.budgetReportRequired === true, 'canonical Pushkin slice must require a budget report');
expect(slice.firstSliceBudgets?.status === 'must-be-measured-on-source-offline-slice', 'canonical first-slice budget must remain measurement-pending until evidence is reviewed/promoted');
expect(slice.firstSliceBudgets?.transferBytes === null && slice.firstSliceBudgets?.gpuTextureResidentBytes === null && slice.firstSliceBudgets?.frameTimeTargets === null && slice.firstSliceBudgets?.productionTextureEncodingDecision === null, 'source authority may not fabricate approved runtime budget values from offline evidence');
expect(hallContract.sourceAuthority?.pushkinOfflineBudget === policyPath, 'Hall contract must register the first-slice budget authority');
expect(acquisition.currentOutcome?.productionManifestAllowed === false && acquisition.currentOutcome?.productionWebglMayBegin === false, 'first-slice budget evidence requires production to remain blocked');

expect(builder.includes("conservativeRgba8ResidentBytes") && builder.includes("productionGpuTextureResidentBytes: null") && builder.includes("webFrameTimeMs: null"), 'budget builder must preserve offline-estimate vs web-runtime distinction');
expect(builder.includes("optimizedNonDocumentaryBytes") && builder.includes("documentaryShareOfOptimizedTransferPercent"), 'budget builder must separate documentary transfer dominance');
expect(workflow.includes('build-first-slice-budget.mjs') && workflow.includes('first-slice-budget-report.json'), 'offline exhibit workflow must build the first-slice budget report');
expect(workflow.includes('validate-hall-pushkin-offline-budget.mjs'), 'offline exhibit workflow must fail closed on first-slice budget evidence');
expect(workflow.includes('docs/hall-v3/pushkin-offline-budget.json') && workflow.includes('scripts/validate-hall-pushkin-offline-budget.mjs'), 'budget authority/validator changes must select the dedicated Hall workflow');

const evidenceDirValue = process.env.HALL_PUSHKIN_OFFLINE_EVIDENCE_DIR;
if (evidenceDirValue) {
  const evidenceDir = path.resolve(evidenceDirValue);
  const reportPath = path.join(evidenceDir, policy.report?.fileName ?? 'first-slice-budget-report.json');
  const evidencePath = path.join(evidenceDir, 'offline-exhibit-evidence.json');
  const rawPath = path.join(evidenceDir, 'pushkin-offline-raw.glb');
  const optimizedPath = path.join(evidenceDir, 'pushkin-offline-optimized.glb');
  const sourceAssetsValue = process.env.HALL_PUSHKIN_SOURCE_ASSETS_EVIDENCE;
  const sourceAssetsPath = sourceAssetsValue ? path.resolve(sourceAssetsValue) : null;
  for (const requiredPath of [reportPath, evidencePath, rawPath, optimizedPath]) {
    expect(fs.existsSync(requiredPath), `generated first-slice budget input missing: ${path.basename(requiredPath)}`);
  }
  expect(Boolean(sourceAssetsPath) && fs.existsSync(sourceAssetsPath), 'generated first-slice budget validation requires source-assets-evidence.json');

  if (fs.existsSync(reportPath) && fs.existsSync(evidencePath) && fs.existsSync(rawPath) && fs.existsSync(optimizedPath) && sourceAssetsPath && fs.existsSync(sourceAssetsPath)) {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    const sourceAssets = JSON.parse(fs.readFileSync(sourceAssetsPath, 'utf8'));
    expect(report.schemaVersion === 1 && report.laneId === 'TLP-HALL-001' && report.productIssue === 369 && report.phase === 'pushkinVerticalSlice', 'generated budget report identity drifted');
    expect(report.status === 'offline-source-slice-measured-production-runtime-pending' && report.purpose === policy.report?.purpose, 'generated budget report must stop before production-runtime budget approval');
    expect(report.delivery?.rawGlb?.bytes === fs.statSync(rawPath).size && report.delivery?.rawGlb?.sha256 === sha256File(rawPath), 'budget report raw GLB identity drifted');
    expect(report.delivery?.optimizedGlb?.bytes === fs.statSync(optimizedPath).size && report.delivery?.optimizedGlb?.sha256 === sha256File(optimizedPath), 'budget report optimized GLB identity drifted');
    expect(Number(report.scene?.exhibitTriangles) === Number(evidence.scene?.exhibitTriangles) && Number(report.scene?.exhibitTriangles) > 0, 'budget triangle count must match generated exhibit evidence');
    expect(Number(report.scene?.drawMaterialCount) === Number(evidence.scene?.materials) && Number(report.scene?.drawMaterialCount) > 0, 'budget material count must match generated exhibit evidence');
    expect(Number(report.scene?.exhibitMeshObjects) === Number(evidence.scene?.exhibitMeshObjects), 'budget mesh-object count must match generated exhibit evidence');

    const sources = new Map((sourceAssets.sources ?? []).map((entry) => [entry.assetId, entry]));
    const derivative = (sourceAssets.derivatives ?? []).find((entry) => entry.assetId === 'pushkin-onegin-1833-title-page-offline-derivative');
    const portrait = sources.get('pushkin-kiprensky-1827-portrait');
    const expectedImages = [
      {
        name: 'kiprensky-1827-source',
        sha256: portrait?.sha256,
        compressedBytes: Number(portrait?.byteCount),
        dimensions: acquisition.assets?.find((entry) => entry.assetId === 'pushkin-kiprensky-1827-portrait')?.verifiedByteIdentity?.dimensions,
      },
      {
        name: 'onegin-1833-title-page',
        sha256: derivative?.sha256,
        compressedBytes: Number(derivative?.byteCount),
        dimensions: derivative?.dimensions,
      },
    ];
    const images = report.delivery?.optimizedGlb?.images ?? [];
    expect(images.length === 2, 'budget report must contain exactly two embedded documentary images');
    for (const expected of expectedImages) {
      const actual = images.find((entry) => entry.name === expected.name);
      expect(Boolean(actual), `budget report missing ${expected.name}`);
      if (actual) {
        expect(actual.sha256 === expected.sha256 && Number(actual.compressedBytes) === expected.compressedBytes, `${expected.name} compressed identity drifted`);
        expect(same(actual.dimensions, expected.dimensions), `${expected.name} dimensions drifted`);
        expect(Number(actual.conservativeRgba8ResidentBytes) === Number(expected.dimensions?.[0]) * Number(expected.dimensions?.[1]) * 4, `${expected.name} RGBA8 residency estimate drifted`);
      }
    }
    const expectedDocumentaryBytes = expectedImages.reduce((total, entry) => total + entry.compressedBytes, 0);
    const expectedRgba8 = expectedImages.reduce((total, entry) => total + Number(entry.dimensions?.[0]) * Number(entry.dimensions?.[1]) * 4, 0);
    expect(Number(report.delivery?.optimization?.documentaryCompressedBytes) === expectedDocumentaryBytes, 'budget documentary compressed-byte total drifted');
    expect(Number(report.delivery?.optimization?.optimizedNonDocumentaryBytes) === fs.statSync(optimizedPath).size - expectedDocumentaryBytes, 'budget non-documentary optimized bytes drifted');
    expect(Number(report.scene?.conservativeRgba8DecodedTextureResidentBytes) === expectedRgba8, 'budget conservative RGBA8 decoded estimate drifted');
    expect(report.productionUnknowns?.productionGpuTextureResidentBytes === null && report.productionUnknowns?.webRendererInfo === null && report.productionUnknowns?.webFrameTimeMs === null && report.productionUnknowns?.mobileFrameTimeMs === null && report.productionUnknowns?.assetDecodeLoadTimeMs === null && report.productionUnknowns?.productionTextureEncodingDecision === null, 'offline budget report may not fabricate web/runtime measurements');
    expect(report.productionBoundary?.productionAsset === false && report.productionBoundary?.approvedBudgetLimit === false && report.productionBoundary?.productionManifestAllowed === false && report.productionBoundary?.documentaryProductionShippingAllowed === false && report.productionBoundary?.productionWebglMayBegin === false && report.productionBoundary?.offlineVisualApprovalPromoted === false, 'generated budget report may not promote production or Hall gates');
  }
}

if (failures.length) {
  console.error('Hall Pushkin first-slice budget validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Hall Pushkin first-slice budget authority passed${evidenceDirValue ? ': generated GLB transfer/texture/scene measurements are exact while browser GPU/frame-time/encoding remain explicitly unmeasured' : ': budget-report wiring is required and offline evidence cannot promote runtime budgets'}.`);
