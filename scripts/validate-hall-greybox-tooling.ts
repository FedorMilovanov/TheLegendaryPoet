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

const reference = JSON.parse(read('docs/hall-v3/reference-bible.json')) as {
  status?: string;
  metricConstraints?: {
    unit?: string;
    routeOneWayMinimum?: number;
    routeTwoWayRecommendedMinimum?: number;
    accessibleViewingClearance?: { width?: number; depth?: number };
    clearHeadroomMinimum?: number;
  };
  spatialHypotheses?: Array<{ id?: string }>;
  greyboxEvidencePackage?: {
    certifiedCameraWitnesses?: string[];
    mobileCropMinimum?: number;
    requiredOutputs?: string[];
  };
  decisions?: Record<string, unknown>;
};

const toolingPath = 'docs/hall-v3/greybox-tooling.json';
const candidatesPath = 'docs/hall-v3/greybox-candidates.json';
const tooling = JSON.parse(read(toolingPath)) as {
  schemaVersion?: number;
  laneId?: string;
  phase?: string;
  status?: string;
  blender?: {
    releaseSeries?: string;
    version?: string;
    platform?: string;
    archiveFilename?: string;
    archiveUrl?: string;
    checksumIndexUrl?: string;
    officialBuildIndex?: string;
    officialManual?: string;
    requiredCli?: string[];
    autoUpdate?: boolean;
  };
  smokeScene?: {
    unitSystem?: string;
    lengthUnit?: string;
    scaleLength?: number;
    humanProxyHeightMetres?: number;
    requiredCollections?: string[];
    requiredObjects?: string[];
    roundTripSaveReopen?: boolean;
    renderRequired?: boolean;
    materialsRequired?: boolean;
    lightsRequired?: boolean;
  };
  evidence?: { directory?: string; json?: string; blend?: string; retainInGit?: boolean };
  candidateManifest?: string;
  nonGoals?: string[];
};

const candidates = JSON.parse(read(candidatesPath)) as {
  schemaVersion?: number;
  laneId?: string;
  phase?: string;
  status?: string;
  approvedCandidate?: unknown;
  cameraSet?: { status?: string; lensCandidatesMm?: number[]; approvedRig?: unknown };
  equalComparison?: {
    unit?: string;
    neutralMaterialOnly?: boolean;
    ornamentAllowed?: boolean;
    bloomAllowed?: boolean;
    fogAllowed?: boolean;
    particlesAllowed?: boolean;
    goldGlowAllowed?: boolean;
    fpsRequired?: boolean;
    commonHumanProxyHeightMetres?: number;
    minimumClearances?: {
      routeOneWay?: number;
      routeTwoWayRecommended?: number;
      viewingWidth?: number;
      viewingDepth?: number;
      headroom?: number;
    };
    requiredCameraWitnesses?: string[];
    mobileCropMinimum?: number;
    requiredOutputs?: string[];
  };
  automaticRejectionRules?: string[];
  candidates?: Array<{
    id?: string;
    status?: string;
    sourceBlend?: unknown;
    evidenceManifest?: unknown;
    routeLengthMetres?: unknown;
    forcedTurnCount?: unknown;
    rejected?: boolean;
    rejectionReasons?: unknown[];
  }>;
};

const packageManifest = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const workflowPath = '.github/workflows/hall-greybox-tooling.yml';
const workflow = read(workflowPath);
const blenderScriptPath = 'scripts/hall-greybox/blender-tooling-preflight.py';
const blenderScript = read(blenderScriptPath);

expect(contract.laneId === 'TLP-HALL-001', 'Hall contract must remain owned by TLP-HALL-001');
expect(contract.phase === 'metricGreybox', 'Hall machine phase must be metricGreybox in this wave');
expect(contract.gates?.foundation === 'completed', 'foundation must remain completed');
expect(contract.gates?.referenceBible === 'completed', 'Reference Bible must be completed before metricGreybox');
expect(contract.gates?.metricGreybox === 'active', 'metricGreybox gate must be active');
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
expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain a placeholder during metric greybox');
expect(contract.productionRoute?.allowLegacyHallImports === false, 'metric greybox must not reactivate legacy Hall imports');
expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'metric greybox must not activate Three/R3F runtime');
expect(contract.productionRoute?.allowUnapprovedConceptArt === false, 'metric greybox must not publish unapproved concept art');

expect(contract.sourceAuthority?.greyboxTooling === toolingPath, `sourceAuthority.greyboxTooling must equal ${toolingPath}`);
expect(contract.sourceAuthority?.greyboxCandidates === candidatesPath, `sourceAuthority.greyboxCandidates must equal ${candidatesPath}`);

