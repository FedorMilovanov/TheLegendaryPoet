import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const deepWorkflowPath = '.github/workflows/brand-deep-audit.yml';
const manualWorkflowPath = '.github/workflows/manual-browser-qa.yml';
const deepSpecPath = 'qa/brand-deep-audit.spec.mjs';

for (const file of [deepWorkflowPath, manualWorkflowPath, deepSpecPath]) {
  assert.ok(fs.existsSync(path.resolve(file)), `${file}: required brand audit file is missing`);
}

const workflow = read(deepWorkflowPath);
const manual = read(manualWorkflowPath);
const spec = read(deepSpecPath);
const motion = read('src/components/brandMotionV18.ts');
const mark = read('src/components/BrandMark.tsx');

assert.match(workflow, /name: Brand deep reference and motion audit/);
assert.match(workflow, /Checkout exact tested head/);
assert.match(workflow, /github\.event\.pull_request\.head\.sha \|\| github\.sha/);
assert.match(workflow, /npm run validate:brand/);
assert.match(workflow, /npm run typecheck/);
assert.match(workflow, /npm run build/);
assert.match(workflow, /qa\/brand-deep-audit\.spec\.mjs/);
assert.match(workflow, /--project=chromium-core/);
assert.match(workflow, /--workers=1/);
assert.match(workflow, /brand-reference-contract-metrics\.json/);
assert.match(workflow, /brand-motion-quality-metrics\.json/);
assert.doesNotMatch(manual, /qa\/brand-deep-audit\.spec\.mjs/);

assert.match(spec, /reference proportions are measured and no current SVG is silently approval-eligible/);
assert.match(spec, /approvalEligible/);
assert.match(spec, /toBe\(false\)/);
assert.match(spec, /spring motion has bounded trajectory, size-normalized depth and fast exact return/);
assert.match(spec, /samples\.length[\s\S]*toBeGreaterThanOrEqual\(12\)/);
assert.match(spec, /sampleSpanMs[\s\S]*toBeGreaterThanOrEqual\(900\)/);
assert.match(spec, /activation\.elapsed \+ 120/);
assert.match(spec, /first95AfterActivationMs/);
assert.match(spec, /peak[\s\S]*expectedEnergy \* 1\.06/);
assert.match(spec, /maxJump/);
assert.match(spec, /data-brand-interaction', 'idle'/);
assert.match(spec, /normalizedAmplitudeRatio/);
assert.match(spec, /reduced motion keeps all depth transforms inert/);

assert.match(motion, /motionScale = clamp\(Math\.min\(bounds\.width, bounds\.height\) \/ 64, 0\.65, 1\.6\)/);
assert.match(motion, /const scaled = \(value: number\) => value \* motionScale/);
assert.match(motion, /const stiffness = active \? 136 : 180/);
assert.match(motion, /const damping = active \? 18\.5 : 20/);
assert.match(motion, /const wakeStiffness = active \? 126 : 220/);
assert.match(motion, /const wakeDamping = active \? 15\.8 : 22/);
assert.match(motion, /const positionTolerance = active \? 0\.0018 : 0\.006/);
assert.match(motion, /const velocityTolerance = active \? 0\.0038 : 0\.15/);
assert.match(motion, /const wakeTolerance = active \? 0\.0022 : 0\.08/);
assert.match(motion, /--brand-motion-scale/);
assert.match(mark, /data-brand-motion-normalization="rendered-box-v1"/);
assert.match(mark, /data-brand-parallax="spring-awakening-v4"/);

console.log('brand deep audit: exact-head Chromium geometry, trajectory, bounded exact-idle return, size normalization and reduced-motion gates are locked');
