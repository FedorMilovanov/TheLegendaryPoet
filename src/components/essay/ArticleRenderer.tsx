import { EssayBlock } from '../../types/essay';
import { EssayBlockView } from './blocks';
import Reveal from '../Reveal';

/** Extract section headings for a table of contents / meta-rail. */
export function getEssayToc(blocks: EssayBlock[]) {
  return blocks
    .filter((b): b is Extract<EssayBlock, { type: 'section' }> => b.type === 'section')
    .map((b) => ({
      heading: b.heading,
      anchor: b.anchor || 'sec-' + b.heading.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-+|-+$/g, ''),
    }));
}

export default function ArticleRenderer({ blocks }: { blocks: EssayBlock[] }) {
  return (
    <div className="essay-body">
      {blocks.map((block, i) => (
        <Reveal key={i} direction="up" distance={18} once className="will-change-transform">
          <EssayBlockView block={block} />
        </Reveal>
      ))}
    </div>
  );
}
