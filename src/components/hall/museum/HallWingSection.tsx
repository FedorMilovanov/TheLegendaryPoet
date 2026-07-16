import type { CSSProperties } from 'react';
import type { HallWing } from '../../../data/hall';
import type { Poet } from '../../../types/poet';
import HallNiche from './HallNiche';
import { titleCase } from '../../../utils/titleCase';
import { pluralRu } from '../../../utils/feedbackValidation';

interface HallWingSectionProps {
  wing: HallWing;
  poets: Poet[];
  active?: boolean;
}

export default function HallWingSection({ wing, poets, active }: HallWingSectionProps) {
  const count = poets.length;
  const isSealed = count === 0;

  return (
    <section
      id={`wing-${wing.id}`}
      className={`hall-wing${active ? ' is-active' : ''}${isSealed ? ' is-sealed' : ''}`}
      aria-labelledby={`wing-title-${wing.id}`}
      style={
        {
          borderColor: `${wing.accent}40`,
          ['--wing-accent' as string]: wing.accent,
        } as CSSProperties
      }
      tabIndex={-1}
    >
      <header className="hall-wing-head">
        <div className="hall-wing-meta">
          <span className="hall-wing-numeral" style={{ color: wing.accent }}>
            {wing.numeral}
          </span>
          <h2 id={`wing-title-${wing.id}`} className="hall-wing-title">
            {titleCase(wing.title)}
          </h2>
          <span className="hall-wing-era">{wing.era}</span>
        </div>
        <p className="hall-wing-desc">{wing.description}</p>
      </header>

      {isSealed ? (
        <div className="hall-wing-sealed" role="status">
          <div className="hall-wing-sealed-arch" aria-hidden="true" />
          <div className="hall-wing-sealed-lock" aria-hidden="true">
            IV
          </div>
          <div className="hall-wing-empty-seal">Дверь запечатана</div>
          <p className="hall-wing-empty-text">
            Крыло современных поэтов ждёт кураторских материалов. Пустые ниши
            не заполняем вымыслом — когда появятся выверенные страницы, они
            займут место за этой дверью.
          </p>
        </div>
      ) : (
        <>
          <div className="sr-only">
            {count} {pluralRu(count, 'поэт', 'поэта', 'поэтов')} в этом зале
          </div>
          <div className="hall-wing-grid">
            {poets.map((poet) => (
              <HallNiche key={poet.id} poet={poet} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
