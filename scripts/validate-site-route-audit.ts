import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');

const specPath = 'qa/site-route-integrity.spec.mjs';
const contractPath = 'src/routes/route-contract.json';
const configPath = 'playwright.route-audit.config.mjs';
const workflowPath = '.github/workflows/site-route-integrity-audit.yml';
const ciPath = '.github/workflows/ci.yml';

for (const file of [specPath, contractPath, configPath, workflowPath, ciPath]) {
  assert.ok(fs.existsSync(path.resolve(file)), `${file}: route audit file is missing`);
}

const spec = read(specPath);
const contract = JSON.parse(read(contractPath));
const config = read(configPath);
const workflow = read(workflowPath);
const ci = read(ciPath);

assert.equal(contract.schemaVersion, 1);
assert.ok(contract.routes.some((route: { audit: string; path: string }) => route.audit === 'utility' && route.path === '/hall'));
assert.ok(contract.routes.some((route: { audit: string; path: string }) => route.audit === 'utility' && route.path === '/archive'));
assert.ok(contract.redirects.some((redirect: { from: string }) => redirect.from === '/articles/article-1'));
assert.ok(contract.notFoundProbes.includes('/route-audit-page-that-must-not-exist'));
assert.ok(contract.notFoundProbes.includes('/articles/route-audit-legacy'));
assert.ok(!contract.redirects.some((redirect: { from: string }) => redirect.from === '/articles/route-audit-legacy'));

assert.match(spec, /public\/sitemap\.xml/);
assert.match(spec, /src\/routes\/route-contract\.json/);
assert.match(spec, /MIN_CANONICAL_ROUTES = 28/);
assert.match(spec, /MIN_AUDITED_ROUTES = 35/);
assert.match(spec, /const canonicalRoutes = readCanonicalRoutes\(\)/);
assert.match(spec, /routeContract\.routes/);
assert.match(spec, /routeContract\.redirects/);
assert.match(spec, /routeContract\.notFoundProbes/);
assert.match(spec, /knownInternalPaths/);
assert.match(spec, /unknown internal route links rendered on/);
assert.match(spec, /page\.on\('pageerror'/);
assert.match(spec, /response\.status\(\) >= 400/);
assert.match(spec, /visible viewport images should decode/);
assert.match(spec, /horizontalOverflow/);
assert.match(spec, /link\[rel="canonical"\]/);
assert.match(spec, /ChunkLoadError/);
assert.match(spec, /for \(const route of renderedRoutes\)/);
assert.match(spec, /for \(const \[source, target\] of redirects\)/);
assert.match(spec, /for \(const notFoundRoute of notFoundRoutes\)/);
assert.doesNotMatch(spec, /const canonicalRoutes = \[/);
assert.doesNotMatch(spec, /waitForTimeout\(/);
assert.doesNotMatch(spec, /webkit|iphone-safari/i);

assert.match(config, /failOnFlakyTests:\s*Boolean\(process\.env\.CI\)/);
assert.match(config, /retries:\s*process\.env\.CI\s*\?\s*1\s*:\s*0/);
assert.match(config, /browserName:\s*'chromium'/);
assert.match(config, /trace:\s*'retain-on-failure'/);
assert.match(config, /screenshot:\s*'only-on-failure'/);
assert.doesNotMatch(config, /webkit|firefox/i);

assert.match(workflow, /name: Site route integrity audit/);
assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
assert.match(workflow, /npm run sitemap/);
assert.match(workflow, /npm run build/);
assert.match(workflow, /playwright install --with-deps chromium/);
assert.match(workflow, /qa\/site-route-integrity\.spec\.mjs/);
assert.match(workflow, /playwright\.route-audit\.config\.mjs/);
assert.match(workflow, /site-route-integrity-evidence/);
assert.doesNotMatch(workflow, /--retries=0/);
assert.doesNotMatch(workflow, /webkit|firefox/i);

assert.match(ci, /Validate site route audit architecture/);
assert.match(ci, /npm run validate:route-audit/);

console.log('site route audit: route-contract inventory, behavioral URLs, strict runtime evidence, primary-CI lock and isolated Chromium execution locked');