expect(reference.status === 'completed', 'Reference Bible data must be completed before metric greybox activates');
for (const [decision, value] of Object.entries(reference.decisions ?? {})) {
  expect(value === null, `metric greybox must start without pre-approved Reference Bible decision: ${decision}`);
}

expect(tooling.schemaVersion === 1, 'greybox tooling schemaVersion must be 1');
expect(tooling.laneId === contract.laneId, 'greybox tooling lane must match Hall contract');
expect(tooling.phase === 'metricGreybox' && tooling.status === 'active', 'greybox tooling must be active in metricGreybox phase');
expect(tooling.blender?.releaseSeries === '4.5 LTS', 'greybox Blender release series must be 4.5 LTS');
expect(tooling.blender?.version === '4.5.12', 'greybox Blender version must be pinned to 4.5.12');
expect(tooling.blender?.platform === 'linux-x64', 'CI greybox Blender platform must be linux-x64');
expect(tooling.blender?.archiveFilename === 'blender-4.5.12-linux-x64.tar.xz', 'Blender archive filename must remain exact');
expect(tooling.blender?.archiveUrl === 'https://download.blender.org/release/Blender4.5/blender-4.5.12-linux-x64.tar.xz', 'Blender archive must come from the official pinned release URL');
expect(tooling.blender?.checksumIndexUrl === 'https://download.blender.org/release/Blender4.5/blender-4.5.12.sha256', 'Blender checksum index must come from the official pinned release URL');
expect(tooling.blender?.officialBuildIndex?.startsWith('https://builder.blender.org/'), 'tooling must retain an official Blender build-index witness');
expect(tooling.blender?.officialManual?.startsWith('https://docs.blender.org/manual/'), 'tooling must retain an official Blender manual witness');
expect(JSON.stringify(tooling.blender?.requiredCli ?? []) === JSON.stringify(['--background', '--disable-autoexec', '--python-exit-code', '--python']), 'required Blender headless CLI flags must remain explicit');
expect(tooling.blender?.autoUpdate === false, 'Blender tooling must not silently auto-update');

expect(tooling.smokeScene?.unitSystem === 'METRIC', 'tooling smoke scene must use METRIC units');
expect(tooling.smokeScene?.lengthUnit === 'METERS', 'tooling smoke scene must use METERS length units');
expect(tooling.smokeScene?.scaleLength === 1, 'tooling smoke scene must keep one Blender unit equal to one metre');
expect(tooling.smokeScene?.humanProxyHeightMetres === 1.75, 'tooling smoke scene human proxy must remain 1.75 m');
expect(JSON.stringify(tooling.smokeScene?.requiredCollections ?? []) === JSON.stringify(['COLL_CORE', 'COLL_CAMERAS', 'COLL_EXPORT_HELPERS']), 'tooling smoke scene collections must remain stable');
expect(JSON.stringify(tooling.smokeScene?.requiredObjects ?? []) === JSON.stringify(['TOOLING_FLOOR', 'HUMAN_PROXY', 'CAM_TOOLING_PREFLIGHT']), 'tooling smoke scene objects must remain stable');
expect(tooling.smokeScene?.roundTripSaveReopen === true, 'tooling smoke scene must prove save/reopen round trip');
expect(tooling.smokeScene?.renderRequired === false, 'tooling preflight must not require rendering');
expect(tooling.smokeScene?.materialsRequired === false, 'tooling preflight must not require materials');
expect(tooling.smokeScene?.lightsRequired === false, 'tooling preflight must not require lights');
expect(tooling.evidence?.retainInGit === false, 'generated Blender smoke evidence must not become Product source authority');
expect(tooling.candidateManifest === candidatesPath, 'tooling must point to the canonical greybox candidate manifest');
expect((tooling.nonGoals?.length ?? 0) >= 8, 'tooling preflight must retain strong non-goals');

expect(candidates.schemaVersion === 1, 'greybox candidate schemaVersion must be 1');
expect(candidates.laneId === contract.laneId, 'greybox candidate lane must match Hall contract');
expect(candidates.phase === 'metricGreybox' && candidates.status === 'active', 'greybox candidate manifest must be active');
expect(candidates.approvedCandidate === null, 'metric greybox must start without an approved candidate');
expect(candidates.cameraSet?.approvedRig === null, 'camera rig must remain unapproved during metric greybox');
expect((candidates.cameraSet?.lensCandidatesMm?.length ?? -1) === 0, 'common candidate lens set must remain unselected in tooling preflight');

