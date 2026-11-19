import { useCallback, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ExternalLink,
  Feather,
  Maximize2,
  Quote,
  X,
} from 'lucide-react';
import type { EssayBlock } from '../../types/essay';
import { withGold, splitParagraphs, withTypography } from './richText';
import { sectionAnchor } from './anchor';
import { voiceConfig, DEFAULT_VOICE_KIND, poemVariant } from './theme';
import { titleCase } from '../../utils/titleCase';
import { asset } from '../../utils/asset';
import { useNativeImageState } from '../../hooks/useNativeImageState';
import { useDialogExitLifetime, useDialogSurface } from '../../hooks/useDialogSurface';
import TiltCard from '../TiltCard';
import LightboxFigure from './LightboxFigure';

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
    <div data-essay-block="epigraph" className="my-10 ml-auto max-w-md text-right">
      <Quote size={18} className="ml-auto mb-2 text-luxury-gold/40" aria-hidden="true" />
      <p className="font-serif text-lg italic leading-relaxed theme-poet-accent text-pretty">{withTypography(block.text)}</p>
      {block.cite && (
        <p className="mt-2 text-xs uppercase tracking-[0.18em] theme-functional-muted">{withTypography(block.cite)}</p>
      )}
    </div>
  );
}

function LeadBlock({ block, citations }: { block: Block<'lead'>; citations?: ReactNode }) {
  return (
    <p className="essay-lead mb-10 font-serif text-2xl md:text-3xl leading-[1.5] text-white text-pretty">
      {withTypography(block.text)}{citations}
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
      <span className="theme-essay-emphasis gold-gradient gold-glow-text">{titleCase(block.heading)}</span>
    </h2>
  );
}

function ParagraphBlock({ block, citations }: { block: Block<'paragraph'>; citations?: ReactNode }) {
  const paragraphs = splitParagraphs(block.text);
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="theme-essay-prose mb-6 text-lg md:text-xl leading-[1.9] font-light text-pretty">
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
    <figcaption className="essay-image-caption theme-functional-muted">
      <span className="min-w-0 flex-1">
        <span className="essay-image-kind theme-functional-muted">
          {kindLabels[kind]}
        </span>
        {block.caption}
        {block.credit ? <span className="theme-functional-subtle"> · {block.credit}</span> : null}
      </span>
      {block.sourceUrl && (
        <a
          href={block.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="essay-image-source theme-control-action"
        >
          Источник <ExternalLink size={11} aria-hidden="true" />
        </a>
      )}
    </figcaption>
  );
}

