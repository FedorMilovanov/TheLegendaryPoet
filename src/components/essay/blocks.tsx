import { useEffect, useState } from 'react';
import { ExternalLink, Feather, Maximize2, Quote, X } from 'lucide-react';
import type { EssayBlock } from '../../types/essay';
import { withGold, splitParagraphs } from './richText';
import { sectionAnchor } from './anchor';
import { voiceConfig, DEFAULT_VOICE_KIND, poemVariant } from './theme';
import { titleCase } from '../../utils/titleCase';
import TiltCard from '../TiltCard';

/**
 * The essay rendering "engine": one styled component per block type, dispatched
 * by `EssayBlockView`. New articles never restyle — they compose these blocks
 * as data. All visual tokens live in ./theme; inline emphasis in ./richText.
 *
 * To add a block type: extend the `EssayBlock` union in types/essay.ts, add a
 * component here, and add its `case` to the switch. The `never` guard makes a
 * missing case a compile error, so the engine can't silently drop a block.
 */

type Block<T extends EssayBlock['type']> = Extract<EssayBlock, { type: T }>;

function EpigraphBlock({ block }: { block: Block<'epigraph'> }) {
  return (
    <div className="my-10 ml-auto max-w-md text-right">
      <Quote size={18} className="ml-auto mb-2 text-luxury-gold/40" aria-hidden="true" />
      <p className="font-serif text-lg italic leading-relaxed text-luxury-gold/80 text-pretty">{block.text}</p>
      {block.cite && (
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-luxury-gray-light/50">{block.cite}</p>
      )}
    </div>
  );
}

function LeadBlock({ block }: { block: Block<'lead'> }) {
  return (
    <p className="essay-lead mb-10 font-serif text-2xl md:text-3xl leading-[1.5] text-white text-pretty">
      {block.text}
    </p>
  );
}

function SectionBlock({ block, number }: { block: Block<'section'>; number?: number }) {
  const anchor = sectionAnchor(block.heading, block.anchor);
  return (
    <h2
      id={anchor}
      className="scroll-mt-28 mt-16 mb-8 flex items-baseline gap-4 font-serif text-3xl md:text-4xl font-bold text-white text-balance"
    >
      {number != null && (
        <span className="essay-section-number" aria-hidden="true">
          {String(number).padStart(2, '0')}
        </span>
      )}
      <span className="h-px w-8 self-center bg-luxury-gold/50" />
      <span className="gold-gradient gold-glow-text">{titleCase(block.heading)}</span>
    </h2>
  );
}

function ParagraphBlock({ block }: { block: Block<'paragraph'> }) {
  return (
    <>
      {splitParagraphs(block.text).map((p, i) => (
        <p key={i} className="mb-6 text-lg md:text-xl leading-[1.9] text-luxury-gray-light font-light text-pretty">
          {withGold(p)}
        </p>
      ))}
    </>
  );
}

const kindLabels = {
  archive: 'Архив',
  restoration: 'Цифровая реставрация',
  reconstruction: 'Художественная реконструкция',
  document: 'Документ',
} as const;

function ImageMeta({ block }: { block: Pick<Block<'image'>, 'caption' | 'credit' | 'sourceUrl' | 'kind'> }) {
  const kind = block.kind ?? 'archive';
  return (
    <figcaption className="mt-3 flex flex-wrap items-start justify-between gap-x-5 gap-y-2 px-1 text-[11px] leading-relaxed text-luxury-gray-light/55">
      <span className="min-w-0 flex-1">
        <span className="mr-2 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-luxury-gray-light/60">
          {kindLabels[kind]}
        </span>
        {block.caption}
        {block.credit ? <span className="text-luxury-gray-light/35"> · {block.credit}</span> : null}
      </span>
      {block.sourceUrl && (
        <a
          href={block.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-8 shrink-0 items-center gap-1 py-1 uppercase tracking-[0.14em] text-luxury-gold/55 transition hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/60"
        >
          Источник <ExternalLink size={11} />
        </a>
      )}
    </figcaption>
  );
}

function ImageBlock({ block }: { block: Block<'image'> }) {
  const [open, setOpen] = useState(false);
  const layout = block.layout ?? 'wide';
  const frameClass =
    layout === 'portrait'
      ? 'mx-auto max-w-xl aspect-[4/5]'
      : layout === 'cinematic'
        ? 'aspect-[16/9]'
        : 'aspect-[3/2]';

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const image = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`group relative block w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080808] text-left shadow-[0_24px_70px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70 ${frameClass}`}
      aria-label={`Увеличить изображение: ${block.alt}`}
    >
      <img
        src={block.src}
        alt={block.alt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover grayscale-[0.08] transition duration-700 ease-out group-hover:scale-[1.018] group-hover:contrast-[1.04]"
        style={{ objectPosition: block.objectPosition || '50% 50%' }}
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/[0.03]" />
      <span className="pointer-events-none absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/65 opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-visible:opacity-100">
        <Maximize2 size={15} />
      </span>
    </button>
  );

  return (
    <>
      <figure className="my-12">
        {block.tilt === false ? image : <TiltCard intensity={4}>{image}</TiltCard>}
        <ImageMeta block={block} />
      </figure>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={block.alt}
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/92 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/75 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold"
            aria-label="Закрыть изображение"
          >
            <X size={20} />
          </button>
          <div className="max-h-[92vh] max-w-[94vw]">
            <img src={block.src} alt={block.alt} className="max-h-[84vh] max-w-full rounded-xl object-contain shadow-2xl" />
            <p className="mx-auto mt-3 max-w-4xl text-center text-xs leading-relaxed text-white/55">{block.caption}</p>
          </div>
        </div>
      )}
    </>
  );
}

