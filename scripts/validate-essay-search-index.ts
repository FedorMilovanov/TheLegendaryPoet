import { sectionAnchor } from '../src/components/essay/anchor';
import { essays } from '../src/data/essays/index';
import { essaySearchIndex } from '../src/data/essaySearchIndex.generated';
import { titleCase } from '../src/utils/titleCase';

const failures: string[] = [];

const canonical = essays.map(({ id, title, excerpt, slug, blocks }) => {
  const sections = blocks.flatMap((block) => (
    block.type === 'section'
      ? [{
          heading: titleCase(block.heading),
          anchor: sectionAnchor(block.heading, block.anchor),
        }]
      : []
  ));

  const anchors = sections.map((section) => section.anchor);
  if (new Set(anchors).size !== anchors.length) {
    failures.push(`canonical essay ${slug} contains duplicate section anchors`);
  }
  for (const section of sections) {
    if (!section.heading.trim()) failures.push(`canonical essay ${slug} contains an empty section heading`);
    if (!section.anchor.trim()) failures.push(`canonical essay ${slug} contains an empty section anchor`);
  }

  return { id, title, excerpt, slug, sections };
});

const actual = essaySearchIndex.map((entry) => ({
  id: entry.id,
  title: entry.title,
  excerpt: entry.excerpt,
  slug: entry.slug,
  sections: Array.isArray((entry as { sections?: unknown }).sections)
    ? (entry as { sections: readonly { heading: string; anchor: string }[] }).sections.map(({ heading, anchor }) => ({ heading, anchor }))
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
  for (const section of sections as Record<string, unknown>[]) {
    const sectionKeys = Object.keys(section).sort().join(',');
    if (sectionKeys !== 'anchor,heading') {
      failures.push(`generated essay section has unexpected fields: ${sectionKeys}`);
    }
  }
}

if (failures.length) {
  console.error('\nEssay search index validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nEXPECTED_ESSAY_SEARCH_INDEX_JSON_BEGIN');
  console.error(JSON.stringify(canonical, null, 2));
  console.error('EXPECTED_ESSAY_SEARCH_INDEX_JSON_END');
  console.error('\nRun: npm run search-index');
  process.exit(1);
}

const sectionCount = canonical.reduce((count, entry) => count + entry.sections.length, 0);
console.log(`Essay search index validation passed: ${actual.length} published entries, ${sectionCount} canonical sections.`);
