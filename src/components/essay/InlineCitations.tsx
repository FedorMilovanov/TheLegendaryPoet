import type { EssaySource } from '../../types/essay';

export interface EssaySourceReference {
  number: number;
  source: EssaySource;
}

export type EssaySourceReferenceMap = Record<string, EssaySourceReference>;

export default function InlineCitations({
  sourceIds,
  references,
}: {
  sourceIds?: string[];
  references?: EssaySourceReferenceMap;
}) {
  if (!sourceIds?.length || !references) return null;

  const resolved = sourceIds
    .map((id) => ({ id, reference: references[id] }))
    .filter((item): item is { id: string; reference: EssaySourceReference } => Boolean(item.reference));

  if (resolved.length === 0) return null;

  return (
    <sup className="ml-1 inline-flex translate-y-[-0.12em] flex-wrap items-center gap-1 align-baseline not-italic">
      {resolved.map(({ id, reference }) => (
        <a
          key={id}
          href={`#source-${id}`}
          title={reference.source.title}
          aria-label={`Источник ${reference.number}: ${reference.source.title}`}
          className="group/citation relative inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-luxury-gold/18 bg-luxury-gold/[0.055] px-1.5 font-sans text-[9px] font-bold leading-none tabular-nums text-luxury-gold/70 transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-0.5 hover:border-luxury-gold/40 hover:bg-luxury-gold/[0.11] hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/65"
        >
          {reference.number}
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-[calc(100%+0.45rem)] left-1/2 z-30 w-max max-w-64 -translate-x-1/2 rounded-lg border border-luxury-gold/20 bg-[#12100c] px-2.5 py-1.5 text-left text-[10px] font-normal leading-snug normal-case tracking-normal text-luxury-gray-light/85 opacity-0 shadow-xl transition-opacity duration-150 group-hover/citation:opacity-100 group-focus-visible/citation:opacity-100"
          >
            {reference.source.title}
          </span>
        </a>
      ))}
    </sup>
  );
}
