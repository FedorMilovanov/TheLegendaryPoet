import fs from 'node:fs';
import path from 'node:path';
import { sectionAnchor } from '../src/components/essay/anchor';
import { essays } from '../src/data/essays/index';
import { essaySearchIndex } from '../src/data/essaySearchIndex.generated';
import { titleCase } from '../src/utils/titleCase';

const failures: string[] = [];

const canonical = essays.map(({ id, title, excerpt, slug, blocks }) => {
  const sections = blocks.flatMap((block) => (
    block.type === 'section'
      ? [[titleCase(block.heading), sectionAnchor(block.heading, block.anchor)] as const]
      : []
  ));

  const anchors = sections.map(([, anchor]) => anchor);
  if (new Set(anchors).size !== anchors.length) {
    failures.push(`canonical essay ${slug} contains duplicate section anchors`);
  }
  for (const [heading, anchor] of sections) {
    if (!heading.trim()) failures.push(`canonical essay ${slug} contains an empty section heading`);
    if (!anchor.trim()) failures.push(`canonical essay ${slug} contains an empty section anchor`);
  }

  return { id, title, excerpt, slug, sections };
});

const actual = essaySearchIndex.map((entry) => ({
  id: entry.id,
  title: entry.title,
  excerpt: entry.excerpt,
  slug: entry.slug,
  sections: Array.isArray((entry as { sections?: unknown }).sections)
    ? (entry as { sections: readonly (readonly [string, string])[] }).sections.map(([heading, anchor]) => [heading, anchor] as const)
    : null,
}));

if (JSON.stringify(actual) !== JSON.stringify(canonical)) {
  failures.push('essay search index is stale or does not contain exact canonical section metadata');
}

for (const entry of essaySearchIndex as readonly Record<string, unknown>[]) {
  const keys = Object.keys(entry).sort().join(',');
  if (keys !== 'excerpt,id,sections,slug,title') {
    failures.push(`generated essay search entry has unexpected fields: ${keys}`);
  }
  const sections = entry.sections;
  if (!Array.isArray(sections)) continue;
  for (const section of sections) {
    if (!Array.isArray(section) || section.length !== 2 || section.some((value) => typeof value !== 'string')) {
      failures.push('generated essay section must be exactly [heading, anchor]');
    }
  }
}

if (failures.length) {
  const artifactDir = path.resolve('qa-artifacts');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(
    path.join(artifactDir, 'expected-essay-search-index.json'),
    `${JSON.stringify(canonical)}\n`,
    'utf8',
  );

  console.error('\nEssay search index validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nRun: npm run search-index');
  process.exit(1);
}

const sectionCount = canonical.reduce((count, entry) => count + entry.sections.length, 0);
console.log(`Essay search index validation passed: ${actual.length} published entries, ${sectionCount} canonical sections.`);
