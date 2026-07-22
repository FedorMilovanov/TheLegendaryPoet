import type { EssayBlock, EssaySource } from '../../types/essay';
import { EssayBlockView } from './blocks';
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

interface BlockLayout {
  className: string;
  direction: 'up' | 'left' | 'right';
  /** Floats must not live inside transformed wrappers: prose boxes then steal their hit area. */
  reveal: boolean;
}

function blockLayout(block: EssayBlock): BlockLayout {
  if (block.type === 'image' && block.placement === 'left') {
    return {
      className:
        'relative z-10 lg:float-left lg:mr-9 lg:mb-5 lg:w-[46%] lg:[&_figure]:my-2',
      direction: 'right',
      reveal: false,
    };
  }
  if (block.type === 'image' && block.placement === 'right') {
    return {
      className:
        'relative z-10 lg:float-right lg:ml-9 lg:mb-5 lg:w-[46%] lg:[&_figure]:my-2',
      direction: 'left',
      reveal: false,
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
    reveal: true,
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
        const content = (
          <EssayBlockView
            block={block}
            sectionNumber={sectionNumber}
            citations={citations}
          />
        );

        if (!layout.reveal) {
          return (
            <div key={`${block.type}-${i}`} className={layout.className}>
              {content}
            </div>
          );
        }

        return (
          <Reveal
            key={`${block.type}-${i}`}
            direction={layout.direction}
            distance={18}
            once
            className={`${layout.className} will-change-transform`}
          >
            {content}
          </Reveal>
        );
      })}
    </div>
  );
}