function PullquoteBlock({ block }: { block: Block<'pullquote'> }) {
  return (
    <blockquote className="my-12 border-l-4 border-luxury-gold pl-8 md:pl-10">
      <p className="font-serif text-2xl md:text-3xl italic leading-[1.5] text-white gold-glow-text text-pretty">
        «{withGold(block.text)}»
      </p>
      {block.cite && (
        <cite className="mt-4 block text-sm not-italic uppercase tracking-[0.18em] text-luxury-gold/70">
          {block.cite}
        </cite>
      )}
    </blockquote>
  );
}

function PoemBlock({ block }: { block: Block<'poem'> }) {
  const v = poemVariant[block.variant === 'blood' ? 'blood' : 'default'];
  const blood = block.variant === 'blood';
  return (
    <figure className={`group/poem relative my-12 overflow-hidden rounded-[2rem] border px-8 py-10 md:px-12 shadow-inner ${v.frame}`}>
      <span className={`absolute left-0 top-8 bottom-8 w-[3px] rounded-full ${v.rule}`} />
      {block.title && (
        <figcaption className="mb-5 flex flex-wrap items-baseline gap-3">
          <span className={`font-serif text-xl font-semibold ${v.title}`}>«{block.title}»</span>
          {block.year && (
            <span className="text-[11px] uppercase tracking-[0.18em] text-luxury-gray-light/50">{block.year}</span>
          )}
          {blood && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/25 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-red-300/80">
              <Feather size={10} /> написано кровью
            </span>
          )}
        </figcaption>
      )}
      <div className={`poetry-text whitespace-pre-line text-xl md:text-2xl leading-[1.9] tracking-wide ${v.body}`}>
        {withGold(block.lines)}
      </div>
      {block.note && (
        <p className={`mt-5 border-t pt-4 text-sm italic ${v.noteRule}`}>{block.note}</p>
      )}
    </figure>
  );
}

function VoiceBlock({ block }: { block: Block<'voice'> }) {
  const cfg = voiceConfig[block.kind ?? DEFAULT_VOICE_KIND];
  return (
    <div className={`my-8 rounded-3xl border ${cfg.border} bg-[#0a0a0a] p-6 md:p-8`}>
      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gray-light/50">
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
        {cfg.label}
      </div>
      <p className="font-serif text-xl md:text-2xl italic leading-relaxed text-white mb-4 text-pretty">«{block.quote}»</p>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-white/5 pt-4">
        <div>
          <span className="text-sm font-bold text-white">{block.author}</span>
          <span className="text-xs text-luxury-gray-light/60"> — {block.role}</span>
        </div>
        {block.sourceUrl ? (
          <a
            href={block.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] uppercase tracking-wider text-luxury-gold/60 transition-colors hover:text-luxury-gold"
          >
            {block.source}
          </a>
        ) : (
          <span className="text-[11px] uppercase tracking-wider text-luxury-gray-light/40">{block.source}</span>
        )}
      </div>
    </div>
  );
}

function NoteBlock({ block }: { block: Block<'note'> }) {
  return (
    <aside className="my-10 rounded-[2rem] border-l-[6px] border-l-cyan-400/60 bg-[#061018]/60 p-6 md:p-8">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
        THE LEGENDARY POET — ремарка
      </div>
      <p className="text-lg leading-relaxed text-cyan-50/85 font-light italic text-pretty">{block.text}</p>
    </aside>
  );
}

function ReflectionBlock({ block }: { block: Block<'reflection'> }) {
  return (
    <aside className="relative my-14 overflow-hidden rounded-[2.5rem] border border-luxury-gold/25 bg-gradient-to-br from-[#12100a] via-[#0b0a07] to-[#050505] p-8 md:p-12 shadow-[0_0_60px_rgba(212,175,55,0.06)]">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-luxury-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 -bottom-10 text-luxury-gold/5">
        <Feather size={200} />
      </div>
      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-center gap-3 text-luxury-gold/70">
          <span className="h-px w-10 bg-luxury-gold/40" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{titleCase(block.heading || 'Библейская ремарка')}</span>
          <span className="h-px w-10 bg-luxury-gold/40" />
        </div>
        {splitParagraphs(block.text).map((p, i) => (
          <p key={i} className="mx-auto mb-5 max-w-2xl text-center font-serif text-xl md:text-2xl leading-[1.7] text-luxury-gold-light/90 italic text-pretty">
            {withGold(p)}
          </p>
        ))}
      </div>
    </aside>
  );
}

function DividerBlock() {
  return (
    <div className="my-14 flex items-center justify-center gap-4" aria-hidden="true">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-luxury-gold/40" />
      <span className="text-luxury-gold/50">✦</span>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-luxury-gold/40" />
    </div>
  );
}

export function EssayBlockView({ block, sectionNumber }: { block: EssayBlock; sectionNumber?: number }) {
  switch (block.type) {
    case 'epigraph':
      return <EpigraphBlock block={block} />;
    case 'lead':
      return <LeadBlock block={block} />;
    case 'section':
      return <SectionBlock block={block} number={sectionNumber} />;
    case 'paragraph':
      return <ParagraphBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'pullquote':
      return <PullquoteBlock block={block} />;
    case 'poem':
      return <PoemBlock block={block} />;
    case 'voice':
      return <VoiceBlock block={block} />;
    case 'note':
      return <NoteBlock block={block} />;
    case 'reflection':
      return <ReflectionBlock block={block} />;
    case 'divider':
      return <DividerBlock />;
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}
