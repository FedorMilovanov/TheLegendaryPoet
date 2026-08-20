import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const acquisitionPath = 'docs/research/SIMONOV_SON_ARTILLERISTA_VISUAL_ACQUISITION_MANIFEST_2026-08.md';
const approvalPath = 'docs/research/SIMONOV_SON_ARTILLERISTA_HERO_APPROVAL_2026-08.md';
const heroPath = 'public/images/essays/simonov/simonov-son-artillerista-hero.webp';

if (!existsSync(acquisitionPath)) throw new Error(`Simonov visual acquisition manifest missing: ${acquisitionPath}`);
if (!existsSync(approvalPath)) throw new Error(`Simonov hero approval record missing: ${approvalPath}`);
if (!existsSync(heroPath)) throw new Error(`Simonov approved production hero missing: ${heroPath}`);

const text = readFileSync(acquisitionPath, 'utf8');
const approval = readFileSync(approvalPath, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'three contextual assets object-verified / Red Star p.3 facsimile page-content direct-verified / documentary Loskutov-Ryklis-Simonov 1941 assets still rights-pending / no visual bytes vendored yet',
  'На хребте муста-тунтури 3.jpg',
  '960 × 640 px; 333 KB',
  'Meellaira Ahr',
  '27 August 2013',
  '**CC BY-SA 4.0**',
  'Petsamo 02.jpg',
  '550 × 390 px; 145 KB',
  'October 1944',
  '**CC BY 4.0**',
  'Mil.ru',
  'Ilya Vlasenko Konstantin Simonov near Ponyri. Battle of Kursk. 1943.jpg',
  '3378 × 2245 px; 5.19 MB',
  '**Public Domain**',
  'семейный архив Власенко',
  'D1 — Иван Алексеевич Лоскутов, 1941',
  'D2 — Ефим Самсонович Рыклис, 1941',
  'D3 — Симонов на Севере, 1941',
  'F1 — `Красная звезда`, №288 (5043), 07.12.1941',
  'page-content DIRECT VERIFIED by exact №288 PDF',
  'SHPL exact node 37037 + p.3 inspect route holder-confirmed',
  'SHPL derivative pixels not independently rendered',
  'facsimile reuse rights separate',
  '6 506 121',
  '9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229',
  '**шесть газетных колонок**',
  'Following printed p.4 просмотрена и продолжения поэмы не содержит.',
  'F3 — наградной документ Лоскутова `10800112`',
  'не документальная фотография Ивана Лоскутова',
  'не смог напрямую получить `upload.wikimedia.org` bytes',
  'не выдумывает SHA-256 исходных файлов',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov visual-manifest boundary disappeared: ${marker}`);
}

for (const marker of [
  'OWNER APPROVED / exact production bytes present / reconstruction disclosure mandatory',
  '1600 × 900 px',
  '130 386 bytes',
  '5aa9024cab522b4a6b4686231ba09b91dcc66969b85ba8f5f6dcecce67e16dd5',
  '32eec59d4d0701d0b93e71dda3555f5daed81cd9',
  '74615efa6974c057f4b5d44e0119ef4b59dd6702',
  'редакционная художественная реконструкция',
  'не документальная фотография Ивана Лоскутова',
  'No generative or stylistic transformation was used for the committed production asset.',
  '13ba95ba05eaa87eb8a7f6eac7fe888e0f5710bd9dc91a50c5b83dd2b6e7a087',
  'superseded',
  'original multi-megabyte PNG and intermediate compression variants are **not** committed',
]) {
  if (!approval.includes(marker)) throw new Error(`Simonov hero-approval boundary disappeared: ${marker}`);
}

for (const forbidden of [
  'Petsamo 02.jpg — бой Лоскутова 1941',
  'Поныри, 1943 — северная поездка Симонова 1941',
  'Муста-Тунтури 2013 — точное место наблюдательного пункта Лоскутова',
  'архивные фотографии ГОКУ ГАМО свободны для использования',
  'source SHA-256 verified',
  'SHPL derivative pixels visually verified by current toolchain',
  'facsimile reuse rights cleared',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov visual manifest overstates provenance, rights or context: ${forbidden}`);
}

if (!status.includes('Red Star p.3 facsimile page-content direct-verified')) {
  throw new Error(`Simonov visual manifest lost Red Star page-content closure: ${status}`);
}

const heroBytes = readFileSync(heroPath);
const actualSha = createHash('sha256').update(heroBytes).digest('hex');
const expectedSha = '5aa9024cab522b4a6b4686231ba09b91dcc66969b85ba8f5f6dcecce67e16dd5';
if (actualSha !== expectedSha) throw new Error(`Simonov approved hero SHA drift: ${actualSha}`);
if (heroBytes.length !== 130386) throw new Error(`Simonov approved hero byte-size drift: ${heroBytes.length}`);

console.log('Simonov visual gate: acquisition evidence remains fail-closed; exact owner-approved 1600×900 production reconstruction is present at 130,386 bytes with the pinned SHA-256 and mandatory non-documentary disclosure.');
