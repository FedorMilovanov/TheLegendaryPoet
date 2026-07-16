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

  return (
    <section
      id={`wing-${wing.id}`}
      className={`hall-wing${active ? ' is-active' : ''}`}
      aria-labelledby={`wing-title-${wing.id}`}
      style={{ borderColor: `${wing.accent}33` }}
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

      {count === 0 ? (
        <div className="hall-wing-empty" role="status">
          <div className="hall-wing-empty-seal">Запечатано</div>
          <p className="hall-wing-empty-text">
            Крыло IV ждёт кураторских материалов. Мы не заполняем пустые ниши
            вымыслом — когда появятся выверенные страницы современных поэтов,
            они займут место здесь.
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
