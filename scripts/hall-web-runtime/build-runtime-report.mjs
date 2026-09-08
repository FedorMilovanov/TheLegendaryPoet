import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist-hall-web-runtime');
const evidenceDir = path.join(root, 'qa-artifacts', 'hall-web-runtime');
const outputPath = path.join(evidenceDir, 'runtime-budget.json');
const testedSha = process.env.TESTED_SHA || process.env.GITHUB_SHA || null;
const contract = JSON.parse(fs.readFileSync(path.join(root, 'docs/hall-v3/web-runtime-proof.json'), 'utf8'));
const expectedBrowserAuthority = { ...contract.authority, documentaryMedia: contract.runtimeContract.documentaryMedia };
const harnessSource = fs.readFileSync(path.join(root, 'qa/hall-web-runtime/main.ts'), 'utf8');
const applicationTextureApiPattern = /\b(?:TextureLoader|CubeTextureLoader|DataTexture|CanvasTexture|VideoTexture|CompressedTexture|KTX2Loader)\b/g;
const applicationTextureSources = harnessSource.match(applicationTextureApiPattern) ?? [];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

if (!fs.existsSync(distDir)) throw new Error('dist-hall-web-runtime is missing');
if (!fs.existsSync(evidenceDir)) throw new Error('qa-artifacts/hall-web-runtime is missing');

const relativeBuildFiles = walk(distDir).map((file) => ({
  path: path.relative(distDir, file).replaceAll(path.sep, '/'),
  bytes: fs.statSync(file).size,
})).sort((a, b) => a.path.localeCompare(b.path));
const jsBytes = relativeBuildFiles.filter((file) => file.path.endsWith('.js')).reduce((sum, file) => sum + file.bytes, 0);
const cssBytes = relativeBuildFiles.filter((file) => file.path.endsWith('.css')).reduce((sum, file) => sum + file.bytes, 0);
const totalBytes = relativeBuildFiles.reduce((sum, file) => sum + file.bytes, 0);

const runtimeEvidence = fs.readdirSync(evidenceDir)
  .filter((name) => /-(runtime|forced-fallback|reduced-motion|context-loss)\.json$/.test(name))
  .sort()
  .map((name) => ({ file: name, ...JSON.parse(fs.readFileSync(path.join(evidenceDir, name), 'utf8')) }));
const chromiumRuntime = runtimeEvidence.find((entry) => entry.file === 'chromium-desktop-runtime.json');
const webkitRuntime = runtimeEvidence.find((entry) => entry.file === 'webkit-iphone-runtime.json');

if (!chromiumRuntime || chromiumRuntime.state?.mode !== 'webgl' || chromiumRuntime.state?.metrics?.firstFrameMs == null) throw new Error('Canonical Chromium WebGL runtime evidence is missing');
if (!webkitRuntime || webkitRuntime.state?.ready !== true) throw new Error('Canonical WebKit/iPhone runtime-or-fallback evidence is missing');
if (testedSha && chromiumRuntime.testedSha !== testedSha) throw new Error(`Chromium evidence SHA ${chromiumRuntime.testedSha} does not match ${testedSha}`);
if (testedSha && webkitRuntime.testedSha !== testedSha) throw new Error(`WebKit evidence SHA ${webkitRuntime.testedSha} does not match ${testedSha}`);
if (JSON.stringify(chromiumRuntime.state.authority) !== JSON.stringify(expectedBrowserAuthority)) throw new Error('Chromium runtime authority does not match web-runtime-proof contract');
if (JSON.stringify(webkitRuntime.state.authority) !== JSON.stringify(expectedBrowserAuthority)) throw new Error('WebKit runtime authority does not match web-runtime-proof contract');

const report = {
  schemaVersion: 1,
  laneId: contract.laneId,
  productIssue: contract.productIssue,
  testedSha,
  productionAcceptance: contract.productionBoundary.productionAcceptance,
  productionRouteActivated: contract.productionBoundary.productionRouteActivated,
  authority: chromiumRuntime.state.authority,
  applicationTextureSources: {
    count: applicationTextureSources.length,
    tokens: [...new Set(applicationTextureSources)].sort(),
  },
  build: { totalBytes, jsBytes, cssBytes, files: relativeBuildFiles },
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
  thresholds: contract.thresholds,
};

fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  outputPath: path.relative(root, outputPath),
  ...report.build,
  applicationTextureSources: report.applicationTextureSources,
  chromium: report.chromium,
  webkit: report.webkit,
}, null, 2));