const comparison = candidates.equalComparison ?? {};
const referenceMetrics = reference.metricConstraints ?? {};
expect(comparison.unit === referenceMetrics.unit, 'greybox unit must match Reference Bible');
expect(comparison.neutralMaterialOnly === true, 'all candidate greyboxes must use neutral material only');
for (const [key, value] of Object.entries({
  ornamentAllowed: comparison.ornamentAllowed,
  bloomAllowed: comparison.bloomAllowed,
  fogAllowed: comparison.fogAllowed,
  particlesAllowed: comparison.particlesAllowed,
  goldGlowAllowed: comparison.goldGlowAllowed,
  fpsRequired: comparison.fpsRequired,
})) {
  expect(value === false, `metric greybox comparison must keep ${key}=false`);
}
expect(comparison.commonHumanProxyHeightMetres === 1.75, 'all greybox candidates must use the same 1.75 m human proxy');
expect(comparison.minimumClearances?.routeOneWay === referenceMetrics.routeOneWayMinimum, 'one-way clearance must match Reference Bible');
expect(comparison.minimumClearances?.routeTwoWayRecommended === referenceMetrics.routeTwoWayRecommendedMinimum, 'two-way clearance must match Reference Bible');
expect(comparison.minimumClearances?.viewingWidth === referenceMetrics.accessibleViewingClearance?.width, 'viewing width must match Reference Bible');
expect(comparison.minimumClearances?.viewingDepth === referenceMetrics.accessibleViewingClearance?.depth, 'viewing depth must match Reference Bible');
expect(comparison.minimumClearances?.headroom === referenceMetrics.clearHeadroomMinimum, 'headroom must match Reference Bible');
expect(JSON.stringify(comparison.requiredCameraWitnesses ?? []) === JSON.stringify(reference.greyboxEvidencePackage?.certifiedCameraWitnesses ?? []), 'greybox camera witnesses must exactly inherit Reference Bible');
expect(comparison.mobileCropMinimum === reference.greyboxEvidencePackage?.mobileCropMinimum, 'mobile crop minimum must inherit Reference Bible');
expect(JSON.stringify(comparison.requiredOutputs ?? []) === JSON.stringify(reference.greyboxEvidencePackage?.requiredOutputs ?? []), 'greybox required outputs must exactly inherit Reference Bible');
expect((candidates.automaticRejectionRules?.length ?? 0) >= 8, 'greybox candidate manifest must retain automatic rejection rules');

const candidateList = candidates.candidates ?? [];
expect(JSON.stringify(candidateList.map((candidate) => candidate.id)) === JSON.stringify(['H1', 'H2', 'H3']), 'greybox candidate manifest must start with H1/H2/H3 only');
expect(JSON.stringify(reference.spatialHypotheses?.map((hypothesis) => hypothesis.id) ?? []) === JSON.stringify(['H1', 'H2', 'H3']), 'Reference Bible hypothesis IDs must remain H1/H2/H3');
for (const candidate of candidateList) {
  expect(candidate.status === 'unbuilt', `${candidate.id ?? 'candidate'} must remain unbuilt in tooling preflight`);
  expect(candidate.sourceBlend === null, `${candidate.id ?? 'candidate'} must not have a source blend before authoring begins`);
  expect(candidate.evidenceManifest === null, `${candidate.id ?? 'candidate'} must not claim evidence before authoring begins`);
  expect(candidate.routeLengthMetres === null, `${candidate.id ?? 'candidate'} route length must remain unset before measurement`);
  expect(candidate.forcedTurnCount === null, `${candidate.id ?? 'candidate'} forced-turn count must remain unset before measurement`);
  expect(candidate.rejected === false, `${candidate.id ?? 'candidate'} must not be pre-rejected in tooling preflight`);
  expect((candidate.rejectionReasons?.length ?? 0) === 0, `${candidate.id ?? 'candidate'} rejection reasons must start empty`);
}

expect(blenderScript.includes('EXPECTED_VERSION = (4, 5, 12)'), 'Blender smoke script must assert exact Blender version');
expect(blenderScript.includes('bpy.app.background'), 'Blender smoke script must assert background mode');
expect(blenderScript.includes('read_factory_settings(use_empty=True)'), 'Blender smoke script must start from an empty factory scene');
expect(blenderScript.includes('scene.unit_settings.system = "METRIC"'), 'Blender smoke script must author metric units');
expect(blenderScript.includes('scene.unit_settings.scale_length = 1.0'), 'Blender smoke script must make one Blender unit one metre');
expect(blenderScript.includes('save_as_mainfile'), 'Blender smoke script must save a .blend round-trip witness');
expect(blenderScript.includes('open_mainfile'), 'Blender smoke script must reopen its saved .blend witness');
expect(!blenderScript.includes('bpy.ops.render'), 'tooling smoke script must not hide architecture behind rendering');
expect(!blenderScript.includes('bpy.data.materials.new'), 'tooling smoke script must not create lookdev materials');
expect(!blenderScript.includes('bpy.data.lights.new'), 'tooling smoke script must not create lighting lookdev');

