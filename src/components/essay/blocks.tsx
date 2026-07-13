import { Fragment, type ReactNode } from 'react';
import { Quote, Feather } from 'lucide-react';
import { EssayBlock } from '../../types/essay';

/** Render text with **double-asterisk** spans as glowing gold emphasis. */
function withGold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={i} className="gold-gradient gold-glow-text font-medium">
          {part.slice(2, -2)}
        </span>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * The essay rendering "engine": one styled component per block type.
 * New articles never restyle — they just compose these blocks as data.
 */

function slugifyAnchor(heading: string, explicit?: string) {
  if (explicit) return explicit;
  return (
    'sec-' +
    heading
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
  );
}

function Paragraphs({ text }: { text: string }) {
  const parts = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (
        <p key={i} className="mb-6 text-lg md:text-xl leading-[1.9] text-luxury-gray-light font-light">
          {p}
        </p>
      ))}
    </>
  );
}

const voiceAccent: Record<string, string> = {
  self: 'border-luxury-gold/30',
  friend: 'border-cyan-400/25',
  poet: 'border-purple-400/25',
  historian: 'border-cyan-300/20',
};

const voiceLabel: Record<string, string> = {
  self: 'Сам Есенин',
  friend: 'Из круга поэта',
  poet: 'Голос поэта',
  historian: 'Историк литературы',
};

export function EssayBlockView({ block }: { block: EssayBlock }) {
  switch (block.type) {
    case 'epigraph':
      return (
        <div className="my-10 ml-auto max-w-md text-right">
          <p className="font-serif text-lg italic leading-relaxed text-luxury-gold/80">{block.text}</p>
          {block.cite && <p className="mt-2 text-xs uppercase tracking-[0.18em] text-luxury-gray-light/50">{block.cite}</p>}
        </div>
      );

    case 'lead':
      return (
        <p className="mb-10 font-serif text-2xl md:text-3xl leading-[1.5] text-white first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-7xl first-letter:font-bold first-letter:leading-[0.8] first-letter:text-luxury-gold">
          {block.text}
        </p>
      );

    case 'section': {
      const anchor = slugifyAnchor(block.heading, block.anchor);
      return (
        <h2 id={anchor} className="scroll-mt-28 mt-16 mb-8 flex items-center gap-4 font-serif text-3xl md:text-4xl font-bold text-white">
          <span className="h-px w-8 bg-luxury-gold/50" />
          <span className="gold-gradient gold-glow-text">{block.heading}</span>
        </h2>
      );
    }

    case 'paragraph':
      return <Paragraphs text={block.text} />;

    case 'pullquote':
      return (
        <blockquote className="my-12 border-l-4 border-luxury-gold pl-8 md:pl-10">
          <p className="font-serif text-2xl md:text-3xl italic leading-[1.5] text-white gold-glow-text">
            «{withGold(block.text)}»
          </p>
          {block.cite && <cite className="mt-4 block text-sm not-italic uppercase tracking-[0.18em] text-luxury-gold/70">{block.cite}</cite>}
        </blockquote>
      );

    case 'poem': {
      const blood = block.variant === 'blood';
      return (
        <figure
          className={`group/poem relative my-12 overflow-hidden rounded-[2rem] border px-8 py-10 md:px-12 shadow-inner ${
            blood ? 'border-red-500/20 bg-[#0a0505]' : 'border-luxury-gold/10 bg-[#050505]'
          }`}
        >
          {/* Illuminated left rule */}
          <span
            className={`absolute left-0 top-8 bottom-8 w-[3px] rounded-full ${
              blood ? 'bg-gradient-to-b from-red-500/60 to-red-900/10' : 'bg-gradient-to-b from-luxury-gold/60 to-luxury-gold/5'
            }`}
          />
          {block.title && (
            <figcaption className="mb-5 flex flex-wrap items-baseline gap-3">
              <span className={`font-serif text-xl font-semibold ${blood ? 'text-red-200' : 'text-luxury-gold-light'}`}>
                «{block.title}»
              </span>
              {block.year && <span className="text-[11px] uppercase tracking-[0.18em] text-luxury-gray-light/50">{block.year}</span>}
              {blood && (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-500/25 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-red-300/80">
                  <Feather size={10} /> написано кровью
                </span>
              )}
            </figcaption>
          )}
          <div
            className={`poetry-text whitespace-pre-line text-xl md:text-2xl leading-[1.9] tracking-wide ${
              blood ? 'text-red-50/90' : 'text-white/90'
            }`}
          >
            {withGold(block.lines)}
          </div>
          {block.note && (
            <p className={`mt-5 border-t pt-4 text-sm italic ${blood ? 'border-red-500/15 text-red-100/60' : 'border-luxury-gold/10 text-luxury-gray-light/70'}`}>
              {block.note}
            </p>
          )}
        </figure>
      );
    }

    case 'voice': {
      const kind = block.kind || 'friend';
      return (
        <div className={`my-8 rounded-3xl border ${voiceAccent[kind]} bg-[#0a0a0a] p-6 md:p-8`}>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gray-light/50">
            <Quote size={13} className="text-luxury-gold/50" /> {voiceLabel[kind]}
          </div>
          <p className="font-serif text-xl md:text-2xl italic leading-relaxed text-white mb-4">«{block.quote}»</p>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-white/5 pt-4">
            <div>
              <span className="text-sm font-bold text-white">{block.author}</span>
              <span className="text-xs text-luxury-gray-light/60"> — {block.role}</span>
            </div>
            {block.sourceUrl ? (
              <a href={block.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] uppercase tracking-wider text-luxury-gold/60 hover:text-luxury-gold transition-colors">
                {block.source}
              </a>
            ) : (
              <span className="text-[11px] uppercase tracking-wider text-luxury-gray-light/40">{block.source}</span>
            )}
          </div>
        </div>
      );
    }

    case 'note':
      return (
        <aside className="my-10 rounded-[2rem] border-l-[6px] border-l-cyan-400/60 bg-[#061018]/60 p-6 md:p-8">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">THE LEGENDARY POET — ремарка</div>
          <p className="text-lg leading-relaxed text-cyan-50/85 font-light italic">{block.text}</p>
        </aside>
      );

    case 'reflection':
      return (
        <aside className="relative my-14 overflow-hidden rounded-[2.5rem] border border-luxury-gold/25 bg-gradient-to-br from-[#12100a] via-[#0b0a07] to-[#050505] p-8 md:p-12 shadow-[0_0_60px_rgba(212,175,55,0.06)]">
          {/* candle-glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-luxury-gold/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 -bottom-10 text-luxury-gold/5"><Feather size={200} /></div>
          <div className="relative z-10">
            <div className="mb-5 flex items-center justify-center gap-3 text-luxury-gold/70">
              <span className="h-px w-10 bg-luxury-gold/40" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{block.heading || 'Библейская ремарка'}</span>
              <span className="h-px w-10 bg-luxury-gold/40" />
            </div>
            {block.text.split(/\n{2,}/).map((p, i) => (
              <p key={i} className="mx-auto mb-5 max-w-2xl text-center font-serif text-xl md:text-2xl leading-[1.7] text-luxury-gold-light/90 italic">
                {withGold(p.trim())}
              </p>
            ))}
          </div>
        </aside>
      );

    case 'divider':
      return (
        <div className="my-14 flex items-center justify-center gap-4" aria-hidden="true">
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-luxury-gold/40" />
          <span className="text-luxury-gold/50">✦</span>
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-luxury-gold/40" />
        </div>
      );

    default:
      return null;
  }
}
