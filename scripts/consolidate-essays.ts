import fs from 'node:fs';
import path from 'node:path';
import { essays } from '../src/data/essays/index';

const root = process.cwd();
const essaysDir = path.join(root, 'src/data/essays');

const mapping: Record<string, { filename: string; variable: string }> = {
  'yesenin-kutezhi': { filename: 'yeseninKutezhi.ts', variable: 'yeseninKutezhi' },
  'mayakovsky-gromovoy': { filename: 'mayakovskyGromovoy.ts', variable: 'mayakovskyGromovoy' },
  'brik-case': { filename: 'brikCase.ts', variable: 'brikCase' },
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

if (essays.length !== Object.keys(mapping).length) {
  throw new Error(`Expected ${Object.keys(mapping).length} essays, received ${essays.length}`);
}

for (const essay of essays) {
  const target = mapping[essay.slug];
  if (!target) throw new Error(`Missing output mapping for ${essay.slug}`);

  const content = `import type { Essay } from '../../types/essay';\n\nexport const ${target.variable}: Essay = ${serialize(essay)};\n`;
  fs.writeFileSync(path.join(essaysDir, target.filename), content, 'utf8');
}

const indexContent = `import type { Essay } from '../../types/essay';
import { yeseninKutezhi } from './yeseninKutezhi';
import { mayakovskyGromovoy } from './mayakovskyGromovoy';
import { brikCase } from './brikCase';

export const essays: Essay[] = [yeseninKutezhi, mayakovskyGromovoy, brikCase];

export function getAllEssays(): Essay[] {
  return essays;
}

export function getEssayBySlug(slug: string): Essay | undefined {
  return essays.find((essay) => essay.slug === slug);
}
`;
fs.writeFileSync(path.join(essaysDir, 'index.ts'), indexContent, 'utf8');

for (const filename of [
  'editorialReview.ts',
  'sourceDeepening.ts',
  'sourceVerificationRound2.ts',
  'sourceVerificationRound3.ts',
  'sourceVerificationRound4.ts',
  'sourceVerificationRound5.ts',
  'sourceVerificationRound6.ts',
  'sourceVerificationRound7.ts',
]) {
  fs.rmSync(path.join(essaysDir, filename), { force: true });
}

const statusPath = path.join(root, 'docs/INTEGRATION_STATUS.md');
let status = fs.readFileSync(statusPath, 'utf8');
status = status.replace(
  'Утверждённые редакционные тексты перенесены непосредственно в десять исходных файлов поэтов. Четыре временных слоя преобразований удалены; итоговые объекты до и после переноса программно сопоставлены и полностью совпали. Библиотека снова имеет прямую и читаемую архитектуру.',
  'Утверждённые редакционные тексты перенесены непосредственно в десять исходных файлов поэтов и три исходных файла больших эссе. Четыре библиотечных и восемь эссеистических слоёв преобразований удалены; итоговые объекты до и после каждого переноса программно сопоставлены и полностью совпали. Данные снова имеют прямую и читаемую архитектуру.',
);
fs.writeFileSync(statusPath, status, 'utf8');

console.log(`Consolidated ${essays.length} essay modules and removed temporary editorial layers.`);
