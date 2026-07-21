import type { EssayBlock } from '../../types/essay';
import { EssayBlockView } from './blocks';
import { sectionAnchor } from './anchor';
import { titleCase } from '../../utils/titleCase';
import Reveal from '../Reveal';

export interface TocEntry {
  heading: string;
  anchor: string;
  number: number;
}

/**
 * Remove only accidental adjacent duplicate section headings.
 *
 * The source data is still validated in CI; this is a defensive rendering
 * guard so one duplicated heading cannot produce two identical anchors or a
 * repeated chapter in production while an editorial fix is being prepared.
 */
export function normalizeEssayBlocks(blocks: EssayBlock[]): EssayBlock[] {
  return blocks.filter((block, index) => {
    if (block.type !== 'section' || index === 0) return true;

    const previous = blocks[index - 1];
    return !(
      previous.type === 'section' &&
      previous.heading.trim().toLocaleLowerCase('ru-RU') ===
        block.heading.trim().toLocaleLowerCase('ru-RU')
    );
  });
}

/** Extract numbered section headings for the table of contents / meta-rail. */
export function getEssayToc(blocks: EssayBlock[]): TocEntry[] {
  let n = 0;
  return normalizeEssayBlocks(blocks)
    .filter((b): b is Extract<EssayBlock, { type: 'section' }> => b.type === 'section')
    .map((b) => ({
      heading: titleCase(b.heading),
      anchor: sectionAnchor(b.heading, b.anchor),
      number: ++n,
    }));
}

export default function ArticleRenderer({ blocks }: { blocks: EssayBlock[] }) {
  let sectionCount = 0;
  const normalizedBlocks = normalizeEssayBlocks(blocks);

  return (
    <div className="essay-body">
      {normalizedBlocks.map((block, i) => {
        const sectionNumber = block.type === 'section' ? ++sectionCount : undefined;
        return (
          <Reveal key={i} direction="up" distance={18} once className="will-change-transform">
            <EssayBlockView block={block} sectionNumber={sectionNumber} />
          </Reveal>
        );
      })}
    </div>
  );
}
