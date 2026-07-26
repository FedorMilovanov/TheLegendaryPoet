import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const VERSION = 'cloak-20260726-8';
const MASTER_SHA256 = 'f9e29065cc7191827750d252ecb8b8002385671faed5a4503dd2738065f661b7';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
const coreRoutes = ['/', '/poets', '/ratings', '/articles', '/music', '/archive', '/about'];

async function imageSize(page, url) {
  return page.evaluate(async (assetUrl) => { const image = new Image(); image.src = assetUrl; await image.decode(); return { width: image.naturalWidth, height: image.naturalHeight }; }, url);
}

test('vector emblem, micro favicon, install icons and share metadata are coherent', async ({ page, request }) => {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('meta[name="brand-release"]')).toHaveAttribute('content', VERSION);
  const releaseResponse = await request.get(`${BASE_URL}/brand-release.txt?verify=${Date.now()}`);
  expect(releaseResponse.status()).toBe(200);
  expect((await releaseResponse.text()).trim()).toBe(`${VERSION}\nmaster-sha256=${MASTER_SHA256}`);

  for (const asset of ['brand-emblem.svg', 'brand-mark-micro.svg', 'brand-emblem-mask.svg']) {
    const assetResponse = await request.get(`${BASE_URL}/${asset}?verify=${Date.now()}`);
    expect(assetResponse.status(), `${asset} HTTP status`).toBe(200);
    const source = await assetResponse.text();
    expect(source).toMatch(/<path\b/);
    expect(source).not.toMatch(/<image\b|data:image|base64,/i);
    expect(source).not.toMatch(/<rect\b/);
  }

  const standaloneSvg = await (await request.get(`${BASE_URL}/brand-emblem.svg?verify=${Date.now()}`)).text();
  expect(standaloneSvg).toContain('viewBox="0 0 96 96"');
  expect(standaloneSvg).toContain('data-brand-vector-source="reference-derived-contours-v8"');
  expect(standaloneSvg).toContain('id="aura-blur"');
  expect(standaloneSvg).toContain('id="rim-glow"');
  expect(standaloneSvg).toContain('M48 2C42.8 3.8');
  expect(standaloneSvg).toContain('M48 2.4C43.1 3.8');
  expect(standaloneSvg).toContain('M48 18.2C41 21.3');
  expect((standaloneSvg.match(/<path\b/g) || []).length).toBeGreaterThanOrEqual(45);
  expect(standaloneSvg).not.toMatch(/id="core"|7fecff|49\.5L51\.5 57/i);

  const microSvg = await (await request.get(`${BASE_URL}/brand-mark-micro.svg?verify=${Date.now()}`)).text();
  expect(microSvg).toContain('viewBox="0 0 32 32"');
  expect(microSvg).toContain('M.5 32C1.4 26.2');
  expect(microSvg).toContain('M16 .5C14.2 1.1');
  expect(microSvg).toContain('M16 5.5C13.5 6.8');
  expect((microSvg.match(/<path\b/g) || []).length).toBeGreaterThanOrEqual(9);

  const rasterAssets = [['brand-emblem-master.webp',{width:320,height:320}],['favicon-16.png',{width:16,height:16}],['favicon-32.png',{width:32,height:32}],['apple-touch-icon.png',{width:180,height:180}],['icon-192.png',{width:192,height:192}],['icon-512.png',{width:512,height:512}],['icon-maskable-512.png',{width:512,height:512}],['mstile-150x150.png',{width:150,height:150}],['og-image.jpg',{width:1200,height:630}]];
  for (const [asset, size] of rasterAssets) { const assetUrl = `${BASE_URL}/${asset}?verify=${Date.now()}`; const assetResponse = await request.get(assetUrl); expect(assetResponse.status(), `${asset} HTTP status`).toBe(200); expect(await imageSize(page, assetUrl), `${asset} dimensions`).toEqual(size); }

  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', new RegExp(`brand-mark-micro\\.svg\\?v=${VERSION}$`));
  await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute('href', new RegExp(`favicon-32\\.png\\?v=${VERSION}$`));
  await expect(page.locator('link[rel="icon"][sizes="16x16"]')).toHaveAttribute('href', new RegExp(`favicon-16\\.png\\?v=${VERSION}$`));
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', new RegExp(`apple-touch-icon\\.png\\?v=${VERSION}$`));
  expect(await page.locator('link[rel="preload"][href*="brand-emblem-master.webp"]').count()).toBe(0);
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toBe(`https://thelegendarypoet.ru/og-image.jpg?v=${VERSION}`);
  expect(await page.locator('meta[name="twitter:image"]').getAttribute('content')).toBe(`https://thelegendarypoet.ru/og-image.jpg?v=${VERSION}`);
  await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', 'image/jpeg');
  const manifest = await (await request.get(`${BASE_URL}/site.webmanifest?v=${VERSION}`)).json();
  expect(manifest.icons).toEqual(expect.arrayContaining([expect.objectContaining({src:`/favicon-32.png?v=${VERSION}`,sizes:'32x32',type:'image/png'}),expect.objectContaining({src:`/icon-192.png?v=${VERSION}`,sizes:'192x192',type:'image/png',purpose:'any'}),expect.objectContaining({src:`/icon-512.png?v=${VERSION}`,sizes:'512x512',type:'image/png',purpose:'any'}),expect.objectContaining({src:`/icon-maskable-512.png?v=${VERSION}`,purpose:'maskable'})]));
});

