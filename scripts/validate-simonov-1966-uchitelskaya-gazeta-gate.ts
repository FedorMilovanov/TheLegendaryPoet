import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_1966_UCHITELSKAYA_GAZETA_GATE_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov 1966 Uchitelskaya Gazeta gate missing: ${path}`);
const text = readFileSync(path, 'utf8');

for (const marker of [
  'exact tertiary citation recovered / direct newspaper or RKP entry not yet recovered',
  'Гаспарян В.',
  '`Отец артиллериста / о тайне майора Деева`',
  '`Учительская газета`',
  '15 февраля',
  'C — tertiary bibliographic lead',
  'Газетной летописи',
  'RKP entry ещё не recovery-closed',
  'не используется',
  'не доказывает',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov 1966 Uchitelskaya Gazeta boundary disappeared: ${marker}`);
}

for (const forbidden of [
  'Учительская газета 15.02.1966 direct scan verified',
  'В. Гаспарян первым установил прототипа Деева',
  'публикация была причиной письма Лоскутова',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov 1966 Uchitelskaya Gazeta gate overstates closure: ${forbidden}`);
}

console.log('Simonov 1966 Uchitelskaya Gazeta: exact tertiary citation pinned; direct issue/article and independent RKP record remain open.');
