import { getEssayBySlug } from '../src/data/essays/index';

const essay = getEssayBySlug('sergei-yesenin-1921-1925');
if (!essay) throw new Error('Yesenin Part II is not registered');

const words = essay.blocks
  .flatMap((block) => {
    const value = block as Record<string, unknown>;
    return ['text', 'heading', 'caption', 'note', 'quote', 'lines']
      .flatMap((key) => (Array.isArray(value[key]) ? (value[key] as unknown[]) : [value[key]]))
      .filter((item): item is string => typeof item === 'string');
  })
  .reduce((total, text) => total + (text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0), 0);

const sources = essay.sources ?? [];
const sourceUnits = new Set(
  sources.map((source) => source.id).filter((id): id is string => Boolean(id)),
).size;
const publicUrls = sources.filter((source) => Boolean(source.url)).length;
const primaryOrResearch = sources.filter(
  (source) => source.kind === 'primary' || source.kind === 'research',
).length;
const citedSourceIds = new Set<string>();
for (const block of essay.blocks) {
  if ('sourceIds' in block) {
    for (const id of block.sourceIds ?? []) citedSourceIds.add(id);
  }
}
const images = essay.blocks.filter((block) => block.type === 'image').length;
const documentaryImages = essay.blocks.filter(
  (block) => block.type === 'image' && (block.kind === 'archive' || block.kind === 'document'),
).length;

console.log(
  [
    'Yesenin Part II scope:',
    `${words} words`,
    `${sourceUnits} source units`,
    `${citedSourceIds.size} cited source units`,
    `${publicUrls} public URLs`,
    `${primaryOrResearch} primary/research sources`,
    `${images} visual blocks`,
    `${documentaryImages} documentary blocks`,
  ].join(' '),
);
