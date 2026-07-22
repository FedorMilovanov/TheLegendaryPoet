import { useState, type ReactNode } from 'react';
import { asset } from '../../utils/asset';
import { vtShared } from '../../lib/viewTransition';
import { DEFAULT_ACCENT, coverBackground } from './theme';
import { optimizedSibling, optimizedSmallSibling } from './media';

/**
 * Shared essay cover surface with local AVIF/WebP delivery. Every local cover
 * gets a compact 640px candidate and a full-size candidate generated in CI;
 * the original path remains the final fallback and preserves graceful failure.
 */
interface EssayCoverProps {
  src: string;
  alt: string;
  accent?: string;
  kicker?: string;
  focusY?: string;
  overlayFrom?: string;
  ornamentClass?: string;
  imgClassName?: string;
  loading?: 'eager' | 'lazy';
  className?: string;
  sharedName?: string;
  children?: ReactNode;
}

function localSrcSet(src: string, format: 'avif' | 'webp'): string | undefined {
  const full = optimizedSibling(src, format);
  const small = optimizedSmallSibling(src, format);
  if (!full || !small) return undefined;
  return `${asset(small)} 640w, ${asset(full)} 1600w`;
}

export default function EssayCover({
  src,
  alt,
  accent = DEFAULT_ACCENT,
  kicker,
  focusY = '20%',
  overlayFrom = '#050505',
  ornamentClass = 'text-[9rem]',
  imgClassName = '',
  loading = 'lazy',
  className = '',
  sharedName,
  children,
}: EssayCoverProps) {
  const [imgOk, setImgOk] = useState(true);
  const avifSrcSet = localSrcSet(src, 'avif');
  const webpSrcSet = localSrcSet(src, 'webp');

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: coverBackground(accent, focusY), ...(sharedName ? vtShared(sharedName) : undefined) }}
    >
      {imgOk ? (
        <picture className="block h-full w-full">
          {avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes="(max-width: 768px) 94vw, 960px" />}
          {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes="(max-width: 768px) 94vw, 960px" />}
          <img
            src={asset(src)}
            alt={alt}
            className={`h-full w-full object-cover ${imgClassName}`}
            onError={() => setImgOk(false)}
            loading={loading}
            decoding="async"
            fetchPriority={loading === 'eager' ? 'high' : 'auto'}
            data-testid="essay-cover-image"
          />
        </picture>
      ) : (
        <div className="flex h-full w-full items-center justify-center" data-testid="essay-cover-fallback">
          <span className={`font-serif ${ornamentClass} leading-none opacity-10`} style={{ color: accent }}>
            «»
          </span>
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(to top, ${overlayFrom} 0%, ${overlayFrom}33 22%, transparent 55%)` }}
      />

      {kicker && (
        <span
          className="absolute left-5 top-5 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] backdrop-blur-md"
          style={{ color: accent, borderColor: `${accent}55`, backgroundColor: `${accent}18` }}
        >
          {kicker}
        </span>
      )}

      {children}
    </div>
  );
}
