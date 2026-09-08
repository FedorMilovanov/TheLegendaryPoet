import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const artifactDir = path.resolve('qa-artifacts/hall-web-runtime');
fs.mkdirSync(artifactDir, { recursive: true });
const testedSha = process.env.TESTED_SHA || process.env.GITHUB_SHA || null;
const contract = JSON.parse(fs.readFileSync(path.resolve('docs/hall-v3/web-runtime-proof.json'), 'utf8'));

async function readProofState(page) {
  await page.waitForFunction(() => window.__HALL_WEB_PROOF__?.ready === true);
  return page.evaluate(() => window.__HALL_WEB_PROOF__);
}

function writeEvidence(testInfo, name, payload) {
  const safeProject = testInfo.project.name.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
  const target = path.join(artifactDir, `${safeProject}-${name}.json`);
  fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

test('canonical H3/R1/L0/UV0 authority reaches browser readiness without documentary media', async ({ page }, testInfo) => {
  await page.goto('/');
  const state = await readProofState(page);

  expect(state.authority).toEqual({
    topology: 'H3',
    layoutFingerprint: '5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65',
    cameraRig: 'R1',
    lighting: 'L0-minimal-runtime',
    surfaceUv: 'UV0',
    documentaryMedia: 'excluded',
  });
  expect(state.cameraStops).toEqual([
    'entryReveal',
    'orientation',
    'firstTransition',
    'pushkinApproach',
    'pushkinViewing',
    'reverseExit',
  ]);

  if (testInfo.project.name === 'chromium-desktop') {
    expect(state.mode).toBe('webgl');
    expect(state.reason).toBeNull();
    expect(state.metrics.firstFrameMs).toBeGreaterThan(0);
    expect(state.metrics.drawCalls).toBeGreaterThan(0);
    expect(state.metrics.triangles).toBeGreaterThan(0);
    expect(state.metrics.textures).toBeGreaterThanOrEqual(0);
    expect(state.metrics.textures).toBeLessThanOrEqual(contract.thresholds.rendererTexturesMax);

    await page.getByRole('button', { name: 'Далее' }).click();
    await expect.poll(async () => (await page.evaluate(() => window.__HALL_WEB_PROOF__?.currentCameraStop))).toBe('orientation');
    await page.getByRole('button', { name: 'Далее' }).click();
    await page.getByRole('button', { name: 'Далее' }).click();
    await page.getByRole('button', { name: 'Далее' }).click();
    await expect.poll(async () => (await page.evaluate(() => window.__HALL_WEB_PROOF__?.currentCameraStop))).toBe('pushkinViewing');
  } else {
    expect(['webgl', 'fallback']).toContain(state.mode);
    if (state.mode === 'fallback') expect(state.reason).toBeTruthy();
  }

  writeEvidence(testInfo, 'runtime', {
    testedSha,
    project: testInfo.project.name,
    state,
  });
});

test('forced WebGL unavailability is semantic and fail-closed', async ({ page }, testInfo) => {
  await page.goto('/?forceWebglFailure=1');
  const state = await readProofState(page);
  expect(state.mode).toBe('fallback');
  expect(state.reason).toBe('forced-webgl-unavailable');
  await expect(page.getByRole('status').filter({ hasText: '3D-режим недоступен' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Маршрут H3/R1' })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(6);
  await expect(page.getByRole('button', { name: 'Назад' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Далее' })).toBeHidden();

  writeEvidence(testInfo, 'forced-fallback', {
    testedSha,
    project: testInfo.project.name,
    state,
  });
});

test('reduced motion turns the guided camera into deterministic cuts', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const initial = await readProofState(page);

  if (initial.mode === 'webgl') {
    expect(initial.reducedMotion).toBe(true);
    await page.getByRole('button', { name: 'Далее' }).click();
    await expect.poll(async () => (await page.evaluate(() => window.__HALL_WEB_PROOF__?.currentCameraStop))).toBe('orientation');
    await expect(page.getByRole('status').filter({ hasText: 'reduced-motion cut' })).toBeVisible();
  } else {
    expect(initial.reason).toBeTruthy();
  }

  writeEvidence(testInfo, 'reduced-motion', {
    testedSha,
    project: testInfo.project.name,
    state: await page.evaluate(() => window.__HALL_WEB_PROOF__),
  });
});

test('WebGL context loss falls back without leaving a dead canvas', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Context-loss proof is anchored to the guaranteed Chromium WebGL lane.');
  await page.goto('/');
  const initial = await readProofState(page);
  expect(initial.mode).toBe('webgl');

  const lossTriggered = await page.locator('[data-hall-proof-canvas="true"]').evaluate((canvas) => {
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    const extension = gl.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    extension.loseContext();
    return true;
  });
  expect(lossTriggered).toBe(true);

  await expect.poll(async () => (await page.evaluate(() => window.__HALL_WEB_PROOF__?.mode))).toBe('fallback');
  const state = await page.evaluate(() => window.__HALL_WEB_PROOF__);
  expect(state.reason).toBe('webgl-context-lost');
  await expect(page.getByText('Проверочный маршрут остаётся доступным без WebGL.')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Маршрут H3/R1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Назад' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Далее' })).toBeHidden();

  writeEvidence(testInfo, 'context-loss', {
    testedSha,
    project: testInfo.project.name,
    state,
  });
});
