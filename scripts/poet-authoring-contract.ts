import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Poet } from '../src/types/poet';

export const POET_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
export const POET_PORTRAIT_PATTERN = /^\/images\/[a-z0-9][a-z0-9/_-]*\.(?:jpe?g|png|webp)$/;
export const LEGACY_PORTRAIT_STATUS = 'LEGACY-PROVENANCE-UNRESOLVED';
export const LEGACY_PORTRAIT_BOUNDARY = 'Product main@49337c0ab502b056ee503995ae0fa0051c693962';
const LEGACY_POET_IDS = new Set([
  'fyodor-tyutchev',
  'vladimir-mayakovsky',
  'alexander-pushkin',
  'mikhail-lermontov',
  'boris-pasternak',
  'afanasy-fet',
  'nikolay-gumilev',
  'sergei-yesenin',
  'anna-akhmatova',
  'alexander-blok',
]);
const RESERVED_MODULE_BINDINGS = new Set([
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'arguments',
]);
const VERIFIED_STATUSES = new Set(['VERIFIED-ARCHIVAL', 'VERIFIED-PUBLIC-DOMAIN', 'VERIFIED-LOCAL-EDITORIAL']);
const TODO_PATTERN = /\b(?:TODO|FIXME|TBD|XXX)\b/i;

export interface PoetRegistryEntry {
  variable: string;
  stem: string;
}

export interface PoetRegistryValidation {
  errors: string[];
  entries: PoetRegistryEntry[];
}

export type ProvenanceRecord = Record<string, string> & { path: string };

