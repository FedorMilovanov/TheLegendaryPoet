import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ExternalLink,
  Feather,
  Maximize2,
  Quote,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { EssayBlock } from '../../types/essay';
import { withGold, splitParagraphs } from './richText';
import { sectionAnchor } from './anchor';
import { voiceConfig, DEFAULT_VOICE_KIND, poemVariant } from './theme';
import { titleCase } from '../../utils/titleCase';
import TiltCard from '../TiltCard';
import { resolveEssayMedia } from './media';

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

function LeadBlock({ block, citations }: { block: Block<'lead'>; citations?: ReactNode }) {
  return (
    <p className="essay-lead mb-10 font-serif text-2xl md:text-3xl leading-[1.5] text-white text-pretty">
      {block.text}{citations}
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

function ParagraphBlock({ block, citations }: { block: Block<'paragraph'>; citations?: ReactNode }) {
  const paragraphs = splitParagraphs(block.text);
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-6 text-lg md:text-xl leading-[1.9] text-luxury-gray-light font-light text-pretty">
          {withGold(paragraph)}
          {index === paragraphs.length - 1 ? citations : null}
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
          className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md py-1 uppercase tracking-[0.14em] text-luxury-gold/55 transition hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/60"
        >
          Источник <ExternalLink size={11} aria-hidden="true" />
        </a>
      )}
    </figcaption>
  );
}

