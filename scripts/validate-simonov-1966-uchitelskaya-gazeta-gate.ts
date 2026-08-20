import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_1966_UCHITELSKAYA_GAZETA_GATE_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov 1966 Uchitelskaya Gazeta gate missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'exact tertiary citation + official 1966 newspaper corpus/access route recovered / exact 15.02 issue and article page pending',
  'Гаспарян В.', '`Отец артиллериста / о тайне майора Деева`', '`Учительская газета`', '15 февраля',
  'C — tertiary bibliographic lead', 'Российской национальной библиотеки', '1957–1987',
  'центрах удалённого доступа Президентской библиотеки', '1966, № 36 (5553) (24 марта)',
  'https://www.prlib.ru/item/1986967', 'источник электронной копии: Президентская библиотека',
  'место хранения оригинала: Издательский дом `Учительская газета`', 'номер выпуска не вычисляется',
  'Газетной летописи', 'RKP entry ещё не recovery-closed', 'Приоритетный маршрут теперь известен',
  'не использует', 'не доказывает',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov 1966 Uchitelskaya Gazeta boundary disappeared: ${marker}`);
}
if (/direct scan verified|exact 15\.02.*(?:verified|inspected)|article page verified|causal link verified/iu.test(status)) {
  throw new Error(`Simonov 1966 Uchitelskaya Gazeta status falsely closes an open gate: ${status}`);
}

console.log('Simonov 1966 Uchitelskaya Gazeta: tertiary article citation remains unverified, but official Presidential Library 1966 corpus and restricted access route are pinned; exact 15.02 item/page remains open.');