expect(workflow.includes(tooling.blender?.archiveUrl ?? '<missing>'), 'greybox workflow must download the exact pinned Blender release');
expect(workflow.includes(tooling.blender?.checksumIndexUrl ?? '<missing>'), 'greybox workflow must download the vendor checksum index');
expect(workflow.includes('sha256sum -c'), 'greybox workflow must verify the Blender archive checksum');
expect(workflow.includes('--background'), 'greybox workflow must run Blender in background mode');
expect(workflow.includes('--disable-autoexec'), 'greybox workflow must disable embedded auto-execution');
expect(workflow.includes('--python-exit-code 17'), 'greybox workflow must fail on Blender Python exceptions');
expect(workflow.includes(blenderScriptPath), 'greybox workflow must run the canonical Blender smoke script');
expect(workflow.includes('HALL_GREYBOX_TOOLING_EVIDENCE'), 'greybox workflow must re-run the machine validator against generated Blender evidence');

const scripts = packageManifest.scripts ?? {};
expect(scripts['validate:hall-greybox-tooling'] === 'tsx scripts/validate-hall-greybox-tooling.ts', 'package scripts must expose greybox tooling validator');
expect(scripts.check?.includes('validate:hall-greybox-tooling') === true, 'normal project check must run greybox tooling static validator');
expect(ci.includes('npm run validate:hall-greybox-tooling'), 'primary CI must run greybox tooling static validator');
expect(projectContracts.includes('npm run validate:hall-greybox-tooling'), 'Project contracts must independently run greybox tooling static validator');

const evidenceRelative = process.env.HALL_GREYBOX_TOOLING_EVIDENCE;
if (evidenceRelative) {
  const evidencePath = path.join(root, evidenceRelative);
  expect(fs.existsSync(evidencePath), `generated Blender tooling evidence must exist: ${evidenceRelative}`);
  if (fs.existsSync(evidencePath)) {
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8')) as {
      schemaVersion?: number;
      laneId?: string;
      phase?: string;
      runtime?: { versionTuple?: number[]; buildHash?: string; background?: boolean };
      scene?: {
        unitSystem?: string;
        lengthUnit?: string;
        scaleLength?: number;
        collections?: string[];
        objects?: string[];
        humanProxyHeightMetres?: number;
        materials?: number;
        lights?: number;
      };
      roundTripSaveReopen?: boolean;
      rendered?: boolean;
      blendFile?: string;
    };
    expect(evidence.schemaVersion === 1, 'generated Blender evidence schemaVersion must be 1');
    expect(evidence.laneId === contract.laneId, 'generated Blender evidence lane must match Hall contract');
    expect(evidence.phase === 'metricGreybox', 'generated Blender evidence must identify metricGreybox phase');
    expect(JSON.stringify(evidence.runtime?.versionTuple ?? []) === JSON.stringify([4, 5, 12]), 'generated Blender evidence must prove exact 4.5.12 runtime');
    expect((evidence.runtime?.buildHash?.length ?? 0) >= 8, 'generated Blender evidence must record a build hash');
    expect(evidence.runtime?.background === true, 'generated Blender evidence must prove background mode');
    expect(evidence.scene?.unitSystem === 'METRIC', 'generated Blender evidence must prove METRIC units');
    expect(evidence.scene?.lengthUnit === 'METERS', 'generated Blender evidence must prove METERS length unit');
    expect(evidence.scene?.scaleLength === 1, 'generated Blender evidence must prove one-unit-one-metre scale');
    expect(evidence.scene?.humanProxyHeightMetres === 1.75, 'generated Blender evidence must prove 1.75 m human proxy');
    for (const name of tooling.smokeScene?.requiredCollections ?? []) {
      expect(evidence.scene?.collections?.includes(name) === true, `generated Blender evidence lost collection ${name}`);
    }
    for (const name of tooling.smokeScene?.requiredObjects ?? []) {
      expect(evidence.scene?.objects?.includes(name) === true, `generated Blender evidence lost object ${name}`);
    }
    expect(evidence.scene?.materials === 0, 'generated Blender smoke scene must contain zero materials');
    expect(evidence.scene?.lights === 0, 'generated Blender smoke scene must contain zero lights');
    expect(evidence.roundTripSaveReopen === true, 'generated Blender evidence must prove save/reopen round trip');
    expect(evidence.rendered === false, 'generated Blender smoke preflight must not render');
    expect(evidence.blendFile === 'tooling-smoke.blend', 'generated Blender evidence must identify tooling-smoke.blend');
  }
}

if (failures.length > 0) {
  console.error('\nHall v3 metric-greybox tooling validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Hall v3 metric-greybox tooling validation passed${evidenceRelative ? ' with generated Blender runtime evidence' : ' (static contract)'}.`);
