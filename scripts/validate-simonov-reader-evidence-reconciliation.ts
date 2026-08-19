import { readFileSync } from 'node:fs';

const path = 'src/data/essays/simonovSonArtilleristaDraft.ts';
const text = readFileSync(path, 'utf8');

for (const required of [
  'на полуострове Среднем',
  'авторская ретроспектива Симонова прямо связывает рассказ Рыклиса и место действия истории с полуостровом Средним',
  'точный locator наградного объекта `10800112`',
  'сам архивный лист редакцией ещё не просмотрен',
  '№ 288 (5043)',
  'Exact PDF этого выпуска редакция получила и визуально сверила',
  'занимает шесть газетных колонок',
  'на следующей странице продолжения нет',
  'независимо указывает ту же страницу 3',
  'exact выпуск № 288 и его p.3 уже визуально проверены',
  'institutional provenance и прав на повторное использование facsimile',
  'Жанровая маркировка произведения менялась в издательской истории',
  'издания Детской литературы 1978 года уже называет «Сына артиллериста» «Балладой»',
  'для ранней истории текста документировано имя «фронтовая поэма»',
  'в поздней советской издательской традиции закрепляется и жанровая классификация «баллада»',
  "id: 'loskutov-award-locator'",
  "id: 'red-star-direct-288'",
  '9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229',
  "id: 'red-star-page3-kolobov'",
  "id: 'rsl-1978-ballad'",
  "dateModified: '2026-08-19'",
]) {
  if (!text.includes(required)) throw new Error(`Simonov reader evidence reconciliation drifted: ${required}`);
}

for (const forbidden of [
  'на Рыбачьем полуострове её рассказал',
  '31 июля 1941 года. Точного дня',
  'колонки, точные границы текста и возможное продолжение будут считаться установленными только после direct scan inspection № 288',
  'страница 3 уже сильно подтверждена серьёзной библиографией, но',
  'самая первая публикация была 3 декабря',
  'поздней школьной формулой',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov reader revived stale/overstated wording: ${forbidden}`);
}

console.log('Simonov reader evidence reconciliation: Sredny geography and award boundary remain pinned; Red Star №288 p.3 direct facsimile evidence is cited explicitly; first-publication and facsimile-rights gates remain open.');