export const LAYER_MOTION_CSS = `[data-brand-mark] [data-brand-depth]{transform-box:fill-box;transform-origin:center;will-change:transform,opacity;transition:transform 760ms cubic-bezier(.16,1,.3,1),opacity 760ms cubic-bezier(.16,1,.3,1)}
@media (hover:hover) and (pointer:fine){
[data-brand-mark][data-brand-interaction="active"] [data-brand-atmosphere]{transform:translate3d(var(--brand-atmosphere-x),var(--brand-atmosphere-y),0) rotate(var(--brand-atmosphere-r)) scale(1.022);transition-duration:150ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-energy]{transform:translate3d(var(--brand-energy-x),var(--brand-energy-y),0) rotate(var(--brand-energy-r));transition-duration:120ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-figure]{transform:translate3d(var(--brand-figure-x),var(--brand-figure-y),0);transition-duration:190ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-folds],[data-brand-mark][data-brand-interaction="active"] [data-brand-upper-folds],[data-brand-mark][data-brand-interaction="active"] [data-brand-epic-folds]{transform:translate3d(var(--brand-folds-x),var(--brand-folds-y),0);transition-duration:165ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-hood]{transform:translate3d(var(--brand-hood-x),var(--brand-hood-y),0);transition-duration:155ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-hood-layers]{transform:translate3d(var(--brand-hood-layers-x),var(--brand-hood-layers-y),0);transition-duration:135ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-face-void],[data-brand-mark][data-brand-interaction="active"] [data-brand-face-depth]{transform:translate3d(var(--brand-face-x),var(--brand-face-y),0);transition-duration:180ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-collar]{transform:translate3d(var(--brand-collar-x),var(--brand-collar-y),0);transition-duration:145ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-rim-light]{transform:translate3d(var(--brand-rim-x),var(--brand-rim-y),0);transition-duration:110ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-texture],[data-brand-mark][data-brand-interaction="active"] [data-brand-seams]{transform:translate3d(var(--brand-texture-x),var(--brand-texture-y),0);transition-duration:175ms}}
@media (prefers-reduced-motion:reduce){[data-brand-mark] [data-brand-depth]{transform:none!important;transition:none!important}}`;

export const ZERO_DEPTH = {
  '--brand-atmosphere-x':'0px','--brand-atmosphere-y':'0px','--brand-atmosphere-r':'0deg',
  '--brand-energy-x':'0px','--brand-energy-y':'0px','--brand-energy-r':'0deg',
  '--brand-figure-x':'0px','--brand-figure-y':'0px','--brand-folds-x':'0px','--brand-folds-y':'0px',
  '--brand-hood-x':'0px','--brand-hood-y':'0px','--brand-hood-layers-x':'0px','--brand-hood-layers-y':'0px',
  '--brand-face-x':'0px','--brand-face-y':'0px','--brand-collar-x':'0px','--brand-collar-y':'0px',
  '--brand-rim-x':'0px','--brand-rim-y':'0px','--brand-texture-x':'0px','--brand-texture-y':'0px',
} as const;

type DepthProperty = keyof typeof ZERO_DEPTH;
const set=(node:HTMLElement,p:DepthProperty,v:string)=>node.style.setProperty(p,v);
export function applyBrandDepth(node:HTMLElement,x:number,y:number){
  set(node,'--brand-atmosphere-x',`${(-x*1.35).toFixed(3)}px`);set(node,'--brand-atmosphere-y',`${(-y*.9).toFixed(3)}px`);set(node,'--brand-atmosphere-r',`${(-x*.28).toFixed(3)}deg`);
  set(node,'--brand-energy-x',`${(x*1.75).toFixed(3)}px`);set(node,'--brand-energy-y',`${(y*1.2).toFixed(3)}px`);set(node,'--brand-energy-r',`${(x*.36).toFixed(3)}deg`);
  set(node,'--brand-figure-x',`${(x*.22).toFixed(3)}px`);set(node,'--brand-figure-y',`${(y*.16).toFixed(3)}px`);set(node,'--brand-folds-x',`${(x*.55).toFixed(3)}px`);set(node,'--brand-folds-y',`${(y*.38).toFixed(3)}px`);
  set(node,'--brand-hood-x',`${(x*.68).toFixed(3)}px`);set(node,'--brand-hood-y',`${(y*.48).toFixed(3)}px`);set(node,'--brand-hood-layers-x',`${(x*1.02).toFixed(3)}px`);set(node,'--brand-hood-layers-y',`${(y*.72).toFixed(3)}px`);
  set(node,'--brand-face-x',`${(-x*.24).toFixed(3)}px`);set(node,'--brand-face-y',`${(-y*.16).toFixed(3)}px`);set(node,'--brand-collar-x',`${(x*.82).toFixed(3)}px`);set(node,'--brand-collar-y',`${(y*.58).toFixed(3)}px`);
  set(node,'--brand-rim-x',`${(x*1.28).toFixed(3)}px`);set(node,'--brand-rim-y',`${(y*.88).toFixed(3)}px`);set(node,'--brand-texture-x',`${(x*.38).toFixed(3)}px`);set(node,'--brand-texture-y',`${(y*.27).toFixed(3)}px`);
}
export function resetBrandDepth(node:HTMLElement){node.dataset.brandInteraction='idle';for(const[p,v]of Object.entries(ZERO_DEPTH))node.style.setProperty(p,v)}
