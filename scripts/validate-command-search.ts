import { essaySearchIndex } from '../src/data/essaySearchIndex.generated';
import { musicTracks, poets } from '../src/data/poets';
import { buildCommandItems, getCommandItems } from '../src/components/command/commandItems';
import { matchesRussianSearch, normalizeRussianSearch } from '../src/utils/searchText';

const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

const items = getCommandItems();
const ids = items.map((item) => item.id);
expect(new Set(ids).size === ids.length, 'command item ids must remain unique');

const expectedPoemCount = poets.reduce((count, poet) => count + poet.poems.length, 0);
expect(
  items.filter((item) => item.group === 'Стихи').length === expectedPoemCount,
  `command inventory must contain every canonical poem (${expectedPoemCount})`,
);
expect(
  items.filter((item) => item.group === 'Поэты').length === poets.length,
  'command inventory must contain every canonical poet',
);
expect(
  items.filter((item) => item.group === 'Статьи').length === essaySearchIndex.length,
  'command inventory must contain every generated essay search record',
);
expect(
  items.filter((item) => item.group === 'Музыка').length === musicTracks.length,
  'command inventory must contain every published music search record',
);

const byId = new Map(items.map((item) => [item.id, item]));
for (const poet of poets) {
  for (const poem of poet.poems) {
    const item = byId.get(`poem-${poet.id}-${poem.id}`);
    const expectedPath = `/poets/${poet.id}#poem-${encodeURIComponent(poem.id)}`;
    expect(Boolean(item), `missing command item for poem ${poet.id}/${poem.id}`);
    expect(item?.path === expectedPath, `poem ${poet.id}/${poem.id} must deep-link to ${expectedPath}`);
    expect(item?.label === poem.title, `poem ${poet.id}/${poem.id} must derive its title from canonical library data`);
    expect(item?.group === 'Стихи', `poem ${poet.id}/${poem.id} must remain in the poem search group`);
  }
}

for (const poet of poets) {
  const item = byId.get(`poet-${poet.id}`);
  expect(item?.path === `/poets/${poet.id}`, `poet ${poet.id} must retain its canonical route`);
  expect(item?.label === poet.name, `poet ${poet.id} must derive its label from canonical library data`);
}
for (const essay of essaySearchIndex) {
  const item = byId.get(`essay-${essay.id}`);
  expect(item?.path === `/essays/${essay.slug}`, `essay ${essay.id} must retain its generated canonical deep route`);
  expect(item?.label === essay.title, `essay ${essay.id} must derive its label from generated search metadata`);
}
for (const track of musicTracks) {
  const item = byId.get(`track-${track.id}`);
  expect(item?.path === `/music/${track.id}`, `track ${track.id} must retain its canonical release route`);
  expect(item?.label === track.title, `track ${track.id} must derive its label from canonical music data`);
}

expect(
  normalizeRussianSearch('ФЁДОР  ТЮТЧЕВ') === normalizeRussianSearch('федор тютчев'),
  'Russian normalization must treat ё and е as equivalent and collapse whitespace',
);
expect(
  normalizeRussianSearch('Николай') !== normalizeRussianSearch('Николаи'),
  'Russian normalization must keep й distinct from и',
);
expect(
  matchesRussianSearch('федор', ['Фёдор Тютчев']),
  'search matching must apply ё/е equivalence to reader queries',
);
expect(
  !matchesRussianSearch('николаи гумилев', ['Николай Гумилёв']),
  'search matching must not erase the semantic й/и distinction',
);

// Mutation-style proof: a completely synthetic poet/poem must enter the inventory
// without any production title/id being hard-coded in commandItems.ts.
const fixtureItems = buildCommandItems({
  poets: [{
    id: 'fixture-poet',
    name: 'Фёдор Йота',
    fullName: 'Фёдор Йота Тестовый',
    poems: [{ id: 'fixture-poem', title: 'Ёлочный май', year: 1901 }],
  }],
  essays: [{ id: 'fixture-essay', title: 'Новая статья', excerpt: 'Проверка', slug: 'fixture-essay' }],
  tracks: [{ id: 'fixture-track', title: 'Новый трек', poet: 'Фёдор Йота', duration: '1:23' }],
});
const fixturePoem = fixtureItems.find((item) => item.id === 'poem-fixture-poet-fixture-poem');
expect(fixturePoem?.label === 'Ёлочный май', 'builder must derive unseen poem labels from supplied source data');
expect(
  fixturePoem?.path === '/poets/fixture-poet#poem-fixture-poem',
  'builder must derive unseen poem deep links from supplied source data',
);
expect(
  fixtureItems.some((item) => item.id === 'essay-fixture-essay') && fixtureItems.some((item) => item.id === 'track-fixture-track'),
  'builder must derive unseen essay and track records from supplied source data',
);

if (failures.length) {
  console.error('\nCommand search validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Command search validation passed: ${items.length} source-derived items, ${expectedPoemCount} poems.`);
