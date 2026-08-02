export const BRAND_MOTION_CSS = `
[data-brand-mark]{--brand-motion-scale:1;--brand-root-y:0px;--brand-root-scale:1;--brand-far-x:0px;--brand-far-y:0px;--brand-far-scale:1;--brand-energy-x:0px;--brand-energy-y:0px;--brand-energy-r:0deg;--brand-energy-scale:1;--brand-figure-x:0px;--brand-figure-y:0px;--brand-folds-x:0px;--brand-folds-y:0px;--brand-folds-scale-x:1;--brand-folds-scale-y:1;--brand-hood-x:0px;--brand-hood-y:0px;--brand-hood-scale:1;--brand-hood-layers-x:0px;--brand-hood-layers-y:0px;--brand-hood-layers-scale:1;--brand-face-x:0px;--brand-face-y:0px;--brand-face-scale:1;--brand-collar-x:0px;--brand-collar-y:0px;--brand-collar-scale-x:1;--brand-collar-scale-y:1;--brand-rim-x:0px;--brand-rim-y:0px;--brand-texture-x:0px;--brand-texture-y:0px;--brand-aura-opacity:1;--brand-energy-opacity:1;--brand-rim-opacity:1;--brand-energy-brightness:1;--brand-rim-brightness:1}
[data-brand-mark] [data-brand-vector]{transform:translate3d(0,var(--brand-root-y),0) scale(var(--brand-root-scale));transform-origin:center;filter:drop-shadow(0 5px 12px rgba(0,4,13,.84)) drop-shadow(0 0 10px rgba(46,216,255,.18));transition:filter 520ms cubic-bezier(.16,1,.3,1)}
[data-brand-mark] [data-brand-depth]{transform-box:fill-box;transform-origin:center}
[data-brand-mark] [data-brand-atmosphere]{transform:translate3d(var(--brand-far-x),var(--brand-far-y),0) scale(var(--brand-far-scale));opacity:var(--brand-aura-opacity)}
[data-brand-mark] [data-brand-energy]{transform:translate3d(var(--brand-energy-x),var(--brand-energy-y),0) rotate(var(--brand-energy-r)) scale(var(--brand-energy-scale));opacity:var(--brand-energy-opacity);filter:brightness(var(--brand-energy-brightness))}
[data-brand-mark] [data-brand-figure]{transform:translate3d(var(--brand-figure-x),var(--brand-figure-y),0)}
[data-brand-mark] [data-brand-folds],[data-brand-mark] [data-brand-upper-folds],[data-brand-mark] [data-brand-epic-folds]{transform:translate3d(var(--brand-folds-x),var(--brand-folds-y),0) scale(var(--brand-folds-scale-x),var(--brand-folds-scale-y))}
[data-brand-mark] [data-brand-hood]{transform:translate3d(var(--brand-hood-x),var(--brand-hood-y),0) scale(var(--brand-hood-scale))}
[data-brand-mark] [data-brand-hood-layers]{transform:translate3d(var(--brand-hood-layers-x),var(--brand-hood-layers-y),0) scale(var(--brand-hood-layers-scale))}
[data-brand-mark] [data-brand-face-void],[data-brand-mark] [data-brand-face-depth]{transform:translate3d(var(--brand-face-x),var(--brand-face-y),0) scale(var(--brand-face-scale))}
[data-brand-mark] [data-brand-collar]{transform:translate3d(var(--brand-collar-x),var(--brand-collar-y),0) scale(var(--brand-collar-scale-x),var(--brand-collar-scale-y))}
[data-brand-mark] [data-brand-rim-light]{transform:translate3d(var(--brand-rim-x),var(--brand-rim-y),0);opacity:var(--brand-rim-opacity);filter:brightness(var(--brand-rim-brightness))}
[data-brand-mark] [data-brand-texture],[data-brand-mark] [data-brand-seams]{transform:translate3d(var(--brand-texture-x),var(--brand-texture-y),0)}
@media (hover:hover) and (pointer:fine){
[data-brand-mark][data-brand-interaction="active"] [data-brand-vector],[data-brand-mark][data-brand-interaction="settling"] [data-brand-vector]{will-change:transform,filter}
[data-brand-mark][data-brand-interaction="active"] [data-brand-depth],[data-brand-mark][data-brand-interaction="settling"] [data-brand-depth]{will-change:transform,opacity}
[data-brand-mark][data-brand-interaction="active"] [data-brand-vector]{filter:brightness(1.08) saturate(1.07) drop-shadow(0 9px 19px rgba(0,7,18,.9)) drop-shadow(0 0 19px rgba(65,220,255,.36)) drop-shadow(0 0 6px rgba(184,247,255,.18))}
[data-brand-mark][data-brand-interaction="settling"] [data-brand-vector]{filter:brightness(1.028) saturate(1.025) drop-shadow(0 7px 16px rgba(0,7,18,.88)) drop-shadow(0 0 14px rgba(65,220,255,.24))}
}
a:focus-visible [data-brand-mark] [data-brand-vector],button:focus-visible [data-brand-mark] [data-brand-vector]{filter:brightness(1.075) saturate(1.05) drop-shadow(0 0 17px rgba(65,220,255,.34))}
a:focus-visible [data-brand-mark] [data-brand-rim-light],button:focus-visible [data-brand-mark] [data-brand-rim-light]{opacity:1;filter:brightness(1.3)}
@media (prefers-reduced-motion:reduce){
[data-brand-mark] [data-brand-vector],[data-brand-mark] [data-brand-depth]{transform:none!important;transition:none!important;will-change:auto!important}
[data-brand-mark][data-brand-interaction="active"] [data-brand-vector]{filter:brightness(1.065) saturate(1.04) drop-shadow(0 0 15px rgba(65,220,255,.28))}
[data-brand-mark][data-brand-interaction="active"] [data-brand-rim-light]{opacity:1;filter:brightness(1.22)}
}`;
