import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const BASE_URL=process.env.QA_BASE_URL||'http://127.0.0.1:4173',ARTIFACT_DIR=path.resolve('qa-artifacts');
const VERSION='cloak-20260729-20',VECTOR_SOURCE='canonical-reference-v2-black-monolith-v17-0';
const routes=['/','/poets','/ratings','/articles','/music','/archive','/about'];
const layers=['atmosphere','energy','figure','folds','hood','hood-layers','face-void','face-depth','collar','rim-light','texture','seams'];
fs.mkdirSync(ARTIFACT_DIR,{recursive:true});
async function state(mark){return mark.evaluate((n,names)=>Object.fromEntries(names.map(k=>[k,getComputedStyle(n.querySelector(`[data-brand-${k}]`)).transform])),layers)}

test('v17 surfaces are black-monolith, curved-energy and raster-free',async({page,request})=>{
  expect((await page.goto(BASE_URL,{waitUntil:'domcontentloaded'}))?.status()).toBeLessThan(400);
  for(const asset of ['brand-emblem.svg','brand-mark-micro.svg','brand-emblem-mask.svg']){const r=await request.get(`${BASE_URL}/${asset}?v=${Date.now()}`),s=await r.text();expect(r.status(),asset).toBe(200);expect(s).toContain(`data-brand-vector-source="${VECTOR_SOURCE}"`);expect(s).toMatch(/<path\b/);expect(s).not.toMatch(/<image\b|<rect\b|data:image|base64,/i)}
  const s=await(await request.get(`${BASE_URL}/brand-emblem.svg`)).text();
  for(const token of ['M48 36.5C40.4 35.9','M47.4 7.6C43.9 8.8','M47.5 16.2C44.8 16.8','data-brand-throat=""','@media (hover:hover) and (pointer:fine)','@media (prefers-reduced-motion:reduce)'])expect(s).toContain(token);
  const energy=s.slice(s.indexOf('<g data-brand-energy='),s.indexOf('<g data-brand-figure='));expect(energy).not.toMatch(/<(?:line|polyline)\b/i);for(const d of [...energy.matchAll(/d="([^"]+)"/g)].map(m=>m[1]))expect(d).not.toMatch(/[LHVlhv]/);
});

test('standalone and micro decode at every optical size',async({page})=>{
  await page.setViewportSize({width:980,height:360});const sizes=[192,96,56,44,32,16];
  await page.setContent(`<style>html,body{margin:0;background:#050810;color:#d9f8ff;font:12px system-ui}main{min-height:360px;display:flex;align-items:center;gap:22px;padding:28px}.tile{width:204px;height:204px;display:grid;place-items:center;background:#02050b;border:1px solid #123}figure{margin:0;text-align:center}</style><main>${sizes.map(n=>`<figure><div class=tile><img data-size=${n} width=${n} height=${n} src="${BASE_URL}/${n<=32?'brand-mark-micro.svg':'brand-emblem.svg'}?v=${VERSION}"></div>${n}px</figure>`).join('')}</main>`);
  const decoded=await page.locator('img').evaluateAll(async ns=>Promise.all(ns.map(async n=>{try{await n.decode();return n.naturalWidth>0}catch{return false}})));expect(decoded.every(Boolean)).toBe(true);
  await page.screenshot({path:path.join(ARTIFACT_DIR,'brand-emblem-optical-size-matrix.png'),fullPage:true});
});

test('live header uses v17 geometry and independent pointer depth',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(BASE_URL,{waitUntil:'domcontentloaded'});await page.addStyleTag({content:'[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}'});
  const mark=page.locator('header [data-brand-mark]').first();await expect(mark).toBeVisible();await expect(mark).toHaveAttribute('data-brand-version',VERSION);await expect(mark).toHaveAttribute('data-brand-vector-source',VECTOR_SOURCE);await expect(mark).toHaveAttribute('data-brand-parallax','layered-v1');
  for(const hook of ['vector','figure','hood','cloak','face-void','face-depth','rim-light','folds','upper-folds','epic-folds','collar','throat','atmosphere','energy','texture','seams','hood-layers','neck-shadow'])await expect(mark.locator(`[data-brand-${hook}]`)).toBeAttached();
  expect(await mark.locator('image,rect,line,polyline').count()).toBe(0);
  const g=await mark.evaluate(n=>{const b=s=>n.querySelector(s).getBBox(),hood=b('[data-brand-hood]'),face=b('[data-brand-face-void]'),cloak=b('[data-brand-cloak]'),throat=b('[data-brand-throat]'),aura=b('[data-brand-atmosphere]'),energy=b('[data-brand-energy]');return{hoodW:hood.width,hoodY:hood.y,faceW:face.width,faceH:face.height,ratio:face.width/hood.width,cloakW:cloak.width,cloakB:cloak.y+cloak.height,throatW:throat.width,auraW:aura.width,auraB:aura.y+aura.height,energyW:energy.width}});
  expect(g.hoodW).toBeGreaterThan(22);expect(g.hoodW).toBeLessThan(24);expect(g.hoodY).toBeGreaterThan(7.2);expect(g.hoodY).toBeLessThan(8);expect(g.faceW).toBeGreaterThan(14);expect(g.faceW).toBeLessThan(15.5);expect(g.faceH).toBeLessThan(18);expect(g.ratio).toBeGreaterThan(.61);expect(g.ratio).toBeLessThan(.69);expect(g.cloakW).toBeGreaterThan(80);expect(g.cloakW).toBeLessThan(82);expect(g.cloakB).toBeGreaterThan(95.7);expect(g.throatW).toBeLessThan(5.5);expect(g.auraW).toBeLessThan(74);expect(g.auraB).toBeLessThan(71);expect(g.energyW).toBeLessThan(59);
  const vector=mark.locator('[data-brand-vector]'),before=await vector.evaluate(n=>({t:getComputedStyle(n).transform,f:getComputedStyle(n).filter})),box=await mark.boundingBox();
  await page.screenshot({path:path.join(ARTIFACT_DIR,'brand-emblem-vector-idle.png'),clip:{x:Math.max(0,box.x-28),y:Math.max(0,box.y-28),width:box.width+56,height:box.height+56}});await page.mouse.move(box.x+box.width*.84,box.y+box.height*.18);await page.waitForTimeout(320);await expect(mark).toHaveAttribute('data-brand-interaction','active');
  const active=await state(mark),moved=Object.values(active).filter(v=>v&&v!=='none');expect(moved.length).toBeGreaterThanOrEqual(10);expect(new Set(moved).size).toBeGreaterThanOrEqual(7);expect(active.atmosphere).not.toBe(active.energy);expect(active.hood).not.toBe(active['hood-layers']);expect(active['face-void']).not.toBe(active['rim-light']);const after=await vector.evaluate(n=>({t:getComputedStyle(n).transform,f:getComputedStyle(n).filter}));expect(after.t).not.toBe(before.t);expect(after.f).not.toBe(before.f);
  await page.screenshot({path:path.join(ARTIFACT_DIR,'brand-emblem-layered-hover.png'),clip:{x:Math.max(0,box.x-32),y:Math.max(0,box.y-32),width:box.width+64,height:box.height+64}});await page.mouse.move(Math.max(2,box.x-80),Math.max(2,box.y-80));await page.waitForTimeout(820);await expect(mark).toHaveAttribute('data-brand-interaction','idle');for(const v of Object.values(await state(mark)))expect(['none','matrix(1, 0, 0, 1, 0, 0)']).toContain(v);expect(errors).toEqual([]);
});

