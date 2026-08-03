import { BRAND_MOTION_CSS } from './brandMotionV18';

export { BRAND_MOTION_CSS };

export type BrandMotionController = {
  enter(clientX: number, clientY: number): void;
  move(clientX: number, clientY: number): void;
  leave(): void;
  cancel(): void;
  destroy(): void;
};

export type BrandMotionState = {
  x: number;
  y: number;
  wake: number;
  velocityX: number;
  velocityY: number;
  velocityWake: number;
};

export type BrandMotionTargets = {
  x: number;
  y: number;
  wake: number;
};

type Bounds = { left: number; top: number; width: number; height: number };
type MotionPhase = 'active' | 'returning';

export const BRAND_MOTION_TIMESTEP = {
  maxFrameDeltaSeconds: 0.1,
  maxSubstepSeconds: 1 / 60,
} as const;

export const BRAND_MOTION_SPRINGS = {
  active: {
    stiffness: 128,
    damping: 18.5,
    wakeStiffness: 120,
    wakeDamping: 15.8,
  },
  returning: {
    stiffness: 180,
    damping: 20,
    wakeStiffness: 220,
    wakeDamping: 22,
  },
} as const;

const px = (value: number) => `${value.toFixed(3)}px`;
const number = (value: number) => value.toFixed(4);
const degrees = (value: number) => `${value.toFixed(3)}deg`;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const brandMotionPhase = (value: number, start: number, end: number) => {
  const t = clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};

export const createBrandMotionState = (): BrandMotionState => ({
  x: 0,
  y: 0,
  wake: 0,
  velocityX: 0,
  velocityY: 0,
  velocityWake: 0,
});

export function advanceBrandMotionState(
  state: BrandMotionState,
  targets: BrandMotionTargets,
  elapsedSeconds: number,
  phase: MotionPhase,
): void {
  const spring = BRAND_MOTION_SPRINGS[phase];
  let remaining = clamp(elapsedSeconds, 0, BRAND_MOTION_TIMESTEP.maxFrameDeltaSeconds);

  // Consume the real wall-clock interval in bounded stable substeps. The old
  // one-step 32ms clamp discarded time whenever RAF was sparse, making the same
  // spring visibly slower on loaded runners and low-refresh devices.
  while (remaining > 0.000_001) {
    const dt = Math.min(BRAND_MOTION_TIMESTEP.maxSubstepSeconds, remaining);

    state.velocityX += (targets.x - state.x) * spring.stiffness * dt;
    state.velocityY += (targets.y - state.y) * spring.stiffness * dt;
    state.velocityWake += (targets.wake - state.wake) * spring.wakeStiffness * dt;
    state.velocityX *= Math.exp(-spring.damping * dt);
    state.velocityY *= Math.exp(-spring.damping * dt);
    state.velocityWake *= Math.exp(-spring.wakeDamping * dt);
    state.x += state.velocityX * dt;
    state.y += state.velocityY * dt;
    state.wake += state.velocityWake * dt;

    remaining -= dt;
  }
}

export function isBrandMotionSettled(
  state: BrandMotionState,
  targets: BrandMotionTargets,
  phase: MotionPhase,
): boolean {
  const positionError = Math.abs(targets.x - state.x) + Math.abs(targets.y - state.y);
  const velocity = Math.abs(state.velocityX) + Math.abs(state.velocityY);
  const wakeError = Math.abs(targets.wake - state.wake) + Math.abs(state.velocityWake);
  const positionTolerance = phase === 'active' ? 0.0018 : 0.006;
  const velocityTolerance = phase === 'active' ? 0.0038 : 0.15;
  const wakeTolerance = phase === 'active' ? 0.0022 : 0.08;
  return positionError < positionTolerance && velocity < velocityTolerance && wakeError < wakeTolerance;
}

export function snapBrandMotionState(state: BrandMotionState, targets: BrandMotionTargets): void {
  state.x = targets.x;
  state.y = targets.y;
  state.wake = targets.wake;
  state.velocityX = 0;
  state.velocityY = 0;
  state.velocityWake = 0;
}

