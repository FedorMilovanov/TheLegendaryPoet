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
    <div className="essay-body">
      {normalizedBlocks.map((block, i) => {
        const sectionNumber = block.type === 'section' ? ++sectionCount : undefined;
        const sourceIds = 'sourceIds' in block ? block.sourceIds : undefined;
        return (
          <Reveal key={`${block.type}-${i}`} direction="up" distance={18} once className="will-change-transform">
            <EssayBlockView block={block} sectionNumber={sectionNumber} />
            {sourceIds?.length ? (
              <div className="-mt-4 mb-6 flex items-center gap-2 pl-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-luxury-gray-light/30">
                <span>Источники</span>
                <InlineCitations sourceIds={sourceIds} references={references} />
              </div>
            ) : null}
          </Reveal>
        );
      })}
    </div>
  );
}
