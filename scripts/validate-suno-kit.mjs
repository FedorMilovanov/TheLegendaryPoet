import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'suno/README.md',
  'suno/AGENT.md',
  'suno/STRESS_PROTOCOL.md',
  'suno/QUALITY_GATE.md',
  'suno/RESEARCH_2026-10-15.md',
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

expectText('AGENTS.md', []);
expectText('suno/AGENT.md', [
  'STRESS_PROTOCOL.md',
  'Никогда не размечай все многосложные слова',
  'реестр **каждого** поставленного ударения',
  '`Variety = 0`',
  'single-lyric/section edit',
]);
expectText('suno/STRESS_PROTOCOL.md', [
  'нулевая разметка, пока не доказана необходимость',
  'Правило двух подтверждений',
  'Рифма и метр сами по себе',
  'каждого поставленного знака',
]);
expectText('suno/QUALITY_GATE.md', [
  'Каждое поставленное ударение проверено',
  'Авторское/историческое ударение',
  'Remaster не предлагается для изменения Lyrics',
]);
expectText('suno/examples/GOOD.md', ['| Форма в Lyrics | Значение | Статус | Проверка | Почему знак нужен |']);
expectText('suno/examples/BAD.md', ['## 14. Форумный workaround выдан за норму']);

const agents = readFileSync(resolve(root, 'AGENTS.md'), 'utf8');
if (!agents.includes('suno/STRESS_PROTOCOL.md') || !agents.includes('suno/RESEARCH_2026-10-15.md')) {
  fail('AGENTS.md must route Suno work through the stress protocol and evidence review');
}

const research = texts.get('suno/RESEARCH_2026-10-15.md') ?? '';
const urls = [...research.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((match) => match[1]);
const uniqueUrls = new Set(urls);
if (uniqueUrls.size < 50) fail(`research must retain at least 50 unique links; found ${uniqueUrls.size}`);

const countHost = (fragment) => [...uniqueUrls].filter((url) => url.includes(fragment)).length;
if (countHost('suno.com') < 15) fail('research must retain at least 15 official Suno links');
if (countHost('reddit.com') < 15) fail('research must retain at least 15 forum threads');
if (countHost('gramota.ru') < 5) fail('research must retain at least 5 authoritative Russian dictionary links');

if (process.exitCode) process.exit(process.exitCode);
console.log(`SUNO kit: OK (${requiredFiles.length} files, ${uniqueUrls.size} unique research links)`);
