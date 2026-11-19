import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';
import { useNativeImageState } from '../../hooks/useNativeImageState';
import type { EssayBlock } from '../../types/essay';

const magnification = 1.65;
const clampOrigin = (value: number) => Math.max(0, Math.min(1, value));

type Props = {
  block: Extract<EssayBlock, { type: 'image' }>;
  imageSrc: string;
  captionId: string;
  reduceMotion: boolean | null;
};

/** Only mounted in the open viewer. Its own image may load (or fail)
 * independently of the thumbnail. The parent owns the modal and its exit. */
export default function LightboxFigure({ block, imageSrc, captionId, reduceMotion }: Props) {
  const { ref, state, ready } = useNativeImageState(imageSrc);
  const [zoomed, setZoomed] = useState(false);
  const originX = useMotionValue(0.5);
  const originY = useMotionValue(0.5);
  const panHint = useId();
  const drag = useRef<{ id: number; x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const image = ref.current;
    if (!zoomed || !image) return;
    // A fast one-finger pan belongs to the photo, not the scrollable sheet.
    // A native fling can otherwise consume the very next tap on Zoom/Close.
    const consumePan = (event: TouchEvent) => {
      if (event.cancelable && event.touches.length === 1) event.preventDefault();
    };
    image.addEventListener('touchmove', consumePan, { passive: false });
    return () => image.removeEventListener('touchmove', consumePan);
  }, [ref, zoomed]);

  // Pan the scale origin within the photo rather than translating the photo
  // out of its frame. Percentages stay valid through resize and during zoom.
  const moveOrigin = (dx: number, dy: number) => {
    originX.set(clampOrigin(originX.get() + dx));
    originY.set(clampOrigin(originY.get() + dy));
  };
  // Store the gesture endpoints, not frame-sampled deltas. WebKit can
  // deliver the release before the animation frame scheduled by the move.
  const pan = (event: PointerEvent<HTMLImageElement>) => {
    const start = drag.current, image = event.currentTarget;
    if (!start || start.id !== event.pointerId) return;
    originX.set(clampOrigin(start.ox - (event.clientX - start.x) / (image.clientWidth * (magnification - 1))));
    originY.set(clampOrigin(start.oy - (event.clientY - start.y) / (image.clientHeight * (magnification - 1))));
  };
  const toggleZoom = () => {
    if (!ready) return;
    if (!zoomed) { originX.set(0.5); originY.set(0.5); }
    setZoomed(!zoomed);
  };
  const panWithKeys = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!zoomed) return;
    switch (event.key) {
      case 'ArrowLeft': moveOrigin(-0.15, 0); break;
      case 'ArrowRight': moveOrigin(0.15, 0); break;
      case 'ArrowUp': moveOrigin(0, -0.15); break;
      case 'ArrowDown': moveOrigin(0, 0.15); break;
      default: return;
    }
    event.preventDefault();
  };

  return (
    <>
      {/* The grid gives the caption its actual height first. At large text
          sizes the sheet scrolls rather than collapsing/cropping the photo. */}
      <div className={`essay-lightbox-frame ${ready ? 'h-[min(74dvh,100%)]' : ''}`}>
        <motion.img
          ref={ref}
          src={imageSrc}
          alt={block.alt}
          decoding="async"
          draggable={false}
          data-image-state={state}
          style={{ originX, originY }}
          animate={{ scale: zoomed ? magnification : 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
          onPointerDown={event => {
            if (!zoomed || !event.isPrimary || event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, ox: originX.get(), oy: originY.get() };
          }}
          onPointerMove={pan}
          onPointerUp={pan}
          onLostPointerCapture={event => { if (drag.current?.id === event.pointerId) drag.current = null; }}
          onDoubleClick={toggleZoom}
          className={`h-full w-auto max-w-full select-none object-contain ${!ready ? 'hidden' : zoomed ? 'touch-none cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
        />
        {!ready && (
          <p role="status" className="essay-lightbox-status theme-dark-island-muted">
            {state === 'error' ? 'Изображение временно недоступно' : 'Загрузка изображения…'}
          </p>
        )}
      </div>
      <div className="essay-lightbox-footer">
        <p id={captionId} className="essay-lightbox-caption theme-dark-island-muted">
          {block.caption}
          {block.credit ? <span className="theme-dark-island-subtle"> · {block.credit}</span> : null}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {block.sourceUrl && (
            <a href={block.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="essay-lightbox-source theme-dark-island-accent">
              Источник <ExternalLink size={11} />
            </a>
          )}
          <button type="button" onClick={toggleZoom} onKeyDown={panWithKeys} disabled={!ready}
            className="essay-lightbox-zoom"
            aria-label={zoomed ? 'Уменьшить изображение' : 'Увеличить изображение'} aria-pressed={zoomed} aria-describedby={zoomed ? panHint : undefined}>
            {zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
          </button>
          {zoomed && <span className="sr-only" id={panHint}>Перемещайте изображение перетаскиванием или клавишами со стрелками.</span>}
        </div>
      </div>
    </>
  );
}
