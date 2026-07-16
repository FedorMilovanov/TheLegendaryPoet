import { Link } from '../../ui/Link';
import PoetImage from '../../PoetImage';
import type { Poet } from '../../../types/poet';
import { poetMuseumMeta } from '../../../data/poetMuseumMeta';
import { vtShared } from '../../../lib/viewTransition';

interface HallNicheProps {
  poet: Poet;
}

/**
 * Museum niche: gold-framed portrait + bronze plaque.
 * Quote comes only from curated museum meta (or shortBio fallback) — never invented.
 */
export default function HallNiche({ poet }: HallNicheProps) {
  const meta = poetMuseumMeta[poet.id];
  const years = poet.deathYear
    ? `${poet.birthYear}–${poet.deathYear}`
    : `${poet.birthYear}–н.в.`;
  const quote = meta?.mainQuote || poet.shortBio;

  return (
    <Link
      to={`/poets/${poet.id}`}
      className="hall-niche"
      aria-label={`${poet.name}, ${years}. Открыть страницу поэта`}
    >
      <div className="hall-niche-frame">
        <PoetImage
          src={poet.photo}
          name={poet.name}
          alt={`Портрет: ${poet.name}`}
          style={vtShared(`poet-portrait-${poet.id}`)}
        />
      </div>
      <div className="hall-niche-plaque">
        <h3 className="hall-niche-name">{poet.name}</h3>
        <div className="hall-niche-years">{years}</div>
        {quote && <p className="hall-niche-quote">«{quote}»</p>}
      </div>
    </Link>
  );
}
