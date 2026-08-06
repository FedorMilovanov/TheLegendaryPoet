import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Poet } from '../src/types/poet';
import { poets } from '../src/data/library/index';
import { fyodorTyutchev } from '../src/data/library/fyodorTyutchev';
import { vladimirMayakovsky } from '../src/data/library/vladimirMayakovsky';
import { alexanderPushkin } from '../src/data/library/alexanderPushkin';
import { mikhailLermontov } from '../src/data/library/mikhailLermontov';
import { borisPasternak } from '../src/data/library/borisPasternak';
import { afanasyFet } from '../src/data/library/afanasyFet';
import { nikolayGumilev } from '../src/data/library/nikolayGumilev';
import { sergeiYesenin } from '../src/data/library/sergeiYesenin';
import { annaAkhmatova } from '../src/data/library/annaAkhmatova';
import { alexanderBlok } from '../src/data/library/alexanderBlok';

const failures: string[] = [];
const fail = (message: string) => failures.push(message);

const canonicalPoets: ReadonlyArray<readonly [Poet, string]> = [
  [fyodorTyutchev, 'fyodorTyutchev.ts'],
  [vladimirMayakovsky, 'vladimirMayakovsky.ts'],
  [alexanderPushkin, 'alexanderPushkin.ts'],
  [mikhailLermontov, 'mikhailLermontov.ts'],
  [borisPasternak, 'borisPasternak.ts'],
  [afanasyFet, 'afanasyFet.ts'],
  [nikolayGumilev, 'nikolayGumilev.ts'],
  [sergeiYesenin, 'sergeiYesenin.ts'],
  [annaAkhmatova, 'annaAkhmatova.ts'],
  [alexanderBlok, 'alexanderBlok.ts'],
];

const forbiddenServiceVoice = [
  'честный портрет',
  'честному читателю',
  'редактору достаточно',
  'не даёт редактору права',
  'не дает редактору права',
  'не нуждается в приукрашивании',
  'не приукрашиваем',
  'не умаляем',
] as const;

const overrideUrl = new URL('../src/data/library/editorialPortraitOverrides.ts', import.meta.url);
if (existsSync(overrideUrl)) {
  fail('shared editorialPortraitOverrides.ts must not exist; each poet file owns its publication prose');
}

const indexUrl = new URL('../src/data/library/index.ts', import.meta.url);
const indexSource = readFileSync(indexUrl, 'utf8');
for (const forbiddenIndexMechanism of [
  'editorialPortraitOverrides',
  'sourcePoets.map',
  'Object.assign(poet',
]) {
  if (indexSource.includes(forbiddenIndexMechanism)) {
    fail(`library/index.ts contains hidden poet rewriting: ${forbiddenIndexMechanism}`);
  }
}

if (poets.length !== canonicalPoets.length) {
  fail(`published poet count must equal canonical source count: ${poets.length}/${canonicalPoets.length}`);
}

for (const [poet, filename] of canonicalPoets) {
  const published = poets.find((candidate) => candidate.id === poet.id);
  if (!published) {
    fail(`${poet.id}: canonical poet is missing from the published catalog`);
  } else if (published !== poet) {
    fail(`${poet.id}: published catalog must expose the canonical object directly, without an override clone`);
  }

  const sourceUrl = new URL(`../src/data/library/${filename}`, import.meta.url);
  const source = readFileSync(sourceUrl, 'utf8');
  const moralCount = source.match(/^  moralPortrait:/gm)?.length ?? 0;
  const conclusionCount = source.match(/^  authorCommentary:/gm)?.length ?? 0;
  if (moralCount !== 1 || conclusionCount !== 1) {
    fail(`${poet.id}: ${filename} must contain exactly one moralPortrait and authorCommentary; found ${moralCount}/${conclusionCount}`);
  }

  if (!poet.moralPortrait?.trim() || !poet.authorCommentary?.trim()) {
    fail(`${poet.id}: canonical moral portrait and conclusion must both be non-empty`);
  }

  const editorialText = [
    poet.shortBio,
    poet.fullBio,
    poet.historicalNote ?? '',
    poet.spiritualSearch ?? '',
    poet.moralPortrait ?? '',
    poet.authorCommentary ?? '',
  ].join('\n').toLocaleLowerCase('ru');

  for (const marker of forbiddenServiceVoice) {
    if (editorialText.includes(marker)) {
      fail(`${poet.id}: service/editorial scaffolding remains in ${filename}: “${marker}”`);
    }
  }
}

const directSourcePaths = canonicalPoets.map(([, filename]) => fileURLToPath(new URL(`../src/data/library/${filename}`, import.meta.url)));
if (new Set(directSourcePaths).size !== directSourcePaths.length) {
  fail('canonical poet source paths must be unique');
}

if (failures.length > 0) {
  throw new Error(`Poet authority validation failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

console.log(`Poet authority validation passed: ${canonicalPoets.length} canonical files publish directly with no hidden editorial override or service voice.`);
