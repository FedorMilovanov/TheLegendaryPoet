import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const deepWorkflowPath = '.github/workflows/brand-deep-audit.yml';
const manualWorkflowPath = '.github/workflows/manual-browser-qa.yml';
const deepSpecPath = 'qa/brand-deep-audit.spec.mjs';
const comparisonSpecPath = 'qa/brand-reference-comparison.spec.mjs';
const motionPath = 'src/components/brandMotionFrameInvariant.ts';
const simulationPath = 'scripts/validate-brand-motion-frame-invariance.ts';

for (const file of [deepWorkflowPath, manualWorkflowPath, deepSpecPath, comparisonSpecPath, motionPath, simulationPath]) {
  assert.ok(fs.existsSync(path.resolve(file)), `${file}: required brand audit file is missing`);
}

const workflow = read(deepWorkflowPath);
const manual = read(manualWorkflowPath);
const spec = read(deepSpecPath);
const comparison = read(comparisonSpecPath);
const motion = read(motionPath);
const simulation = read(simulationPath);
const mark = read('src/components/BrandMark.tsx');
const packageJson = read('package.json');

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
assert.match(spec, /interpolateEnergyAt/);
assert.match(spec, /interpolatedCrossingElapsed/);
assert.match(spec, /activationElapsedMs \+ 120/);
assert.match(spec, /first95ElapsedMs/);
assert.match(spec, /first95AfterActivationMs/);
assert.match(spec, /sampleTransitions/);
assert.match(spec, /frameIntervalsMs/);
assert.match(spec, /maxFrameIntervalMs/);
assert.match(spec, /equivalent60HzJump: observedJump \* \(\(1000 \/ 60\) \/ intervalMs\)/);
assert.match(spec, /maxObservedJump/);
assert.match(spec, /maxEquivalent60HzJump/);
assert.match(spec, /expect\(maxEquivalent60HzJump\)\.toBeLessThan\(0\.55 \* scale\)/);
assert.match(spec, /expect\(maxObservedJump\)\.toBeLessThan\(1\.25 \* scale\)/);
assert.match(spec, /status: 'trajectory-sampled'/);
assert.match(spec, /writeMotionMetrics\([\s\S]*status: 'trajectory-sampled'[\s\S]*expect\(first95AfterActivationMs\)/);
assert.match(spec, /peak[\s\S]*expectedEnergy \* 1\.06/);
assert.match(spec, /data-brand-interaction', 'idle'/);
assert.match(spec, /normalizedAmplitudeRatio/);
assert.match(spec, /reduced motion keeps all depth transforms inert/);
assert.match(spec, /data-brand-motion-timestep', 'bounded-substeps-v1'/);

assert.match(comparison, /data-brand-parallax', 'spring-awakening-v5'/);
assert.match(comparison, /data-brand-motion-timestep', 'bounded-substeps-v1'/);
assert.match(comparison, /v18\.6 production motion keeps directional depth and exact return/);
assert.match(comparison, /v18\.6 FRAME-RATE-INVARIANT AWAKENING STATES/);
assert.doesNotMatch(comparison, /spring-awakening-v4/);
assert.doesNotMatch(comparison, /v18\.4 production motion/);

assert.match(motion, /import \{ BRAND_MOTION_CSS \} from '\.\/brandMotionV18'/);
assert.match(motion, /maxFrameDeltaSeconds: 0\.1/);
assert.match(motion, /maxSubstepSeconds: 1 \/ 60/);
assert.match(motion, /while \(remaining > 0\.000_001\)/);
assert.match(motion, /Math\.min\(BRAND_MOTION_TIMESTEP\.maxSubstepSeconds, remaining\)/);
assert.match(motion, /elapsedSeconds = lastTime \? Math\.max\(0, \(time - lastTime\) \/ 1000\) : 1 \/ 60/);
assert.match(motion, /snapBrandMotionState\(state, targets\);[\s\S]*write\(\);[\s\S]*lastTime = 0;/);
assert.match(motion, /motionScale = clamp\(Math\.min\(bounds\.width, bounds\.height\) \/ 64, 0\.65, 1\.6\)/);
assert.match(motion, /const scaled = \(value: number\) => value \* motionScale/);
assert.match(motion, /stiffness: 136/);
assert.match(motion, /damping: 18\.5/);
assert.match(motion, /wakeStiffness: 126/);
assert.match(motion, /wakeDamping: 15\.8/);
assert.match(motion, /stiffness: 180/);
assert.match(motion, /wakeStiffness: 220/);
assert.match(motion, /phase === 'active' \? 0\.0018 : 0\.006/);
assert.match(motion, /phase === 'active' \? 0\.0038 : 0\.15/);
assert.match(motion, /phase === 'active' \? 0\.0022 : 0\.08/);
assert.match(motion, /--brand-motion-scale/);
assert.doesNotMatch(motion, /Math\.min\(0\.032/);

assert.match(simulation, /FRAME_RATES = \[15, 20, 30, 60, 120, 144\]/);
assert.match(simulation, /advanceBrandMotionState/);
assert.match(simulation, /first95AfterActivationMs/);
assert.match(simulation, /convergenceSpread <= 80/);
assert.match(simulation, /returnSettledMs <= 700/);
assert.match(packageJson, /"validate:brand-motion-timestep": "tsx scripts\/validate-brand-motion-frame-invariance\.ts"/);
assert.match(packageJson, /validate:brand-motion-timestep && npm run validate:brand-deep-audit/);

assert.match(mark, /from '\.\/brandMotionFrameInvariant'/);
assert.match(mark, /data-brand-motion-normalization="rendered-box-v1"/);
assert.match(mark, /data-brand-parallax="spring-awakening-v5"/);
assert.match(mark, /data-brand-motion-timestep="bounded-substeps-v1"/);

console.log('brand deep audit: exact-head geometry, frame-rate-invariant trajectory, v18.6 vector identity, interpolated timing crossings, interval-normalized plus absolute smoothness, bounded exact-idle return, settled clock reset, diagnostics, size normalization and reduced-motion gates are locked');
