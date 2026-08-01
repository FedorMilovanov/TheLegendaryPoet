export const BRAND_MOTION_CSS = `
[data-brand-mark]{--brand-root-y:0px;--brand-root-scale:1;--brand-far-x:0px;--brand-far-y:0px;--brand-energy-x:0px;--brand-energy-y:0px;--brand-energy-r:0deg;--brand-figure-x:0px;--brand-figure-y:0px;--brand-folds-x:0px;--brand-folds-y:0px;--brand-hood-x:0px;--brand-hood-y:0px;--brand-hood-layers-x:0px;--brand-hood-layers-y:0px;--brand-face-x:0px;--brand-face-y:0px;--brand-collar-x:0px;--brand-collar-y:0px;--brand-rim-x:0px;--brand-rim-y:0px;--brand-texture-x:0px;--brand-texture-y:0px;--brand-aura-opacity:1;--brand-energy-opacity:1;--brand-rim-opacity:1}
[data-brand-mark] [data-brand-vector]{transform:translate3d(0,var(--brand-root-y),0) scale(var(--brand-root-scale));transform-origin:center;filter:drop-shadow(0 5px 12px rgba(0,4,13,.84)) drop-shadow(0 0 10px rgba(46,216,255,.18));transition:filter 520ms cubic-bezier(.16,1,.3,1)}
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
[data-brand-mark][data-brand-interaction="active"] [data-brand-vector]{filter:brightness(1.1) saturate(1.08) drop-shadow(0 10px 21px rgba(0,7,18,.9)) drop-shadow(0 0 22px rgba(65,220,255,.42)) drop-shadow(0 0 7px rgba(184,247,255,.22))}
[data-brand-mark][data-brand-interaction="active"] [data-brand-rim-light]{filter:brightness(1.34)}
[data-brand-mark][data-brand-interaction="active"] [data-brand-energy]{filter:brightness(1.22)}
[data-brand-mark][data-brand-interaction="settling"] [data-brand-vector]{filter:brightness(1.035) saturate(1.03) drop-shadow(0 7px 16px rgba(0,7,18,.88)) drop-shadow(0 0 15px rgba(65,220,255,.27))}
}
a:focus-visible [data-brand-mark] [data-brand-vector],button:focus-visible [data-brand-mark] [data-brand-vector]{filter:brightness(1.075) saturate(1.05) drop-shadow(0 0 17px rgba(65,220,255,.34))}
a:focus-visible [data-brand-mark] [data-brand-rim-light],button:focus-visible [data-brand-mark] [data-brand-rim-light]{opacity:1;filter:brightness(1.3)}
@media (prefers-reduced-motion:reduce){
[data-brand-mark] [data-brand-vector],[data-brand-mark] [data-brand-depth]{transform:none!important;transition:none!important;will-change:auto!important}
[data-brand-mark][data-brand-interaction="active"] [data-brand-vector]{filter:brightness(1.065) saturate(1.04) drop-shadow(0 0 15px rgba(65,220,255,.28))}
[data-brand-mark][data-brand-interaction="active"] [data-brand-rim-light]{opacity:1;filter:brightness(1.22)}
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
const phase = (value: number, start: number, end: number) => {
  const t = clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};

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
    const auraWake = phase(wake, 0, 0.46);
    const figureWake = phase(wake, 0.14, 0.82);
    const detailWake = phase(wake, 0.38, 1);
    const style = node.style;

    style.setProperty('--brand-root-y', px(-1.05 * figureWake));
    style.setProperty('--brand-root-scale', number(1 + 0.034 * figureWake));
    style.setProperty('--brand-far-x', px(-x * 2.45 * auraWake));
    style.setProperty('--brand-far-y', px((-y * 1.65 - 0.42) * auraWake));
    style.setProperty('--brand-energy-x', px(x * 2.85 * auraWake));
    style.setProperty('--brand-energy-y', px((y * 1.9 - 0.3) * auraWake));
    style.setProperty('--brand-energy-r', degrees(x * 0.62 * auraWake));
    style.setProperty('--brand-figure-x', px(x * 0.24 * figureWake));
    style.setProperty('--brand-figure-y', px((y * 0.17 - 0.18) * figureWake));
    style.setProperty('--brand-folds-x', px(x * 0.82 * figureWake));
    style.setProperty('--brand-folds-y', px((y * 0.56 + 0.16) * figureWake));
    style.setProperty('--brand-hood-x', px(x * 1.08 * figureWake));
    style.setProperty('--brand-hood-y', px((y * 0.72 - 0.24) * figureWake));
    style.setProperty('--brand-hood-layers-x', px(x * 1.62 * detailWake));
    style.setProperty('--brand-hood-layers-y', px((y * 1.05 - 0.3) * detailWake));
    style.setProperty('--brand-face-x', px(-x * 0.42 * detailWake));
    style.setProperty('--brand-face-y', px((-y * 0.27 + 0.13) * detailWake));
    style.setProperty('--brand-collar-x', px(x * 1.18 * figureWake));
    style.setProperty('--brand-collar-y', px((y * 0.78 + 0.14) * figureWake));
    style.setProperty('--brand-rim-x', px(x * 1.92 * detailWake));
    style.setProperty('--brand-rim-y', px((y * 1.22 - 0.18) * detailWake));
    style.setProperty('--brand-texture-x', px(x * 0.58 * detailWake));
    style.setProperty('--brand-texture-y', px(y * 0.4 * detailWake));
    style.setProperty('--brand-aura-opacity', number(0.94 + 0.06 * auraWake));
    style.setProperty('--brand-energy-opacity', number(0.92 + 0.08 * auraWake));
    style.setProperty('--brand-rim-opacity', number(0.92 + 0.08 * detailWake));
  };

  const schedule = () => {
    if (!frame && !destroyed) frame = requestAnimationFrame(step);
  };

  const step = (time: number) => {
    frame = 0;
    if (destroyed) return;
    const dt = Math.min(0.032, Math.max(0.001, lastTime ? (time - lastTime) / 1000 : 1 / 60));
    lastTime = time;

    const stiffness = active ? 132 : 90;
    const damping = active ? 18 : 15.5;
    const wakeStiffness = active ? 122 : 76;
    const wakeDamping = active ? 15.5 : 14.5;

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
    if (positionError >= 0.0018 || velocity >= 0.0038 || wakeError >= 0.0022) {
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
