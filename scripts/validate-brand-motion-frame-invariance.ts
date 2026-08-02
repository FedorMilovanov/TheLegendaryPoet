import assert from 'node:assert/strict';
import {
  advanceBrandMotionState,
  brandMotionPhase,
  createBrandMotionState,
  isBrandMotionSettled,
  type BrandMotionState,
  type BrandMotionTargets,
} from '../src/components/brandMotionFrameInvariant';

const TARGETS: BrandMotionTargets = { x: 0.68, y: -0.64, wake: 1 };
const IDLE_TARGETS: BrandMotionTargets = { x: 0, y: 0, wake: 0 };
const FRAME_RATES = [15, 20, 30, 60, 120, 144] as const;

type Sample = {
  elapsedMs: number;
  energyRatio: number;
};

type ScheduleResult = {
  fps: number;
  activationMs: number;
  first95AfterActivationMs: number;
  entry120Ratio: number;
  peakRatio: number;
  returnSettledMs: number;
};

const energyRatio = (state: BrandMotionState) =>
  (state.x / TARGETS.x) * brandMotionPhase(state.wake, 0, 0.42);

function closestSample(samples: Sample[], targetMs: number): Sample {
  return samples.reduce((best, sample) => (
    Math.abs(sample.elapsedMs - targetMs) < Math.abs(best.elapsedMs - targetMs) ? sample : best
  ));
}

function simulateSchedule(fps: number): ScheduleResult {
  const frameMs = 1000 / fps;
  const state = createBrandMotionState();
  const samples: Sample[] = [];
  let elapsedMs = 0;

  for (let frame = 0; elapsedMs < 1_400; frame += 1) {
    elapsedMs += frameMs;
    advanceBrandMotionState(
      state,
      TARGETS,
      frame === 0 ? 1 / 60 : frameMs / 1000,
      'active',
    );
    samples.push({ elapsedMs, energyRatio: energyRatio(state) });
  }

  const activation = samples.find((sample) => Math.abs(sample.energyRatio) >= 0.005);
  assert.ok(activation, `${fps}Hz: no measurable activation`);
  const first95 = samples.find((sample) => (
    sample.elapsedMs >= activation.elapsedMs && sample.energyRatio >= 0.95
  ));
  assert.ok(first95, `${fps}Hz: no 95% convergence`);
  const entry = closestSample(samples, activation.elapsedMs + 120);
  const peakRatio = Math.max(...samples.map((sample) => sample.energyRatio));

  let returnSettledMs = 0;
  for (let frame = 0; frame < 120; frame += 1) {
    returnSettledMs += frameMs;
    advanceBrandMotionState(state, IDLE_TARGETS, frameMs / 1000, 'returning');
    if (isBrandMotionSettled(state, IDLE_TARGETS, 'returning')) break;
  }

  assert.ok(isBrandMotionSettled(state, IDLE_TARGETS, 'returning'), `${fps}Hz: return never settled`);

  return {
    fps,
    activationMs: activation.elapsedMs,
    first95AfterActivationMs: first95.elapsedMs - activation.elapsedMs,
    entry120Ratio: entry.energyRatio,
    peakRatio,
    returnSettledMs,
  };
}

const results = FRAME_RATES.map(simulateSchedule);

for (const result of results) {
  assert.ok(
    result.first95AfterActivationMs > 150 && result.first95AfterActivationMs < 650,
    `${result.fps}Hz: 95% convergence ${result.first95AfterActivationMs.toFixed(1)}ms`,
  );
  assert.ok(
    result.entry120Ratio > 0.2 && result.entry120Ratio < 0.82,
    `${result.fps}Hz: 120ms response ratio ${result.entry120Ratio.toFixed(3)}`,
  );
  assert.ok(result.peakRatio <= 1.06, `${result.fps}Hz: overshoot ${result.peakRatio.toFixed(4)}`);
  assert.ok(result.returnSettledMs <= 700, `${result.fps}Hz: return ${result.returnSettledMs.toFixed(1)}ms`);
}

const convergenceTimes = results.map((result) => result.first95AfterActivationMs);
const convergenceSpread = Math.max(...convergenceTimes) - Math.min(...convergenceTimes);
assert.ok(convergenceSpread <= 80, `refresh-rate convergence spread ${convergenceSpread.toFixed(1)}ms`);

console.log(JSON.stringify({
  contract: 'bounded-substeps-v1',
  convergenceSpreadMs: convergenceSpread,
  results,
}, null, 2));
