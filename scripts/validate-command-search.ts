import fs from 'node:fs';
import path from 'node:path';
import { essaySearchIndex } from '../src/data/essaySearchIndex.generated';
import { musicTracks, poets } from '../src/data/poets';
import routeContract from '../src/routes/route-contract.json';
import {
  buildCommandItems,
  buildSectionCommandItems,
  commandSectionPresentations,
  getCommandItems,
} from '../src/components/command/commandItems';
import { matchesRussianSearch, normalizeRussianSearch } from '../src/utils/searchText';

const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};
const expectThrows = (fn: () => unknown, message: string) => {
  try {
    fn();
    failures.push(message);
  } catch {
    // Expected fail-closed rejection.
  }
};

const items = getCommandItems();
const ids = items.map((item) => item.id);
expect(new Set(ids).size === ids.length, 'command item ids must remain unique');

const staticRoutes = routeContract.routes.filter((route) => route.path !== '*' && !route.path.includes(':'));
const staticRouteIds = staticRoutes.map((route) => route.id);
const presentationIds = Object.keys(commandSectionPresentations);
expect(
  JSON.stringify([...presentationIds].sort()) === JSON.stringify([...staticRouteIds].sort()),
  'static command presentation metadata must cover exactly the canonical non-dynamic route inventory',
);

const sectionItems = items.filter((item) => item.group === 'Разделы');
expect(
  sectionItems.length === staticRoutes.length,
  `command inventory must contain every canonical static route (${staticRoutes.length})`,
);
const byId = new Map(items.map((item) => [item.id, item]));
for (const route of staticRoutes) {
  const item = byId.get(route.id);
  expect(Boolean(item), `missing command section for canonical route ${route.id}`);
  expect(item?.path === route.path, `command section ${route.id} must derive path ${route.path} from route-contract.json`);
  expect(item?.group === 'Разделы', `command section ${route.id} must remain in the section group`);
}

expectThrows(
  () => buildSectionCommandItems(
    [...staticRoutes, { id: 'fixture-new-static-route', path: '/fixture-new-static-route' }],
    commandSectionPresentations,
  ),
  'adding a canonical static route without presentation metadata must fail closed',
);
expectThrows(
  () => buildSectionCommandItems(
    staticRoutes,
    {
      ...commandSectionPresentations,
      'fixture-extra-presentation': { label: 'Лишний раздел', description: 'Лишняя запись' },
    },
  ),
  'orphan command presentation metadata must fail closed',
);

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
  'command inventory must contain every generated whole-essay search record',
);
const expectedEssaySectionCount = essaySearchIndex.reduce((count, essay) => count + essay.sections.length, 0);
expect(
  items.filter((item) => item.group === 'Разделы статей').length === expectedEssaySectionCount,
  `command inventory must contain every generated essay section (${expectedEssaySectionCount})`,
);
expect(
  items.filter((item) => item.group === 'Музыка').length === musicTracks.length,
  'command inventory must contain every published music search record',
);

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

  const anchors = essay.sections.map(([, anchor]) => anchor);
  expect(new Set(anchors).size === anchors.length, `essay ${essay.id} section anchors must remain unique`);
  for (const [heading, anchor] of essay.sections) {
    const sectionItem = byId.get(`essay-section-${essay.id}-${anchor}`);
    const expectedPath = `/essays/${essay.slug}#${encodeURIComponent(anchor)}`;
    expect(Boolean(sectionItem), `missing command item for essay section ${essay.id}/${anchor}`);
    expect(sectionItem?.label === heading, `essay section ${essay.id}/${anchor} must derive its visible heading`);
    expect(sectionItem?.path === expectedPath, `essay section ${essay.id}/${anchor} must deep-link to ${expectedPath}`);
    expect(sectionItem?.group === 'Разделы статей', `essay section ${essay.id}/${anchor} must remain in the essay-section group`);
  }
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

// Mutation-style proof: unseen source records must enter the inventory without
// hard-coded production titles, ids or section anchors in commandItems.ts.
const fixtureItems = buildCommandItems({
  poets: [{
    id: 'fixture-poet',
    name: 'Фёдор Йота',
    fullName: 'Фёдор Йота Тестовый',
    poems: [{ id: 'fixture-poem', title: 'Ёлочный май', year: 1901 }],
  }],
  essays: [{
    id: 'fixture-essay',
    title: 'Новая статья',
    excerpt: 'Проверка',
    slug: 'fixture-essay',
    sections: [['Невиданный раздел', 'fixture-section']],
  }],
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
const fixtureEssaySection = fixtureItems.find((item) => item.id === 'essay-section-fixture-essay-fixture-section');
expect(fixtureEssaySection?.label === 'Невиданный раздел', 'builder must derive unseen essay section labels');
expect(
  fixtureEssaySection?.path === '/essays/fixture-essay#fixture-section',
  'builder must derive unseen essay section deep links',
);

const commandItemsSource = fs.readFileSync(path.resolve('src/components/command/commandItems.ts'), 'utf8');
const generatorSource = fs.readFileSync(path.resolve('scripts/gen-essay-search-index.ts'), 'utf8');
expect(
  commandItemsSource.includes("route-contract.json"),
  'command section inventory must consume route-contract.json instead of owning a parallel path list',
);
expect(
  !commandItemsSource.includes("data/essays/index"),
  'persistent command inventory must not import the full canonical longform essay registry',
);
expect(
  generatorSource.includes('sectionAnchor('),
  'essay search generation must consume the shared rendered sectionAnchor authority',
);

if (failures.length) {
  console.error('\nCommand search validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Command search validation passed: ${items.length} source-derived items, ${staticRoutes.length} static routes, ${expectedPoemCount} poems, ${expectedEssaySectionCount} essay sections.`,
);
