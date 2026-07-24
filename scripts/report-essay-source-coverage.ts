import { essays } from '../src/data/essays';
import type { EssaySourceKind } from '../src/types/essay';

const kinds: EssaySourceKind[] = ['primary', 'archive', 'research', 'institutional', 'context'];

const rows = essays.map((essay) => {
  const sources = essay.sources ?? [];
  const urls = sources
    .map((source) => source.url?.replace(/^http:/, 'https:').replace(/\/$/, ''))
    .filter((url): url is string => Boolean(url));
  const uniqueUrls = new Set(urls);
  const counts = Object.fromEntries(
    kinds.map((kind) => [kind, sources.filter((source) => source.kind === kind).length]),
  ) as Record<EssaySourceKind, number>;

  return {
    slug: essay.slug,
    title: essay.title,
    total: sources.length,
    uniqueUrls: uniqueUrls.size,
    unlinked: sources.length - urls.length,
    duplicateUrls: urls.length - uniqueUrls.size,
    ...counts,
  };
});

console.log(JSON.stringify(rows, null, 2));

for (const row of rows) {
  console.log(
    [
      row.slug,
      `total=${row.total}`,
      `unique=${row.uniqueUrls}`,
      `primary=${row.primary}`,
      `archive=${row.archive}`,
      `research=${row.research}`,
      `institutional=${row.institutional}`,
      `context=${row.context}`,
      `duplicates=${row.duplicateUrls}`,
    ].join(' | '),
  );
}
