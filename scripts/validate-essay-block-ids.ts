import { essays } from '../src/data/essays/index';

const errors: string[] = [];
const idPattern = /^[a-z0-9-]+$/;

for (const essay of essays) {
  const seen = new Set<string>();

  for (const [index, block] of essay.blocks.entries()) {
    if (block.id) {
      if (!idPattern.test(block.id)) {
        errors.push(`${essay.slug}: block ${index + 1} has invalid id ${block.id}`);
      }
      if (seen.has(block.id)) {
        errors.push(`${essay.slug}: duplicate block id ${block.id}`);
      }
      seen.add(block.id);
    }

    const hasInlineSources = 'sourceIds' in block && Boolean(block.sourceIds?.length);
    const hasEditorialPlacement = block.type === 'image' && Boolean(block.placement && block.placement !== 'full');

    if ((hasInlineSources || hasEditorialPlacement) && !block.id) {
      errors.push(
        `${essay.slug}: block ${index + 1} needs a stable id because it has ${
          hasInlineSources ? 'inline citations' : 'editorial image placement'
        }`,
      );
    }
  }
}

for (const error of errors) console.error(`ERROR ${error}`);
console.log(`Essay block id validation: ${essays.length} essays, ${errors.length} errors`);
if (errors.length > 0) process.exit(1);
