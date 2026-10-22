import { useLayoutEffect, useRef, useState } from 'react';
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
    .filter((item): item is { id: string; reference: EssaySourceReference } => Boolean(item.reference))
    .sort((a, b) => a.reference.number - b.reference.number);

  if (resolved.length === 0) return null;

  return (
    <sup className="ml-1 inline-flex whitespace-nowrap translate-y-[-0.12em] items-center gap-1 align-baseline not-italic">
      {resolved.map(({ id, reference }) => (
        <CitationLink key={id} id={id} reference={reference} />
      ))}
    </sup>
  );
}

/** Keep the existing inline tooltip within the visible window, not its anchor's center. */
function CitationLink({ id, reference }: { id: string; reference: EssaySourceReference }) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const active = hovered || focused;

  useLayoutEffect(() => {
    if (!active) return;
    const link = linkRef.current;
    const tooltip = link?.querySelector<HTMLElement>('[role="tooltip"]');
    if (!link || !tooltip) return;
    const viewport = window.visualViewport;
    const position = () => {
      const left = viewport?.offsetLeft ?? 0;
      const width = viewport?.width ?? document.documentElement.clientWidth;
      tooltip.style.setProperty('--tlp-citation-viewport-width', `${width}px`);
      const anchor = link.getBoundingClientRect();
      const tipWidth = tooltip.getBoundingClientRect().width;
      const centered = anchor.left + anchor.width / 2 - tipWidth / 2;
      const clamped = Math.max(left + 8, Math.min(centered, left + width - tipWidth - 8));
      tooltip.style.setProperty('--tlp-citation-shift', `${clamped - centered}px`);
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    viewport?.addEventListener('resize', position);
    viewport?.addEventListener('scroll', position);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      viewport?.removeEventListener('resize', position);
      viewport?.removeEventListener('scroll', position);
    };
  }, [active]);

  return (
    <a
      ref={linkRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      href={`#source-${id}`}
      title={reference.source.title}
      aria-label={`Источник ${reference.number}: ${reference.source.title}`}
      className="theme-essay-citation group/citation relative inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-luxury-gold/18 bg-luxury-gold/[0.055] px-1.5 font-sans text-[9px] font-bold leading-none tabular-nums transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-0.5 hover:border-luxury-gold/40 hover:bg-luxury-gold/[0.11]"
    >
      {reference.number}
      <span
        role="tooltip"
        className="theme-essay-citation-tooltip pointer-events-none absolute bottom-[calc(100%+0.45rem)] z-30 w-max whitespace-normal rounded-lg border border-luxury-gold/20 px-2.5 py-1.5 text-left text-[10px] font-normal leading-snug normal-case tracking-normal opacity-0 shadow-xl transition-opacity duration-150 group-hover/citation:opacity-100 group-focus-visible/citation:opacity-100"
      >
        {reference.source.title}
      </span>
    </a>
  );
}
