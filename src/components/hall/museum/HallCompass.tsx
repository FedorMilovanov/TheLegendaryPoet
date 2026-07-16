import type { HallWing, HallWingId } from '../../../data/hall';
import { pluralRu } from '../../../utils/feedbackValidation';

interface HallCompassProps {
  wings: HallWing[];
  activeWing: HallWingId | null;
  onSelect: (id: HallWingId) => void;
  poetCounts: Record<HallWingId, number>;
}

/**
 * Floor compass plate from the temple reference — four directions to the wings.
 * Pure navigation aid; does not invent content.
 */
export default function HallCompass({ wings, activeWing, onSelect, poetCounts }: HallCompassProps) {
  return (
    <nav className="hall-compass" aria-label="Направления залов">
      <div className="hall-compass-caption">Центральный атриум · Пантеон поэтов</div>
      <div className="hall-compass-grid">
        {wings.map((wing) => {
          const count = poetCounts[wing.id] ?? 0;
          const active = activeWing === wing.id;
          return (
            <button
              key={wing.id}
              type="button"
              className={`hall-compass-btn${active ? ' is-active' : ''}`}
              aria-current={active ? 'true' : undefined}
              onClick={() => onSelect(wing.id)}
            >
              <span className="hall-compass-num">{wing.numeral}</span>
              <span className="hall-compass-name">{wing.shortTitle}</span>
              <span className="hall-compass-count">
                {count === 0
                  ? 'ожидает'
                  : `${count} ${pluralRu(count, 'поэт', 'поэта', 'поэтов')}`}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
