import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { titleCase } from '../../../utils/titleCase';

interface HallAtriumProps {
  children?: ReactNode;
}

/**
 * Soft dome-light parallax. Writes CSS vars only (no React re-render on move).
 * Disabled under prefers-reduced-motion and on coarse pointers.
 */
function useDomeParallax(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduced || coarse) {
      root.style.setProperty('--hall-parallax-x', '0px');
      root.style.setProperty('--hall-parallax-y', '0px');
      return;
    }

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = root.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        // Subtle: a few pixels only — museum, not game HUD
        root.style.setProperty('--hall-parallax-x', `${(nx * 14).toFixed(2)}px`);
        root.style.setProperty('--hall-parallax-y', `${(ny * 10).toFixed(2)}px`);
      });
    };

    const onLeave = () => {
      root.style.setProperty('--hall-parallax-x', '0px');
      root.style.setProperty('--hall-parallax-y', '0px');
    };

    root.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', onLeave);
    return () => {
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef]);
}

export default function HallAtrium({ children }: HallAtriumProps) {
  const ref = useRef<HTMLElement>(null);
  useDomeParallax(ref);

  return (
    <header className="hall-atrium" ref={ref}>
      <div className="hall-atrium-dome" aria-hidden="true" />
      <div className="hall-atrium-floor" aria-hidden="true" />
      <div className="hall-atrium-kicker">
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        Храм · Музей · Архив
      </div>
      <h1 className="hall-atrium-title gold-gradient gold-glow-text">
        {titleCase('Храм русской поэзии')}
      </h1>
      <p className="hall-atrium-lead">
        Центральный атриум пантеона. Четыре крыла — четыре эпохи русской словесности.
      </p>
      <p className="hall-atrium-note">
        Музейный вестибюль: тёплый камень, золотые рамы, кураторские ниши. Объём купола
        и прогулка наращиваются отдельными проходами — без спешки и без «космических»
        заглушек.
      </p>
      {children}
    </header>
  );
}
