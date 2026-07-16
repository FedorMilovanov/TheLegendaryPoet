import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

function IconShell({ size = 20, className = '', children }: IconProps & { children: ReactNode }) {
  return (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className} 
      aria-hidden="true"
      whileHover="hover"
      initial="rest"
    >
      {children}
    </motion.svg>
  );
}

export function ArrowRight(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { x: 3 } }} d="M4 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><motion.path variants={{ hover: { x: 3 } }} d="M13 6.5 18.5 12 13 17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export function ArrowLeft(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { x: -3 } }} d="M20 12H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><motion.path variants={{ hover: { x: -3 } }} d="M11 6.5 5.5 12 11 17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export function Search(props: IconProps) { return <IconShell {...props}><motion.circle variants={{ hover: { scale: 1.1 } }} style={{ transformOrigin: 'center' }} cx="10.8" cy="10.8" r="6.2" stroke="currentColor" strokeWidth="1.7"/><motion.path variants={{ hover: { scale: 1.1 } }} style={{ transformOrigin: 'center' }} d="M15.4 15.4 20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></IconShell>; }
export function Filter(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { x: 2 } }} d="M4 6.5h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M7 12h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><motion.path variants={{ hover: { x: -2 } }} d="M10 17.5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></IconShell>; }
export function ArrowDownUp(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { y: -2 } }} d="M8 4v15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><motion.path variants={{ hover: { y: -2 } }} d="M4.5 7.5 8 4l3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><motion.path variants={{ hover: { y: 2 } }} d="M16 20V5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><motion.path variants={{ hover: { y: 2 } }} d="m12.5 16.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export function X(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { rotate: 90 } }} style={{ transformOrigin: 'center' }} d="M6.5 6.5 17.5 17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><motion.path variants={{ hover: { rotate: 90 } }} style={{ transformOrigin: 'center' }} d="M17.5 6.5 6.5 17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></IconShell>; }
export function Menu(props: IconProps) { return <IconShell {...props}><path d="M4.5 7h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M4.5 12h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M4.5 17h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></IconShell>; }
export function Command(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { scale: 1.1 } }} style={{ transformOrigin: 'center' }} d="M9 9H7a3 3 0 1 1 3-3v12a3 3 0 1 1-3-3h10a3 3 0 1 1-3 3V6a3 3 0 1 1 3 3H7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }

// Luxury BookOpen
export function BookOpen(props: IconProps) {
  return (
    <IconShell {...props}>
      <motion.path variants={{ hover: { fillOpacity: 0.25 } }} d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <motion.path variants={{ hover: { fillOpacity: 0.3 } }} d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </IconShell>
  );
}

// Luxury FileText
export function FileText(props: IconProps) {
  return (
    <IconShell {...props}>
      <motion.path variants={{ hover: { fillOpacity: 0.2 } }} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <motion.path variants={{ hover: { x: 2 } }} d="M16 13H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <motion.path variants={{ hover: { x: 4 } }} d="M16 17H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </IconShell>
  );
}

/**
 * Premium audio-wave / equalizer icon.
 * Better for "audio tracks" than a note and cleaner at small sizes.
 */
export function Music(props: IconProps) {
  return (
    <IconShell {...props}>
      <motion.path
        variants={{ hover: { scaleY: 1.12 } }}
        style={{ transformOrigin: '6px 12px' }}
        d="M6 8v8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <motion.path
        variants={{ hover: { scaleY: 0.88 } }}
        style={{ transformOrigin: '10px 12px' }}
        d="M10 5v14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <motion.path
        variants={{ hover: { scaleY: 1.16 } }}
        style={{ transformOrigin: '14px 12px' }}
        d="M14 3.5v17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <motion.path
        variants={{ hover: { scaleY: 0.9 } }}
        style={{ transformOrigin: '18px 12px' }}
        d="M18 6.5v11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M4.5 12h15" stroke="currentColor" strokeWidth="0.8" opacity="0.12" strokeLinecap="round" />
    </IconShell>
  );
}

export const AudioWaveform = Music;

// Luxury Home
export function Home(props: IconProps) {
  return (
    <IconShell {...props}>
      <motion.path variants={{ hover: { y: -2 } }} d="M3 10L12 3l9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"/>
      <motion.path variants={{ hover: { y: 2 } }} d="M10 21V14a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </IconShell>
  );
}

