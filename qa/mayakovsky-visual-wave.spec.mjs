import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const ASSET_FRAGMENT = '/images/essays/mayakovsky/editorial-wave/';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const cases = [
  {
    slug: 'mayakovsky-gromovoy',
    id: 'mayakovsky-part-two',
    expectedImages: 4,
    expectedReconstructions: 3,
    expectedDocuments: 1,
  },
  {
    slug: 'brik-case',
    id: 'mayakovsky-briks',
    expectedImages: 3,
    expectedReconstructions: 2,
    expectedDocuments: 1,
  },
];

async function revealWholeArticle(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  await page.evaluate(async () => {
    const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const step = Math.max(360, Math.floor(window.innerHeight * 0.72));
    for (let y = 0; y <= height; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 55));
    }
  });
}

for (const entry of cases) {
  test(`${entry.id} preserves reconstruction and document boundaries`, async ({ page }, testInfo) => {
    const pageErrors = [];
    const failedRequests = [];
    page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
    page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));

    const response = await page.goto(`${BASE_URL}/essays/${entry.slug}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    expect(response?.status()).toBeLessThan(400);
    await revealWholeArticle(page);

    const waveImages = page.locator(`figure img[src*="${ASSET_FRAGMENT}"]`);
    await expect(waveImages).toHaveCount(entry.expectedImages);

    for (let index = 0; index < entry.expectedImages; index += 1) {
      const image = waveImages.nth(index);
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveAttribute('data-image-state', 'ready', { timeout: 15_000 });
      const dimensions = await image.evaluate((node) => ({
        complete: node.complete,
        width: node.naturalWidth,
        height: node.naturalHeight,
      }));
      expect(dimensions.complete).toBe(true);
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
    }

    const waveFigures = page.locator(`figure:has(img[src*="${ASSET_FRAGMENT}"])`);
    await expect(waveFigures.getByText('Художественная реконструкция', { exact: true })).toHaveCount(
      entry.expectedReconstructions,
    );
    await expect(waveFigures.getByText('Документ', { exact: true })).toHaveCount(entry.expectedDocuments);

    const reconstructionFigures = waveFigures.filter({ hasText: 'Художественная реконструкция' });
    await expect(reconstructionFigures).toHaveCount(entry.expectedReconstructions);
    for (let index = 0; index < entry.expectedReconstructions; index += 1) {
      const figure = reconstructionFigures.nth(index);
      await expect(figure).toContainText('Редакционная реконструкция');
      await expect(figure.locator('a', { hasText: 'Источник' })).toHaveCount(0);
    }

    const documentFigures = waveFigures.filter({ hasText: 'Документ' });
    await expect(documentFigures).toHaveCount(entry.expectedDocuments);
    await expect(documentFigures.locator('a', { hasText: 'Источник' })).toHaveCount(
      entry.expectedDocuments,
    );

    await expect(
      page.getByText(/отдельно помеченные редакционные реконструкции/i),
    ).toHaveCount(1);
    await expect(
      page.getByText(/не являются фотографиями конкретных исторических сцен/i),
    ).toHaveCount(1);

    const firstReconstruction = reconstructionFigures.first();
    await firstReconstruction.locator('button[aria-haspopup="dialog"]').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Редакционная реконструкция');
    await expect(dialog.getByRole('link', { name: /Источник/i })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Закрыть изображение' }).click();
    await expect(dialog).toBeHidden();

    const diagnostics = await page.evaluate(() => ({
      overflow:
        Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) -
        document.documentElement.clientWidth,
      brokenImages: [...document.images]
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
    }));

    expect(diagnostics.overflow).toBeLessThanOrEqual(2);
    expect(diagnostics.brokenImages).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests.filter((value) => value.includes(ASSET_FRAGMENT))).toEqual([]);

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, `${testInfo.project.name}-${entry.id}-visual-wave.json`),
      JSON.stringify(
        {
          slug: entry.slug,
          project: testInfo.project.name,
          ...diagnostics,
          pageErrors,
          failedRequests,
        },
        null,
        2,
      ),
    );

    // These essays are taller than WebKit's 32,767px full-page screenshot
    // ceiling. Capture the first audited reconstruction as bounded visual
    // evidence instead; it retains the image, classification badge and caption
    // while every article-wide runtime assertion above remains unchanged.
    await firstReconstruction.scrollIntoViewIfNeeded();
    await firstReconstruction.screenshot({
      path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-${entry.id}-visual-wave.png`),
    });
  });
}
