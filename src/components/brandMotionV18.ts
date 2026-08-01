export const BRAND_MOTION_CSS = `
[data-brand-mark]{--brand-root-y:0px;--brand-root-scale:1;--brand-far-x:0px;--brand-far-y:0px;--brand-energy-x:0px;--brand-energy-y:0px;--brand-figure-x:0px;--brand-figure-y:0px;--brand-hood-x:0px;--brand-hood-y:0px;--brand-face-x:0px;--brand-face-y:0px;--brand-cowl-x:0px;--brand-cowl-y:0px;--brand-left-x:0px;--brand-left-y:0px;--brand-right-x:0px;--brand-right-y:0px;--brand-rim-x:0px;--brand-rim-y:0px;--brand-aura-opacity:.82;--brand-energy-opacity:.8;--brand-rim-opacity:.86}
[data-brand-mark] [data-brand-vector]{transform:translate3d(0,var(--brand-root-y),0) scale(var(--brand-root-scale));transform-origin:center;filter:drop-shadow(0 5px 12px rgba(0,4,13,.84)) drop-shadow(0 0 10px rgba(46,216,255,.18));transition:transform 620ms cubic-bezier(.16,1,.3,1),filter 620ms cubic-bezier(.16,1,.3,1)}
[data-brand-mark] [data-brand-depth]{transform-box:fill-box;transform-origin:center}
[data-brand-mark] [data-brand-atmosphere]{transform:translate3d(var(--brand-far-x),var(--brand-far-y),0);opacity:var(--brand-aura-opacity)}
[data-brand-mark] [data-brand-energy]{transform:translate3d(var(--brand-energy-x),var(--brand-energy-y),0);opacity:var(--brand-energy-opacity)}
[data-brand-mark] [data-brand-figure]{transform:translate3d(var(--brand-figure-x),var(--brand-figure-y),0)}
[data-brand-mark] [data-brand-hood-layers]{transform:translate3d(var(--brand-hood-x),var(--brand-hood-y),0)}
[data-brand-mark] [data-brand-face-depth]{transform:translate3d(var(--brand-face-x),var(--brand-face-y),0)}
[data-brand-mark] [data-brand-cowl]{transform:translate3d(var(--brand-cowl-x),var(--brand-cowl-y),0)}
[data-brand-mark] [data-brand-left-folds]{transform:translate3d(var(--brand-left-x),var(--brand-left-y),0)}
[data-brand-mark] [data-brand-right-folds]{transform:translate3d(var(--brand-right-x),var(--brand-right-y),0)}
[data-brand-mark] [data-brand-rim-light]{transform:translate3d(var(--brand-rim-x),var(--brand-rim-y),0);opacity:var(--brand-rim-opacity)}
@media (hover:hover) and (pointer:fine){
[data-brand-mark][data-brand-interaction="active"] [data-brand-vector],[data-brand-mark][data-brand-interaction="settling"] [data-brand-vector]{will-change:transform,filter}
[data-brand-mark][data-brand-interaction="active"] [data-brand-depth],[data-brand-mark][data-brand-interaction="settling"] [data-brand-depth]{will-change:transform,opacity}
[data-brand-mark][data-brand-interaction="active"] [data-brand-vector]{filter:drop-shadow(0 8px 18px rgba(0,7,18,.88)) drop-shadow(0 0 17px rgba(65,220,255,.28))}
}
@media (prefers-reduced-motion:reduce){
[data-brand-mark] [data-brand-vector],[data-brand-mark] [data-brand-depth]{transform:none!important;transition:none!important;will-change:auto!important}
[data-brand-mark][data-brand-interaction="active"] [data-brand-atmosphere]{opacity:.92}
[data-brand-mark][data-brand-interaction="active"] [data-brand-energy]{opacity:.88}
[data-brand-mark][data-brand-interaction="active"] [data-brand-rim-light]{opacity:1}
}`;

type Bounds = { left: number; top: number; width: number; height: number };

export type BrandMotionController = {
  enter(clientX: number, clientY: number): void;
  move(clientX: number, clientY: number): void;
  leave(): void;
  cancel(): void;
  destroy(): void;
};

