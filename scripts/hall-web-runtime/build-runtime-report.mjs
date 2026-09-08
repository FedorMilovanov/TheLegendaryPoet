import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist-hall-web-runtime');
const evidenceDir = path.join(root, 'qa-artifacts', 'hall-web-runtime');
const outputPath = path.join(evidenceDir, 'runtime-budget.json');
const testedSha = process.env.TESTED_SHA || process.env.GITHUB_SHA || null;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function byteSize(file) {
  return fs.statSync(file).size;
}

if (!fs.existsSync(distDir)) throw new Error('dist-hall-web-runtime is missing');
if (!fs.existsSync(evidenceDir)) throw new Error('qa-artifacts/hall-web-runtime is missing');

const buildFiles = walk(distDir);
const relativeBuildFiles = buildFiles.map((file) => ({
  path: path.relative(distDir, file).replaceAll(path.sep, '/'),
  bytes: byteSize(file),
})).sort((a, b) => a.path.localeCompare(b.path));

const jsBytes = relativeBuildFiles.filter((file) => file.path.endsWith('.js')).reduce((sum, file) => sum + file.bytes, 0);
const cssBytes = relativeBuildFiles.filter((file) => file.path.endsWith('.css')).reduce((sum, file) => sum + file.bytes, 0);
const totalBytes = relativeBuildFiles.reduce((sum, file) => sum + file.bytes, 0);

const runtimeFiles = fs.readdirSync(evidenceDir)
  .filter((name) => /-(runtime|forced-fallback|reduced-motion|context-loss)\.json$/.test(name))
  .sort();
const runtimeEvidence = runtimeFiles.map((name) => ({
  file: name,
  ...JSON.parse(fs.readFileSync(path.join(evidenceDir, name), 'utf8')),
}));
const chromiumRuntime = runtimeEvidence.find((entry) => entry.file === 'chromium-desktop-runtime.json');
const webkitRuntime = runtimeEvidence.find((entry) => entry.file === 'webkit-iphone-runtime.json');

if (!chromiumRuntime || chromiumRuntime.state?.mode !== 'webgl' || chromiumRuntime.state?.metrics?.firstFrameMs == null) {
  throw new Error('Canonical Chromium WebGL runtime evidence is missing');
}
if (!webkitRuntime || webkitRuntime.state?.ready !== true) throw new Error('Canonical WebKit/iPhone runtime-or-fallback evidence is missing');
if (testedSha && chromiumRuntime.testedSha !== testedSha) throw new Error(`Chromium evidence SHA ${chromiumRuntime.testedSha} does not match ${testedSha}`);
if (testedSha && webkitRuntime.testedSha !== testedSha) throw new Error(`WebKit evidence SHA ${webkitRuntime.testedSha} does not match ${testedSha}`);

const report = {
  schemaVersion: 1,
  laneId: 'TLP-HALL-WEB-PROOF-001',
  productIssue: 463,
  testedSha,
  productionAcceptance: false,
  productionRouteActivated: false,
  authority: chromiumRuntime.state.authority,
  build: {
    totalBytes,
    jsBytes,
    cssBytes,
    files: relativeBuildFiles,
  },
  chromium: {
    evidenceFile: chromiumRuntime.file,
    project: chromiumRuntime.project,
    mode: chromiumRuntime.state.mode,
    metrics: chromiumRuntime.state.metrics,
  },
  webkit: {
    evidenceFile: webkitRuntime.file,
    project: webkitRuntime.project,
    mode: webkitRuntime.state.mode,
    reason: webkitRuntime.state.reason,
    metrics: webkitRuntime.state.metrics,
  },
  thresholds: {
    totalBuildBytesMax: 1500000,
    jsBytesMax: 1200000,
    cssBytesMax: 65536,
    drawCallsMax: 40,
    trianglesMax: 15000,
    texturesMax: 0,
    chromiumFirstFrameMsMax: 5000,
  },
};

fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ outputPath: path.relative(root, outputPath), ...report.build, chromium: report.chromium, webkit: report.webkit }, null, 2));