export function createBrandMotionController(node: HTMLElement): BrandMotionController {
  let bounds: Bounds = { left: 0, top: 0, width: 1, height: 1 };
  let motionScale = 1;
  const targets: BrandMotionTargets = { x: 0, y: 0, wake: 0 };
  const state = createBrandMotionState();
  let frame = 0;
  let lastTime = 0;
  let active = false;
  let destroyed = false;

  const readBounds = () => {
    const rect = node.getBoundingClientRect();
    bounds = {
      left: rect.left,
      top: rect.top,
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };
    motionScale = clamp(Math.min(bounds.width, bounds.height) / 64, 0.65, 1.6);
  };

  const setTargets = (clientX: number, clientY: number) => {
    targets.x = clamp(((clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
    targets.y = clamp(((clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1);
  };

  const write = () => {
    const auraWake = brandMotionPhase(state.wake, 0, 0.42);
    const figureWake = brandMotionPhase(state.wake, 0.12, 0.78);
    const detailWake = brandMotionPhase(state.wake, 0.32, 1);
    const style = node.style;
    const scaled = (value: number) => value * motionScale;

    style.setProperty('--brand-motion-scale', number(motionScale));
    style.setProperty('--brand-root-y', px(scaled(-0.78) * figureWake));
    style.setProperty('--brand-root-scale', number(1 + 0.022 * figureWake));

    style.setProperty('--brand-far-x', px(scaled(-3.15) * state.x * auraWake));
    style.setProperty('--brand-far-y', px(scaled(-2 * state.y - 0.5) * auraWake));
    style.setProperty('--brand-far-scale', number(1 + 0.042 * auraWake));

    style.setProperty('--brand-energy-x', px(scaled(3.65) * state.x * auraWake));
    style.setProperty('--brand-energy-y', px(scaled(2.35 * state.y - 0.36) * auraWake));
    style.setProperty('--brand-energy-r', degrees(state.x * 0.82 * auraWake));
    style.setProperty('--brand-energy-scale', number(1 + 0.022 * auraWake));

    style.setProperty('--brand-figure-x', px(scaled(0.18) * state.x * figureWake));
    style.setProperty('--brand-figure-y', px(scaled(0.13 * state.y - 0.14) * figureWake));

    style.setProperty('--brand-folds-x', px(scaled(1.1) * state.x * figureWake));
    style.setProperty('--brand-folds-y', px(scaled(0.68 * state.y + 0.18) * figureWake));
    style.setProperty('--brand-folds-scale-x', number(1 + 0.012 * figureWake));
    style.setProperty('--brand-folds-scale-y', number(1 + 0.018 * figureWake));

    style.setProperty('--brand-hood-x', px(scaled(1.28) * state.x * figureWake));
    style.setProperty('--brand-hood-y', px(scaled(0.82 * state.y - 0.24) * figureWake));
    style.setProperty('--brand-hood-scale', number(1 + 0.012 * figureWake));

    style.setProperty('--brand-hood-layers-x', px(scaled(2.02) * state.x * detailWake));
    style.setProperty('--brand-hood-layers-y', px(scaled(1.24 * state.y - 0.34) * detailWake));
    style.setProperty('--brand-hood-layers-scale', number(1 + 0.02 * detailWake));

    style.setProperty('--brand-face-x', px(scaled(-0.72) * state.x * detailWake));
    style.setProperty('--brand-face-y', px(scaled(-0.4 * state.y + 0.16) * detailWake));
    style.setProperty('--brand-face-scale', number(1 - 0.022 * detailWake));

    style.setProperty('--brand-collar-x', px(scaled(1.38) * state.x * figureWake));
    style.setProperty('--brand-collar-y', px(scaled(0.9 * state.y + 0.16) * figureWake));
    style.setProperty('--brand-collar-scale-x', number(1 + 0.014 * figureWake));
    style.setProperty('--brand-collar-scale-y', number(1 + 0.009 * figureWake));

    style.setProperty('--brand-rim-x', px(scaled(2.55) * state.x * detailWake));
    style.setProperty('--brand-rim-y', px(scaled(1.5 * state.y - 0.2) * detailWake));
    style.setProperty('--brand-texture-x', px(scaled(0.86) * state.x * detailWake));
    style.setProperty('--brand-texture-y', px(scaled(0.54) * state.y * detailWake));

    style.setProperty('--brand-aura-opacity', number(0.92 + 0.08 * auraWake));
    style.setProperty('--brand-energy-opacity', number(0.9 + 0.1 * auraWake));
    style.setProperty('--brand-rim-opacity', number(0.9 + 0.1 * detailWake));
    style.setProperty('--brand-energy-brightness', number(1 + 0.28 * auraWake));
    style.setProperty('--brand-rim-brightness', number(1 + 0.42 * detailWake));
  };

  const schedule = () => {
    if (!frame && !destroyed) frame = requestAnimationFrame(step);
  };

  const step = (time: number) => {
    frame = 0;
    if (destroyed) return;
    const elapsedSeconds = lastTime ? Math.max(0, (time - lastTime) / 1000) : 1 / 60;
    lastTime = time;
    const motionPhase: MotionPhase = active ? 'active' : 'returning';

    advanceBrandMotionState(state, targets, elapsedSeconds, motionPhase);
    write();

    if (!isBrandMotionSettled(state, targets, motionPhase)) {
      schedule();
      return;
    }

    snapBrandMotionState(state, targets);
    write();
    lastTime = 0;
    if (!active) node.dataset.brandInteraction = 'idle';
  };

  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(readBounds);
  resizeObserver?.observe(node);

  return {
    enter(clientX, clientY) {
      readBounds();
      active = true;
      targets.wake = 1;
      setTargets(clientX, clientY);
      node.dataset.brandInteraction = 'active';
      lastTime = 0;
      schedule();
    },
    move(clientX, clientY) {
      if (!active) return;
      setTargets(clientX, clientY);
      schedule();
    },
    leave() {
      active = false;
      targets.x = 0;
      targets.y = 0;
      targets.wake = 0;
      node.dataset.brandInteraction = 'settling';
      schedule();
    },
    cancel() {
      active = false;
      targets.x = 0;
      targets.y = 0;
      targets.wake = 0;
      node.dataset.brandInteraction = 'settling';
      schedule();
    },
    destroy() {
      active = false;
      targets.x = 0;
      targets.y = 0;
      targets.wake = 0;
      snapBrandMotionState(state, targets);
      write();
      destroyed = true;
      resizeObserver?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      node.dataset.brandInteraction = 'idle';
    },
  };
}
