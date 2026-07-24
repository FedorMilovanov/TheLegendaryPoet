import type { ReactNode } from 'react';
import { Feather, Quote } from 'lucide-react';
import type { EssayBlock } from '../../types/essay';
import { withGold, splitParagraphs } from './richText';
import { sectionAnchor } from './anchor';
import { voiceConfig, DEFAULT_VOICE_KIND, poemVariant } from './theme';
import { titleCase } from '../../utils/titleCase';
import StableEssayImage from './StableEssayImage';

/**
 * The essay rendering engine: one styled component per block type, dispatched
 * by `EssayBlockView`. New articles compose these blocks as data. Interactive
 * image behaviour lives only in StableEssayImage, so the renderer cannot ship a
 * second stale lightbox implementation or diverging 3D stack.
 */

type Block<T extends EssayBlock['type']> = Extract<EssayBlock, { type: T }>;

function EpigraphBlock({ block }: { block: Block<'epigraph'> }) {
  return (
    <div className="my-10 ml-auto max-w-md text-right">
      <Quote size={18} className="ml-auto mb-2 text-luxury-gold/40" aria-hidden="true" />
      <p className="text-pretty font-serif text-lg italic leading-relaxed text-luxury-gold/80">{block.text}</p>
      {block.cite && (
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-luxury-gray-light/50">{block.cite}</p>
      )}
    </div>
  );
}

function LeadBlock({ block, citations }: { block: Block<'lead'>; citations?: ReactNode }) {
  return (
    <p className="essay-lead text-pretty mb-10 font-serif text-2xl leading-[1.5] text-white md:text-3xl">
      {block.text}{citations}
    </p>
  );
}

function SectionBlock({ block, number }: { block: Block<'section'>; number?: number }) {
  const anchor = sectionAnchor(block.heading, block.anchor);
  return (
    <h2
      id={anchor}
      className="text-balance scroll-mt-28 mt-16 mb-8 flex items-baseline gap-4 font-serif text-3xl font-bold text-white md:text-4xl"
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

function ParagraphBlock({ block, citations }: { block: Block<'paragraph'>; citations?: ReactNode }) {
  const paragraphs = splitParagraphs(block.text);
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-pretty mb-6 text-lg font-light leading-[1.9] text-luxury-gray-light md:text-xl">
          {withGold(paragraph)}
          {index === paragraphs.length - 1 ? citations : null}
        </p>
      ))}
    </>
  );
}

function PullquoteBlock({ block }: { block: Block<'pullquote'> }) {
  return (
    <blockquote className="my-12 border-l-4 border-luxury-gold pl-8 md:pl-10">
      <p className="gold-glow-text text-pretty font-serif text-2xl italic leading-[1.5] text-white md:text-3xl">
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
  const variant = poemVariant[block.variant === 'blood' ? 'blood' : 'default'];
  const blood = block.variant === 'blood';
  return (
    <figure className={`group/poem relative my-12 overflow-hidden rounded-[2rem] border px-8 py-10 shadow-inner md:px-12 ${variant.frame}`}>
      <span className={`absolute left-0 top-8 bottom-8 w-[3px] rounded-full ${variant.rule}`} />
      {block.title && (
        <figcaption className="mb-5 flex flex-wrap items-baseline gap-3">
          <span className={`font-serif text-xl font-semibold ${variant.title}`}>«{block.title}»</span>
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
      <div className={`poetry-text whitespace-pre-line text-xl leading-[1.9] tracking-wide md:text-2xl ${variant.body}`}>
        {withGold(block.lines)}
      </div>
      {block.note && (
        <p className={`mt-5 border-t pt-4 text-sm italic ${variant.noteRule}`}>{block.note}</p>
      )}
    </figure>
  );
}

function VoiceBlock({ block }: { block: Block<'voice'> }) {
  const config = voiceConfig[block.kind ?? DEFAULT_VOICE_KIND];
  return (
    <div className={`my-8 rounded-3xl border bg-[#0a0a0a] p-6 md:p-8 ${config.border}`}>
      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gray-light/50">
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
        {config.label}
      </div>
      <p className="text-pretty mb-4 font-serif text-xl italic leading-relaxed text-white md:text-2xl">«{block.quote}»</p>
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

function NoteBlock({ block, citations }: { block: Block<'note'>; citations?: ReactNode }) {
  return (
    <aside className="my-10 rounded-[2rem] border-l-[6px] border-l-cyan-400/60 bg-[#061018]/60 p-6 md:p-8">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
        THE LEGENDARY POET — ремарка
      </div>
      <p className="text-pretty text-lg font-light italic leading-relaxed text-cyan-50/85">
        {block.text}{citations}
      </p>
    </aside>
  );
}

function ReflectionBlock({ block }: { block: Block<'reflection'> }) {
  return (
    <aside className="relative my-14 overflow-hidden rounded-[2.5rem] border border-luxury-gold/25 bg-gradient-to-br from-[#12100a] via-[#0b0a07] to-[#050505] p-8 shadow-[0_0_60px_rgba(212,175,55,0.06)] md:p-12">
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
        {splitParagraphs(block.text).map((paragraph, index) => (
          <p key={index} className="text-pretty mx-auto mb-5 max-w-2xl text-center font-serif text-xl italic leading-[1.7] text-luxury-gold-light/90 md:text-2xl">
            {withGold(paragraph)}
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

export function EssayBlockView({
  block,
  sectionNumber,
  citations,
}: {
  block: EssayBlock;
  sectionNumber?: number;
  citations?: ReactNode;
}) {
  switch (block.type) {
    case 'epigraph':
      return <EpigraphBlock block={block} />;
    case 'lead':
      return <LeadBlock block={block} citations={citations} />;
    case 'section':
      return <SectionBlock block={block} number={sectionNumber} />;
    case 'paragraph':
      return <ParagraphBlock block={block} citations={citations} />;
    case 'image':
      return <StableEssayImage block={block} />;
    case 'pullquote':
      return <PullquoteBlock block={block} />;
    case 'poem':
      return <PoemBlock block={block} />;
    case 'voice':
      return <VoiceBlock block={block} />;
    case 'note':
      return <NoteBlock block={block} citations={citations} />;
    case 'reflection':
      return <ReflectionBlock block={block} />;
    case 'divider':
      return <DividerBlock />;
    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}
