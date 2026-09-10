import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Poet } from '../src/types/poet';
import { poets } from '../src/data/library/index';
import {
  runPoetAuthoringAdversarialFixtures,
  validatePoetRegistrySource,
  validatePoetReleaseCandidate,
} from './poet-authoring-contract';

const failures: string[] = [];
const fail = (message: string) => failures.push(message);
const root = process.cwd();
const libraryDir = path.join(root, 'src', 'data', 'library');
const indexPath = path.join(libraryDir, 'index.ts');
const provenancePath = path.join(root, 'public', 'images', 'PROVENANCE.yml');

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

const overridePath = path.join(libraryDir, 'editorialPortraitOverrides.ts');
if (fs.existsSync(overridePath)) {
  fail('shared editorialPortraitOverrides.ts must not exist; each poet file owns its publication prose');
}
if (!fs.existsSync(indexPath)) fail('src/data/library/index.ts is missing');
if (!fs.existsSync(provenancePath)) fail('public/images/PROVENANCE.yml is missing');

const indexSource = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
for (const forbiddenIndexMechanism of [
  'editorialPortraitOverrides',
  'sourcePoets.map',
  'Object.assign(poet',
]) {
  if (indexSource.includes(forbiddenIndexMechanism)) {
    fail(`library/index.ts contains hidden poet rewriting: ${forbiddenIndexMechanism}`);
  }
}

const moduleFiles = fs.existsSync(libraryDir) ? fs.readdirSync(libraryDir) : [];
const registry = validatePoetRegistrySource(indexSource, moduleFiles);
for (const error of registry.errors) fail(`authoring registry: ${error}`);
if (poets.length !== registry.entries.length) {
  fail(`published poet runtime count must equal canonical registry count: ${poets.length}/${registry.entries.length}`);
}
if (new Set(poets.map((poet) => poet.id)).size !== poets.length) {
  fail('published poet ids must be unique');
}

for (const fixtureFailure of runPoetAuthoringAdversarialFixtures()) {
  fail(`authoring fixture: ${fixtureFailure}`);
}

const provenanceText = fs.existsSync(provenancePath) ? fs.readFileSync(provenancePath, 'utf8') : '';
const publishedById = new Map(poets.map((poet) => [poet.id, poet] as const));
const sourcePaths = new Set<string>();

for (const entry of registry.entries) {
  const sourcePath = path.join(libraryDir, `${entry.stem}.ts`);
  sourcePaths.add(sourcePath);
  if (!fs.existsSync(sourcePath)) {
    fail(`${entry.stem}: registered source file is missing`);
    continue;
  }

  let canonical: Poet | undefined;
  try {
    // Import the exact same module URL consumed by library/index.ts. Adding a
    // cache-busting query would intentionally create a second ESM instance and
    // make reference-identity checks false-negative even when no clone exists.
    const sourceModule = (await import(pathToFileURL(sourcePath).href)) as Record<string, unknown>;
    canonical = sourceModule[entry.variable] as Poet | undefined;
  } catch (error) {
    fail(`${entry.stem}: source module cannot be imported: ${(error as Error).message}`);
    continue;
  }
  if (!canonical || typeof canonical !== 'object') {
    fail(`${entry.stem}: module must export const ${entry.variable}: Poet`);
    continue;
  }

  const published = publishedById.get(canonical.id);
  if (!published) {
    fail(`${canonical.id}: canonical poet is missing from the published catalog`);
  } else if (published !== canonical) {
    fail(`${canonical.id}: published catalog must expose the canonical object directly, without an override clone`);
  }

  for (const error of validatePoetReleaseCandidate({
    poet: canonical,
    moduleStem: entry.stem,
    provenanceText,
    allowLegacy: true,
  })) {
    fail(`${canonical.id}: authoring release contract: ${error}`);
  }

  const source = fs.readFileSync(sourcePath, 'utf8');
  const moralCount = source.match(/^  moralPortrait:/gm)?.length ?? 0;
  const conclusionCount = source.match(/^  authorCommentary:/gm)?.length ?? 0;
  if (moralCount !== 1 || conclusionCount !== 1) {
    fail(`${canonical.id}: ${entry.stem}.ts must contain exactly one moralPortrait and authorCommentary; found ${moralCount}/${conclusionCount}`);
  }

  const editorialText = [
    canonical.shortBio,
    canonical.fullBio,
    canonical.historicalNote ?? '',
    canonical.spiritualSearch ?? '',
    canonical.moralPortrait ?? '',
    canonical.authorCommentary ?? '',
  ].join('\n').toLocaleLowerCase('ru');
  for (const marker of forbiddenServiceVoice) {
    if (editorialText.includes(marker)) {
      fail(`${canonical.id}: service/editorial scaffolding remains in ${entry.stem}.ts: “${marker}”`);
    }
  }
}

if (sourcePaths.size !== registry.entries.length) {
  fail('canonical poet source paths must be unique');
}

if (failures.length > 0) {
  throw new Error(`Poet authority validation failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

console.log(
  `Poet authority validation passed: ${registry.entries.length} registry-driven canonical files, shared authoring contract, portrait provenance and adversarial fixtures.`,
);