test('standalone and micro marks remain legible across optical sizes', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 320 });
  await page.setContent(`<style>html,body{margin:0;min-height:100%;background:#050810;color:#d9f8ff;font:12px system-ui}main{box-sizing:border-box;min-height:320px;display:flex;align-items:center;gap:22px;padding:28px}figure{margin:0;display:grid;justify-items:center;gap:9px}img{display:block;object-fit:contain}.tile{display:grid;place-items:center;width:204px;height:204px;background:#03070d;border:1px solid rgba(70,215,255,.12)}.small{width:102px;height:102px}</style><main><figure><div class="tile"><img data-optical="192" width="192" height="192" src="${BASE_URL}/brand-emblem.svg?v=${VERSION}"></div><figcaption>192 px</figcaption></figure><figure><div class="tile small"><img data-optical="96" width="96" height="96" src="${BASE_URL}/brand-emblem.svg?v=${VERSION}"></div><figcaption>96 px</figcaption></figure><figure><div class="tile small"><img data-optical="56" width="56" height="56" src="${BASE_URL}/brand-emblem.svg?v=${VERSION}"></div><figcaption>56 px</figcaption></figure><figure><div class="tile small"><img data-optical="44" width="44" height="44" src="${BASE_URL}/brand-emblem.svg?v=${VERSION}"></div><figcaption>44 px</figcaption></figure><figure><div class="tile small"><img data-optical="32" width="32" height="32" src="${BASE_URL}/brand-mark-micro.svg?v=${VERSION}"></div><figcaption>micro 32 px</figcaption></figure><figure><div class="tile small"><img data-optical="16" width="16" height="16" src="${BASE_URL}/brand-mark-micro.svg?v=${VERSION}"></div><figcaption>micro 16 px</figcaption></figure></main>`);
  await page.locator('img').evaluateAll(async (images) => Promise.all(images.map((image) => image.decode())));
  for (const size of [192,96,56,44,32,16]) { const image = page.locator(`img[data-optical="${size}"]`); await expect(image).toBeVisible(); const box = await image.boundingBox(); expect(Math.round(box?.width || 0)).toBe(size); expect(Math.round(box?.height || 0)).toBe(size); }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-emblem-optical-size-matrix.png'), fullPage: true });
});

