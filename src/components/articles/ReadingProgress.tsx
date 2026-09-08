import { useEffect, useState, type RefObject } from 'react';

type ReadingProgressProps = {
  articleRef: RefObject<HTMLElement | null>;
};

/**
 * Hairline reading-progress bar owned by the semantic article boundary.
 * One passive scroll/resize observer and one ResizeObserver all schedule the
 * same RAF-coalesced calculation, so late media/layout changes never create a
 * second progress authority. Post-article community/footer content is excluded.
 */
export default function ReadingProgress({ articleRef }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const article = articleRef.current;
      if (!article) {
        setProgress(0);
        return;
      }

      const rect = article.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const articleTop = scrollTop + rect.top;
      const articleBottom = scrollTop + rect.bottom;
      const articleEndScroll = Math.max(articleTop, articleBottom - viewportHeight);
      const span = articleEndScroll - articleTop;
      const nextProgress = span > 0
        ? Math.min(100, Math.max(0, ((scrollTop - articleTop) / span) * 100))
        : scrollTop >= articleTop ? 100 : 0;

      setProgress((current) => (Math.abs(current - nextProgress) < 0.05 ? current : nextProgress));
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const article = articleRef.current;
    const resizeObserver = article && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(scheduleUpdate)
      : null;

    if (article) resizeObserver?.observe(article);
    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      resizeObserver?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [articleRef]);

  const semanticProgress = Math.round(progress);

  return (
    <div
      className="reading-progress fixed left-0 z-[70] h-[2px] w-full bg-cyan-950/60"
      role="progressbar"
      aria-label="Прогресс чтения статьи"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={semanticProgress}
      aria-valuetext={`${semanticProgress}% прочитано`}
    >
      <div
        className="h-full w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(0,212,255,0.65)]"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