function ImageBlock({ block }: { block: Block<'image'> }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const captionId = useId();
  const reduceMotion = useReducedMotion();
  const layout = block.layout ?? 'wide';
  const imageSrc = asset(block.src);
  const { ref: imageRef, state: imageState, ready: imageReady } = useNativeImageState(imageSrc);
  const frameClass =
    layout === 'portrait'
      ? 'aspect-[4/5]'
      : layout === 'cinematic'
        ? 'aspect-[16/9]'
        : 'aspect-[3/2]';
  // A figure is never painted wider than the pixels its source carries. The cap
  // is declared, not measured, so the frame keeps its place while the image
  // loads: an archive scan that survived at 300px is shown at 300px, centred,
  // instead of stretched to the column and blurred.
  const layoutWidth = layout === 'portrait' ? 576 : 768;
  const sourceWidth = block.sourceWidth && block.sourceWidth > 0
    ? Math.min(layoutWidth, block.sourceWidth)
    : layoutWidth;
  const sizes = layout === 'portrait'
    ? `(max-width: 768px) min(92vw, ${sourceWidth}px), ${sourceWidth}px`
    : `(max-width: 1024px) min(92vw, ${sourceWidth}px), ${sourceWidth}px`;

  const closeLightbox = useCallback(() => {
    setOpen(false);
  }, []);

  const lifetime = useDialogExitLifetime(open);
  useDialogSurface({
    open: lifetime.lockOpen,
    deferReleaseUntilUnmount: true,
    dialogRef,
    initialFocusRef: closeRef,
    onClose: closeLightbox,
    label: 'essay-image-lightbox',
  });

  const image = (
    <motion.button
      type="button"
      onClick={() => setOpen(true)}
      whileTap={reduceMotion ? undefined : { scale: 0.992 }}
      transition={{ type: 'spring', stiffness: 320, damping: 25, mass: 0.7 }}
      className={`essay-image-button tilt-card-surface theme-dark-island group tlp-media-shadow ${frameClass}`}
      aria-label={`Увеличить изображение: ${block.alt}${imageState === 'error' ? '. Изображение временно недоступно' : ''}`}
      aria-haspopup="dialog"
    >
      <span className="absolute inset-0">
        {!imageReady && (
          <span className="essay-image-placeholder">
            {imageState === 'error' ? (
              <span className="theme-dark-island-muted px-6 text-center text-[11px] uppercase tracking-[0.16em]">
                Изображение временно недоступно
              </span>
            ) : (
              <span className="essay-image-shimmer" />
            )}
          </span>
        )}
        <img
          ref={imageRef}
          src={imageSrc}
          alt={block.alt}
          loading={block.loading ?? 'lazy'}
          decoding="async"
          sizes={sizes}
          data-image-state={imageState}
          className={`h-full w-full object-cover grayscale-[0.08] transition-[opacity,scale,filter] duration-700 ease-out group-hover:scale-[1.022] group-hover:contrast-[1.045] ${imageReady ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectPosition: block.objectPosition || '50% 50%' }}
        />
        <span className="essay-image-shade" />
        <span className="essay-image-glow" />
      </span>
      <span className="essay-image-expand">
        <Maximize2 size={15} aria-hidden="true" />
      </span>
    </motion.button>
  );

  return (
    <>
      <motion.figure layout className="my-12">
        <div className="mx-auto" style={{ maxWidth: sourceWidth }}>
          {block.tilt === false ? image : <TiltCard intensity={4}>{image}</TiltCard>}
        </div>
        <ImageMeta block={block} />
      </motion.figure>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence onExitComplete={lifetime.onExitComplete}>
          {open && (
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={block.alt}
              aria-describedby={captionId}
              tabIndex={-1}
              // Avoid a full-screen blur tween during shared-layout projection:
              // WebKit can stop painting the exit for seconds under CI load.
              // A static backdrop plus opacity preserves the premium transition
              // while keeping the dialog's focus/inert lease until unmount.
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.28 }}
              style={reduceMotion ? undefined : { backdropFilter: 'blur(12px)' }}
              className="essay-lightbox theme-dark-island theme-dark-island-text"
              onPointerDown={(event) => {
                if (event.currentTarget === event.target) {
                  // Do not let the backdrop's compatibility mouse event steal
                  // focus after the shared dialog lifecycle restores the opener.
                  event.preventDefault();
                  closeLightbox();
                }
              }}
            >
              <motion.div
                // Transform-only zoom avoids a cross-portal shared-layout
                // spring keeping the exit animation alive indefinitely in WebKit.
                initial={reduceMotion ? false : { scale: 0.985 }}
                animate={{ scale: 1 }}
                exit={reduceMotion ? undefined : { scale: 0.985 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="essay-lightbox-sheet"
              >
                <LightboxFigure block={block} imageSrc={imageSrc} captionId={captionId} reduceMotion={reduceMotion} />
              </motion.div>

              <motion.button
                ref={closeRef}
                type="button"
                onClick={closeLightbox}
                whileHover={reduceMotion ? undefined : { rotate: 4, scale: 1.05 }}
                whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                className="essay-lightbox-close"
                aria-label="Закрыть изображение"
              >
                <X size={20} aria-hidden="true" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

function PullquoteBlock({ block }: { block: Block<'pullquote'> }) {
  return (
    <blockquote data-essay-block="pullquote" className="my-12 border-l-4 border-luxury-gold pl-8 md:pl-10">
      <p className="font-serif text-2xl md:text-3xl italic leading-[1.5] text-white gold-glow-text text-pretty">
        «{withGold(block.text)}»
      </p>
      {block.cite && (
        <cite className="mt-4 block text-sm not-italic uppercase tracking-[0.18em] theme-poet-accent">
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
    <figure data-essay-block="poem" className={`group/poem relative my-12 overflow-hidden rounded-[2rem] border px-8 py-10 md:px-12 shadow-inner ${v.frame}`}>
      <span className={`absolute left-0 top-8 bottom-8 w-[3px] rounded-full ${v.rule}`} />
      {block.title && (
        <figcaption className="mb-5 flex flex-wrap items-baseline gap-3">
          <span className={`font-serif text-xl font-semibold ${v.title}`}>«{block.title}»</span>
          {block.year && (
            <span className={`text-[11px] uppercase tracking-[0.18em] ${v.year}`}>{block.year}</span>
          )}
          {blood && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/25 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-red-300/80">
              <Feather size={10} /> написано кровью
            </span>
          )}
        </figcaption>
      )}
      <div className={`poetry-text whitespace-pre-line text-xl md:text-2xl leading-[1.9] tracking-wide ${v.body}`}>
        {withGold(block.lines, { verse: true })}
      </div>
      {block.note && (
        <p className={`mt-5 border-t pt-4 text-sm italic ${v.noteRule}`}>{withTypography(block.note)}</p>
      )}
    </figure>
  );
}

function VoiceBlock({ block }: { block: Block<'voice'> }) {
  const cfg = voiceConfig[block.kind ?? DEFAULT_VOICE_KIND];
  return (
    <div data-essay-block="voice" className={`my-8 rounded-3xl border ${cfg.border} bg-[#0a0a0a] p-6 md:p-8`}>
      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] theme-functional-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
        {cfg.label}
      </div>
      <p className="font-serif text-xl md:text-2xl italic leading-relaxed text-white mb-4 text-pretty">«{withTypography(block.quote, { verse: true })}»</p>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-white/5 pt-4">
        <div>
          <span className="text-sm font-bold text-white">{block.author}</span>
          <span className="text-xs theme-functional-muted"> — {block.role}</span>
        </div>
        {block.sourceUrl ? (
          <a
            href={block.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] uppercase tracking-wider theme-poet-accent transition-colors hover:underline"
          >
            {block.source}
          </a>
        ) : (
          <span className="text-[11px] uppercase tracking-wider theme-functional-muted">{block.source}</span>
        )}
      </div>
    </div>
  );
}

const mythVerdictConfig = {
  false: {
    label: 'Не подтверждается',
    frame: 'border-rose-400/25 bg-gradient-to-br from-rose-500/[0.07] via-[#0b0809] to-[#050505]',
    badge: 'border-rose-300/25 bg-rose-400/10 text-rose-200',
    rule: 'bg-rose-300/70',
    eyebrow: 'text-rose-200/80',
  },
  'partly-true': {
    label: 'Частично верно',
    frame: 'border-amber-300/25 bg-gradient-to-br from-amber-400/[0.07] via-[#0c0a06] to-[#050505]',
    badge: 'border-amber-200/25 bg-amber-300/10 text-amber-100',
    rule: 'bg-amber-200/70',
    eyebrow: 'text-amber-100/80',
  },
  disputed: {
    label: 'Спорно',
    frame: 'border-violet-300/25 bg-gradient-to-br from-violet-400/[0.07] via-[#09080d] to-[#050505]',
    badge: 'border-violet-200/25 bg-violet-300/10 text-violet-100',
    rule: 'bg-violet-200/70',
    eyebrow: 'text-violet-100/80',
  },
  unproven: {
    label: 'Не доказано',
    frame: 'border-cyan-300/25 bg-gradient-to-br from-cyan-400/[0.065] via-[#061014] to-[#050505]',
    badge: 'border-cyan-200/25 bg-cyan-300/10 text-cyan-100',
    rule: 'bg-cyan-200/70',
    eyebrow: 'text-cyan-100/80',
  },
} as const;

function MythNoteBlock({ block, citations }: { block: Extract<Block<'note'>, { variant: 'myth' }>; citations?: ReactNode }) {
  const cfg = mythVerdictConfig[block.verdict];
  const paragraphs = splitParagraphs(block.text);

  return (
    <aside className={`theme-dark-island bg-[#050505] relative my-12 overflow-hidden rounded-[2.25rem] border p-7 md:p-10 tlp-media-shadow-soft ${cfg.frame}`}>
      <span className={`absolute bottom-0 left-0 top-0 w-1 ${cfg.rule}`} aria-hidden="true" />
      <div className="relative z-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] ${cfg.eyebrow}`}>
            <Quote size={14} aria-hidden="true" />
            Проверка мифа
          </div>
          <span className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        <p className="font-serif text-2xl font-semibold leading-snug text-white md:text-3xl text-pretty">
          «{block.claim}»
        </p>

        {block.origin ? (
          <p className="theme-dark-island-muted mt-4 text-xs leading-relaxed">
            <span className="theme-dark-island-muted font-bold uppercase tracking-[0.14em]">Откуда формула:</span>{' '}
            {block.origin}
          </p>
        ) : null}

        <div className="mt-7 border-t border-white/10 pt-6">
          <div className="theme-dark-island-muted mb-3 text-[10px] font-bold uppercase tracking-[0.2em]">
            Что показывают документы
          </div>
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-4 text-base font-light leading-[1.8] text-luxury-gray-light/88 md:text-lg text-pretty">
              {withGold(paragraph)}
              {index === paragraphs.length - 1 ? citations : null}
            </p>
          ))}
        </div>
      </div>
    </aside>
  );
}

function NoteBlock({ block, citations }: { block: Block<'note'>; citations?: ReactNode }) {
  if (block.variant === 'myth') {
    return <MythNoteBlock block={block} citations={citations} />;
  }

  return (
    <aside data-essay-block="note" className="my-10 rounded-[2rem] border-l-[6px] border-l-cyan-400/60 bg-[#061018]/60 p-6 md:p-8">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] theme-functional-subtle">
        THE LEGENDARY POET — ремарка
      </div>
      <p className="theme-essay-prose text-lg leading-relaxed font-light italic text-pretty">
        {withTypography(block.text)}{citations}
      </p>
    </aside>
  );
}

function ReflectionBlock({ block }: { block: Block<'reflection'> }) {
  return (
    <aside className="theme-dark-island bg-[#050505] relative my-14 overflow-hidden rounded-[2.5rem] border border-luxury-gold/25 bg-gradient-to-br from-[#12100a] via-[#0b0a07] to-[#050505] p-8 md:p-12 shadow-[0_0_60px_rgba(212,175,55,0.06)]">
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
      <span className="text-luxury-gold/72">✦</span>
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
