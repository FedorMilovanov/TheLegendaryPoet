import type { EssayBlock } from '../../types/essay';

type ArchiveImage = Extract<EssayBlock, { type: 'image' }>;

/**
 * Insert sourced visuals immediately after their matching section headings.
 * Content remains ordinary essay data; the renderer owns all interaction and styling.
 */
export function insertArchiveImages(
  blocks: EssayBlock[],
  imagesByHeading: Record<string, ArchiveImage[]>,
): EssayBlock[] {
  return blocks.flatMap((block) => {
    if (block.type !== 'section') return [block];
    return [block, ...(imagesByHeading[block.heading] ?? [])];
  });
}

/** Return the essay movement beginning with the named section. */
export function fromSection(blocks: EssayBlock[], heading: string): EssayBlock[] {
  const index = blocks.findIndex(
    (block) => block.type === 'section' && block.heading === heading,
  );
  return index >= 0 ? blocks.slice(index) : blocks;
}
