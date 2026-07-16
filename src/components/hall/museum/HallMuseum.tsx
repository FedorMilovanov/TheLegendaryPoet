import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '../../ui/Link';
import { poets } from '../../../data/poets';
import { hallWings, type HallWingId } from '../../../data/hall';
import HallAtrium from './HallAtrium';
import HallCompass from './HallCompass';
import HallWingSection from './HallWingSection';
import { scrollToId } from '../../../utils/smoothScroll';
import './hallMuseum.css';

// Pass 3: R3F atrium is a separate chunk — never in the homepage shell.
const HallAtriumStage = lazy(() => import('../atrium/HallAtriumStage'));

/**
 * Hall v3 Pass 1–3 — museum vestibule + optional warm R3F atrium.
 *
 * DOM pantheon always ships. The 3D rotunda loads only after the visitor
 * opts in (and only on this route via lazy()). Old cyan-nave HallOfPoets
 * remains unrouted scaffolding.
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

      <Suspense fallback={null}>
        <HallAtriumStage />
      </Suspense>

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
          Кураторские крылья — карта зала. Объём под куполом (проход III) открывается
          по желанию и не подменяет ниши: портреты и цитаты остаются здесь, без
          вымысла и без «космических» декораций.
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
