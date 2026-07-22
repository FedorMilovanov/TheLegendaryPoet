import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { EssayBlock } from '../../types/essay';
import TiltCard from '../TiltCard';
import { resolveEssayMedia } from './media';

type ImageBlock = Extract<EssayBlock, { type: 'image' }>;

const kindLabels = {
  archive: 'Архив',
  restoration: 'Цифровая реставрация',
  reconstruction: 'Художественная реконструкция',
  document: 'Документ',
} as const;

function ImageMeta({ block }: { block: ImageBlock }) {
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
          className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md py-1 uppercase tracking-[0.14em] text-luxury-gold/55 transition-colors hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/60"
        >
          Источник <ExternalLink size={11} aria-hidden="true" />
        </a>
      )}
    </figcaption>
  );
}

/**
 * Stable image surface used by the common article renderer.
 *
 * The preview and the dialog deliberately do not share a Framer `layoutId`.
 * Morphing a portal image out of a transformed 3D card forced Chromium to
 * interpolate between unrelated aspect ratios and occasionally exposed the
 * black modal surface. A short independent panel spring is visually calmer and
 * keeps the image at its own intrinsic ratio throughout the transition.
 */
export default function StableEssayImage({ block }: { block: ImageBlock }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const captionId = useId();
  const reduceMotion = useReducedMotion();
  const layout = block.layout ?? 'wide';
  const media = resolveEssayMedia(block);

  const frameClass =
    layout === 'portrait'
      ? 'mx-auto max-w-xl aspect-[4/5]'
      : layout === 'cinematic'
        ? 'aspect-[16/9]'
        : 'aspect-[3/2]';
  const sizes =
    layout === 'portrait'
      ? '(max-width: 768px) 92vw, 576px'
      : '(max-width: 1024px) 92vw, 768px';

  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const currentPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
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
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;

    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', onKey);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      setZoomed(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
  }, [open]);

  const previewPicture = (
    <picture className="block h-full w-full leading-none">
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
        className={`essay-inline-image block h-full w-full object-cover ${loaded ? 'is-loaded' : ''}`}
        style={{ objectPosition: block.objectPosition || '50% 50%' }}
      />
    </picture>
  );

  const preview = (
    <motion.button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(true)}
      whileTap={reduceMotion ? undefined : { scale: 0.994 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.55 }}
      className={`essay-image-preview group relative block w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080808] text-left shadow-[0_24px_70px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70 ${frameClass}`}
      aria-label={`Увеличить изображение: ${block.alt}`}
      aria-haspopup="dialog"
      data-testid="essay-image-trigger"
    >
      <span
        className="absolute inset-0"
        style={media.placeholder ? { backgroundImage: `url(${media.placeholder})`, backgroundSize: 'cover' } : undefined}
      >
        {!loaded && (
          <span className="absolute inset-0 overflow-hidden bg-[#0d0d0d]/55 backdrop-blur-md">
            <span className="absolute inset-y-0 -left-1/2 w-1/2 animate-[shimmer_1.7s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.045] to-transparent motion-reduce:animate-none" />
          </span>
        )}
        {previewPicture}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/34 via-transparent to-white/[0.025]" />
      </span>
      <span className="essay-image-expand pointer-events-none absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/65 opacity-0 backdrop-blur-md">
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.22, ease: 'easeOut' }}
          className="essay-lightbox fixed inset-0 z-[190] flex items-center justify-center bg-black/88 p-2 sm:p-4"
          onPointerDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
          data-testid="essay-image-dialog"
        >
          <motion.div
            drag={zoomed || reduceMotion ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.16}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.y) > 105 || Math.abs(info.velocity.y) > 650) setOpen(false);
            }}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.965 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 31, mass: 0.72 }}
            className="essay-lightbox-panel relative flex max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-1rem)] flex-col items-center"
            data-testid="essay-image-panel"
          >
            <div
              ref={viewportRef}
              className="essay-lightbox-viewport relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 shadow-[0_35px_120px_rgba(0,0,0,0.72)]"
              data-testid="essay-image-viewport"
            >
              <picture className="block max-h-full max-w-full leading-none">
                {media.avifSrcSet && <source type="image/avif" srcSet={media.avifSrcSet} sizes="94vw" />}
                {media.webpSrcSet && <source type="image/webp" srcSet={media.webpSrcSet} sizes="94vw" />}
                <motion.img
                  src={media.fallback}
                  alt={block.alt}
                  decoding="async"
                  width={media.width}
                  height={media.height}
                  drag={zoomed}
                  dragConstraints={viewportRef}
                  dragMomentum={false}
                  dragElastic={0.06}
                  animate={{ scale: zoomed ? 1.58 : 1 }}
                  transition={{ type: 'spring', stiffness: 285, damping: 31, mass: 0.72 }}
                  onDoubleClick={() => setZoomed((value) => !value)}
                  className={`essay-lightbox-image block h-auto w-auto max-h-[calc(100dvh-9rem)] max-w-[calc(100vw-1.5rem)] select-none ${zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
                  data-testid="essay-image-dialog-image"
                />
              </picture>
              <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.035]" />
            </div>

            <div className="essay-lightbox-meta mt-3 flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-1">
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
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white/55 transition-colors hover:border-luxury-gold/30 hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70"
                    data-testid="essay-image-source"
                  >
                    Источник <ExternalLink size={11} aria-hidden="true" />
                  </a>
                )}
                <motion.button
                  type="button"
                  onClick={() => setZoomed((value) => !value)}
                  whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/60 transition-colors hover:border-luxury-gold/30 hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70"
                  aria-label={zoomed ? 'Уменьшить изображение' : 'Увеличить изображение'}
                  aria-pressed={zoomed}
                  data-testid="essay-image-zoom"
                >
                  {zoomed ? <ZoomOut size={16} aria-hidden="true" /> : <ZoomIn size={16} aria-hidden="true" />}
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            className="essay-lightbox-close absolute inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/62 text-white/75 backdrop-blur-md transition-colors hover:border-luxury-gold/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold sm:h-12 sm:w-12"
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
      <figure
        className="my-12"
        data-image-kind={block.kind ?? 'archive'}
        data-image-layout={layout}
        data-image-placement={block.placement ?? 'full'}
      >
        {block.tilt === false ? preview : <TiltCard intensity={2.8}>{preview}</TiltCard>}
        <ImageMeta block={block} />
      </figure>
      {typeof document !== 'undefined' ? createPortal(lightbox, document.body) : null}
    </>
  );
}
