import type { EssayBlock } from '../../types/essay';
import { EssayBlockView } from './blocks';
import { sectionAnchor } from './anchor';
import Reveal from '../Reveal';

export interface TocEntry {
  heading: string;
  anchor: string;
  number: number;
}

/** Extract numbered section headings for the table of contents / meta-rail. */
export function getEssayToc(blocks: EssayBlock[]): TocEntry[] {
  let n = 0;
  return blocks
    .filter((b): b is Extract<EssayBlock, { type: 'section' }> => b.type === 'section')
    .map((b) => ({
      heading: b.heading,
      anchor: sectionAnchor(b.heading, b.anchor),
      number: ++n,
    }));
}

export default function ArticleRenderer({ blocks }: { blocks: EssayBlock[] }) {
  let sectionCount = 0;
  return (
    <div className="essay-body">
      {blocks.map((block, i) => {
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
