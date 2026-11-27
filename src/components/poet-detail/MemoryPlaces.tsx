import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Landmark, MapPin, Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';
import './memory-places.css';
import type { MemoryPhoto, MemoryPlace } from '../../data/memory-places';
import { loadMemoryPlaces } from '../../data/runtime/memoryPlaces';
import ResilientImage, { type ImageLoadState } from '../media/ResilientImage';
import { useDialogSurface } from '../../hooks/useDialogSurface';
import { asset } from '../../utils/asset';

const linkClass = 'theme-poet-accent underline decoration-current/40 underline-offset-4 hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';

function Photograph({ photo, index, onOpen }: { photo: MemoryPhoto; index: number; onOpen: (index: number) => void }) {
  const [imageState, setImageState] = useState<ImageLoadState>('loading');
  const cutout = Boolean(photo.preview && imageState === 'loaded');
  return (
    <figure className="memory-photo min-w-0">
      <button type="button" className="memory-photo-trigger relative block w-full overflow-hidden rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" data-cutout={cutout} aria-haspopup="dialog" aria-label={imageState === 'failed' ? `Открыть галерею: ${photo.alt} (фотография недоступна)` : `Открыть фотографию: ${photo.alt}`} onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); onOpen(index); }}>
        <ResilientImage src={photo.preview?.src ?? photo.src} fallbackSrc={photo.preview ? photo.src : undefined} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" onStateChange={setImageState} style={{ aspectRatio: photo.width / photo.height }} className="block h-auto w-full object-contain" />
        <span className="memory-image-failure theme-functional-muted" aria-hidden="true">Фотография недоступна</span>
        <span aria-hidden="true" className={`absolute bottom-3 right-3 flex h-11 items-center justify-center gap-2 rounded-full bg-black/80 text-white ${cutout ? 'px-3' : 'w-11'}`}><Maximize2 size={18} />{cutout && <span className="text-xs">Оригинал</span>}</span>
      </button>
      <figcaption className="memory-caption">
        <p className="theme-text memory-caption-text">{photo.caption}</p>
        <p className="theme-functional-muted memory-photo-credit">
          <a href={photo.source} target="_blank" rel="noopener noreferrer" className={linkClass}>{photo.credit} · {photo.sourceLabel}</a>
          {' · '}<a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>{photo.license}</a>
          <span className="memory-photo-changes">{photo.changes}</span>
          {cutout && <span className="memory-photo-changes">{photo.preview?.changes}</span>}
        </p>
      </figcaption>
    </figure>
  );
}

