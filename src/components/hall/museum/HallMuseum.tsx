import { useCallback, useMemo, useState } from 'react';
import { Link } from '../../ui/Link';
import { poets } from '../../../data/poets';
import { hallWings, type HallWingId } from '../../../data/hall';
import HallAtrium from './HallAtrium';
import HallCompass from './HallCompass';
import HallWingSection from './HallWingSection';
import { scrollToId } from '../../../utils/smoothScroll';
import './hallMuseum.css';

/**
 * Hall v3 Pass 1 — museum vestibule.
 *
 * DOM-only, warm pantheon palette, four wings from `data/hall/wings`.
 * No three.js. Future R3F atrium reuses the same wing data.
 */
export default function HallMuseum() {
  const [activeWing, setActiveWing] = useState<HallWingId | null>(null);

  const poetsById = useMemo(() => {
    const map = new Map(poets.map((p) => [p.id, p]));
    return map;
  }, []);

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
          Следующие проходы добавят объём купола и прогулку по мрамору. Сейчас —
          точная кураторская карта зала: кого где ждать, без вымысла и без пустых
          обещаний «3D завтра».
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
