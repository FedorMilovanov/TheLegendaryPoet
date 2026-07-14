import { useEffect, useState } from 'react';

/**
 * Hairline reading-progress bar. Where the browser supports CSS scroll-driven
 * animations (Chrome 115+, Safari 26+) the bar is animated entirely on the
 * compositor via `animation-timeline: scroll(root)` — zero JS per frame.
 * Elsewhere it falls back to the classic passive scroll listener.
 * Rides just below the header and glides to the top edge when the reading
 * chrome auto-hides (see .reading-progress rules in index.css).
 */
const supportsScrollTimeline =
  typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: scroll()');

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (supportsScrollTimeline) return; // CSS drives the bar — no listener needed
    const update = () => {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? Math.min(100, (scrollTop / height) * 100) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div className="reading-progress fixed left-0 z-[70] h-[2px] w-full bg-cyan-950/60">
      <div
        className={`h-full w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(0,212,255,0.65)] ${
          supportsScrollTimeline ? 'reading-progress-fill' : ''
        }`}
        style={supportsScrollTimeline ? undefined : { transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
