import { Quote } from 'lucide-react';
import { EssayBlock } from '../../types/essay';

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
            «{block.text}»
          </p>
          {block.cite && <cite className="mt-4 block text-sm not-italic uppercase tracking-[0.18em] text-luxury-gold/70">{block.cite}</cite>}
        </blockquote>
      );

    case 'poem':
      return (
        <figure className="my-12 rounded-[2rem] border border-luxury-gold/10 bg-[#050505] px-8 py-10 md:px-12 shadow-inner">
          {block.title && (
            <figcaption className="mb-5 flex flex-wrap items-baseline gap-3">
              <span className="font-serif text-xl font-semibold text-luxury-gold-light">«{block.title}»</span>
              {block.year && <span className="text-[11px] uppercase tracking-[0.18em] text-luxury-gray-light/50">{block.year}</span>}
            </figcaption>
          )}
          <div className="poetry-text whitespace-pre-line text-xl md:text-2xl leading-[1.9] tracking-wide text-white/90">
            {block.lines}
          </div>
          {block.note && <p className="mt-5 border-t border-luxury-gold/10 pt-4 text-sm italic text-luxury-gray-light/70">{block.note}</p>}
        </figure>
      );

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
