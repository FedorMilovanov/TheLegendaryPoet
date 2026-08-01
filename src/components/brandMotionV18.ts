export const BRAND_MOTION_CSS = `
[data-brand-mark]{--brand-root-y:0px;--brand-root-scale:1;--brand-far-x:0px;--brand-far-y:0px;--brand-energy-x:0px;--brand-energy-y:0px;--brand-energy-r:0deg;--brand-figure-x:0px;--brand-figure-y:0px;--brand-folds-x:0px;--brand-folds-y:0px;--brand-hood-x:0px;--brand-hood-y:0px;--brand-hood-layers-x:0px;--brand-hood-layers-y:0px;--brand-face-x:0px;--brand-face-y:0px;--brand-collar-x:0px;--brand-collar-y:0px;--brand-rim-x:0px;--brand-rim-y:0px;--brand-texture-x:0px;--brand-texture-y:0px;--brand-aura-opacity:1;--brand-energy-opacity:1;--brand-rim-opacity:1}
[data-brand-mark] [data-brand-vector]{transform:translate3d(0,var(--brand-root-y),0) scale(var(--brand-root-scale));transform-origin:center;filter:drop-shadow(0 5px 12px rgba(0,4,13,.84)) drop-shadow(0 0 10px rgba(46,216,255,.18));transition:filter 620ms cubic-bezier(.16,1,.3,1)}
[data-brand-mark] [data-brand-depth]{transform-box:fill-box;transform-origin:center}
[data-brand-mark] [data-brand-atmosphere]{transform:translate3d(var(--brand-far-x),var(--brand-far-y),0);opacity:var(--brand-aura-opacity)}
[data-brand-mark] [data-brand-energy]{transform:translate3d(var(--brand-energy-x),var(--brand-energy-y),0) rotate(var(--brand-energy-r));opacity:var(--brand-energy-opacity)}
[data-brand-mark] [data-brand-figure]{transform:translate3d(var(--brand-figure-x),var(--brand-figure-y),0)}
[data-brand-mark] [data-brand-folds],[data-brand-mark] [data-brand-upper-folds],[data-brand-mark] [data-brand-epic-folds]{transform:translate3d(var(--brand-folds-x),var(--brand-folds-y),0)}
[data-brand-mark] [data-brand-hood]{transform:translate3d(var(--brand-hood-x),var(--brand-hood-y),0)}
[data-brand-mark] [data-brand-hood-layers]{transform:translate3d(var(--brand-hood-layers-x),var(--brand-hood-layers-y),0)}
[data-brand-mark] [data-brand-face-void],[data-brand-mark] [data-brand-face-depth]{transform:translate3d(var(--brand-face-x),var(--brand-face-y),0)}
[data-brand-mark] [data-brand-collar]{transform:translate3d(var(--brand-collar-x),var(--brand-collar-y),0)}
[data-brand-mark] [data-brand-rim-light]{transform:translate3d(var(--brand-rim-x),var(--brand-rim-y),0);opacity:var(--brand-rim-opacity)}
[data-brand-mark] [data-brand-texture],[data-brand-mark] [data-brand-seams]{transform:translate3d(var(--brand-texture-x),var(--brand-texture-y),0)}
@media (hover:hover) and (pointer:fine){
[data-brand-mark][data-brand-interaction="active"] [data-brand-vector],[data-brand-mark][data-brand-interaction="settling"] [data-brand-vector]{will-change:transform,filter}
[data-brand-mark][data-brand-interaction="active"] [data-brand-depth],[data-brand-mark][data-brand-interaction="settling"] [data-brand-depth]{will-change:transform,opacity}
[data-brand-mark][data-brand-interaction="active"] [data-brand-vector]{filter:drop-shadow(0 8px 18px rgba(0,7,18,.88)) drop-shadow(0 0 17px rgba(65,220,255,.28))}
}
a:focus-visible [data-brand-mark] [data-brand-rim-light],button:focus-visible [data-brand-mark] [data-brand-rim-light]{opacity:1;filter:brightness(1.24)}
a:focus-visible [data-brand-mark] [data-brand-atmosphere],button:focus-visible [data-brand-mark] [data-brand-atmosphere]{opacity:1}
@media (prefers-reduced-motion:reduce){
[data-brand-mark] [data-brand-vector],[data-brand-mark] [data-brand-depth]{transform:none!important;transition:none!important;will-change:auto!important}
[data-brand-mark][data-brand-interaction="active"] [data-brand-atmosphere]{opacity:1}
[data-brand-mark][data-brand-interaction="active"] [data-brand-energy]{opacity:1}
[data-brand-mark][data-brand-interaction="active"] [data-brand-rim-light]{opacity:1;filter:brightness(1.18)}
}`;

