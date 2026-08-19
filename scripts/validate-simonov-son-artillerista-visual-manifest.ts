import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_SON_ARTILLERISTA_VISUAL_ACQUISITION_MANIFEST_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov visual acquisition manifest missing: ${path}`);
const text = readFileSync(path, 'utf8');
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
  'p.4 продолжения поэмы не содержит',
  'F3 — наградной документ Лоскутова `10800112`',
  '13ba95ba05eaa87eb8a7f6eac7fe888e0f5710bd9dc91a50c5b83dd2b6e7a087',
  'owner visual approval pending; bytes are intentionally not in production yet',
  'не документальная фотография Ивана Лоскутова',
  'не смог напрямую получить `upload.wikimedia.org` bytes',
  'не выдумывает SHA-256 исходных файлов',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov visual-manifest boundary disappeared: ${marker}`);
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
if (!status.includes('no visual bytes vendored yet')) {
  throw new Error(`Simonov visual manifest falsely implies visual ingestion: ${status}`);
}

console.log('Simonov visual manifest: 3 context assets object-verified; Red Star №288 p.3 page-content direct-verified with SHPL route holder-confirmed; SHPL derivative pixels, reuse rights, documentary visuals and exact-byte ingestion remain fail-closed.');