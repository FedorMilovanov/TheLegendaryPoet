import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const read=(f:string)=>fs.readFileSync(path.resolve(f),'utf8');
const raw=(f:string)=>fs.readFileSync(path.resolve(f));
const blob=(f:string)=>{const b=raw(f);return crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex')};
const version='cloak-20260729-20',source='canonical-reference-v2-black-monolith-v17-0';
const component=read('src/components/BrandMark.tsx'),motion=read('src/components/brandMotionV17.ts');
const asset=read('src/components/brandEmblemV17.svg'),svg=read('public/brand-emblem.svg');
const micro=read('public/brand-mark-micro.svg'),mask=read('public/brand-emblem-mask.svg');
const evaluation=JSON.parse(read('qa/brand-reference-evaluation.json')) as {candidateSource:string;candidateRevision:string;reviewerDecision:string;candidateGitBlobShas:Record<string,string>};
function validSvg(s:string,file:string,box:string){assert.match(s,new RegExp(`<svg\\b[^>]*viewBox="${box.split(' ').join('\\s+')}"`));assert.ok(s.trimEnd().endsWith('</svg>'),`${file}: truncated`);assert.equal((s.match(/<g(?:\s[^>]*)?>/g)||[]).filter(t=>!/\/\s*>$/.test(t)).length,(s.match(/<\/g>/g)||[]).length,`${file}: groups`);assert.doesNotMatch(s,/<(?:image|rect)\b|data:image|base64,/i)}
for(const t of ['useId()','useReducedMotion()','requestAnimationFrame(','cancelAnimationFrame(','data-brand-interaction="idle"','data-brand-parallax="layered-v1"',"pointerType!=='touch'","pointerEvents:'none'","import rawVector from './brandEmblemV17.svg?raw'","const BRAND_VERSION='cloak-20260729-20'","const VECTOR_SOURCE='canonical-reference-v2-black-monolith-v17-0'"])assert.ok(component.includes(t),`component missing ${t}`);
for(const t of ['@media (hover:hover) and (pointer:fine)','@media (prefers-reduced-motion:reduce)','--brand-atmosphere-x','--brand-energy-x','--brand-figure-x','--brand-folds-x','--brand-hood-x','--brand-hood-layers-x','--brand-face-x','--brand-collar-x','--brand-rim-x','--brand-texture-x'])assert.ok(motion.includes(t),`motion missing ${t}`);
assert.equal(asset,svg,'inline asset diverged from standalone');validSvg(svg,'emblem','0 0 96 96');validSvg(micro,'micro','0 0 32 32');validSvg(mask,'mask','0 0 96 96');
for(const s of [svg,micro,mask])assert.ok(s.includes(`data-brand-vector-source="${source}"`));
for(const t of ['M48 36.5C40.4 35.9','M47.4 7.6C43.9 8.8','M47.5 16.2C44.8 16.8','M45.4 32.2C46.3 33','data-brand-throat=""'])assert.ok(svg.includes(t),`geometry missing ${t}`);
for(const h of ['figure','hood','cloak','face-void','face-depth','rim-light','folds','upper-folds','epic-folds','collar','throat','atmosphere','energy','texture','seams','hood-layers','neck-shadow'])assert.ok(svg.includes(`data-brand-${h}`),`hook ${h}`);
const atmosphere=svg.slice(svg.indexOf('<g data-brand-atmosphere='),svg.indexOf('<g data-brand-energy='));for(const m of atmosphere.matchAll(/d="([^"]+)"/g)){const n=(m[1].match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);assert.ok(n.filter((_,i)=>i%2===1).every(y=>y<=70),'lower smoke')}
const energy=svg.slice(svg.indexOf('<g data-brand-energy='),svg.indexOf('<g data-brand-figure='));assert.doesNotMatch(energy,/<(?:line|polyline)\b/i,'crisp bug fragment');for(const m of energy.matchAll(/d="([^"]+)"/g))assert.doesNotMatch(m[1],/[LHVlhv]/,'straight energy command');
const figure=svg.slice(svg.indexOf('<g data-brand-figure='));for(const m of figure.matchAll(/fill="#([0-9a-fA-F]{6})"/g)){const c=[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16));assert.ok(Math.max(...c)<=42,`grey figure #${m[1]}`)}
for(const t of ['M16 12.2C13.5 12','M15.8 2.6C14.6 2.9','M15.8 5.4C14.9 5.6'])assert.ok(micro.includes(t));assert.ok(mask.includes('fill-rule="evenodd"'));
assert.equal(evaluation.candidateSource,source);assert.match(evaluation.candidateRevision,/v17\.0/);assert.equal(evaluation.reviewerDecision,'not-reference-approved');for(const f of ['src/components/BrandMark.tsx','src/components/brandMotionV17.ts','src/components/brandEmblemV17.svg','public/brand-emblem.svg','public/brand-mark-micro.svg','public/brand-emblem-mask.svg'])assert.equal(blob(f),evaluation.candidateGitBlobShas[f],`${f}: lock`);
for(const f of ['index.html','public/site.webmanifest','public/browserconfig.xml','public/brand-release.txt'])assert.ok(read(f).includes(version),`${f}: cache marker`);
console.log('brand validation: v17 black monolith, shared source, curved-only energy, layered motion and smoke-free lower edge synchronized');
