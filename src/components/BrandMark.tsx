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
 */
export default function BrandMark({ size = 'sm' }: BrandMarkProps) {
  return (
    <svg className={`${sizes[size]} overflow-visible`} viewBox="0 0 96 96" role="img" aria-label="THE LEGENDARY POET">
      <defs>
        <linearGradient id="hoodFill" x1="18" y1="6" x2="78" y2="92">
          <stop offset="0%" stopColor="#e2fdff" />
          <stop offset="42%" stopColor="#41dcff" />
          <stop offset="100%" stopColor="#1f66ff" />
        </linearGradient>
        <linearGradient id="hoodFold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a3550" stopOpacity="0" />
          <stop offset="100%" stopColor="#041a2b" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="hoodVoid" cx="50%" cy="34%" r="62%">
          <stop offset="0%" stopColor="#020509" />
          <stop offset="62%" stopColor="#061019" />
          <stop offset="100%" stopColor="#0c1c2e" />
        </radialGradient>
        <filter id="hoodGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#hoodGlow)">
        <path d="M48 22 C42 22 38 25 35 31 C28 44 18 55 13 74 C11 82 11 87 12 90 C24 87 33 88 48 88 C63 88 72 87 84 90 C85 87 85 82 83 74 C78 55 68 44 61 31 C58 25 54 22 48 22 Z" fill="url(#hoodFill)" />
        <path d="M48 6 C40 6 34 11 31 19 C28 27 28 38 32 47 C34 52 38 56 44 58 C46 59 50 59 52 58 C58 56 62 52 64 47 C68 38 68 27 65 19 C62 11 56 6 48 6 Z" fill="url(#hoodFill)" />
        <path d="M48 15 C42 15 38 21 38 30 C38 41 43 50 48 52 C53 50 58 41 58 30 C58 21 54 15 48 15 Z" fill="url(#hoodVoid)" />
        <path d="M48 58 C40 66 34 78 33 88 C40 88 44 88 48 88 C52 88 56 88 63 88 C62 78 56 66 48 58 Z" fill="url(#hoodFold)" />
        <path d="M35 31 C28 44 18 55 13 74" fill="none" stroke="#bff4ff" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
        <path d="M31 19 C28 27 28 38 32 47" fill="none" stroke="#bff4ff" strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
      </g>
    </svg>
  );
}
