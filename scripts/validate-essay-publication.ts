import fs from 'node:fs';
import path from 'node:path';
import type { Essay } from '../src/types/essay';
import { estimateReadTime } from '../src/utils/readTime';
import { essays, getAllEssays, getEssayBySlug } from '../src/data/essays/index';
import { lermontovRoadEssay } from '../src/data/essays/lermontovRoadEssay';
import { yeseninKutezhiVisual } from '../src/data/essays/yeseninVisual';
import { yeseninPartOnePublic } from '../src/data/essays/yeseninPartOnePublic';
import { yeseninPartTwoPublic } from '../src/data/essays/yeseninPartTwoPublic';
import { yeseninDuncanFirstMeetingPublished } from '../src/data/essays/yeseninDuncanFirstMeetingPublished';
import { mayakovskyPartOne } from '../src/data/essays/mayakovskyPartOne';
import { mayakovskyPartTwo } from '../src/data/essays/mayakovskyPartTwoVisual';
import { brikCaseVisual } from '../src/data/essays/brikCaseVisual';

const root = process.cwd();
const errors: string[] = [];

function fail(message: string) {
  errors.push(message);
}

function isDeepFrozen(value: unknown, seen = new Set<object>()): boolean {
  if (!value || typeof value !== 'object') return true;
  const object = value as object;
  if (seen.has(object)) return true;
  seen.add(object);
  if (!Object.isFrozen(object)) return false;
  return Object.values(value as Record<string, unknown>).every((item) => isDeepFrozen(item, seen));
}

const authoringEssays: Essay[] = [
  lermontovRoadEssay,
  yeseninKutezhiVisual,
  yeseninPartOnePublic,
  yeseninPartTwoPublic,
  yeseninDuncanFirstMeetingPublished,
  mayakovskyPartOne,
  mayakovskyPartTwo,
  brikCaseVisual,
];

if (!Object.isFrozen(essays)) fail('published essay catalog must be frozen');
if (getAllEssays() !== essays) fail('getAllEssays must return the canonical readonly catalog');
if (essays.length !== authoringEssays.length) {
  fail(`published essay count ${essays.length} does not match authoring count ${authoringEssays.length}`);
}

const ids = new Set<string>();
const slugs = new Set<string>();

for (const essay of essays) {
  if (!isDeepFrozen(essay)) fail(`${essay.slug}: published essay is not deeply frozen`);
  if (essay.readTime !== estimateReadTime(essay.blocks)) {
    fail(`${essay.slug}: readTime is not derived from final published blocks`);
  }
  if (ids.has(essay.id)) fail(`${essay.slug}: duplicate essay id ${essay.id}`);
  if (slugs.has(essay.slug)) fail(`${essay.slug}: duplicate essay slug`);
  ids.add(essay.id);
  slugs.add(essay.slug);
  if (getEssayBySlug(essay.slug) !== essay) {
    fail(`${essay.slug}: slug lookup must return the canonical published object`);
  }

  const authoring = authoringEssays.find((candidate) => candidate.id === essay.id);
  if (!authoring) {
    fail(`${essay.slug}: no authoring input with id ${essay.id}`);
    continue;
  }
  if (authoring === essay) fail(`${essay.slug}: published object aliases its authoring input`);
  if (authoring.blocks === essay.blocks) fail(`${essay.slug}: published blocks alias authoring blocks`);
  if (authoring.sources && essay.sources && authoring.sources === essay.sources) {
    fail(`${essay.slug}: published sources alias authoring sources`);
  }
}

const first = essays[0];
if (first) {
  const originalTitle = first.title;
  try {
    (first as Essay).title = 'mutation-probe';
  } catch {
    // Expected in strict ESM when the frozen object rejects the assignment.
  }
  if (first.title !== originalTitle) fail('published essay accepted a top-level mutation');
}

const indexSource = fs.readFileSync(
  path.join(root, 'src/data/essays/index.ts'),
  'utf8',
);

const forbiddenAssignments = [
  /\byeseninPartTwoPublic\.(?:sources|blocks|readTime)\s*=/,
  /\b(?:essay|publishedEssay)\.readTime\s*=/,
  /for\s*\([^)]*of\s+essays[^)]*\)\s*\{[\s\S]*?\.readTime\s*=/,
];

for (const pattern of forbiddenAssignments) {
  if (pattern.test(indexSource)) fail(`catalog contains forbidden post-import mutation: ${pattern}`);
}

const publicationCalls = indexSource.match(/\bpublishEssay\s*\(/g)?.length ?? 0;
if (publicationCalls !== authoringEssays.length) {
  fail(`expected ${authoringEssays.length} publishEssay calls, found ${publicationCalls}`);
}

if (!indexSource.includes('readonly PublishedEssay[]')) {
  fail('catalog must expose a readonly PublishedEssay array');
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(
  `Immutable essay publication passed: ${essays.length} deeply frozen essays, derived reading times, no authoring aliases.`,
);