const px = (value: number) => `${value.toFixed(3)}px`;
const number = (value: number) => value.toFixed(4);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function createBrandMotionController(node: HTMLElement): BrandMotionController {
  let bounds: Bounds = { left: 0, top: 0, width: 1, height: 1 };
  let targetX = 0;
  let targetY = 0;
  let targetWake = 0;
  let x = 0;
  let y = 0;
  let wake = 0;
  let velocityX = 0;
  let velocityY = 0;
  let velocityWake = 0;
  let frame = 0;
  let lastTime = 0;
  let lastFilterWrite = 0;
  let active = false;
  let destroyed = false;

  const turbulence = node.querySelector<SVGFETurbulenceElement>('[data-brand-turbulence]');
  const displacement = node.querySelector<SVGFEDisplacementMapElement>('[data-brand-displacement]');

  const readBounds = () => {
    const rect = node.getBoundingClientRect();
    bounds = {
      left: rect.left,
      top: rect.top,
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };
  };

  const setTargets = (clientX: number, clientY: number) => {
    targetX = clamp(((clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
    targetY = clamp(((clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1);
  };

  const write = (time: number) => {
    const style = node.style;
    const lift = -0.56 * wake;
    const scale = 1 + 0.018 * wake;

    style.setProperty('--brand-root-y', px(lift));
    style.setProperty('--brand-root-scale', number(scale));
    style.setProperty('--brand-far-x', px(-x * 1.35));
    style.setProperty('--brand-far-y', px(-y * 0.9 - wake * 0.25));
    style.setProperty('--brand-energy-x', px(x * 1.55));
    style.setProperty('--brand-energy-y', px(y * 1.02 - wake * 0.18));
    style.setProperty('--brand-figure-x', px(x * 0.14));
    style.setProperty('--brand-figure-y', px(y * 0.1 - wake * 0.12));
    style.setProperty('--brand-hood-x', px(x * 0.62));
    style.setProperty('--brand-hood-y', px(y * 0.42 - wake * 0.16));
    style.setProperty('--brand-face-x', px(-x * 0.2));
    style.setProperty('--brand-face-y', px(-y * 0.13 + wake * 0.08));
    style.setProperty('--brand-cowl-x', px(x * 0.38));
    style.setProperty('--brand-cowl-y', px(y * 0.28 + wake * 0.1));
    style.setProperty('--brand-left-x', px(-0.16 * wake + x * 0.28));
    style.setProperty('--brand-left-y', px(y * 0.2 + wake * 0.12));
    style.setProperty('--brand-right-x', px(0.16 * wake + x * 0.3));
    style.setProperty('--brand-right-y', px(y * 0.19 + wake * 0.1));
    style.setProperty('--brand-rim-x', px(x * 0.88));
    style.setProperty('--brand-rim-y', px(y * 0.58 - wake * 0.08));
    style.setProperty('--brand-aura-opacity', number(0.82 + wake * 0.18));
    style.setProperty('--brand-energy-opacity', number(0.8 + wake * 0.2));
    style.setProperty('--brand-rim-opacity', number(0.86 + wake * 0.14));

    if (time - lastFilterWrite >= 48) {
      lastFilterWrite = time;
      if (turbulence) {
        const fx = 0.045 + wake * 0.004 + Math.abs(x) * 0.0015;
        const fy = 0.075 + wake * 0.006 + Math.abs(y) * 0.0015;
        turbulence.setAttribute('baseFrequency', `${fx.toFixed(4)} ${fy.toFixed(4)}`);
      }
      if (displacement) displacement.setAttribute('scale', (1.15 + wake * 0.85).toFixed(3));
    }
  };

  const schedule = () => {
    if (!frame && !destroyed) frame = requestAnimationFrame(step);
  };

  const step = (time: number) => {
    frame = 0;
    if (destroyed) return;
    const dt = Math.min(0.032, Math.max(0.001, lastTime ? (time - lastTime) / 1000 : 1 / 60));
    lastTime = time;

    const stiffness = active ? 118 : 86;
    const damping = active ? 17 : 15;
    const wakeStiffness = active ? 92 : 72;
    const wakeDamping = active ? 15 : 14;

    velocityX += (targetX - x) * stiffness * dt;
    velocityY += (targetY - y) * stiffness * dt;
    velocityWake += (targetWake - wake) * wakeStiffness * dt;

    const positionDecay = Math.exp(-damping * dt);
    const wakeDecay = Math.exp(-wakeDamping * dt);
    velocityX *= positionDecay;
    velocityY *= positionDecay;
    velocityWake *= wakeDecay;

    x += velocityX * dt;
    y += velocityY * dt;
    wake += velocityWake * dt;
    write(time);

    const positionError = Math.abs(targetX - x) + Math.abs(targetY - y);
    const velocity = Math.abs(velocityX) + Math.abs(velocityY);
    const wakeError = Math.abs(targetWake - wake) + Math.abs(velocityWake);
    const settled = positionError < 0.002 && velocity < 0.004 && wakeError < 0.0025;

    if (!settled) {
      schedule();
      return;
    }

    x = targetX;
    y = targetY;
    wake = targetWake;
    velocityX = 0;
    velocityY = 0;
    velocityWake = 0;
    write(time);
    if (!active) node.dataset.brandInteraction = 'idle';
  };

  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(readBounds);
  resizeObserver?.observe(node);

  return {
    enter(clientX, clientY) {
      readBounds();
      active = true;
      targetWake = 1;
      setTargets(clientX, clientY);
      node.dataset.brandInteraction = 'active';
      schedule();
    },
    move(clientX, clientY) {
      if (!active) return;
      setTargets(clientX, clientY);
      schedule();
    },
    leave() {
      active = false;
      targetX = 0;
      targetY = 0;
      targetWake = 0;
      node.dataset.brandInteraction = 'settling';
      schedule();
    },
    cancel() {
      active = false;
      targetX = 0;
      targetY = 0;
      targetWake = 0;
      node.dataset.brandInteraction = 'settling';
      schedule();
    },
    destroy() {
      active = false;
      targetX = 0;
      targetY = 0;
      targetWake = 0;
      x = 0;
      y = 0;
      wake = 0;
      velocityX = 0;
      velocityY = 0;
      velocityWake = 0;
      write(performance.now());
      destroyed = true;
      resizeObserver?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      node.dataset.brandInteraction = 'idle';
    },
  };
}
