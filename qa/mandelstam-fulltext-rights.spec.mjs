import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const works = [
  { id: 'mandelstam-dano-mne-telo-fragment', lines: 12, opening: 'Дано мне тело — что мне делать с ним,',
    closing: 'Узора милого не зачеркнуть.', source: '/01versus/1_015.htm', fragment: false },
  { id: 'mandelstam-my-zhivem-fragment', lines: 2, opening: 'Мы живём, под собою не чуя страны,',
    closing: 'Наши речи за десять шагов не слышны.', source: '/01versus/3_064.htm', fragment: true },
];
test('Мандельштам: 12 строк 1909 и честный правовой HOLD для 1933', async ({ page }, testInfo) => {
  const widths = testInfo.project.name === 'chromium-core' ? [320,390,1440] : [390];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${BASE_URL}/poets/osip-mandelstam`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation', { name: 'Навигация по лирике' })).toBeVisible();
    for(const poem of works){
      const card=page.locator(`#poem-${poem.id}`);
      await expect(card).toBeVisible();
      const title=card.locator('h3').first();
      if(poem.fragment) await expect(title).toContainText('фрагмент');
      else await expect(title).not.toContainText('фрагмент');
      const lines=(await card.locator('[data-poem-canonical]').textContent()||'')
        .split('\n').map(s=>s.trim()).filter(Boolean);
      expect(lines.length, poem.id).toBe(poem.lines);
      expect(lines[0]).toBe(poem.opening);
      expect(lines.at(-1)).toBe(poem.closing);
      expect(lines.join('\n')).not.toContain('<...>');
      const source=card.getByRole('link',{name:'Источник текста'});
      await expect(source).toBeVisible();
      await expect(source).toHaveAttribute('rel','noopener noreferrer');
      expect(await source.getAttribute('href')).toContain(poem.source);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
    if(testInfo.project.name==='chromium-core'){
      mkdirSync('qa-artifacts',{recursive:true});
      for(const theme of ['dark','light']){
        await page.evaluate(light=>document.documentElement.classList.toggle('theme-light',light),theme==='light');
        await page.waitForTimeout(150);
        await page.locator('#poem-mandelstam-dano-mne-telo-fragment')
          .screenshot({path:`qa-artifacts/mandelstam-fulltext-${width}-${theme}.png`,animations:'disabled'});
      }
    }
  }
});
