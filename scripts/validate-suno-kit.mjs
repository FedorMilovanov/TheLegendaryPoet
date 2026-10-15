import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'suno/README.md',
  'suno/AGENT.md',
  'suno/CREATIVE_DIRECTION.md',
  'suno/STRESS_PROTOCOL.md',
  'suno/QUALITY_GATE.md',
  'suno/RESEARCH_2026-10-15.md',
  'suno/AUDIT_2026-10-15.md',
  'suno/REQUEST_TEMPLATE.md',
  'suno/examples/GOOD.md',
  'suno/examples/BAD.md',
];

const fail = (message) => {
  console.error(`SUNO kit validation failed: ${message}`);
  process.exitCode = 1;
};

const texts = new Map();
for (const relativePath of requiredFiles) {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`missing ${relativePath}`);
    continue;
  }

  const text = readFileSync(absolutePath, 'utf8');
  texts.set(relativePath, text);
  if ((text.match(/```/g) ?? []).length % 2 !== 0) {
    fail(`unclosed fenced block in ${relativePath}`);
  }

  for (const match of text.matchAll(/\[[^\]]+\]\((?!https?:\/\/)([^)#]+)(?:#[^)]+)?\)/g)) {
    const target = resolve(dirname(absolutePath), match[1]);
    if (!existsSync(target)) fail(`broken local link in ${relativePath}: ${match[1]}`);
  }
}

const expectText = (relativePath, needles) => {
  const text = texts.get(relativePath) ?? '';
  for (const needle of needles) {
    if (!text.includes(needle)) fail(`${relativePath} must contain ${JSON.stringify(needle)}`);
  }
};

expectText('suno/README.md', [
  '`npm run validate:suno` — это статическая проверка самого отдела',
  'не норма на каждый запрос',
]);
expectText('suno/AGENT.md', [
  'CREATIVE_DIRECTION.md',
  'STRESS_PROTOCOL.md',
  'останавливайся по смысловому насыщению, а не по квоте',
  'допустимы 2–6',
  'Никогда не размечай все многосложные слова',
  'лексико-грамматическое решение',
  'каждую добавленную `ё`',
  '`всё душевные способности`',
  'реестр **каждого** поставленного ударения',
  '`Variety = 0`',
  'single-lyric/section edit',
  'Не устраивай 50-ссылочный поиск без причины',
]);
expectText('suno/CREATIVE_DIRECTION.md', [
  'Свобода внутри твёрдых границ',
  'минимум две несовпадающие интерпретации',
  'Обычно достаточно **6–12 коротких концептуальных семян**',
  'Останавливайся не по числу, а после смыслового насыщения',
  'Это **не жанровые ячейки**',
  'Эмоциональный контрапункт',
  'Грустный стих можно сделать светлым, танцевальным, почти праздничным',
  'Не переопределять всё',
  'Мог бы этот Style без изменений подойти ещё к ста случайным стихотворениям?',
]);
expectText('suno/STRESS_PROTOCOL.md', [
  'нулевая разметка, пока не доказана необходимость',
  'Правило двух подтверждений',
  'Рифма и метр сами по себе',
  'каждая предлагаемая замена `е → ё`',
  'финальный семантический diff',
  '`все способности` нельзя превращать во `всё способности`',
  'каждого поставленного знака',
]);
expectText('suno/QUALITY_GATE.md', [
  'Каждая замена `е → ё` проверена как лексико-грамматическое решение',
  'построчный diff с каноническим мастером',
  'Проверены смыслоразличительные формы `все/всё`',
  'Каждое поставленное ударение проверено',
  'Авторское/историческое ударение',
  'минимум две несовпадающие интерпретации',
  'Ни один Style не подошёл бы без изменений к сотне случайных стихотворений',
  'если выбран весёлый Style для грустного текста',
  'не превращён в обязательный пробег для каждого стиха',
  'Remaster не предлагается для изменения Lyrics',
]);
expectText('suno/AUDIT_2026-10-15.md', [
  'повторный полный проход выполнен',
  'Матрица «правило → доказательства»',
  '**A: 30**',
  '**B: 29**',
  '**C: 5**',
  'остановка происходит по **смысловому насыщению**',
  '64 источника дают проверяемую основу',
]);
expectText('suno/examples/GOOD.md', ['| Форма в Lyrics | Значение | Статус | Проверка | Почему знак нужен |']);
expectText('suno/examples/BAD.md', [
  '## 14. Форумный workaround выдан за норму',
  '## 15. `ё` восстановлена механически и изменила смысл',
  'Ты, все душевные способности губя',
  'Ты, всё душевные способности губя',
  '## 16. Каждый стих получает одну и ту же сетку вариантов',
]);

const agents = readFileSync(resolve(root, 'AGENTS.md'), 'utf8');
if (
  !agents.includes('suno/CREATIVE_DIRECTION.md') ||
  !agents.includes('suno/STRESS_PROTOCOL.md') ||
  !agents.includes('suno/RESEARCH_2026-10-15.md')
) {
  fail('AGENTS.md must route Suno work through creative direction, stress and evidence protocols');
}

const research = texts.get('suno/RESEARCH_2026-10-15.md') ?? '';
const references = research
  .split('\n')
  .map((line) => line.match(/^(\d+)\. \*\*\[([ABC])\] \[[^\]]+\]\((https:\/\/[^)]+)\)\*\*/))
  .filter(Boolean)
  .map((match) => ({ number: Number(match[1]), grade: match[2], url: match[3] }));

references.forEach((reference, index) => {
  if (reference.number !== index + 1) {
    fail(`research reference numbering must be continuous: expected ${index + 1}, found ${reference.number}`);
  }
});

const urls = references.map(({ url }) => url);
const uniqueUrls = new Set(urls);
if (uniqueUrls.size !== urls.length) fail(`research contains ${urls.length - uniqueUrls.size} duplicate URL(s)`);
if (uniqueUrls.size < 50) fail(`research must retain at least 50 unique links; found ${uniqueUrls.size}`);

const declaredCountMatch = research.match(/Всего ниже: \*\*(\d+) ссылки\*\*/);
const declaredCount = Number(declaredCountMatch?.[1]);
if (declaredCount !== references.length) {
  fail(`research declares ${declaredCount || 'no'} links but contains ${references.length} numbered references`);
}

const gradeCounts = references.reduce((counts, { grade }) => {
  counts[grade] += 1;
  return counts;
}, { A: 0, B: 0, C: 0 });
if (gradeCounts.A !== 30 || gradeCounts.B !== 29 || gradeCounts.C !== 5) {
  fail(`research evidence census drifted: ${JSON.stringify(gradeCounts)}; expected A=30, B=29, C=5`);
}

const officialHosts = new Set(['suno.com', 'help.suno.com', 'gramota.ru']);
for (const { number, grade, url } of references) {
  const host = new URL(url).hostname;
  if (grade === 'A' && !officialHosts.has(host)) {
    fail(`A-grade reference ${number} uses non-primary host ${host}`);
  }
}

const countHost = (fragment) => [...uniqueUrls].filter((url) => url.includes(fragment)).length;
if (countHost('suno.com') < 15) fail('research must retain at least 15 official Suno links');
if (countHost('reddit.com') < 15) fail('research must retain at least 15 forum threads');
if (countHost('gramota.ru') < 5) fail('research must retain at least 5 authoritative Russian dictionary links');

if (process.exitCode) process.exit(process.exitCode);
console.log(
  `SUNO kit: OK (${requiredFiles.length} files, ${uniqueUrls.size} unique research links; ` +
  `evidence A/B/C=${gradeCounts.A}/${gradeCounts.B}/${gradeCounts.C})`,
);
