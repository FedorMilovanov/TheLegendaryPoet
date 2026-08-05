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
    (essay.sources ?? [])
      .filter((source): source is typeof source & { id: string } => Boolean(source.id))
      .map((source) => [source.id, source]),
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

/*
 * Site-wide link integrity for every bibliography.
 *
 * Two rules, both learned from real regressions:
 *  - no source may link to our own repository in place of the document it
 *    claims to be (a reader clicking a forensic act must not land in our
 *    markdown); the one allowed exception is an entry that openly presents
 *    itself as the editorial ledger;
 *  - no source may use plain http:// — five poet testimonies and two essay
 *    sources did, including feb-web.ru, which serves https everywhere else.
 */
const SELF_REFERENCE = /github\.com\/FedorMilovanov/i;

for (const essay of essays) {
  for (const source of essay.sources ?? []) {
    if (!source.url) continue;

    if (source.url.startsWith('http://')) {
      errors.push(`${essay.slug}: source ${source.id ?? source.title} uses insecure http://`);
    }
    if (
      SELF_REFERENCE.test(source.url) &&
      !/ledger|реестр|редакционн/i.test(source.title)
    ) {
      errors.push(
        `${essay.slug}: source ${source.id ?? source.title} links to our own repository instead of the document`,
      );
    }
  }
}

for (const warning of warnings) console.warn(`WARN  ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
console.log(
  `Citation validation: ${essays.length} essays, ${errors.length} errors, ${warnings.length} warnings`,
);

if (errors.length > 0) process.exit(1);
