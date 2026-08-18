import { writeFileSync } from 'node:fs';
import { getAllEssays } from '../src/data/essays';
import { musicTracks, poets } from '../src/data/poets';

const TARGET_ID = /^[a-z0-9][a-z0-9-]{1,159}$/;

function uniqueSorted(values: readonly string[], targetType: string) {
  const ids = [...new Set(values)].sort((a, b) => a.localeCompare(b, 'en'));
  if (ids.length !== values.length) {
    throw new Error(`Duplicate canonical community target id in ${targetType}`);
  }
  for (const id of ids) {
    if (!TARGET_ID.test(id)) throw new Error(`Invalid community target id: ${targetType}:${id}`);
  }
  return ids;
}

const manifest = {
  version: 1,
  targets: {
    poet: uniqueSorted(poets.map((poet) => poet.id), 'poet'),
    poem: uniqueSorted(poets.flatMap((poet) => poet.poems.map((poem) => poem.id)), 'poem'),
    track: uniqueSorted(musicTracks.map((track) => track.id), 'track'),
    article: uniqueSorted(getAllEssays().map((essay) => essay.id), 'article'),
  },
} as const;

const output = `${JSON.stringify(manifest, null, 2)}\n`;
writeFileSync('public/community-targets.json', output, 'utf8');

const total = Object.values(manifest.targets).reduce((sum, ids) => sum + ids.length, 0);
console.log(
  `Community target manifest: ${total} canonical targets `
  + `(${manifest.targets.poet.length} poets, ${manifest.targets.poem.length} poems, `
  + `${manifest.targets.track.length} tracks, ${manifest.targets.article.length} articles).`,
);
