import fs from 'node:fs';
import path from 'node:path';
import { getAllEssays } from '../src/data/essays/index.ts';
import { allMusicTracks } from '../src/data/poets.ts';

const BASE = (process.env.SITE_URL || 'https://thelegendarypoet.ru').replace(/\/$/, '');
const OUTPUT = path.resolve('public/feed.xml');

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function atomDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? `${date}T00:00:00Z` : undefined;
}

const entries = [
  ...getAllEssays().map((essay) => ({
    kind: 'article',
    title: essay.title,
    path: `/essays/${essay.slug}`,
    summary: essay.excerpt,
    published: atomDate(essay.date),
    updated: atomDate(essay.dateModified || essay.date),
    author: essay.author,
    categories: essay.tags,
  })),
  ...allMusicTracks
    .filter((track) => track.availability === 'published' && track.publishedAt)
    .map((track) => ({
      kind: 'music',
      title: `${track.title} — ${track.poet}`,
      path: `/music/${track.id}`,
      summary: track.description || 'Музыкальная публикация проекта THE LEGENDARY POET.',
      published: atomDate(track.publishedAt),
      updated: atomDate(track.publishedAt),
      author: 'THE LEGENDARY POET',
      categories: ['музыка', track.poet],
    })),
]
  .filter((entry) => entry.updated)
  .sort((a, b) => b.updated.localeCompare(a.updated));

if (!entries.length) throw new Error('feed.xml: no published entries');
const feedUpdated = entries[0].updated;

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ru">
  <id>${BASE}/</id>
  <title>THE LEGENDARY POET</title>
  <subtitle>Новые статьи, биографические исследования и музыкальные публикации проекта.</subtitle>
  <link href="${BASE}/" />
  <link rel="self" type="application/atom+xml" href="${BASE}/feed.xml" />
  <updated>${feedUpdated}</updated>
  <author><name>THE LEGENDARY POET</name><uri>${BASE}/about</uri></author>
${entries.map((entry) => `  <entry>
    <id>${BASE}${entry.path}</id>
    <title>${escapeXml(entry.title)}</title>
    <link href="${BASE}${entry.path}" />
    <published>${entry.published || entry.updated}</published>
    <updated>${entry.updated}</updated>
    <author><name>${escapeXml(entry.author)}</name></author>
    <summary type="text">${escapeXml(entry.summary)}</summary>
${entry.categories.map((category) => `    <category term="${escapeXml(category)}" />`).join('\n')}
  </entry>`).join('\n')}
</feed>
`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, xml);
console.log(`feed.xml: ${entries.length} published entries, updated ${feedUpdated}`);
