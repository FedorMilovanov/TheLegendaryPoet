import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportPath = path.join(root, 'qa-artifacts', 'hall-web-runtime', 'runtime-budget.json');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

if (!fs.existsSync(reportPath)) {
  console.error('Hall web runtime report validation failed:\n- runtime-budget.json is missing');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const expectedSha = process.env.TESTED_SHA || process.env.GITHUB_SHA || null;

expect(report.schemaVersion === 1, 'schemaVersion must be 1');
expect(report.laneId === 'TLP-HALL-WEB-PROOF-001' && report.productIssue === 463, 'runtime report identity must remain exact');
expect(typeof report.testedSha === 'string' && /^[0-9a-f]{40}$/.test(report.testedSha), 'testedSha must be a full commit SHA');
if (expectedSha) expect(report.testedSha === expectedSha, `testedSha must equal current exact head ${expectedSha}`);
expect(report.productionAcceptance === false && report.productionRouteActivated === false, 'runtime proof may not claim production acceptance or route activation');
expect(report.authority?.topology === 'H3', 'runtime report must preserve H3 topology authority');
expect(report.authority?.layoutFingerprint === '5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65', 'runtime report H3 fingerprint drifted');
expect(report.authority?.cameraRig === 'R1', 'runtime report must preserve R1 camera authority');
expect(report.authority?.lighting === 'L0-minimal-runtime', 'runtime report must preserve L0 lighting authority');
expect(report.authority?.surfaceUv === 'UV0', 'runtime report must preserve UV0 surface authority');
expect(report.authority?.documentaryMedia === 'excluded', 'runtime report must prove documentary media exclusion');

const thresholds = report.thresholds ?? {};
expect(report.build?.totalBytes <= thresholds.totalBuildBytesMax, `total proof build ${report.build?.totalBytes} exceeds ${thresholds.totalBuildBytesMax}`);
expect(report.build?.jsBytes <= thresholds.jsBytesMax, `proof JS ${report.build?.jsBytes} exceeds ${thresholds.jsBytesMax}`);
expect(report.build?.cssBytes <= thresholds.cssBytesMax, `proof CSS ${report.build?.cssBytes} exceeds ${thresholds.cssBytesMax}`);
expect(Array.isArray(report.build?.files) && report.build.files.length > 0, 'runtime build file inventory must be present');

expect(report.chromium?.mode === 'webgl', 'Chromium must prove the real WebGL success path');
expect(report.chromium?.metrics?.drawCalls > 0 && report.chromium.metrics.drawCalls <= thresholds.drawCallsMax, `Chromium draw calls must be within 1..${thresholds.drawCallsMax}`);
expect(report.chromium?.metrics?.triangles > 0 && report.chromium.metrics.triangles <= thresholds.trianglesMax, `Chromium triangles must be within 1..${thresholds.trianglesMax}`);
expect(report.chromium?.metrics?.textures === thresholds.texturesMax, `Chromium texture count must remain ${thresholds.texturesMax} for documentary-free proof`);
expect(report.chromium?.metrics?.firstFrameMs > 0 && report.chromium.metrics.firstFrameMs <= thresholds.chromiumFirstFrameMsMax, `Chromium first frame must be within ${thresholds.chromiumFirstFrameMsMax} ms`);
expect(report.chromium?.metrics?.canvasWidth > 0 && report.chromium?.metrics?.canvasHeight > 0, 'Chromium canvas dimensions must be measured');

expect(report.webkit?.project === 'webkit-iphone', 'WebKit/iPhone project evidence must be present');
expect(['webgl', 'fallback'].includes(report.webkit?.mode), 'WebKit/iPhone must prove either runtime readiness or semantic fallback');
if (report.webkit?.mode === 'fallback') expect(Boolean(report.webkit?.reason), 'WebKit fallback must record a reason');

if (failures.length) {
  console.error('Hall web runtime report validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Hall web runtime report: OK — ${report.build.totalBytes} total bytes, ${report.chromium.metrics.drawCalls} draw calls, ${report.chromium.metrics.triangles} triangles, ${report.chromium.metrics.textures} textures, ${report.chromium.metrics.firstFrameMs} ms first frame; production acceptance remains false.`);
