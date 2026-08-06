import { useEffect, useState } from 'react';

/**
 * Hairline reading-progress bar. Where the browser supports CSS scroll-driven
 * animations (Chrome 115+, Safari 26+) the bar is animated entirely on the
 * compositor via `animation-timeline: scroll(root)` — zero JS per frame.
 * Elsewhere it falls back to one passive listener with one RAF-coalesced React
 * update per frame. Rides just below the header and glides to the top edge when
 * the reading chrome auto-hides (see .reading-progress rules in index.css).
 */
const supportsScrollTimeline =
  typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: scroll()');

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (supportsScrollTimeline) return; // CSS drives the bar — no listener needed

    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = height > 0 ? Math.min(100, (scrollTop / height) * 100) : 0;
      setProgress((current) => (Math.abs(current - nextProgress) < 0.05 ? current : nextProgress));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
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
