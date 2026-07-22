import { getEssayBySlug } from '../src/data/essays/index';

const essay = getEssayBySlug('yesenin-kutezhi');
if (!essay) {
  console.error('ERROR yesenin-kutezhi: essay is missing');
  process.exit(1);
}

const imageBlocks = essay.blocks.filter((block) => block.type === 'image');
const sources = essay.sources ?? [];
const archiveSources = sources.filter((source) => source.kind === 'archive');
const errors: string[] = [];

if (imageBlocks.length < 8) {
  errors.push(`requires at least 8 documentary images; found ${imageBlocks.length}`);
}
if (sources.length < 30) {
  errors.push(`requires at least 30 sources; found ${sources.length}`);
}
if (archiveSources.length < 8) {
  errors.push(`requires at least 8 archive sources; found ${archiveSources.length}`);
}

for (const [index, block] of imageBlocks.entries()) {
  if (!block.sourceUrl) errors.push(`image ${index + 1} has no sourceUrl`);
  if (!block.caption.trim()) errors.push(`image ${index + 1} has no caption`);
  if (!block.alt.trim()) errors.push(`image ${index + 1} has no alt`);
  if (block.kind !== 'archive') errors.push(`image ${index + 1} is not marked as archive`);
}

for (const error of errors) console.error(`ERROR yesenin-kutezhi: ${error}`);
console.log(
  `Yesenin archive validation: ${imageBlocks.length} images, ${sources.length} sources, ${archiveSources.length} archive sources, ${errors.length} errors`,
);

if (errors.length > 0) process.exit(1);
