import { useRef, useState } from 'react';
import { sourceAnchor } from './anchor';
import { supportsPopover } from '../../utils/popover';
import { useAnchoredPanel } from '../../hooks/useAnchoredPanel';
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
    <sup className="inline-flex max-w-full translate-y-[-0.12em] flex-wrap items-center gap-1 pl-1 align-baseline not-italic">
      {resolved.map(({ id, reference }) => (
        <CitationLink key={id} reference={reference} />
      ))}
    </sup>
  );
}

function CitationLink({ reference }: { reference: EssaySourceReference }) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useAnchoredPanel(open, linkRef, tipRef);
  const show = () => tipRef.current?.showPopover();
  const hide = () => tipRef.current?.hidePopover();

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={(event) => {
        if (!tipRef.current || event.pointerType === 'touch') return;
        // An auto popover replaces its peers. A passing pointer may replace
        // another hover preview, never a keyboard preview or an open control.
        const owner = document.querySelector<HTMLElement>(':popover-open:not([role="tooltip"]), .theme-essay-citation:focus + :popover-open');
        if (!owner || owner.style.visibility === 'hidden') show();
      }}
      onPointerLeave={() => { if (document.activeElement !== linkRef.current) hide(); }}
      onPointerCancel={hide}
    >
      <a
        ref={linkRef}
        onFocus={show}
        onBlur={hide}
        onClick={hide}
        href={'#' + sourceAnchor(reference.source)}
        title={supportsPopover ? undefined : reference.source.title}
        aria-label={`Источник ${reference.number}: ${reference.source.title}`}
        className="theme-essay-citation relative inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-luxury-gold/18 bg-luxury-gold/[0.055] px-1.5 font-sans text-[9px] font-bold leading-none tabular-nums transition-colors duration-200 hover:border-luxury-gold/40 hover:bg-luxury-gold/[0.11]"
      >
        {reference.number}
      </a>
      {supportsPopover && (
        <span
          ref={tipRef}
          popover="auto"
          role="tooltip"
          onToggle={(event) => setOpen(event.currentTarget.matches(':popover-open'))}
          className="anchored-panel theme-essay-citation-tooltip w-max whitespace-normal rounded-lg border border-luxury-gold/20 px-2.5 py-1.5 text-left text-xs font-normal leading-snug normal-case tracking-normal shadow-xl"
        >
          {reference.source.title}
        </span>
      )}
    </span>
  );
}