export function Star(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { scale: 1.1 } }} style={{ transformOrigin: 'center' }} d="M12 3.6 14.3 9l5.7 1-4.3 3.8.9 5.8-4.6-3-4.6 3 .9-5.8L4 10l5.7-1L12 3.6Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round"/><path d="M12 6.9 13.1 10l3.2.5-2.45 2.05.55 3.15L12 14.1l-2.4 1.6.55-3.15L7.7 10.5l3.2-.5L12 6.9Z" fill="currentColor"/></IconShell>; }
export function Heart(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { scale: 1.1 } }} style={{ transformOrigin: 'center' }} d="M12 20s-7.5-4.7-9.3-9.1C1.4 7.7 3.4 5 6.4 5c1.8 0 3.3 1 4.1 2.3C11.3 6 12.8 5 14.6 5c3 0 5 2.7 3.7 5.9C19.5 15.3 12 20 12 20Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></IconShell>; }
export function Calendar(props: IconProps) { return <IconShell {...props}><rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M8 3.5v3M16 3.5v3M4.5 9h15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></IconShell>; }
export function Clock(props: IconProps) { return <IconShell {...props}><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6"/><motion.path variants={{ hover: { rotate: 90 } }} style={{ transformOrigin: '12px 12px' }} d="M12 7.8V12l3 2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export function MapPin(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { y: -2 } }} d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" stroke="currentColor" strokeWidth="1.6"/><motion.circle variants={{ hover: { y: -2 } }} cx="12" cy="10" r="2" fill="currentColor"/></IconShell>; }
export function Play(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { scale: 1.1 } }} style={{ transformOrigin: 'center' }} d="M8 5.8v12.4c0 .65.72 1.05 1.28.7l9.6-6.2a.82.82 0 0 0 0-1.4l-9.6-6.2A.82.82 0 0 0 8 5.8Z" fill="currentColor"/></IconShell>; }
export function Pause(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { scale: 1.1 } }} style={{ transformOrigin: 'center' }} d="M6 5h4v14H6V5Zm8 0h4v14h-4V5Z" fill="currentColor"/></IconShell>; }
export function Download(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { y: 2 } }} d="M12 4v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><motion.path variants={{ hover: { y: 2 } }} d="m8 10 4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 19h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></IconShell>; }
export function ExternalLink(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { x: 2, y: -2 } }} d="M9 5H5.8A1.8 1.8 0 0 0 4 6.8v11.4c0 1 .8 1.8 1.8 1.8h11.4c1 0 1.8-.8 1.8-1.8V15" stroke="currentColor" strokeWidth="1.6"/><motion.path variants={{ hover: { x: 2, y: -2 } }} d="M13 4h7v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><motion.path variants={{ hover: { x: 2, y: -2 } }} d="m20 4-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></IconShell>; }
export function Mail(props: IconProps) { return <IconShell {...props}><rect x="3.8" y="6" width="16.4" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/><motion.path variants={{ hover: { y: 2 } }} d="m5 8 7 5 7-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export function Quote(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { scale: 1.1 } }} style={{ transformOrigin: 'center' }} d="M9 6c-3 1.4-4.5 3.7-4.5 6.8 0 2.5 1.4 4.2 3.3 4.2 1.5 0 2.7-1 2.7-2.6 0-1.5-1-2.5-2.4-2.5-.45 0-.85.08-1.2.24.2-1.7 1.2-3 3-4.1L9 6Zm10 0c-3 1.4-4.5 3.7-4.5 6.8 0 2.5 1.4 4.2 3.3 4.2 1.5 0 2.7-1 2.7-2.6 0-1.5-1-2.5-2.4-2.5-.45 0-.85.08-1.2.24.2-1.7 1.2-3 3-4.1L19 6Z" fill="currentColor"/></IconShell>; }
export function Shield(props: IconProps) { return <IconShell {...props}><path d="M12 3.5 19 6v5.2c0 4.5-2.8 7.6-7 9.3-4.2-1.7-7-4.8-7-9.3V6l7-2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><motion.path variants={{ hover: { scale: 1.2 } }} style={{ transformOrigin: '12px 13px' }} d="m8.7 12 2.2 2.2 4.6-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export const ShieldCheck = Shield;
export function Award(props: IconProps) { return <IconShell {...props}><motion.circle variants={{ hover: { scale: 1.1 } }} style={{ transformOrigin: '12px 9px' }} cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.6"/><motion.path variants={{ hover: { y: 2 } }} d="m9.2 13.2-1 6 3.8-2 3.8 2-1-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></IconShell>; }
export function MessageSquare(props: IconProps) { return <IconShell {...props}><path d="M5 5.5h14v10H9l-4 3v-13Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><motion.path variants={{ hover: { x: 2 } }} d="M8 9h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><motion.path variants={{ hover: { x: -2 } }} d="M8 12h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></IconShell>; }
export function CheckCircle2(props: IconProps) { return <IconShell {...props}><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6"/><motion.path variants={{ hover: { scale: 1.2 } }} style={{ transformOrigin: 'center' }} d="m8.5 12.2 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export function AlertTriangle(props: IconProps) { return <IconShell {...props}><path d="M12 4 21 19H3L12 4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><motion.path variants={{ hover: { scale: 1.2 } }} style={{ transformOrigin: '12px 14px' }} d="M12 9v4M12 16.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></IconShell>; }
export function ThumbsUp(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { y: -2, rotate: -5 } }} style={{ transformOrigin: 'bottom left' }} d="M8 11v8H5.5A1.5 1.5 0 0 1 4 17.5v-5A1.5 1.5 0 0 1 5.5 11H8Z" stroke="currentColor" strokeWidth="1.6"/><motion.path variants={{ hover: { y: -2, rotate: -5 } }} style={{ transformOrigin: 'bottom left' }} d="M8 11 11 5c.45-.9 1.8-.55 1.8.45V10H18c1.2 0 2.05 1.1 1.8 2.25l-1.15 5.4A2 2 0 0 1 16.7 19H8v-8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></IconShell>; }
export function Sparkles(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { scale: 1.1, rotate: 15 } }} style={{ transformOrigin: 'center' }} d="M12 3.5 13.7 9 19 10.7 13.7 12.4 12 18l-1.7-5.6L5 10.7 10.3 9 12 3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M18 3.8 18.7 6l2.1.7-2.1.7L18 9.6l-.7-2.2-2.1-.7 2.1-.7.7-2.2Z" fill="currentColor"/></IconShell>; }
export function TrendingUp(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { x: 2, y: -2 } }} d="M4 17 10 11l4 4 6-8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><motion.path variants={{ hover: { x: 2, y: -2 } }} d="M15 7h5v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export function TrendingDown(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { x: 2, y: 2 } }} d="M4 7l6 6 4-4 6 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><motion.path variants={{ hover: { x: 2, y: 2 } }} d="M15 17h5v-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export function Info(props: IconProps) { return <IconShell {...props}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/><path d="M12 16v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export function ArrowUp(props: IconProps) { return <IconShell {...props}><motion.path variants={{ hover: { y: -3 } }} d="M12 19V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><motion.path variants={{ hover: { y: -3 } }} d="m5 12 7-7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export function Volume2(props: IconProps) { return <IconShell {...props}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export function VolumeX(props: IconProps) { return <IconShell {...props}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export function SkipForward(props: IconProps) { return <IconShell {...props}><polygon points="5 4 15 12 5 20 5 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }
export function SkipBack(props: IconProps) { return <IconShell {...props}><polygon points="19 20 9 12 19 4 19 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconShell>; }

/** Check mark — used by ShareLine confirmation and success states. */
export function Check(props: IconProps) {
  return (
    <IconShell {...props}>
      <motion.path
        variants={{ hover: { scale: 1.12 } }}
        style={{ transformOrigin: 'center' }}
        d="m5.5 12.2 4 4 9-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconShell>
  );
}

/** Chain-link — text-fragment deep-link chip. */
export function Link2(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.2 1.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.2-1.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </IconShell>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <IconShell {...props}>
      <motion.path
        variants={{ hover: { y: 2 } }}
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconShell>
  );
}

/** Writing pen — essay hero / editorial mark. */
export function PenLine(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 20h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <motion.path
        variants={{ hover: { rotate: -6 } }}
        style={{ transformOrigin: '10px 10px' }}
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </IconShell>
  );
}

/** Quill / feather — essay poem badges and reflections. */
export function Feather(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 8 2 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17.5 15H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconShell>
  );
}