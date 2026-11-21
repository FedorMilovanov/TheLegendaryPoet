import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const works = [
  { id:'simonov-zhdi-menya-short-excerpt', title:'Жди меня', source:'godliteratury.ru', opening:'Жди меня, и я вернусь.',closing:'Желтые дожди,' },
  { id:'simonov-ty-pomnish-alesha-short-excerpt',title:'Ты помнишь, Алёша', source:'www.nkj.ru', opening:'Ты помнишь, Алёша, дороги Смоленщины,',closing:'Прижав, как детей, от дождя их к груди.' }
];
test('Симонов: два честных четырёхстрочных отрывка и архивные ссылки', async ({page},testInfo)=>{
 const widths=testInfo.project.name==='chromium-core'?[320,390,1440]:[390];
 for(const width of widths){
   await page.setViewportSize({width,height:900});
   await page.goto(`${BASE_URL}/poets/konstantin-simonov`,{waitUntil:'domcontentloaded'});
   await expect(page.getByRole('navigation',{name:'Навигация по лирике'})).toBeVisible();
   for(const poem of works){
     const card=page.locator(`#poem-${poem.id}`);
     await expect(card).toBeVisible();
     const heading=card.locator('h3').first();
     await expect(heading).toContainText(poem.title);
     await expect(heading).toContainText('цитата');
     const text=(await card.locator('[data-poem-canonical]').textContent()||'');
     const lines=text.split('\n').map(x=>x.trim()).filter(Boolean);
     expect(lines.length,poem.id).toBe(4);
     expect(lines[0]).toBe(poem.opening);
     expect(lines.at(-1)).toBe(poem.closing);
     expect(text).not.toContain('<...>');
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
       await page.locator('#poem-simonov-ty-pomnish-alesha-short-excerpt')
         .screenshot({path:`qa-artifacts/simonov-rights-${width}-${theme}.png`,animations:'disabled'});
     }
   }
 }
});
