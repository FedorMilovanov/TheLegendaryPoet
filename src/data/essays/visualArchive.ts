import type { EssayBlock } from '../../types/essay';

type ArchiveImage = Extract<EssayBlock, { type: 'image' }>;

/** Insert sourced visuals after a stable section id, never after editable display text. */
export function insertArchiveImages(
  blocks: EssayBlock[],
  imagesBySectionId: Record<string, ArchiveImage[]>,
): EssayBlock[] {
  const matched = new Set<string>();
  const result = blocks.reduce<EssayBlock[]>((output, block) => {
    output.push(block);
    if (block.type === 'section' && block.id) {
      const images = imagesBySectionId[block.id];
      if (images) {
        matched.add(block.id);
        output.push(...images);
      }
    }
    return output;
  }, []);

  for (const sectionId of Object.keys(imagesBySectionId)) {
    if (!matched.has(sectionId)) {
      throw new Error(`Archive image group points to missing section: ${sectionId}`);
    }
  }
  return result;
}

/** Return the essay movement beginning with a stable section id. */
export function fromSection(blocks: EssayBlock[], sectionId: string): EssayBlock[] {
  const index = blocks.findIndex(
    (block) => block.type === 'section' && block.id === sectionId,
  );
  if (index < 0) throw new Error(`Essay movement section not found: ${sectionId}`);
  return blocks.slice(index);
}