test('reduced motion keeps depth stationary',async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.goto(BASE_URL,{waitUntil:'domcontentloaded'});const mark=page.locator('header [data-brand-mark]').first(),box=await mark.boundingBox();await page.mouse.move(box.x+box.width*.8,box.y+box.height*.2);await page.waitForTimeout(250);await expect(mark).toHaveAttribute('data-brand-interaction','idle');for(const v of Object.values(await state(mark)))expect(['none','matrix(1, 0, 0, 1, 0, 0)']).toContain(v);await page.screenshot({path:path.join(ARTIFACT_DIR,'brand-emblem-reduced-motion.png'),clip:{x:Math.max(0,box.x-28),y:Math.max(0,box.y-28),width:box.width+56,height:box.height+56}})});
for(const route of routes)test(`${route}: header and footer use v17`,async({page})=>{expect((await page.goto(`${BASE_URL}${route}`,{waitUntil:'domcontentloaded'}))?.status()).toBeLessThan(400);for(const mark of [page.locator('header [data-brand-mark]').first(),page.locator('footer [data-brand-mark]').first()]){await expect(mark).toHaveAttribute('data-brand-vector-source',VECTOR_SOURCE);await expect(mark).toHaveAttribute('data-brand-parallax','layered-v1');expect(await mark.locator('image,rect,line,polyline').count()).toBe(0)}});
