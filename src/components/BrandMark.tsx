interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
};

export default function BrandMark({ size = 'sm' }: BrandMarkProps) {
  return (
    <svg className={`${sizes[size]} overflow-visible`} viewBox="0 0 96 96" role="img" aria-label="LP emblem">
      <defs>
        <linearGradient id="lpStroke" x1="18" y1="10" x2="76" y2="84">
          <stop offset="0%" stopColor="#c9fbff" />
          <stop offset="50%" stopColor="#2ed8ff" />
          <stop offset="100%" stopColor="#2a7fff" />
        </linearGradient>
        <filter id="lpGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#lpGlow)">
        <path d="M22 18V76H52" fill="none" stroke="url(#lpStroke)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M52 76V20H66C75 20 81 25.6 81 34.5C81 43.5 75 49 66 49H52" fill="none" stroke="url(#lpStroke)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 84C32 79 64 79 78 84" fill="none" stroke="#59d8ff" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
      </g>
    </svg>
  );
}
