import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { poets } from '../src/data/library/index';
import type { Poet } from '../src/types/poet';
import {
  assertPoetId,
  moduleStemFromPoetId,
  validatePoetRegistrySource,
  validatePoetReleaseCandidate,
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
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: npx tsx scripts/register-poet.ts --id <ascii-kebab-id> --after <existing-poet-id>');
  process.exit(0);
}

const id = option(args, '--id');
const afterId = option(args, '--after');
if (!id) fail('explicit --id is required');
if (!afterId) fail('explicit --after <existing-poet-id> placement is required');

try {
  assertPoetId(id);
  assertPoetId(afterId);
} catch (error) {
  fail((error as Error).message);
}

const existingIds = new Set(poets.map((poet) => poet.id));
if (existingIds.has(id)) fail(`canonical poet id already exists: ${id}`);
if (!existingIds.has(afterId)) fail(`--after target is not a published poet id: ${afterId}`);

const stem = moduleStemFromPoetId(id);
const afterStem = moduleStemFromPoetId(afterId);
const libraryDir = path.resolve('src/data/library');
const draftPath = path.join(libraryDir, `${stem}.draft.ts`);
const finalPath = path.join(libraryDir, `${stem}.ts`);
const indexPath = path.join(libraryDir, 'index.ts');
const provenancePath = path.resolve('public/images/PROVENANCE.yml');

if (!fs.existsSync(draftPath)) fail(`draft does not exist: ${path.relative(process.cwd(), draftPath)}`);
if (fs.existsSync(finalPath)) fail(`final module already exists: ${path.relative(process.cwd(), finalPath)}`);
if (!fs.existsSync(provenancePath)) fail('public/images/PROVENANCE.yml is missing');

const draftModule = (await import(`${pathToFileURL(draftPath).href}?register=${Date.now()}`)) as Record<string, unknown>;
const poet = draftModule[stem] as Poet | undefined;
if (!poet || typeof poet !== 'object') fail(`draft must export const ${stem}: Poet`);
if (poet.id !== id) fail(`draft id ${JSON.stringify(poet.id)} does not match --id ${id}`);

const provenanceText = fs.readFileSync(provenancePath, 'utf8');
const releaseErrors = validatePoetReleaseCandidate({
  poet,
  moduleStem: stem,
  provenanceText,
  allowLegacy: false,
  existingIds,
});
if (releaseErrors.length > 0) {
  fail(`poet release contract failed before registry mutation:\n${releaseErrors.map((error) => `  - ${error}`).join('\n')}`);
}

const indexSource = fs.readFileSync(indexPath, 'utf8');
const importLine = `import { ${stem} } from './${stem}';`;
if (indexSource.includes(importLine) || new RegExp(`\\b${stem}\\b`).test(indexSource)) {
  fail(`${stem}: registry already contains this symbol`);
}

const exportMarker = '\n\nexport const poets: Poet[] = [';
if (!indexSource.includes(exportMarker)) fail('library/index.ts export marker changed; refusing automatic placement');
let nextIndex = indexSource.replace(exportMarker, `\n${importLine}${exportMarker}`);
const afterLine = `  ${afterStem},\n`;
if (!nextIndex.includes(afterLine)) fail(`cannot find unique --after registry entry for ${afterId}`);
if (nextIndex.indexOf(afterLine) !== nextIndex.lastIndexOf(afterLine)) fail(`--after registry entry is duplicated: ${afterId}`);
nextIndex = nextIndex.replace(afterLine, `${afterLine}  ${stem},\n`);

const hypotheticalModules = fs
  .readdirSync(libraryDir)
  .filter((name) => name.endsWith('.ts') && !name.endsWith('.draft.ts'))
  .concat(`${stem}.ts`);
const registryValidation = validatePoetRegistrySource(nextIndex, hypotheticalModules);
if (registryValidation.errors.length > 0) {
  fail(`generated registry would violate the canonical contract:\n${registryValidation.errors.map((error) => `  - ${error}`).join('\n')}`);
}

const originalIndex = indexSource;
try {
  fs.renameSync(draftPath, finalPath);
  fs.writeFileSync(indexPath, nextIndex, 'utf8');
} catch (error) {
  try {
    fs.writeFileSync(indexPath, originalIndex, 'utf8');
  } catch {
    // Preserve the original error; CI will also fail closed on registry/module drift.
  }
  try {
    if (fs.existsSync(finalPath) && !fs.existsSync(draftPath)) fs.renameSync(finalPath, draftPath);
  } catch {
    // Preserve the original error; no false success is printed.
  }
  fail(`registration mutation failed and rollback was attempted: ${(error as Error).message}`);
}

console.log(`✓ Registered ${id} from ${stem}.draft.ts as ${stem}.ts after ${afterId}.`);
console.log('✓ Canonical index and module placement now converge; run the full repository check before committing.');
