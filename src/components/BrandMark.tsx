import { useId } from 'react';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
};

/**
 * Brand emblem: a cloaked, hooded figure — the "legendary poet" as an
 * anonymous, timeless silhouette. Draped cloak, deep cowl, shadowed face and
 * a cyan neon rim. Pure SVG, frameless.
 *
 * Gradient/filter ids are instance-unique via useId so multiple BrandMarks on
 * one page (header + footer + wipe overlay) never collide in the SVG DOM.
 */
export default function BrandMark({ size = 'sm' }: BrandMarkProps) {
  const uid = useId().replace(/:/g, '');
  const hoodFill = `hoodFill-${uid}`;
  const hoodFold = `hoodFold-${uid}`;
  const hoodVoid = `hoodVoid-${uid}`;
  const hoodGlow = `hoodGlow-${uid}`;

  return (
    <svg className={`${sizes[size]} overflow-visible brand-mark`} viewBox="0 0 96 96" role="img" aria-label="THE LEGENDARY POET">
      <defs>
        <linearGradient id={hoodFill} x1="20" y1="4" x2="76" y2="92">
          <stop offset="0%" stopColor="#e8feff" />
          <stop offset="45%" stopColor="#3fd4ff" />
          <stop offset="100%" stopColor="#1858e6" />
        </linearGradient>
        <linearGradient id={hoodFold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#062033" stopOpacity="0" />
          <stop offset="100%" stopColor="#03121f" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id={hoodVoid} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#01050a" />
          <stop offset="60%" stopColor="#05101b" />
          <stop offset="100%" stopColor="#0a1b2c" />
        </radialGradient>
        <filter id={hoodGlow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${hoodGlow})`}>
        {/* draped robe with sloped shoulders */}
        <path d="M48 30 C40 30 34 34 30 42 C24 52 18 64 15 78 C14 83 14 87 15 90 C26 88 36 88 48 88 C60 88 70 88 81 90 C82 87 82 83 81 78 C78 64 72 52 66 42 C62 34 56 30 48 30 Z" fill={`url(#${hoodFill})`} />
        {/* pointed cowl */}
        <path d="M48 6 C42 6 37 10 35 17 C33 24 34 32 38 38 C41 41 44 42 48 42 C52 42 55 41 58 38 C62 32 63 24 61 17 C59 10 54 6 48 6 Z" fill={`url(#${hoodFill})`} />
        {/* shadowed face */}
        <path d="M48 16 C43 16 39 21 39 28 C39 35 43 40 48 41 C53 40 57 35 57 28 C57 21 53 16 48 16 Z" fill={`url(#${hoodVoid})`} />
        {/* center drape */}
        <path d="M48 42 C44 58 42 74 43 88 C46 88 50 88 53 88 C54 74 52 58 48 42 Z" fill={`url(#${hoodFold})`} />
        {/* neon rim on cowl + shoulder */}
        <path d="M35 17 C33 24 34 32 38 38" fill="none" stroke="#c9f6ff" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
        <path d="M30 42 C24 52 18 64 15 78" fill="none" stroke="#c9f6ff" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      </g>
    </svg>
  );
}
