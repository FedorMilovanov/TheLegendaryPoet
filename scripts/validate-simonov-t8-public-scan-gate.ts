import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_T8_PUBLIC_SCAN_GATE_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov T8 public scan gate missing: ${path}`);
const text = readFileSync(path, 'utf8');

for (const marker of [
  'exact public PDF/DjVu scan files located / relevant pages not yet visually inspected in current toolchain',
  'Т. 8. `Разные дни войны. Дневник писателя`',
  'С. **393, 430–433**',
  'Simonov_K.M.__Sobranie_sochineniy_v_10_tt._T.08.(1982).[djv].zip',
  '**13.8 MB**',
  'Simonov_K.M.__Sobranie_sochineniy_v_10_tt._T.08.(1982).[pdf].zip',
  '**10.4 MB**',
  'vmakhankov',
  'предоставил: Alexandr, 2018',
  '**479 с.**',
  'Иван Михайлович / Алексей Михайлович',
  'Cache miss',
  'DNS/network failure',
  'exact scan located / bytes not acquired / relevant pages uninspected',
  'не означает права перепубликовывать страницы как изображения',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov T8 scan boundary disappeared: ${marker}`);
}

for (const forbidden of [
  'с. 430–433 визуально проверены',
  'PDF SHA-256 verified',
  'scan freely licensed for republication',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov T8 scan gate overstates closure: ${forbidden}`);
}

console.log('Simonov T8 scan: exact public PDF/DjVu packages located; printed pp.393 and 430–433 remain byte/page-inspection pending.');
