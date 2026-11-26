import { ArrowUpRight, Landmark, MapPin } from 'lucide-react';
import './memory-places.css';
import { getMemoryPlaces, type MemoryPhoto, type MemoryPlace } from '../../data/memory-places';

const linkClass = 'theme-poet-accent underline decoration-current/40 underline-offset-4 hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';

function Photograph({ photo }: { photo: MemoryPhoto }) {
  return (
    <figure className="theme-soft-surface min-w-0 overflow-hidden rounded-2xl border">
      <a href={photo.src} target="_blank" rel="noopener noreferrer" className="group relative block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px]" aria-label={`Открыть фотографию: ${photo.alt}`}>
        <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" decoding="async" className="block h-auto w-full" />
        <span aria-hidden="true" className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-black/75 text-white"><ArrowUpRight size={19} /></span>
      </a>
      <figcaption className="p-4">
        <p className="theme-text text-sm font-medium leading-relaxed">{photo.caption}</p>
        <p className="theme-functional-muted mt-2 text-xs leading-relaxed">
          <a href={photo.source} target="_blank" rel="noopener noreferrer" className={linkClass}>{photo.credit} · {photo.sourceLabel}</a>
          {' · '}<a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>{photo.license}</a>
          {' · '}{photo.changes}
        </p>
      </figcaption>
    </figure>
  );
}

function Exhibit({ place }: { place: MemoryPlace }) {
  const [hero, figure, detail, ...more] = place.photos;
  return (
    <article id={`memory-${place.id}`} aria-labelledby={`memory-${place.id}-title`} className="memory-exhibit theme-elevated-surface scroll-mt-28 rounded-[2rem] border p-4 sm:p-8">
      <header className="mb-6 border-b border-luxury-gold/20 pb-6">
        <p className="theme-functional-muted flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide"><MapPin size={15} aria-hidden="true" /> {place.location}</p>
        <h3 id={`memory-${place.id}-title`} className="theme-text mt-3 max-w-[24ch] font-serif text-3xl leading-[1.12] sm:text-4xl">{place.title}</h3>
        <p className="theme-poet-accent mt-3 text-sm font-semibold">{place.date}</p>
        <p className="theme-text mt-5 max-w-[68ch] text-base leading-[1.85]">{place.intro}</p>
      </header>
      {hero && <Photograph photo={hero} />}
      <dl className="memory-facts my-7 gap-3">
        {place.facts.map((fact) => (
          <div key={fact.label} className="theme-soft-surface min-w-0 rounded-xl border border-luxury-gold/15 p-3">
            <dt className="theme-functional-muted text-xs leading-relaxed">{fact.label}</dt>
            <dd className="theme-text mt-2 font-serif text-xl leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-2xl">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="memory-story gap-6" data-has-photo={Boolean(figure)}>
        {figure && <Photograph photo={figure} />}
        <div className="memory-timeline min-w-0">
          <h4 className="theme-text mb-5 font-serif text-2xl">История места</h4>
          <ol className="space-y-5 border-l border-luxury-gold/30 pl-5">
            {place.timeline.map((event) => (
              <li key={event.date} className="relative">
                <span aria-hidden="true" className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-luxury-gold ring-4 ring-luxury-gold/10" />
                <p className="theme-poet-accent text-xs font-semibold tracking-wide tabular-nums">{event.date}</p>
                <p className="theme-text mt-2 text-sm leading-[1.85]">{event.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
      {detail && <div className="memory-detail mt-6 gap-6">
        <div className="self-center">
          <p className="theme-poet-accent mb-2 text-xs font-semibold uppercase tracking-widest">Деталь экспозиции</p>
          <h4 className="theme-text font-serif text-2xl">{place.detailNote?.title ?? detail.alt}</h4>
          {place.detailNote && <p className="theme-text mt-3 text-sm leading-[1.85]">{place.detailNote.text}</p>}
        </div>
        <Photograph photo={detail} />
      </div>}
      {!detail && place.detailNote && (
        <aside className="theme-soft-surface mt-6 rounded-2xl border border-luxury-gold/20 p-5">
          <h4 className="theme-text font-serif text-2xl">{place.detailNote.title}</h4>
          <p className="theme-text mt-3 text-sm leading-[1.85]">{place.detailNote.text}</p>
        </aside>
      )}
      {more.length > 0 && <div className="mt-6 grid gap-4 sm:grid-cols-2">{more.map((photo) => <Photograph key={photo.src} photo={photo} />)}</div>}
      {place.literaryConnection && (
        <figure className="theme-soft-surface mt-7 rounded-2xl border border-luxury-gold/20 p-5 sm:p-7">
          <p className="theme-poet-accent mb-4 text-xs font-semibold uppercase tracking-widest">Место в литературе</p>
          <blockquote className="theme-text font-serif text-xl leading-[1.6] sm:text-2xl">
            {place.literaryConnection.lines.map((line) => <span key={line} className="block">{line}</span>)}
          </blockquote>
          <figcaption className="theme-functional-muted mt-4 text-xs leading-relaxed">
            <a href={place.literaryConnection.url} target="_blank" rel="noopener noreferrer" className={linkClass}>{place.literaryConnection.attribution} ↗</a>
          </figcaption>
        </figure>
      )}
      <details className="theme-soft-surface mt-7 rounded-xl border p-4">
        <summary className="theme-text cursor-pointer text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Источники и дальнейшее чтение</summary>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed">
          {place.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className={linkClass}>{source.label} ↗</a></li>)}
        </ul>
      </details>
    </article>
  );
}

export default function MemoryPlaces({ poetId }: { poetId: string }) {
  const places = getMemoryPlaces(poetId);
  if (!places.length) return null;
  return (
    <section id="memory-places" aria-labelledby="memory-places-heading" className="scroll-mt-28 space-y-6">
      <header>
        <p className="theme-poet-accent mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"><Landmark size={18} aria-hidden="true" /> Литературная география</p>
        <h2 id="memory-places-heading" className="theme-text font-serif text-3xl leading-tight sm:text-4xl">Места памяти</h2>
        <p className="theme-functional-muted mt-3 max-w-[65ch] text-sm leading-[1.8]">Памятники, дома, усадьбы и музеи. История памяти о поэте, рассказанная через реальные места, фотографии и документы.</p>
      </header>
      {places.length > 1 && (
        <nav aria-label="Места памяти поэта" className="flex flex-wrap gap-3">
          {places.map((place) => <a key={place.id} href={`#memory-${place.id}`} className={linkClass}>{place.title}</a>)}
        </nav>
      )}
      {places.map((place) => <Exhibit key={place.id} place={place} />)}
    </section>
  );
}
