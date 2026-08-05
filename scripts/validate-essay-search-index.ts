import { essays } from '../src/data/essays/index';
import { essaySearchIndex } from '../src/data/essaySearchIndex.generated';

const canonical = essays.map(({ id, title, excerpt, slug }) => ({ id, title, excerpt, slug }));
const actual = essaySearchIndex.map(({ id, title, excerpt, slug }) => ({ id, title, excerpt, slug }));

if (JSON.stringify(actual) !== JSON.stringify(canonical)) {
  console.error('Essay search index is stale. Run: npm run search-index');
  process.exit(1);
}

console.log(`Essay search index validation passed: ${actual.length} published entries.`);
