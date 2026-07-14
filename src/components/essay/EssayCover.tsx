import { useState, type ReactNode } from 'react';
import { asset } from '../../utils/asset';
import { vtShared } from '../../lib/viewTransition';
import { DEFAULT_ACCENT, coverBackground } from './theme';

/**
 * Shared essay cover surface: the accent-washed box that shows the artwork, or a
 * graceful serif «» ornament when the image is missing, plus the optional kicker
 * badge. Owns the image-load fallback so both the hero and the listing card get
 * identical behaviour from one place.
 *
 * The caller supplies size / rounding / border via `className`; this component
 * fills that box.
 */
interface EssayCoverProps {
  src: string;
  alt: string;
  accent?: string;
  kicker?: string;
  /** Vertical focus of the fallback radial wash. */
  focusY?: string;
  /** Base colour of the bottom-up legibility gradient (match the card body). */
  overlayFrom?: string;
  /** Tailwind size class for the «» fallback ornament. */
  ornamentClass?: string;
  /** Extra classes on the <img> (e.g. a hover zoom). */
  imgClassName?: string;
  loading?: 'eager' | 'lazy';
  /** Size / rounding / border of the cover box itself. */
  className?: string;
  /**
   * View-transition shared-element name (e.g. `essay-cover-<id>`). Give the
   * hero and the listing card the same name and the cover morphs between the
   * two pages on navigation.
   */
  sharedName?: string;
  children?: ReactNode;
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

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: coverBackground(accent, focusY), ...(sharedName ? vtShared(sharedName) : undefined) }}
    >
      {imgOk ? (
        <img
          src={asset(src)}
          alt={alt}
          className={`h-full w-full object-cover ${imgClassName}`}
          onError={() => setImgOk(false)}
          loading={loading}
          decoding="async"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className={`font-serif ${ornamentClass} leading-none opacity-10`} style={{ color: accent }}>
            «»
          </span>
        </div>
      )}

      {/* Bottom-up legibility gradient */}
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
