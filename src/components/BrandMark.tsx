interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
};

/**
 * Brand emblem: a hooded, cloaked figure — the "legendary poet" as an
 * anonymous, timeless silhouette. Pure SVG, frameless, cyan-neon on dark.
 */
export default function BrandMark({ size = 'sm' }: BrandMarkProps) {
  return (
    <svg className={`${sizes[size]} overflow-visible`} viewBox="0 0 96 96" role="img" aria-label="THE LEGENDARY POET">
      <defs>
        <linearGradient id="hoodFill" x1="20" y1="8" x2="76" y2="88">
          <stop offset="0%" stopColor="#d6fbff" />
          <stop offset="46%" stopColor="#33d6ff" />
          <stop offset="100%" stopColor="#2170ff" />
        </linearGradient>
        <radialGradient id="hoodVoid" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#03060c" />
          <stop offset="70%" stopColor="#071019" />
          <stop offset="100%" stopColor="#0b1826" />
        </radialGradient>
        <filter id="hoodGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#hoodGlow)">
        <path d="M12 91 C12 77 18 67 30 62 C36 60 42 60 48 60 C54 60 60 60 66 62 C78 67 84 77 84 91 Z" fill="url(#hoodFill)" />
        <path d="M48 7 C39 7 33 14 31 24 C29 33 30 45 34 54 C36 58 38 61 40 62 L56 62 C58 61 60 58 62 54 C66 45 67 33 65 24 C63 14 57 7 48 7 Z" fill="url(#hoodFill)" />
        <path d="M48 17 C41 17 37 24 37 33 C37 44 42 53 48 55 C54 53 59 44 59 33 C59 24 55 17 48 17 Z" fill="url(#hoodVoid)" />
      </g>
    </svg>
  );
}
