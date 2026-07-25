import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const OUT = path.resolve('webkit-paint-artifacts');
fs.mkdirSync(OUT, { recursive: true });

async function decoded(page) {
  await expect.poll(
    () => page.locator('[data-hero-poet-window] img').evaluateAll((images) => images.length === 6 && images.every((image) => image.complete && image.naturalWidth > 0)),
    { timeout: 15_000 },
  ).toBe(true);
}

async function twoFrames(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function capture(page, name) {
  const state = await page.evaluate(() => {
    const title = document.querySelector('.hero-title-lockup');
    const root = title?.parentElement;
    const shell = document.querySelector('[data-hero-poet-window-shell]');
    const label = document.querySelector('[data-hero-poet-window-label]');
    const describe = (node) => {
      if (!node) return null;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        tag: node.tagName,
        className: node.className,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom },
        opacity: style.opacity,
        display: style.display,
        visibility: style.visibility,
        transform: style.transform,
        filter: style.filter,
        contentVisibility: style.contentVisibility,
        contain: style.contain,
      };
    };
    const animations = root ? root.getAnimations({ subtree: true }).map((animation) => ({
      playState: animation.playState,
      currentTime: animation.currentTime,
      startTime: animation.startTime,
      playbackRate: animation.playbackRate,
      timing: animation.effect?.getComputedTiming?.(),
    })) : [];
    const center = title?.getBoundingClientRect();
    const hit = center ? document.elementFromPoint(Math.max(0, Math.min(innerWidth - 1, center.left + center.width / 2)), Math.max(0, Math.min(innerHeight - 1, center.top + Math.min(center.height / 2, 40)))) : null;
    return {
      href: location.href,
      visibilityState: document.visibilityState,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      coarsePointer: matchMedia('(hover: none) and (pointer: coarse)').matches,
      viewport: { innerWidth, innerHeight, devicePixelRatio, scrollX, scrollY },
      documentSize: { bodyWidth: document.body.scrollWidth, bodyHeight: document.body.scrollHeight, htmlWidth: document.documentElement.scrollWidth, htmlHeight: document.documentElement.scrollHeight },
      title: describe(title),
      root: describe(root),
      shell: describe(shell),
      label: describe(label),
      animationCount: animations.length,
      animations,
      hit: hit ? { tag: hit.tagName, className: hit.className, text: hit.textContent?.trim().slice(0, 80) } : null,
    };
  });
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(state, null, 2));
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
}

test('diagnose reduced-motion WebKit paint lifecycle', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  await decoded(page);

  await capture(page, '01-immediate-after-decode');
  await twoFrames(page);
  await capture(page, '02-after-two-frames');
  await page.waitForTimeout(250);
  await capture(page, '03-after-250ms');
  await page.waitForTimeout(750);
  await capture(page, '04-after-1000ms');

  const hero = page.locator('section').first();
  await hero.screenshot({ path: path.join(OUT, '05-hero-element.png') });

  await page.evaluate(() => {
    const title = document.querySelector('.hero-title-lockup');
    const root = title?.parentElement;
    if (!root) return;
    root.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
    Object.assign(root.style, { opacity: '1', transform: 'none', transition: 'none', animation: 'none' });
    document.querySelectorAll('[data-hero-poet-window-shell], .hero-blur-reveal, .hero-blur-reveal-strong').forEach((node) => {
      Object.assign(node.style, { opacity: '1', transform: 'none', filter: 'none', animation: 'none', transition: 'none' });
    });
    void document.documentElement.offsetHeight;
  });
  await twoFrames(page);
  await capture(page, '06-after-cancel-and-inline-final');

  await page.evaluate(async () => {
    const root = document.querySelector('.hero-title-lockup')?.parentElement;
    if (!root) return;
    root.style.display = 'none';
    void root.offsetHeight;
    root.style.display = '';
    void root.offsetHeight;
  });
  await twoFrames(page);
  await capture(page, '07-after-display-repaint');
});
