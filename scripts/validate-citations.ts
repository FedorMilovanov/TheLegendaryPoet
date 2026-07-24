import { essays } from '../src/data/essays/index';
import { stableCitationRuleSets } from '../src/data/essays/essayCitations';

const errors: string[] = [];
const warnings: string[] = [];

const minimumCitedBlocks: Record<string, number> = {
  'mayakovsky-before-revolution': 10,
  'mayakovsky-gromovoy': 10,
  'brik-case': 9,
};

for (const essay of essays) {
  const sourceMap = new Map<string, NonNullable<typeof essay.sources>[number]>();

  for (const [index, source] of (essay.sources ?? []).entries()) {
    const ids = [source.id, ...(source.aliases ?? [])].filter(
      (id): id is string => Boolean(id),
    );
    const localIds = new Set<string>();

    for (const id of ids) {
      if (!/^[a-z0-9-]+$/.test(id)) {
        errors.push(`${essay.slug}: source ${index + 1} has invalid id or alias ${id}`);
      }
      if (localIds.has(id)) {
        errors.push(`${essay.slug}: source ${index + 1} repeats id or alias ${id}`);
      }
      localIds.add(id);
      if (sourceMap.has(id)) {
        errors.push(`${essay.slug}: duplicate bibliography id or alias ${id}`);
      } else {
        sourceMap.set(id, source);
      }
    }
  }

  let citedBlocks = 0;
  let citationCount = 0;
  const blockIdMap = new Map<string, number>();

  for (const [index, block] of essay.blocks.entries()) {
    if (block.id) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(block.id)) {
        errors.push(`${essay.slug}: block ${index + 1} has invalid stable id ${block.id}`);
      }
      const previousIndex = blockIdMap.get(block.id);
      if (previousIndex != null) {
        errors.push(`${essay.slug}: blocks ${previousIndex + 1} and ${index + 1} repeat stable id ${block.id}`);
      } else {
        blockIdMap.set(block.id, index);
      }
    }

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

  const ruleSet = stableCitationRuleSets[essay.slug as keyof typeof stableCitationRuleSets];
  if (ruleSet) {
    for (const rule of ruleSet) {
      const blockIndex = blockIdMap.get(rule.blockId);
      if (blockIndex == null) {
        errors.push(`${essay.slug}: stable citation rule ${rule.blockId} is orphaned`);
        continue;
      }
      const block = essay.blocks[blockIndex];
      if (!('sourceIds' in block) || !block.sourceIds) {
        errors.push(`${essay.slug}: stable block ${rule.blockId} has no inline citations`);
        continue;
      }
      const actual = [...block.sourceIds].sort().join('|');
      const expected = [...rule.sourceIds].sort().join('|');
      if (actual !== expected) {
        errors.push(`${essay.slug}: stable block ${rule.blockId} citation map drifted`);
      }
    }

    if (blockIdMap.size < ruleSet.length) {
      errors.push(`${essay.slug}: expected at least ${ruleSet.length} stable citation block ids; found ${blockIdMap.size}`);
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
