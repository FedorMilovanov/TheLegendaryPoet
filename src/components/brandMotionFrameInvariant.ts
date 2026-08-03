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

export type BrandMotionTargets = { x: number; y: number; wake: number };
type Bounds = { left: number; top: number; width: number; height: number };
type MotionPhase = 'active' | 'returning';

export const BRAND_MOTION_TIMESTEP = {
  maxFrameDeltaSeconds: 0.1,
  maxSubstepSeconds: 1 / 60,
} as const;

export const BRAND_MOTION_SPRINGS = {
  active: { stiffness: 128, damping: 18.5, wakeStiffness: 120, wakeDamping: 15.8 },
  returning: { stiffness: 180, damping: 20, wakeStiffness: 220, wakeDamping: 22 },
} as const;

const px = (value: number) => `${value.toFixed(3)}px`;
const number = (value: number) => value.toFixed(4);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const brandMotionPhase = (value: number, start: number, end: number) => {
  const t = clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};

export const createBrandMotionState = (): BrandMotionState => ({
  x: 0, y: 0, wake: 0, velocityX: 0, velocityY: 0, velocityWake: 0,
});

export function advanceBrandMotionState(state: BrandMotionState, targets: BrandMotionTargets, elapsedSeconds: number, phase: MotionPhase): void {
  const spring = BRAND_MOTION_SPRINGS[phase];
  let remaining = clamp(elapsedSeconds, 0, BRAND_MOTION_TIMESTEP.maxFrameDeltaSeconds);
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

export function isBrandMotionSettled(state: BrandMotionState, targets: BrandMotionTargets, phase: MotionPhase): boolean {
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
    bounds = { left: rect.left, top: rect.top, width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
    motionScale = clamp(Math.min(bounds.width, bounds.height) / 64, 0.7, 1.35);
  };

  const setTargets = (clientX: number, clientY: number) => {
    targets.x = clamp(((clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
    targets.y = clamp(((clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1);
  };

  const write = () => {
    const wake = brandMotionPhase(state.wake, 0, 0.72);
    const detail = brandMotionPhase(state.wake, 0.22, 1);
    const style = node.style;
    const scaled = (value: number) => value * motionScale;
    style.setProperty('--brand-motion-scale', number(motionScale));
    style.setProperty('--brand-root-y', px(scaled(-0.12) * wake));
    style.setProperty('--brand-root-scale', number(1 + 0.004 * wake));
    style.setProperty('--brand-figure-x', px(scaled(0.06) * state.x * wake));
    style.setProperty('--brand-figure-y', px(scaled(0.04 * state.y - 0.02) * wake));
    style.setProperty('--brand-aura-x', px(scaled(0.5) * state.x * detail));
    style.setProperty('--brand-aura-y', px(scaled(0.3 * state.y - 0.04) * detail));
    style.setProperty('--brand-aura-scale', number(1 + 0.003 * detail));
  };

  const schedule = () => { if (!frame && !destroyed) frame = requestAnimationFrame(step); };
  const step = (time: number) => {
    frame = 0;
    if (destroyed) return;
    const elapsedSeconds = lastTime ? Math.max(0, (time - lastTime) / 1000) : 1 / 60;
    lastTime = time;
    const motionPhase: MotionPhase = active ? 'active' : 'returning';
    advanceBrandMotionState(state, targets, elapsedSeconds, motionPhase);
    write();
    if (!isBrandMotionSettled(state, targets, motionPhase)) { schedule(); return; }
    snapBrandMotionState(state, targets);
    write();
    lastTime = 0;
    if (!active) node.dataset.brandInteraction = 'idle';
  };

  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(readBounds);
  resizeObserver?.observe(node);

  return {
    enter(clientX, clientY) { readBounds(); active = true; targets.wake = 1; setTargets(clientX, clientY); node.dataset.brandInteraction = 'active'; lastTime = 0; schedule(); },
    move(clientX, clientY) { if (!active) return; setTargets(clientX, clientY); schedule(); },
    leave() { active = false; targets.x = 0; targets.y = 0; targets.wake = 0; node.dataset.brandInteraction = 'settling'; schedule(); },
    cancel() { active = false; targets.x = 0; targets.y = 0; targets.wake = 0; node.dataset.brandInteraction = 'settling'; schedule(); },
    destroy() { active = false; targets.x = 0; targets.y = 0; targets.wake = 0; snapBrandMotionState(state, targets); write(); destroyed = true; resizeObserver?.disconnect(); if (frame) cancelAnimationFrame(frame); frame = 0; lastTime = 0; node.dataset.brandInteraction = 'idle'; },
  };
}