function Gallery({ photos, index, onChange, onClose }: { photos: readonly MemoryPhoto[]; index: number; onChange: (index: number) => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(false);
  const [reveal, setReveal] = useState(Boolean(photos[index]?.preview));
  const [imageState, setImageState] = useState<ImageLoadState>('loading');
  const imageReady = imageState === 'loaded' || imageState === 'fallback';
  const { isTopmost } = useDialogSurface({ open: true, dialogRef, initialFocusRef: closeRef, onClose, label: 'memory-photo-gallery' });
  const photo = photos[index];
  const step = (direction: number) => {
    setZoom(false);
    setReveal(false);
    setImageState('loading');
    onChange((index + direction + photos.length) % photos.length);
  };
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.scrollTo(zoom ? (stage.scrollWidth - stage.clientWidth) / 2 : 0, zoom ? (stage.scrollHeight - stage.clientHeight) / 2 : 0);
  }, [index, zoom]);
  return createPortal(
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Фотографии места памяти" tabIndex={-1}
      className="memory-gallery theme-dark-island theme-dark-island-text"
      onKeyDown={(event) => {
        if (!isTopmost() || photos.length < 2 || (zoom && event.target === stageRef.current)) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          step(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}>
      <header className="memory-gallery-toolbar">
        <p className="theme-dark-island-muted text-sm tabular-nums" aria-live="polite">{index + 1} / {photos.length}{imageState === 'failed' && <span className="sr-only">. Фотография недоступна</span>}</p>
        <div className="memory-gallery-actions">
          {photos.length > 1 && <>
            <button className="memory-gallery-control" type="button" aria-label="Предыдущая фотография" onClick={() => step(-1)}><ChevronLeft size={20} /></button>
            <button className="memory-gallery-control" type="button" aria-label="Следующая фотография" onClick={() => step(1)}><ChevronRight size={20} /></button>
          </>}
          <button className="memory-gallery-control" type="button" aria-label={zoom ? 'Уменьшить фотографию' : 'Увеличить фотографию'} aria-pressed={zoom} disabled={!imageReady} onClick={() => { setReveal(false); setZoom((value) => !value); }}>{zoom ? <ZoomOut size={20} /> : <ZoomIn size={20} />}</button>
          <button ref={closeRef} className="memory-gallery-control" type="button" aria-label="Закрыть фотографии" onClick={onClose}><X size={22} /></button>
        </div>
      </header>
      <div className="memory-gallery-stage" ref={stageRef} data-zoom={zoom} data-reveal={reveal && Boolean(photo.preview) && imageState !== 'failed'}
        role="region" aria-label="Область фотографии" tabIndex={zoom ? 0 : -1}
        style={{ '--memory-photo-ratio': photo.width / photo.height, '--memory-photo-native': photo.width + 'px', '--memory-reveal-preview': photo.preview ? `url("${asset(photo.preview.src)}")` : undefined } as CSSProperties}>
        <ResilientImage key={photo.src} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="eager" onStateChange={setImageState} />
        <span className="memory-image-failure theme-dark-island-muted" aria-hidden="true">Фотография недоступна</span>
      </div>
      <footer className="memory-gallery-caption">
        <p className="text-sm leading-relaxed">{photo.caption}</p>
        <p className="theme-dark-island-muted memory-photo-credit">
          <a className="underline underline-offset-4" href={photo.source} target="_blank" rel="noopener noreferrer">{photo.credit} · {photo.sourceLabel}</a>
          {' · '}<a className="underline underline-offset-4" href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a>
          <span className="memory-photo-changes">{photo.changes}</span>
        </p>
      </footer>
    </div>, document.body
  );
}

function Exhibit({ place }: { place: MemoryPlace }) {
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const close = useCallback(() => setActivePhoto(null), []);
  const [hero, figure, detail, ...more] = place.photos;
  const note = place.detailNote && <aside className="memory-note">
        <p className="theme-poet-accent text-xs font-semibold uppercase tracking-widest">Деталь экспозиции</p>
        <h4 className="theme-text font-serif memory-subtitle">{place.detailNote.title}</h4>
        <p className="theme-text memory-note-text">{place.detailNote.text}</p>
      </aside>;
  const quotation = place.literaryConnection && (
        <figure className="memory-quotation">
          <p className="theme-poet-accent mb-4 text-xs font-semibold uppercase tracking-widest">Место в литературе</p>
          <blockquote className="theme-text font-serif text-xl leading-[1.6] sm:text-2xl">
            {place.literaryConnection.lines.map((line) => <span key={line} className="block">{line}</span>)}
          </blockquote>
          <figcaption className="theme-functional-muted mt-4 text-xs leading-relaxed">
            <a href={place.literaryConnection.url} target="_blank" rel="noopener noreferrer" className={linkClass}>{place.literaryConnection.attribution} ↗</a>
          </figcaption>
        </figure>
      );
  return (
    <article id={`memory-${place.id}`} aria-labelledby={`memory-${place.id}-title`} className="memory-exhibit scroll-mt-28">
      <header className="memory-heading">
        <p className="theme-functional-muted flex items-start gap-2 text-xs font-medium leading-relaxed"><MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> <span>{place.location}</span></p>
        <h3 id={`memory-${place.id}-title`} className="theme-text font-serif memory-title">{place.title}</h3>
        <p className="theme-poet-accent text-sm font-semibold">{place.date}</p>
      </header>
      {hero && <Photograph photo={hero} index={0} onOpen={setActivePhoto} />}
      <p className="memory-lead theme-text">{place.intro}</p>
      <dl className="memory-facts">
        {place.facts.map((fact) => (
          <div key={fact.label} className="memory-fact min-w-0">
            <dt className="theme-functional-muted text-xs leading-relaxed">{fact.label}</dt>
            <dd className="theme-text font-serif memory-fact-value tabular-nums">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="memory-story" data-has-photo={Boolean(figure)}>
        <div className="memory-timeline min-w-0">
          <h4 className="theme-text font-serif memory-subtitle">История места</h4>
          <ol className="memory-events">
            {place.timeline.map((event) => (
              <li key={event.date} className="memory-event">
                <p className="theme-poet-accent memory-event-date tabular-nums">{event.date}</p>
                <p className="theme-text memory-event-text">{event.text}</p>
              </li>
            ))}
          </ol>
        </div>
        {figure && <div className="memory-story-media">
          <Photograph photo={figure} index={1} onOpen={setActivePhoto} />
          {!detail && note}
        </div>}
      </div>
      {!figure && note}
      {detail ? (
        <div className="memory-detail" data-has-copy={Boolean(note || quotation)}>
          <Photograph photo={detail} index={2} onOpen={setActivePhoto} />
          {(note || quotation) && <div className="memory-detail-copy">{note}{quotation}</div>}
        </div>
      ) : quotation}
      {more.length > 0 && <div className="memory-extra">{more.map((photo, index) => <Photograph key={photo.src} photo={photo} index={index + 3} onOpen={setActivePhoto} />)}</div>}
      <details className="memory-sources">
        <summary className="theme-text cursor-pointer text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Источники и дальнейшее чтение</summary>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed">
          {place.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className={linkClass}>{source.label} ↗</a></li>)}
        </ul>
      </details>
      {activePhoto !== null && <Gallery photos={place.photos} index={activePhoto} onChange={setActivePhoto} onClose={close} />}
    </article>
  );
}

export default function MemoryPlaces({ poetId, revision }: { poetId: string; revision: string }) {
  const [places, setPlaces] = useState<readonly MemoryPlace[]>([]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setPlaces([]);
    setFailed(false);
    loadMemoryPlaces(poetId, revision, controller.signal)
      .then(value => { if (!controller.signal.aborted) setPlaces(value); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [poetId, revision, attempt]);
  useEffect(() => {
    if (!places.length) return;
    const frame = requestAnimationFrame(() => window.dispatchEvent(new CustomEvent('tlp-poet-corpus-hydrated', { detail: { poetId } })));
    return () => cancelAnimationFrame(frame);
  }, [poetId, places]);
  return (
    <section id="memory-places" aria-labelledby="memory-places-heading" className="memory-places scroll-mt-28">
      <header className="memory-section-heading">
        <p className="theme-poet-accent flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"><Landmark size={17} aria-hidden="true" /> Литературная география</p>
        <h2 id="memory-places-heading" className="theme-text font-serif text-3xl leading-tight sm:text-4xl">Места памяти</h2>
      </header>
      {failed ? <div role="status" className="theme-functional-muted text-sm">
        Не удалось загрузить экспозицию. <button type="button" className={linkClass} onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Повторить</button>
      </div> : !places.length ? <p role="status" className="theme-functional-muted text-sm">Загрузка экспозиции…</p> : null}
      {places.length > 1 && (
        <nav aria-label="Места памяти поэта" className="flex flex-wrap gap-3">
          {places.map(place => <a key={place.id} href={`#memory-${place.id}`} className={linkClass}>{place.title}</a>)}
        </nav>
      )}
      {places.map(place => <Exhibit key={place.id} place={place} />)}
    </section>
  );
}
