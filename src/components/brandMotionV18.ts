export const BRAND_MOTION_CSS = `
[data-brand-mark]{--brand-motion-scale:1;--brand-root-y:0px;--brand-root-scale:1;--brand-figure-x:0px;--brand-figure-y:0px;--brand-aura-x:0px;--brand-aura-y:0px;--brand-aura-scale:1}
[data-brand-mark][data-brand-interaction="active"] [data-brand-raster-stage],[data-brand-mark][data-brand-interaction="settling"] [data-brand-raster-stage]{will-change:transform}
[data-brand-mark][data-brand-interaction="active"] [data-brand-raster-layer],[data-brand-mark][data-brand-interaction="settling"] [data-brand-raster-layer]{will-change:transform,opacity}
@media (prefers-reduced-motion:reduce){
[data-brand-mark] [data-brand-raster-stage],[data-brand-mark] [data-brand-raster-layer]{transform:none!important;transition:none!important;will-change:auto!important}
}`;