function stripYamlScalar(value: string): string {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function isValidPoetId(id: string): boolean {
  return POET_ID_PATTERN.test(id) && !RESERVED_MODULE_BINDINGS.has(id);
}

export function assertPoetId(id: string): void {
  if (!isValidPoetId(id)) {
    throw new Error(`poet id must be identifier-safe ASCII kebab-case, start with a letter, and not be a reserved module binding: ${JSON.stringify(id)}`);
  }
}

export function moduleStemFromPoetId(id: string): string {
  assertPoetId(id);
  return id.replace(/-([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());
}

export function isValidPortraitPath(photo: string): boolean {
  return POET_PORTRAIT_PATTERN.test(photo) && !photo.includes('..') && !photo.includes('\\');
}

export function publicPathFromPhoto(photo: string): string {
  if (!isValidPortraitPath(photo)) {
    throw new Error(`portrait path must be a lowercase public /images asset: ${JSON.stringify(photo)}`);
  }
  return `public${photo}`;
}

export function parseImageProvenance(text: string): ProvenanceRecord[] {
  const records: ProvenanceRecord[] = [];
  let current: ProvenanceRecord | null = null;

  for (const line of text.split(/\r?\n/)) {
    const start = line.match(/^  - path:\s*(.+?)\s*$/);
    if (start) {
      if (current) records.push(current);
      current = { path: stripYamlScalar(start[1]) };
      continue;
    }
    if (!current) continue;
    const field = line.match(/^    ([a-zA-Z0-9_]+):\s*(.*?)\s*$/);
    if (!field || field[2] === '>-' || field[2] === '|-') continue;
    current[field[1]] = stripYamlScalar(field[2]);
  }

  if (current) records.push(current);
  return records;
}

function sha256(bytes: Buffer): string {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function gitBlobSha(bytes: Buffer): string {
  return crypto
    .createHash('sha1')
    .update(Buffer.from(`blob ${bytes.length}\0`, 'utf8'))
    .update(bytes)
    .digest('hex');
}

function defaultAssetReader(relativePath: string): Buffer | null {
  const absolute = path.resolve(relativePath);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute) : null;
}

function defaultFileExists(relativePath: string): boolean {
  return fs.existsSync(path.resolve(relativePath));
}

function isSafeRepoRelativePath(relativePath: string): boolean {
  return relativePath.length > 0 && !path.isAbsolute(relativePath) && !relativePath.includes('..') && !relativePath.includes('\\');
}

export function validatePortraitProvenance(options: {
  poetId: string;
  photo: string;
  provenanceText: string;
  allowLegacy: boolean;
  assetReader?: (relativePath: string) => Buffer | null;
  fileExists?: (relativePath: string) => boolean;
}): string[] {
  const errors: string[] = [];
  let publicPath = '';
  try {
    publicPath = publicPathFromPhoto(options.photo);
  } catch (error) {
    return [(error as Error).message];
  }

  const matchingRecords = parseImageProvenance(options.provenanceText).filter((candidate) => candidate.path === publicPath);
  if (matchingRecords.length === 0) return [`${options.poetId}: portrait ${publicPath} has no item-level PROVENANCE.yml record`];
  if (matchingRecords.length !== 1) return [`${options.poetId}: portrait ${publicPath} must have exactly one PROVENANCE.yml record`];
  const record = matchingRecords[0];

  if (record.role !== 'poet_portrait') errors.push(`${options.poetId}: portrait provenance role must be poet_portrait`);
  if (record.poet_id !== options.poetId) {
    errors.push(`${options.poetId}: portrait provenance poet_id must match the canonical poet id`);
  }

  const readAsset = options.assetReader ?? defaultAssetReader;
  const bytes = readAsset(publicPath);
  if (!bytes || bytes.length === 0) {
    errors.push(`${options.poetId}: portrait file does not exist or is empty: ${publicPath}`);
    return errors;
  }

  if (record.review_status === LEGACY_PORTRAIT_STATUS) {
    if (!options.allowLegacy || !LEGACY_POET_IDS.has(options.poetId)) {
      errors.push(`${options.poetId}: ${LEGACY_PORTRAIT_STATUS} is restricted to the frozen legacy poet set`);
      return errors;
    }
    if (record.origin_class !== 'legacy_canonical_portrait') {
      errors.push(`${options.poetId}: legacy portrait must use origin_class legacy_canonical_portrait`);
    }
    if (record.source_use !== 'not_primary_evidence') {
      errors.push(`${options.poetId}: unresolved legacy portrait must be marked not_primary_evidence`);
    }
    if (record.legacy_boundary !== LEGACY_PORTRAIT_BOUNDARY) {
      errors.push(`${options.poetId}: unresolved legacy portrait must retain the frozen ${LEGACY_PORTRAIT_BOUNDARY} boundary`);
    }
    if (!/^[0-9a-f]{40}$/.test(record.git_blob_sha ?? '')) {
      errors.push(`${options.poetId}: unresolved legacy portrait needs its exact git_blob_sha`);
    } else if (gitBlobSha(bytes) !== record.git_blob_sha) {
      errors.push(`${options.poetId}: unresolved legacy portrait bytes changed from the frozen git blob`);
    }
    if (!record.required_follow_up) {
      errors.push(`${options.poetId}: unresolved legacy portrait needs an explicit provenance follow-up`);
    }
    return errors;
  }

  if (!VERIFIED_STATUSES.has(record.review_status ?? '')) {
    errors.push(`${options.poetId}: portrait review_status is not release-approved: ${record.review_status ?? '<missing>'}`);
    return errors;
  }

  if (!record.origin_class) errors.push(`${options.poetId}: verified portrait provenance needs origin_class`);
  if (!/^[0-9a-f]{64}$/.test(record.sha256 ?? '')) {
    errors.push(`${options.poetId}: verified portrait provenance needs a lowercase SHA-256`);
  } else if (sha256(bytes) !== record.sha256) {
    errors.push(`${options.poetId}: portrait SHA-256 does not match PROVENANCE.yml`);
  }

  const isLocal = (record.origin_class ?? '').includes('local');
  if (isLocal) {
    if (record.review_status !== 'VERIFIED-LOCAL-EDITORIAL') {
      errors.push(`${options.poetId}: local portrait must use VERIFIED-LOCAL-EDITORIAL review_status`);
    }
    if (!record.evidence) {
      errors.push(`${options.poetId}: verified local portrait needs an evidence record`);
    } else {
      const fileExists = options.fileExists ?? defaultFileExists;
      if (!isSafeRepoRelativePath(record.evidence) || !fileExists(record.evidence)) {
        errors.push(`${options.poetId}: verified local portrait evidence must be an existing repository-relative record`);
      }
    }
    if (record.source_use !== 'not_primary_evidence') {
      errors.push(`${options.poetId}: local editorial portrait must be marked not_primary_evidence`);
    }
  } else {
    if (!new Set(['VERIFIED-ARCHIVAL', 'VERIFIED-PUBLIC-DOMAIN']).has(record.review_status ?? '')) {
      errors.push(`${options.poetId}: archival/public-domain portrait must use an archival/public-domain review_status`);
    }
    if (!/^https:\/\//.test(record.source_url ?? '')) {
      errors.push(`${options.poetId}: archival portrait needs an item-level https source_url`);
    }
    if (!record.rights_statement) errors.push(`${options.poetId}: archival portrait needs rights_statement`);
    if (!record.credit) errors.push(`${options.poetId}: archival portrait needs credit`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.accessed_at ?? '')) {
      errors.push(`${options.poetId}: archival portrait needs ISO accessed_at`);
    }
  }

  return errors;
}

export function validatePoetReleaseCandidate(options: {
  poet: Poet;
  moduleStem: string;
  provenanceText: string;
  allowLegacy: boolean;
  existingIds?: ReadonlySet<string>;
  assetReader?: (relativePath: string) => Buffer | null;
  fileExists?: (relativePath: string) => boolean;
}): string[] {
  const { poet, moduleStem } = options;
  const errors: string[] = [];

  if (!isValidPoetId(poet.id)) errors.push(`poet id must be identifier-safe ASCII kebab-case starting with a letter and not a reserved module binding: ${JSON.stringify(poet.id)}`);
  if (isValidPoetId(poet.id) && moduleStemFromPoetId(poet.id) !== moduleStem) {
    errors.push(`${poet.id}: module stem must be ${moduleStemFromPoetId(poet.id)}, got ${moduleStem}`);
  }
  if (options.existingIds?.has(poet.id)) errors.push(`${poet.id}: canonical poet id already exists`);

  for (const [field, value] of [
    ['name', poet.name],
    ['fullName', poet.fullName],
    ['nationality', poet.nationality],
    ['shortBio', poet.shortBio],
    ['fullBio', poet.fullBio],
    ['moralPortrait', poet.moralPortrait],
    ['authorCommentary', poet.authorCommentary],
  ] as const) {
    if (typeof value !== 'string' || value.trim().length === 0) errors.push(`${poet.id || '<missing-id>'}: missing ${field}`);
    else if (TODO_PATTERN.test(value)) errors.push(`${poet.id}: ${field} still contains draft placeholder text`);
  }

  if (!Number.isInteger(poet.birthYear) || poet.birthYear <= 0) errors.push(`${poet.id}: birthYear must be a verified positive year`);
  if (poet.deathYear !== undefined && (!Number.isInteger(poet.deathYear) || poet.deathYear <= poet.birthYear)) {
    errors.push(`${poet.id}: deathYear must be later than birthYear or omitted for a living poet`);
  }
  if (typeof poet.rating !== 'number' || poet.rating < 0 || poet.rating > 10) errors.push(`${poet.id}: rating must be 0–10`);
  if (!Array.isArray(poet.tags) || poet.tags.length < 3 || poet.tags.some((tag) => TODO_PATTERN.test(tag))) {
    errors.push(`${poet.id}: release requires at least three non-placeholder tags`);
  }
  if (!Array.isArray(poet.poems) || poet.poems.length < 2) errors.push(`${poet.id}: release requires at least two poems`);
  if (!Array.isArray(poet.famousWorks) || poet.famousWorks.length < 5 || poet.famousWorks.some((work) => TODO_PATTERN.test(work))) {
    errors.push(`${poet.id}: release requires at least five non-placeholder famousWorks entries`);
  }

  errors.push(
    ...validatePortraitProvenance({
      poetId: poet.id,
      photo: poet.photo,
      provenanceText: options.provenanceText,
      allowLegacy: options.allowLegacy,
      assetReader: options.assetReader,
      fileExists: options.fileExists,
    }),
  );
  return errors;
}

export function validatePoetRegistrySource(indexSource: string, moduleFiles: readonly string[]): PoetRegistryValidation {
  const errors: string[] = [];
  const imports = [...indexSource.matchAll(/^import \{\s*([A-Za-z][A-Za-z0-9]*)\s*\} from '\.\/([A-Za-z][A-Za-z0-9]*)';$/gm)]
    .map((match) => ({ variable: match[1], stem: match[2] }));
  const arrayMatch = indexSource.match(/export const poets:\s*Poet\[\]\s*=\s*\[([\s\S]*?)\];/);
  if (!arrayMatch) return { errors: ['library/index.ts is missing the canonical poets: Poet[] registry'], entries: [] };

  const entries = arrayMatch[1]
    .split(',')
    .map((value) => value.replace(/\/\/.*$/gm, '').trim())
    .filter(Boolean);
  const publishedModules = moduleFiles
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.draft.ts') && name !== 'index.ts' && name !== 'musicTracks.ts')
    .map((name) => name.slice(0, -3))
    .sort();

  const importStems = imports.map((entry) => entry.stem).sort();
  if (new Set(imports.map((entry) => entry.variable)).size !== imports.length) errors.push('library/index.ts has duplicate poet import variables');
  if (new Set(importStems).size !== importStems.length) errors.push('library/index.ts imports a poet module more than once');
  if (JSON.stringify(importStems) !== JSON.stringify(publishedModules)) {
    errors.push(`published poet modules must exactly match index imports: modules=${publishedModules.join(',')} imports=${importStems.join(',')}`);
  }
  if (entries.length !== imports.length) errors.push(`poets[] must contain exactly one entry per poet import: ${entries.length}/${imports.length}`);
  if (new Set(entries).size !== entries.length) errors.push('poets[] contains duplicate registry entries');
  for (const imported of imports) {
    if (entries.filter((entry) => entry === imported.variable).length !== 1) {
      errors.push(`${imported.stem}: imported poet must appear exactly once in poets[]`);
    }
  }
  for (const entry of entries) {
    if (!imports.some((imported) => imported.variable === entry)) errors.push(`poets[] contains unimported registry entry ${entry}`);
  }

  return { errors, entries: imports };
}

export function runPoetAuthoringAdversarialFixtures(): string[] {
  const failures: string[] = [];
  const expectError = (label: string, errors: string[]) => {
    if (errors.length === 0) failures.push(`${label}: fixture unexpectedly passed`);
  };
  const bytes = Buffer.from('authoring-contract-fixture', 'utf8');
  const digest = sha256(bytes);
  const validProvenance = `assets:\n  - path: public/images/test-poet.jpg\n    role: poet_portrait\n    poet_id: test-poet\n    origin_class: local_project_artwork\n    evidence: docs/test-poet-portrait.md\n    review_status: VERIFIED-LOCAL-EDITORIAL\n    source_use: not_primary_evidence\n    sha256: ${digest}\n`;
  const basePoet: Poet = {
    id: 'test-poet',
    name: 'Тест Поэт',
    fullName: 'Тест Тестович Поэт',
    birthYear: 1900,
    deathYear: 1950,
    nationality: 'Русский',
    photo: '/images/test-poet.jpg',
    shortBio: 'Краткая проверенная биографическая справка без черновых маркеров.',
    fullBio: 'Полная проверенная биография для контрактного теста.',
    rating: 8,
    tags: ['Классика', 'Лирика', 'Тест'],
    poems: [
      { id: 'test-poet-1', title: 'Первое', text: 'Первая строка\nВторая строка\nТретья строка\nЧетвёртая строка', rating: 8 },
      { id: 'test-poet-2', title: 'Второе', text: 'Первая строка\nВторая строка\nТретья строка\nЧетвёртая строка', rating: 8 },
    ],
    moralPortrait: 'Документированный нравственный портрет.',
    authorCommentary: 'Краткая итоговая редакционная ремарка.',
    famousWorks: ['Один', 'Два', 'Три', 'Четыре', 'Пять'],
  };
  const assetReader = (relativePath: string) => (relativePath === 'public/images/test-poet.jpg' ? bytes : null);
  const fileExists = (relativePath: string) => relativePath === 'docs/test-poet-portrait.md';

  const valid = validatePoetReleaseCandidate({
    poet: basePoet,
    moduleStem: 'testPoet',
    provenanceText: validProvenance,
    allowLegacy: false,
    assetReader,
    fileExists,
  });
  if (valid.length > 0) failures.push(`valid fixture failed: ${valid.join('; ')}`);

  expectError(
    'unicode id',
    validatePoetReleaseCandidate({
      poet: { ...basePoet, id: 'тест-поэт' },
      moduleStem: 'testPoet',
      provenanceText: validProvenance,
      allowLegacy: false,
      assetReader,
      fileExists,
    }),
  );
  expectError(
    'numeric-leading id',
    validatePoetReleaseCandidate({
      poet: { ...basePoet, id: '123-poet' },
      moduleStem: '123Poet',
      provenanceText: validProvenance,
      allowLegacy: false,
      assetReader,
      fileExists,
    }),
  );
  expectError(
    'reserved module binding',
    validatePoetReleaseCandidate({
      poet: { ...basePoet, id: 'class' },
      moduleStem: 'class',
      provenanceText: validProvenance,
      allowLegacy: false,
      assetReader,
      fileExists,
    }),
  );
  expectError(
    'id collision',
    validatePoetReleaseCandidate({
      poet: basePoet,
      moduleStem: 'testPoet',
      provenanceText: validProvenance,
      allowLegacy: false,
      existingIds: new Set(['test-poet']),
      assetReader,
      fileExists,
    }),
  );
  expectError(
    'placeholder birth year',
    validatePoetReleaseCandidate({
      poet: { ...basePoet, birthYear: 0 },
      moduleStem: 'testPoet',
      provenanceText: validProvenance,
      allowLegacy: false,
      assetReader,
      fileExists,
    }),
  );
  expectError(
    'missing provenance',
    validatePoetReleaseCandidate({
      poet: basePoet,
      moduleStem: 'testPoet',
      provenanceText: 'assets:\n',
      allowLegacy: false,
      assetReader,
      fileExists,
    }),
  );
  expectError(
    'duplicate provenance',
    validatePoetReleaseCandidate({
      poet: basePoet,
      moduleStem: 'testPoet',
      provenanceText: `${validProvenance}\n${validProvenance.replace(/^assets:\n/, '')}`,
      allowLegacy: false,
      assetReader,
      fileExists,
    }),
  );
  expectError(
    'missing portrait bytes',
    validatePoetReleaseCandidate({
      poet: basePoet,
      moduleStem: 'testPoet',
      provenanceText: validProvenance,
      allowLegacy: false,
      assetReader: () => null,
      fileExists,
    }),
  );
  expectError(
    'missing local evidence file',
    validatePoetReleaseCandidate({
      poet: basePoet,
      moduleStem: 'testPoet',
      provenanceText: validProvenance,
      allowLegacy: false,
      assetReader,
      fileExists: () => false,
    }),
  );
  const legacyProvenance = `assets:\n  - path: public/images/test-poet.jpg\n    role: poet_portrait\n    poet_id: test-poet\n    origin_class: legacy_canonical_portrait\n    review_status: ${LEGACY_PORTRAIT_STATUS}\n    source_use: not_primary_evidence\n    git_blob_sha: ${gitBlobSha(bytes)}\n    legacy_boundary: ${LEGACY_PORTRAIT_BOUNDARY}\n    required_follow_up: recover provenance\n`;
  expectError(
    'new poet using legacy provenance',
    validatePoetReleaseCandidate({
      poet: basePoet,
      moduleStem: 'testPoet',
      provenanceText: legacyProvenance,
      allowLegacy: false,
      assetReader,
      fileExists,
    }),
  );
  expectError(
    'future poet cannot inherit legacy exception',
    validatePoetReleaseCandidate({
      poet: basePoet,
      moduleStem: 'testPoet',
      provenanceText: legacyProvenance,
      allowLegacy: true,
      assetReader,
      fileExists,
    }),
  );
  expectError(
    'registry omission',
    validatePoetRegistrySource(
      "import type { Poet } from '../../types/poet';\nimport { existingPoet } from './existingPoet';\n\nexport const poets: Poet[] = [existingPoet];\n",
      ['existingPoet.ts', 'newPoet.ts'],
    ).errors,
  );

  return failures;
}