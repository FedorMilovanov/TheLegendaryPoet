import type { KeyboardEvent } from 'react';
import type { HallWing, HallWingId } from '../../../data/hall';
import { pluralRu } from '../../../utils/feedbackValidation';

interface HallCompassProps {
  wings: HallWing[];
  activeWing: HallWingId | null;
  onSelect: (id: HallWingId) => void;
  poetCounts: Record<HallWingId, number>;
}

/**
 * Floor compass plate — four directions to the wings.
 * Keyboard: arrows move between buttons when focus is inside the compass.
 */
export default function HallCompass({ wings, activeWing, onSelect, poetCounts }: HallCompassProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!keys.includes(event.key)) return;

    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('button.hall-compass-btn'),
    );
    if (!buttons.length) return;
    const current = buttons.findIndex((b) => b === document.activeElement);
    if (current < 0) return;

    event.preventDefault();
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const next = (current + delta + buttons.length) % buttons.length;
    buttons[next]?.focus();
  };

  return (
    <nav className="hall-compass" aria-label="Направления залов" onKeyDown={onKeyDown}>
      <div className="hall-compass-caption">Центральный атриум · Пантеон поэтов</div>
      <div className="hall-compass-grid" role="group" aria-label="Четыре крыла">
        {wings.map((wing) => {
          const count = poetCounts[wing.id] ?? 0;
          const active = activeWing === wing.id;
          return (
            <button
              key={wing.id}
              type="button"
              className={`hall-compass-btn${active ? ' is-active' : ''}`}
              aria-current={active ? 'true' : undefined}
              aria-controls={`wing-${wing.id}`}
              onClick={() => onSelect(wing.id)}
            >
              <span className="hall-compass-num">{wing.numeral}</span>
              <span className="hall-compass-name">{wing.shortTitle}</span>
              <span className="hall-compass-count">
                {count === 0
                  ? 'запечатано'
                  : `${count} ${pluralRu(count, 'поэт', 'поэта', 'поэтов')}`}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
