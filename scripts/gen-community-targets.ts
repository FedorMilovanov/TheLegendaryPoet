import { writeFileSync } from 'node:fs';
import { getAllEssays } from '../src/data/essays';
import { musicTracks, poets } from '../src/data/poets';

const TARGET_ID = /^[a-z0-9][a-z0-9-]{1,159}$/;

function uniqueSorted(values: readonly string[]) {
  const ids = [...new Set(values)].sort((a, b) => a.localeCompare(b, 'en'));
  for (const id of ids) {
    if (!TARGET_ID.test(id)) throw new Error(`Invalid community target id: ${id}`);
  }
  return ids;
}

const manifest = {
  version: 1,
  targets: {
    poet: uniqueSorted(poets.map((poet) => poet.id)),
    poem: uniqueSorted(poets.flatMap((poet) => poet.poems.map((poem) => poem.id))),
    track: uniqueSorted(musicTracks.map((track) => track.id)),
    article: uniqueSorted(getAllEssays().map((essay) => essay.id)),
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
