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

  const openSource = (id: string) => {
    const hash = `#source-${encodeURIComponent(id)}`;
    window.history.replaceState(null, '', hash);
    // replaceState does not emit hashchange. SourceLibrary listens for it so it
    // can clear filters, expand a collapsed source and then perform a Lenis-aware
    // jump only after the target row has entered the DOM.
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  return (
    <sup className="ml-1 inline-flex translate-y-[-0.12em] flex-wrap items-center gap-1 align-baseline not-italic">
      {resolved.map(({ id, reference }) => (
        <a
          key={id}
          href={`#source-${id}`}
          onClick={(event) => {
            event.preventDefault();
            openSource(id);
          }}
          title={reference.source.title}
          aria-label={`Источник ${reference.number}: ${reference.source.title}`}
          data-testid="inline-citation"
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-luxury-gold/18 bg-luxury-gold/[0.055] px-1.5 font-sans text-[9px] font-bold leading-none tabular-nums text-luxury-gold/70 transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-0.5 hover:border-luxury-gold/40 hover:bg-luxury-gold/[0.11] hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/65"
        >
          {reference.number}
        </a>
      ))}
    </sup>
  );
}
