import { Link } from '../../ui/Link';
import PoetImage from '../../PoetImage';
import type { Poet } from '../../../types/poet';
import { poetMuseumMeta, type MonumentMaterial } from '../../../data/poetMuseumMeta';
import { vtShared } from '../../../lib/viewTransition';

interface HallNicheProps {
  poet: Poet;
}

const MATERIAL_LABEL: Record<MonumentMaterial, string> = {
  marble: 'Мрамор',
  bronze: 'Бронза',
  'black-stone': 'Чёрный камень',
  glass: 'Стекло',
  mixed: 'Смешанный',
};

/**
 * Museum niche: double gold frame + bronze plaque.
 * Quote / material only from curated museum meta — never invented.
 */
export default function HallNiche({ poet }: HallNicheProps) {
  const meta = poetMuseumMeta[poet.id];
  const years = poet.deathYear
    ? `${poet.birthYear}–${poet.deathYear}`
    : `${poet.birthYear}–н.в.`;
  const quote = meta?.mainQuote || poet.shortBio;
  const material = meta?.material ? MATERIAL_LABEL[meta.material] : null;

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
        {material && <span className="hall-niche-material">{material}</span>}
        {quote && <p className="hall-niche-quote">«{quote}»</p>}
      </div>
    </Link>
  );
}