test('header renders the mystical reference-derived vector and restrained hover', async ({ page }) => {
  const pageErrors = []; page.on('pageerror', (error) => pageErrors.push(String(error)));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: '[data-custom-cursor-dot], [data-custom-cursor-ring] { display: none !important; }' });
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toBeVisible();
  await expect(mark).toHaveAttribute('data-brand-version', VERSION);
  await expect(mark).toHaveAttribute('data-brand-renderer', 'inline-vector');
  await expect(mark).toHaveAttribute('data-brand-vector-source', 'reference-derived-contours-v8');
  for (const hook of ['vector','figure','hood','cloak','face-void','rim-light','folds','collar','energy','atmosphere']) await expect(mark.locator(`[data-brand-${hook}]`)).toBeVisible();
  expect(await mark.locator('[data-brand-light-core]').count()).toBe(0);
  expect(await mark.locator('image, rect, [data-brand-fallback], [data-brand-book], [data-brand-wing], [data-brand-halo]').count()).toBe(0);
  const box = await mark.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(54); expect(box?.width).toBeLessThanOrEqual(60); expect(box?.height).toBeGreaterThanOrEqual(54); expect(box?.height).toBeLessThanOrEqual(60);
  const geometry = await mark.evaluate((node) => { const bounds = (selector) => node.querySelector(selector)?.getBBox(); const hood=bounds('[data-brand-hood]'); const face=bounds('[data-brand-face-void]'); const cloak=bounds('[data-brand-cloak]'); if(!hood||!face||!cloak)return null; return {hoodWidth:hood.width,faceWidth:face.width,cloakWidth:cloak.width,faceToHoodWidth:face.width/hood.width,faceToHoodHeight:face.height/hood.height,cloakToHoodWidth:cloak.width/hood.width,hoodTop:hood.y,cloakBottom:cloak.y+cloak.height}; });
  expect(geometry).not.toBeNull(); expect(geometry.hoodWidth).toBeGreaterThan(38); expect(geometry.faceWidth).toBeGreaterThan(31); expect(geometry.cloakWidth).toBeGreaterThan(91); expect(geometry.faceToHoodWidth).toBeGreaterThan(0.8); expect(geometry.faceToHoodHeight).toBeGreaterThan(0.77); expect(geometry.cloakToHoodWidth).toBeGreaterThan(2.3); expect(geometry.hoodTop).toBeLessThan(3); expect(geometry.cloakBottom).toBeGreaterThanOrEqual(95.8);
  const readMotionState = () => mark.evaluate((node) => { const read=(selector)=>{const element=node.querySelector(selector);if(!element)return null;const style=getComputedStyle(element);return{opacity:Number(style.opacity),transform:style.transform,filter:style.filter}}; const rimPath=node.querySelector('[data-brand-rim-light] path'); const rimStyle=rimPath?getComputedStyle(rimPath):null; return{vector:read('[data-brand-vector]'),rim:read('[data-brand-rim-light]'),folds:read('[data-brand-folds]'),energy:read('[data-brand-energy]'),atmosphere:read('[data-brand-atmosphere]'),rimDash:rimStyle?{array:rimStyle.strokeDasharray,offset:rimStyle.strokeDashoffset}:null}; });
  const before=await readMotionState();
  await page.screenshot({path:path.join(ARTIFACT_DIR,'brand-emblem-vector-idle.png'),clip:{x:Math.max(0,(box?.x||0)-28),y:Math.max(0,(box?.y||0)-28),width:Math.min(page.viewportSize()?.width||1280,(box?.width||56)+56),height:(box?.height||56)+56}});
  await mark.hover(); await page.waitForTimeout(620); const after=await readMotionState();
  await page.screenshot({path:path.join(ARTIFACT_DIR,'brand-emblem-vector-hover.png'),clip:{x:Math.max(0,(box?.x||0)-28),y:Math.max(0,(box?.y||0)-28),width:Math.min(page.viewportSize()?.width||1280,(box?.width||56)+56),height:(box?.height||56)+56}});
  expect(after.vector?.transform).not.toBe(before.vector?.transform); expect(after.vector?.filter).not.toBe(before.vector?.filter); expect(after.rim?.opacity).toBeGreaterThan(before.rim?.opacity??0); expect(after.folds?.opacity).toBeGreaterThanOrEqual(before.folds?.opacity??0); expect(after.energy?.opacity).toBeGreaterThan(before.energy?.opacity??0); expect(after.atmosphere?.opacity).toBeGreaterThan(before.atmosphere?.opacity??0); expect(after.rimDash).not.toEqual(before.rimDash); expect(pageErrors).toEqual([]);
});

for (const route of coreRoutes) test(`${route}: header and footer use the v8 vector emblem`, async ({ page }) => { const response=await page.goto(`${BASE_URL}${route}`,{waitUntil:'domcontentloaded'}); expect(response?.status()).toBeLessThan(400); await expect(page.locator('header [data-brand-mark]').first()).toBeVisible(); expect(await page.locator('footer [data-brand-mark]').count()).toBeGreaterThanOrEqual(1); const result=await page.evaluate(()=>{const marks=[...document.querySelectorAll('[data-brand-mark]')];return{marks:marks.length,wrongVersions:marks.filter((mark)=>mark.getAttribute('data-brand-version')!=='cloak-20260726-8').length,wrongRenderers:marks.filter((mark)=>mark.getAttribute('data-brand-renderer')!=='inline-vector').length,wrongSources:marks.filter((mark)=>mark.getAttribute('data-brand-vector-source')!=='reference-derived-contours-v8').length,invalidViewBoxes:marks.map((mark)=>mark.querySelector('svg')?.getAttribute('viewBox')).filter((viewBox)=>viewBox!=='0 0 96 96'),rasterOrPlate:marks.reduce((count,mark)=>count+mark.querySelectorAll('image, rect, [data-brand-fallback], [data-brand-book], [data-brand-wing], [data-brand-halo], [data-brand-light-core]').length,0)}}); expect(result.marks).toBeGreaterThanOrEqual(2); expect(result.wrongVersions).toBe(0); expect(result.wrongRenderers).toBe(0); expect(result.wrongSources).toBe(0); expect(result.invalidViewBoxes).toEqual([]); expect(result.rasterOrPlate).toBe(0); });
