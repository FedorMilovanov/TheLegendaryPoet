import { essays } from '../src/data/essays/index';

const errors: string[] = [];
const warnings: string[] = [];

const minimumCitedBlocks: Record<string, number> = {
  'mayakovsky-before-revolution': 8,
  'mayakovsky-gromovoy': 8,
  'brik-case': 8,
};

for (const essay of essays) {
  const sourceMap = new Map(
    (essay.sources ?? []).flatMap((source) =>
      [source.id, ...(source.aliases ?? [])]
        .filter((id): id is string => Boolean(id))
        .map((id) => [id, source] as const),
    ),
  );

  let citedBlocks = 0;
  let citationCount = 0;

  for (const [index, block] of essay.blocks.entries()) {
    if (!('sourceIds' in block) || !block.sourceIds?.length) continue;
    citedBlocks += 1;

    const localIds = new Set<string>();
    for (const sourceId of block.sourceIds) {
      citationCount += 1;
      if (localIds.has(sourceId)) {
        errors.push(`${essay.slug}: block ${index + 1} repeats citation id ${sourceId}`);
      }
      localIds.add(sourceId);

      const source = sourceMap.get(sourceId);
      if (!source) {
        errors.push(`${essay.slug}: block ${index + 1} cites missing source id ${sourceId}`);
        continue;
      }
      if (!source.url) {
        warnings.push(`${essay.slug}: cited source ${sourceId} has no URL`);
      }
    }
  }

  const minimum = minimumCitedBlocks[essay.slug];
  if (minimum && citedBlocks < minimum) {
    errors.push(`${essay.slug}: requires at least ${minimum} cited prose blocks; found ${citedBlocks}`);
  }

  if (citationCount > 0 && sourceMap.size === 0) {
    errors.push(`${essay.slug}: has inline citations but no stable bibliography ids`);
  }
}

for (const warning of warnings) console.warn(`WARN  ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
console.log(
  `Citation validation: ${essays.length} essays, ${errors.length} errors, ${warnings.length} warnings`,
);

if (errors.length > 0) process.exit(1);
