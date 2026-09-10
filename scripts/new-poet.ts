/**
 * Scaffold an explicit, unreleasable poet draft.
 *
 * Usage:
 *   npx tsx scripts/new-poet.ts "Имя Отчество Фамилия" --id ascii-kebab-id --portrait /images/file.jpg
 *
 * The command never edits the canonical registry. It writes
 * `src/data/library/<camel>.draft.ts`; only `register-poet.ts` may promote a
 * completed draft into the published module set after the release contract,
 * portrait bytes and item-level provenance all pass.
 */
import fs from 'node:fs';
import path from 'node:path';
import { poets } from '../src/data/library/index';
import {
  assertPoetId,
  isValidPortraitPath,
  moduleStemFromPoetId,
} from './poet-authoring-contract';

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (!args.length || args[0] === '--help' || args[0] === '-h') {
  console.log('Usage: npx tsx scripts/new-poet.ts "<Full Name>" --id <ascii-kebab-id> --portrait </images/file.jpg>');
  process.exit(0);
}

const fullName = args[0]?.trim();
const id = option(args, '--id');
const portrait = option(args, '--portrait');
if (!fullName || fullName.startsWith('--')) fail('quoted full name must be the first argument');
if (fullName.split(/\s+/).length < 2) fail('full name must contain at least given name and surname');
if (!id) fail('explicit --id is required; surname-only implicit ids are forbidden');
if (!portrait) fail('explicit --portrait path is required; the scaffold does not invent an image path');

try {
  assertPoetId(id);
} catch (error) {
  fail((error as Error).message);
}
if (!isValidPortraitPath(portrait)) {
  fail(`portrait must be a lowercase public /images path without traversal: ${JSON.stringify(portrait)}`);
}
if (poets.some((poet) => poet.id === id)) fail(`canonical poet id already exists: ${id}`);

const stem = moduleStemFromPoetId(id);
const libraryDir = path.resolve('src/data/library');
const draftPath = path.join(libraryDir, `${stem}.draft.ts`);
const finalPath = path.join(libraryDir, `${stem}.ts`);
if (fs.existsSync(draftPath) || fs.existsSync(finalPath)) {
  fail(`refusing to overwrite existing authoring module for ${id}`);
}

const nameParts = fullName.split(/\s+/);
const shortName = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
const template = `import type { Poet } from '../../types/poet';

// DRAFT ONLY. This file is not part of the canonical poets[] registry.
// Complete the content and item-level portrait provenance, then use register-poet.ts.
export const ${stem}: Poet = {
  id: '${id}',
  name: '${shortName}',
  fullName: '${fullName}',
  birthYear: 0, // TODO: YYYY (verify)
  deathYear: 0, // TODO: YYYY (undefined if living)
  nationality: 'Русский',
  photo: '${portrait}', // release requires existing bytes + acceptable public/images/PROVENANCE.yml record
  shortBio: ` + '`TODO: 1–2 предложения, ~280–360 знаков. Конкретный портрет, не рекламный лозунг.`' + `,
  fullBio: ` + '`TODO: 5–9 абзацев (\\n\\n между ними). Жизнь по этапам, с датами.`' + `,
  rating: 9.5, // 0–10
  tags: ['TODO-эпоха', 'TODO-течение', 'TODO-тема'],
  poems: [
    {
      id: '${id}-1',
      title: 'TODO Название',
      year: 0, // TODO
      text: ` + '`TODO: канонический текст, сверен по >=2 источникам (>=1 A+)`' + `,
      analysis: 'TODO: краткий литературный разбор',
      rating: 9.5,
    },
    {
      id: '${id}-2',
      title: 'TODO Второе название',
      year: 0, // TODO
      text: ` + '`TODO: второй проверенный канонический текст`' + `,
      analysis: 'TODO: краткий литературный разбор',
      rating: 9.5,
    },
  ],
  historicalNote: 'TODO: 2–4 предложения об эпохе',
  spiritualSearch: 'TODO: духовный путь и мировоззрение — аналитически, без подмены источников',
  moralPortrait: ` + '`TODO: документированный нравственный портрет; release-authority требует непустое поле.`' + `,
  authorCommentary: 'TODO: короткая итоговая ремарка; release-authority требует непустое поле.',
  testimonies: [
    // цель 5–9: contemporary + historian; у каждой записи проверяемый source
  ],
  famousWorks: ['TODO 1', 'TODO 2', 'TODO 3', 'TODO 4', 'TODO 5'],
};
`;

fs.writeFileSync(draftPath, template, { encoding: 'utf8', flag: 'wx' });
console.log(`✓ Created unreleasable draft ${path.relative(process.cwd(), draftPath)}`);
console.log('✓ Canonical src/data/library/index.ts was not changed.');
console.log(`\nBefore release, add/verify ${portrait} and its item-level record in public/images/PROVENANCE.yml.`);
console.log(`Then run: npx tsx scripts/register-poet.ts --id ${id} --after <existing-poet-id>`);
console.log('Registration fails closed until identity, content, portrait bytes, provenance and registry placement all pass.');
