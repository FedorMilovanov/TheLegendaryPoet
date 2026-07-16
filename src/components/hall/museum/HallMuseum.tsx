import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '../../ui/Link';
import { poets } from '../../../data/poets';
import { hallWings, type HallWingId } from '../../../data/hall';
import HallAtrium from './HallAtrium';
import HallCompass from './HallCompass';
import HallWingSection from './HallWingSection';
import { scrollToId } from '../../../utils/smoothScroll';
import './hallMuseum.css';

/**
 * Hall v3 Pass 1–2 — museum vestibule.
 *
 * DOM-only, warm pantheon palette, four wings from `data/hall/wings`.
 * Pass 2: material depth, sealed door, parallax light, scroll-spy active wing.
 * No three.js. Future R3F atrium reuses the same wing data.
 */
export default function HallMuseum() {
  const [activeWing, setActiveWing] = useState<HallWingId | null>(null);

  const poetsById = useMemo(() => new Map(poets.map((p) => [p.id, p])), []);

  const poetCounts = useMemo(() => {
    const counts = {} as Record<HallWingId, number>;
    for (const wing of hallWings) {
      counts[wing.id] = wing.poetIds.filter((id) => poetsById.has(id)).length;
    }
    return counts;
  }, [poetsById]);

  const onSelectWing = useCallback((id: HallWingId) => {
    setActiveWing(id);
    scrollToId(`wing-${id}`);
    // Move focus into the wing for keyboard users after compass activation
    requestAnimationFrame(() => {
      document.getElementById(`wing-${id}`)?.focus({ preventScroll: true });
    });
  }, []);

  // Scroll-spy: which wing is in view (for compass active state)
  useEffect(() => {
    const nodes = hallWings
      .map((w) => document.getElementById(`wing-${w.id}`))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the most visible intersecting wing
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible?.target?.id) return;
        const id = visible.target.id.replace(/^wing-/, '') as HallWingId;
        if (hallWings.some((w) => w.id === id)) {
          setActiveWing(id);
        }
      },
      { rootMargin: '-25% 0px -45% 0px', threshold: [0.15, 0.35, 0.55] },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="hall-museum">
      <HallAtrium>
        <HallCompass
          wings={hallWings}
          activeWing={activeWing}
          onSelect={onSelectWing}
          poetCounts={poetCounts}
        />
      </HallAtrium>

      <div className="hall-wings">
        {hallWings.map((wing) => {
          const wingPoets = wing.poetIds
            .map((id) => poetsById.get(id))
            .filter((p): p is NonNullable<typeof p> => Boolean(p));
          return (
            <HallWingSection
              key={wing.id}
              wing={wing}
              poets={wingPoets}
              active={activeWing === wing.id}
            />
          );
        })}
      </div>

      <footer className="hall-museum-foot">
        <p>
          Вестибюль наращивается проходами: материалы, свет, затем объём купола.
          Сейчас — точная кураторская карта: кого где ждать, без вымысла и без
          пустых обещаний «3D завтра».
        </p>
        <div className="hall-museum-foot-actions">
          <Link to="/poets" className="hall-btn-primary">
            Каталог поэтов
          </Link>
          <Link to="/" className="hall-btn-ghost">
            На главную
          </Link>
        </div>
      </footer>
    </div>
  );
}