export type BrandMotionController = {
  enter(clientX: number, clientY: number): void;
  move(clientX: number, clientY: number): void;
  leave(): void;
  cancel(): void;
  destroy(): void;
};

type Bounds = { left: number; top: number; width: number; height: number };

const px = (value: number) => `${value.toFixed(3)}px`;
const number = (value: number) => value.toFixed(4);
const degrees = (value: number) => `${value.toFixed(3)}deg`;
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
  };

  const setTargets = (clientX: number, clientY: number) => {
    targetX = clamp(((clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
    targetY = clamp(((clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1);
  };

  const write = () => {
    const style = node.style;
    style.setProperty('--brand-root-y', px(-0.58 * wake));
    style.setProperty('--brand-root-scale', number(1 + 0.019 * wake));
    style.setProperty('--brand-far-x', px(-x * 1.25));
    style.setProperty('--brand-far-y', px(-y * 0.82 - wake * 0.2));
    style.setProperty('--brand-energy-x', px(x * 1.55));
    style.setProperty('--brand-energy-y', px(y * 1.05 - wake * 0.14));
    style.setProperty('--brand-energy-r', degrees(x * 0.28));
    style.setProperty('--brand-figure-x', px(x * 0.13));
    style.setProperty('--brand-figure-y', px(y * 0.09 - wake * 0.1));
    style.setProperty('--brand-folds-x', px(x * 0.42));
    style.setProperty('--brand-folds-y', px(y * 0.29 + wake * 0.08));
    style.setProperty('--brand-hood-x', px(x * 0.58));
    style.setProperty('--brand-hood-y', px(y * 0.4 - wake * 0.13));
    style.setProperty('--brand-hood-layers-x', px(x * 0.86));
    style.setProperty('--brand-hood-layers-y', px(y * 0.58 - wake * 0.16));
    style.setProperty('--brand-face-x', px(-x * 0.2));
    style.setProperty('--brand-face-y', px(-y * 0.13 + wake * 0.06));
    style.setProperty('--brand-collar-x', px(x * 0.64));
    style.setProperty('--brand-collar-y', px(y * 0.44 + wake * 0.08));
    style.setProperty('--brand-rim-x', px(x * 1.02));
    style.setProperty('--brand-rim-y', px(y * 0.68 - wake * 0.07));
    style.setProperty('--brand-texture-x', px(x * 0.31));
    style.setProperty('--brand-texture-y', px(y * 0.22));
    style.setProperty('--brand-aura-opacity', number(0.92 + wake * 0.08));
    style.setProperty('--brand-energy-opacity', number(0.9 + wake * 0.1));
    style.setProperty('--brand-rim-opacity', number(0.9 + wake * 0.1));
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
    velocityX *= Math.exp(-damping * dt);
    velocityY *= Math.exp(-damping * dt);
    velocityWake *= Math.exp(-wakeDamping * dt);
    x += velocityX * dt;
    y += velocityY * dt;
    wake += velocityWake * dt;
    write();

    const positionError = Math.abs(targetX - x) + Math.abs(targetY - y);
    const velocity = Math.abs(velocityX) + Math.abs(velocityY);
    const wakeError = Math.abs(targetWake - wake) + Math.abs(velocityWake);
    if (positionError >= 0.002 || velocity >= 0.004 || wakeError >= 0.0025) {
      schedule();
      return;
    }

    x = targetX;
    y = targetY;
    wake = targetWake;
    velocityX = 0;
    velocityY = 0;
    velocityWake = 0;
    write();
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
      write();
      destroyed = true;
      resizeObserver?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      node.dataset.brandInteraction = 'idle';
    },
  };
}
