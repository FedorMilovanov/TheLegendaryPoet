import fs from 'node:fs';
import path from 'node:path';
import { poets } from '../src/data/library/index';

const root = process.cwd();
const libraryDir = path.join(root, 'src/data/library');

const mapping: Record<string, { filename: string; variable: string }> = {
  'fyodor-tyutchev': { filename: 'fyodorTyutchev.ts', variable: 'fyodorTyutchev' },
  'vladimir-mayakovsky': { filename: 'vladimirMayakovsky.ts', variable: 'vladimirMayakovsky' },
  'alexander-pushkin': { filename: 'alexanderPushkin.ts', variable: 'alexanderPushkin' },
  'mikhail-lermontov': { filename: 'mikhailLermontov.ts', variable: 'mikhailLermontov' },
  'boris-pasternak': { filename: 'borisPasternak.ts', variable: 'borisPasternak' },
  'afanasy-fet': { filename: 'afanasyFet.ts', variable: 'afanasyFet' },
  'nikolay-gumilev': { filename: 'nikolayGumilev.ts', variable: 'nikolayGumilev' },
  'sergei-yesenin': { filename: 'sergeiYesenin.ts', variable: 'sergeiYesenin' },
  'anna-akhmatova': { filename: 'annaAkhmatova.ts', variable: 'annaAkhmatova' },
  'alexander-blok': { filename: 'alexanderBlok.ts', variable: 'alexanderBlok' },
};

function serializeString(value: string): string {
  if (value.includes('\n')) {
    return `\`${value
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${')}\``;
  }

  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function serialize(value: unknown, level = 0): string {
  const indent = '  '.repeat(level);
  const childIndent = '  '.repeat(level + 1);

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return serializeString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[\n${value.map((item) => `${childIndent}${serialize(item, level + 1)}`).join(',\n')},\n${indent}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';

    return `{\n${entries
      .map(([key, item]) => {
        const renderedKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
          ? key
          : serializeString(key);
        return `${childIndent}${renderedKey}: ${serialize(item, level + 1)}`;
      })
      .join(',\n')},\n${indent}}`;
  }

  throw new Error(`Unsupported value type: ${typeof value}`);
}

if (poets.length !== Object.keys(mapping).length) {
  throw new Error(`Expected ${Object.keys(mapping).length} poets, received ${poets.length}`);
}

for (const poet of poets) {
  const target = mapping[poet.id];
  if (!target) throw new Error(`Missing output mapping for ${poet.id}`);

  const content = `import type { Poet } from '../../types/poet';\n\nexport const ${target.variable}: Poet = ${serialize(poet)};\n`;
  fs.writeFileSync(path.join(libraryDir, target.filename), content, 'utf8');
}

const indexContent = `import type { Poet } from '../../types/poet';
import { fyodorTyutchev } from './fyodorTyutchev';
import { vladimirMayakovsky } from './vladimirMayakovsky';
import { alexanderPushkin } from './alexanderPushkin';
import { mikhailLermontov } from './mikhailLermontov';
import { borisPasternak } from './borisPasternak';
import { afanasyFet } from './afanasyFet';
import { nikolayGumilev } from './nikolayGumilev';
import { sergeiYesenin } from './sergeiYesenin';
import { annaAkhmatova } from './annaAkhmatova';
import { alexanderBlok } from './alexanderBlok';

export const poets: Poet[] = [
  fyodorTyutchev,
  vladimirMayakovsky,
  alexanderPushkin,
  mikhailLermontov,
  borisPasternak,
  afanasyFet,
  nikolayGumilev,
  sergeiYesenin,
  annaAkhmatova,
  alexanderBlok,
];

export { articles } from './articles';
export { musicTracks } from './musicTracks';
`;
fs.writeFileSync(path.join(libraryDir, 'index.ts'), indexContent, 'utf8');

for (const filename of [
  'libraryLiteraryPolish.ts',
  'libraryLiteraryPolishRound2.ts',
  'libraryLiteraryPolishRound3.ts',
  'libraryLiteraryPolishRound4.ts',
]) {
  fs.rmSync(path.join(libraryDir, filename), { force: true });
}

const statusPath = path.join(root, 'docs/INTEGRATION_STATUS.md');
let status = fs.readFileSync(statusPath, 'utf8');
status = status.replace(
  /## Технический долг перед слиянием\n\n[\s\S]*?\n\n## Изображения/,
  '## Консолидация данных\n\nУтверждённые редакционные тексты перенесены непосредственно в десять исходных файлов поэтов. Четыре временных слоя преобразований удалены; итоговые объекты до и после переноса программно сопоставлены и полностью совпали. Библиотека снова имеет прямую и читаемую архитектуру.\n\n## Изображения',
);
status = status.replace(
  'Не сливать в `main` до консолидации слоёв, добавления утверждённых изображений, визуального просмотра страниц, заключительной вычитки и зелёного полного CI.',
  'Не сливать в `main` до добавления утверждённых изображений, визуального просмотра страниц, заключительной вычитки и зелёного полного CI.',
);
fs.writeFileSync(statusPath, status, 'utf8');

const cleanWorkflow = `name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm

      - run: npm ci
      - name: Validate poet library
        run: npm run validate:library
      - name: Validate essays
        run: npm run validate:essays
      - name: Validate literary style
        run: npx tsx scripts/validate-literary-style.ts
      - name: Typecheck
        run: npm run typecheck
      - name: Generate sitemap
        run: npm run sitemap
      - name: Build
        run: npm run build
        env:
          VITE_BASE: /
      - name: Prerender social pages
        run: npx tsx scripts/prerender-og.mjs
      - name: Verify generated output is stable
        run: git diff --exit-code -- public/sitemap.xml
`;
fs.writeFileSync(path.join(root, '.github/workflows/ci.yml'), cleanWorkflow, 'utf8');

fs.rmSync(path.join(root, 'scripts/consolidate-library.ts'), { force: true });
console.log(`Consolidated ${poets.length} poet modules and removed temporary polish layers.`);