function ImageBlock({ block }: { block: Block<'image'> }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const captionId = useId();
  const layoutId = `essay-image-${useId().replace(/:/g, '')}`;
  const reduceMotion = useReducedMotion();
  const layout = block.layout ?? 'wide';
  const media = resolveEssayMedia(block);
  const frameClass =
    layout === 'portrait'
      ? 'mx-auto max-w-xl aspect-[4/5]'
      : layout === 'cinematic'
        ? 'aspect-[16/9]'
        : 'aspect-[3/2]';
  const sizes = layout === 'portrait'
    ? '(max-width: 768px) 92vw, 576px'
    : '(max-width: 1024px) 92vw, 768px';

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const focusFrame = requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      setZoomed(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
  }, [open]);

  const picture = (
    <picture className="block h-full w-full">
      {media.avifSrcSet && <source type="image/avif" srcSet={media.avifSrcSet} sizes={sizes} />}
      {media.webpSrcSet && <source type="image/webp" srcSet={media.webpSrcSet} sizes={sizes} />}
      <img
        src={media.fallback}
        alt={block.alt}
        loading="lazy"
        decoding="async"
        sizes={sizes}
        width={media.width}
        height={media.height}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        data-media-key={block.mediaKey}
        data-testid="essay-image"
        className={`h-full w-full object-cover grayscale-[0.08] transition-[opacity,transform,filter] duration-700 ease-out group-hover:scale-[1.022] group-hover:contrast-[1.045] ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ objectPosition: block.objectPosition || '50% 50%' }}
      />
    </picture>
  );

  const image = (
    <motion.button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(true)}
      whileHover={reduceMotion ? undefined : { y: -3, scale: 1.006 }}
      whileTap={reduceMotion ? undefined : { scale: 0.992 }}
      transition={{ type: 'spring', stiffness: 320, damping: 25, mass: 0.7 }}
      className={`group relative block w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080808] text-left shadow-[0_24px_70px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70 ${frameClass}`}
      aria-label={`Увеличить изображение: ${block.alt}`}
      aria-haspopup="dialog"
      data-testid="essay-image-trigger"
    >
      <motion.span
        layoutId={layoutId}
        transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.8 }}
        className="absolute inset-0"
        style={media.placeholder ? { backgroundImage: `url(${media.placeholder})`, backgroundSize: 'cover' } : undefined}
      >
        {!loaded && (
          <span className="absolute inset-0 overflow-hidden bg-[#0d0d0d]/65 backdrop-blur-lg">
            <span className="absolute inset-y-0 -left-1/2 w-1/2 animate-[shimmer_1.7s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.055] to-transparent motion-reduce:animate-none" />
          </span>
        )}
        {picture}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/38 via-transparent to-white/[0.035]" />
        <span className="pointer-events-none absolute -inset-12 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100 [background:radial-gradient(circle_at_72%_18%,rgba(212,175,55,0.12),transparent_38%)]" />
      </motion.span>
      <span className="pointer-events-none absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/65 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:opacity-100 group-focus-visible:opacity-100">
        <Maximize2 size={15} aria-hidden="true" />
      </span>
    </motion.button>
  );

  const lightbox = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={block.alt}
          aria-describedby={captionId}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: reduceMotion ? 0.12 : 0.28 }}
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 p-3 sm:p-5"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
          data-testid="essay-image-dialog"
        >
          <motion.div
            layoutId={layoutId}
            drag={zoomed || reduceMotion ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.y) > 110 || Math.abs(info.velocity.y) > 650) setOpen(false);
            }}
            transition={{ type: 'spring', stiffness: 240, damping: 30, mass: 0.85 }}
            className="relative flex max-h-[94vh] max-w-[96vw] flex-col items-center"
          >
            <div className="relative flex max-h-[86vh] max-w-[94vw] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-[0_35px_120px_rgba(0,0,0,0.75)]">
              <picture>
                {media.avifSrcSet && <source type="image/avif" srcSet={media.avifSrcSet} sizes="94vw" />}
                {media.webpSrcSet && <source type="image/webp" srcSet={media.webpSrcSet} sizes="94vw" />}
                <motion.img
                  src={media.fallback}
                  alt={block.alt}
                  decoding="async"
                  width={media.width}
                  height={media.height}
                  drag={zoomed}
                  dragMomentum={false}
                  dragElastic={0.08}
                  animate={{ scale: zoomed ? 1.65 : 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  onDoubleClick={() => setZoomed((value) => !value)}
                  className={`max-h-[84vh] max-w-[94vw] select-none object-contain ${zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
                />
              </picture>
              <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.035]" />
            </div>

            <div className="mt-3 flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-1">
              <p id={captionId} className="min-w-0 flex-1 text-xs leading-relaxed text-white/58">
                {block.caption}
                {block.credit ? <span className="text-white/32"> · {block.credit}</span> : null}
              </p>
              <div className="flex items-center gap-2">
                {block.sourceUrl && (
                  <a
                    href={block.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white/55 transition hover:border-luxury-gold/30 hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70"
                    data-testid="essay-image-source"
                  >
                    Источник <ExternalLink size={11} />
                  </a>
                )}
                <motion.button
                  type="button"
                  onClick={() => setZoomed((value) => !value)}
                  whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/60 transition hover:border-luxury-gold/30 hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70"
                  aria-label={zoomed ? 'Уменьшить изображение' : 'Увеличить изображение'}
                  aria-pressed={zoomed}
                  data-testid="essay-image-zoom"
                >
                  {zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            whileHover={reduceMotion ? undefined : { rotate: 4, scale: 1.05 }}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/75 backdrop-blur-md transition hover:border-luxury-gold/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold sm:right-5 sm:top-5 sm:h-12 sm:w-12"
            aria-label="Закрыть изображение"
            data-testid="essay-image-close"
          >
            <X size={20} aria-hidden="true" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <motion.figure layout className="my-12" data-image-kind={block.kind ?? 'archive'}>
        {block.tilt === false ? image : <TiltCard intensity={4}>{image}</TiltCard>}
        <ImageMeta block={block} />
      </motion.figure>
      {typeof document !== 'undefined' ? createPortal(lightbox, document.body) : null}
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

function NoteBlock({ block, citations }: { block: Block<'note'>; citations?: ReactNode }) {
  return (
    <aside className="my-10 rounded-[2rem] border-l-[6px] border-l-cyan-400/60 bg-[#061018]/60 p-6 md:p-8">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
        THE LEGENDARY POET — ремарка
      </div>
      <p className="text-lg leading-relaxed text-cyan-50/85 font-light italic text-pretty">
        {block.text}{citations}
      </p>
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
        {splitParagraphs(block.text).map((paragraph, index) => (
          <p key={index} className="mx-auto mb-5 max-w-2xl text-center font-serif text-xl md:text-2xl leading-[1.7] text-luxury-gold-light/90 italic text-pretty">
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
      return <ImageBlock block={block} />;
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
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}
