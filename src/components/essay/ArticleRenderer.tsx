import type { EssayBlock, EssaySource } from '../../types/essay';
import { EssayBlockView } from './blocks';
import StableEssayImage from './StableEssayImage';
import { sectionAnchor } from './anchor';
import { titleCase } from '../../utils/titleCase';
import Reveal from '../Reveal';
import InlineCitations, { type EssaySourceReferenceMap } from './InlineCitations';

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

function buildSourceReferences(sources: EssaySource[]): EssaySourceReferenceMap {
  return Object.fromEntries(
    sources.flatMap((source, index) =>
      source.id ? [[source.id, { number: index + 1, source }] as const] : [],
    ),
  );
}

function blockLayout(block: EssayBlock): { className: string; direction: 'up' | 'left' | 'right' } {
  if (block.type === 'image' && block.placement === 'left') {
    return {
      className: 'lg:float-left lg:mr-9 lg:mb-5 lg:w-[46%] lg:[&_figure]:my-2',
      direction: 'right',
    };
  }
  if (block.type === 'image' && block.placement === 'right') {
    return {
      className: 'lg:float-right lg:ml-9 lg:mb-5 lg:w-[46%] lg:[&_figure]:my-2',
      direction: 'left',
    };
  }

  const clearFloat =
    block.type === 'section' ||
    block.type === 'image' ||
    block.type === 'pullquote' ||
    block.type === 'poem' ||
    block.type === 'voice' ||
    block.type === 'note' ||
    block.type === 'reflection' ||
    block.type === 'divider';

  return {
    className: clearFloat ? 'clear-both' : '',
    direction: 'up',
  };
}

export default function ArticleRenderer({
  blocks,
  sources = [],
}: {
  blocks: EssayBlock[];
  sources?: EssaySource[];
}) {
  let sectionCount = 0;
  const normalizedBlocks = normalizeEssayBlocks(blocks);
  const references = buildSourceReferences(sources);

  return (
    <div className="essay-body flow-root">
      {normalizedBlocks.map((block, i) => {
        const sectionNumber = block.type === 'section' ? ++sectionCount : undefined;
        const sourceIds = 'sourceIds' in block ? block.sourceIds : undefined;
        const citations = sourceIds?.length ? (
          <InlineCitations sourceIds={sourceIds} references={references} />
        ) : undefined;
        const layout = blockLayout(block);
        const blockView =
          block.type === 'image' ? (
            <StableEssayImage block={block} />
          ) : (
            <EssayBlockView
              block={block}
              sectionNumber={sectionNumber}
              citations={citations}
            />
          );
        const className = `${layout.className} essay-block-shell essay-block-${block.type}`;

        // Fixed overlays must not be nested under a transformed Reveal node.
        // StableEssayImage owns both the pointer tilt and a body-level portal,
        // while its shell remains a normal document-flow element.
        if (block.type === 'image') {
          return (
            <div key={`${block.type}-${i}`} className={className}>
              {blockView}
            </div>
          );
        }

        return (
          <Reveal
            key={`${block.type}-${i}`}
            direction={layout.direction}
            distance={18}
            once
            // Dozens of blur-filter animations on a long article force large
            // offscreen textures while the reader scrolls. Opacity + translation
            // keeps the same quiet reveal without competing with images or Tilt.
            blur={false}
            className={className}
          >
            {blockView}
          </Reveal>
        );
      })}
    </div>
  );
}
