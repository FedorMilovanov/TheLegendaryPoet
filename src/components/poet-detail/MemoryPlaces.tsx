import { createElement, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Landmark, MapPin, Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';
import './memory-places.css';
import type { MemoryPhoto, MemoryPlace } from '../../data/memory-places';
import { loadMemoryPlaces } from '../../data/runtime/memoryPlaces';
import ResilientImage, { type ImageLoadState } from '../media/ResilientImage';
import { useDialogSurface } from '../../hooks/useDialogSurface';
import { asset } from '../../utils/asset';

const outline = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';
const linkClass = 'theme-poet-accent underline decoration-current/40 underline-offset-4 hover:decoration-current ' + outline;

const reducedMotion = '(prefers-reduced-motion: reduce)';
const galleryControl = 'memory-gallery-control grid place-items-center text-white';
const storyGrid = 'grid grid-cols-1 gap-6 items-start';
const subtitle = 'theme-text font-serif memory-subtitle';
const kicker = 'text-xs font-semibold uppercase tracking-widest';
const sectionKicker = 'theme-poet-accent ' + kicker;
const failureLabel = 'Фотография недоступна';

const muted = 'theme-functional-muted';
const serif = 'theme-text font-serif';
const accent = 'theme-poet-accent';
const bodyText = 'theme-text';
const islandMuted = 'theme-dark-island-muted';
const changesClass = 'memory-photo-changes';
const galleryImageFailure = 'memory-image-failure ';
const statusClass = 'theme-functional-muted text-sm';

function copy(tag: 'p' | 'h4' | 'span' | 'dt' | 'dd', className: string, children: ReactNode, key?: string) {
  return createElement(tag, { className, key }, children);
}

function SourceLink({ href, children, className = linkClass }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
}

function PhotoCredit({ photo, gallery = false, cutout = false }: { photo: MemoryPhoto; gallery?: boolean; cutout?: boolean }) {
  const className = gallery ? 'underline underline-offset-4' : linkClass;
  return <p className={(gallery ? islandMuted : muted) + ' memory-photo-credit'}>
    <SourceLink href={photo.source} className={className}>{photo.credit} · {photo.sourceLabel}</SourceLink>
    {' · '}<SourceLink href={photo.licenseUrl} className={className}>{photo.license}</SourceLink>
    {copy("span", changesClass, photo.changes)}
    {cutout && copy("span", changesClass, photo.preview?.changes)}
  </p>;
}

function Photograph({ photo, index, onOpen }: { photo: MemoryPhoto; index: number; onOpen: (index: number, reveal: boolean) => void }) {
  const [imageState, setImageState] = useState<ImageLoadState>('loading');
  const cutout = Boolean(photo.preview && imageState === 'loaded');
  const frame = photo.preview?.frame;
  const frameStyle = frame ? {
    '--memory-frame-ratio': frame.width / frame.height,
    '--memory-frame-image-width': `${photo.width / frame.width * 100}%`,
    '--memory-frame-image-left': `${-frame.x / frame.width * 100}%`,
    '--memory-frame-image-top': `${-frame.y / frame.height * 100}%`,
  } as CSSProperties : undefined;
  return (
    <figure className="memory-photo min-w-0">
      <button type="button" className={"memory-photo-trigger relative block w-full overflow-hidden rounded-xl " + outline} data-cutout={cutout} data-frame={Boolean(frame)} style={frameStyle} aria-haspopup="dialog" aria-label={`Открыть ${imageState === 'failed' ? 'галерею' : cutout ? 'оригинал фотографии' : 'фотографию'}: ${photo.alt}${imageState === 'failed' ? ' (фотография недоступна)' : ''}`} onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); onOpen(index, cutout); }}>
        <ResilientImage src={photo.preview?.src ?? photo.src} fallbackSrc={photo.preview ? photo.src : undefined} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" onStateChange={setImageState} style={{ aspectRatio: photo.width / photo.height }} className="block h-auto w-full object-contain" />
        <span className={galleryImageFailure + muted} aria-hidden="true">{failureLabel}</span>
        <span aria-hidden="true" className={`absolute bottom-3 right-3 flex h-11 items-center justify-center gap-2 rounded-full bg-black/80 text-white ${cutout ? 'px-3' : 'w-11'}`}><Maximize2 size={18} />{cutout && <span className="text-xs">Оригинал</span>}</span>
      </button>
      <figcaption className="memory-caption">
        {copy("p", bodyText + " memory-caption-text", photo.caption)}
        <PhotoCredit photo={photo} cutout={cutout} />
      </figcaption>
    </figure>
  );
}

function Gallery({ photos, index, initialReveal, onChange, onClose }: { photos: readonly MemoryPhoto[]; index: number; initialReveal: boolean; onChange: (index: number) => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(false);
  const [reveal, setReveal] = useState(() => initialReveal && !window.matchMedia(reducedMotion).matches);
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
    if (!reveal) return;
    const motion = window.matchMedia(reducedMotion);
    const retire = () => { if (motion.matches) setReveal(false); };
    motion.addEventListener('change', retire);
    retire();
    return () => motion.removeEventListener('change', retire);
  }, [reveal]);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.scrollTo(zoom ? (stage.scrollWidth - stage.clientWidth) / 2 : 0, zoom ? (stage.scrollHeight - stage.clientHeight) / 2 : 0);
  }, [index, zoom]);
  return createPortal(
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Фотографии места памяти" tabIndex={-1}
      className="memory-gallery fixed inset-0 grid theme-dark-island theme-dark-island-text"
      onKeyDown={(event) => {
        if (!isTopmost() || photos.length < 2 || (zoom && event.target === stageRef.current)) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          step(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}>
      <header className="memory-gallery-toolbar flex flex-wrap items-center justify-between">
        <p className={islandMuted + " text-sm tabular-nums"} aria-live="polite">{index + 1} / {photos.length}{imageState === 'failed' && <span className="sr-only">{". " + failureLabel}</span>}</p>
        <div className="memory-gallery-actions flex flex-wrap items-center">
          {photos.length > 1 && [-1, 1].map(direction => {
            const Icon = direction < 0 ? ChevronLeft : ChevronRight;
            return <button key={direction} className={galleryControl} type="button" aria-label={direction < 0 ? 'Предыдущая фотография' : 'Следующая фотография'} onClick={() => step(direction)}><Icon size={20} /></button>;
          })}
          <button className={galleryControl} type="button" aria-label={zoom ? 'Уменьшить фотографию' : 'Увеличить фотографию'} aria-pressed={zoom} disabled={!imageReady} onClick={() => { setReveal(false); setZoom((value) => !value); }}>{zoom ? <ZoomOut size={20} /> : <ZoomIn size={20} />}</button>
          <button ref={closeRef} className={galleryControl} type="button" aria-label="Закрыть фотографии" onClick={onClose}><X size={22} /></button>
        </div>
      </header>
      <div className="memory-gallery-stage relative overflow-auto min-h-0 min-w-0 flex" ref={stageRef} data-zoom={zoom} data-reveal={reveal && Boolean(photo.preview) && imageState !== 'failed'}
        role="region" aria-label="Область фотографии" tabIndex={zoom ? 0 : -1}
        style={{ '--memory-photo-ratio': photo.width / photo.height, '--memory-photo-native': photo.width + 'px', '--memory-reveal-preview': photo.preview ? `url("${asset(photo.preview.src)}")` : undefined } as CSSProperties}>
        <ResilientImage key={photo.src} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="eager" onStateChange={setImageState} onAnimationEnd={(event) => { if (event.animationName === 'memory-photo-reveal') setReveal(false); }} />
        <span className={galleryImageFailure + islandMuted} aria-hidden="true">{failureLabel}</span>
      </div>
      <footer className="memory-gallery-caption">
        {copy("p", "text-sm leading-relaxed", photo.caption)}
        <PhotoCredit photo={photo} gallery />
      </footer>
    </div>, document.body
  );
}

function Exhibit({ place }: { place: MemoryPlace }) {
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const [revealOnOpen, setRevealOnOpen] = useState(false);
  const open = (index: number, reveal: boolean) => {
    setRevealOnOpen(reveal);
    setActivePhoto(index);
  };
  const close = useCallback(() => setActivePhoto(null), []);
  const [hero, figure, detail, ...more] = place.photos;
  const note = place.detailNote && <aside className="memory-note">
        {copy("p", sectionKicker, "Деталь экспозиции")}
        {copy("h4", subtitle, place.detailNote.title)}
        {copy("p", bodyText + " memory-note-text", place.detailNote.text)}
      </aside>;
  const quotation = place.literaryConnection && (
        <figure className="memory-quotation">
          {copy("p", sectionKicker + " mb-4", "Место в литературе")}
          <blockquote className={serif + " text-xl leading-[1.6] sm:text-2xl"}>
            {place.literaryConnection.lines.map((line) => copy("span", "block", line, line))}
          </blockquote>
          <figcaption className={muted + " mt-4 text-xs leading-relaxed"}>
            <SourceLink href={place.literaryConnection.url}>{place.literaryConnection.attribution} ↗</SourceLink>
          </figcaption>
        </figure>
      );
  return (
    <article id={`memory-${place.id}`} aria-labelledby={`memory-${place.id}-title`} className="memory-exhibit min-w-0 grid grid-cols-1 gap-6 scroll-mt-28">
      <header className="memory-heading">
        <p className={muted + " flex items-start gap-2 text-xs font-medium leading-relaxed"}><MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> <span>{place.location}</span></p>
        <h3 id={`memory-${place.id}-title`} className={serif + " memory-title"}>{place.title}</h3>
        {copy("p", accent + " text-sm font-semibold", place.date)}
      </header>
      {hero && <Photograph photo={hero} index={0} onOpen={open} />}
      {copy("p", "memory-lead " + bodyText, place.intro)}
      <dl className="memory-facts grid grid-cols-1">
        {place.facts.map((fact) => (
          <div key={fact.label} className="memory-fact min-w-0 grid">
            {copy("dt", muted + " text-xs leading-relaxed", fact.label)}
            {copy("dd", serif + " memory-fact-value tabular-nums", fact.value)}
          </div>
        ))}
      </dl>
      <div className={"memory-story " + storyGrid} data-has-photo={Boolean(figure)}>
        <div className="memory-timeline min-w-0">
          {copy("h4", subtitle, "История места")}
          <ol className="memory-events grid grid-cols-1 gap-5 mt-4 pl-4">
            {place.timeline.map((event) => (
              <li key={event.date} className="memory-event relative min-w-0">
                {copy("p", accent + " memory-event-date tabular-nums", event.date)}
                {copy("p", bodyText + " memory-event-text", event.text)}
              </li>
            ))}
          </ol>
        </div>
        {figure && <div className={"memory-story-media " + storyGrid}>
          <Photograph photo={figure} index={1} onOpen={open} />
          {!detail && note}
        </div>}
      </div>
      {!figure && note}
      {detail ? (
        <div className={"memory-detail " + storyGrid} data-has-copy={Boolean(note || quotation)}>
          <Photograph photo={detail} index={2} onOpen={open} />
          {(note || quotation) && <div className={"memory-detail-copy " + storyGrid}>{note}{quotation}</div>}
        </div>
      ) : quotation}
      {more.length > 0 && <div className={"memory-extra " + storyGrid}>{more.map((photo, index) => <Photograph key={photo.src} photo={photo} index={index + 3} onOpen={open} />)}</div>}
      <details className="memory-sources">
        <summary className={"theme-text cursor-pointer text-sm font-semibold " + outline}>Источники и дальнейшее чтение</summary>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed">
          {place.sources.map((source) => <li key={source.url}><SourceLink href={source.url}>{source.label} ↗</SourceLink></li>)}
        </ul>
      </details>
      {activePhoto !== null && <Gallery photos={place.photos} index={activePhoto} initialReveal={revealOnOpen} onChange={setActivePhoto} onClose={close} />}
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
    <section id="memory-places" aria-labelledby="memory-places-heading" className="memory-places grid grid-cols-1 gap-6 scroll-mt-28">
      <header className="memory-section-heading grid gap-2">
        <p className={accent + " flex items-center gap-2 " + kicker}><Landmark size={17} aria-hidden="true" /> Литературная география</p>
        <h2 id="memory-places-heading" className={serif + " text-3xl leading-tight sm:text-4xl"}>Места памяти</h2>
      </header>
      {failed ? <div role="status" className={statusClass}>
        Не удалось загрузить экспозицию. <button type="button" className={linkClass} onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Повторить</button>
      </div> : !places.length ? <p role="status" className={statusClass}>Загрузка экспозиции…</p> : null}
      {places.length > 1 && (
        <nav aria-label="Места памяти поэта" className="flex flex-wrap gap-3">
          {places.map(place => <a key={place.id} href={`#memory-${place.id}`} className={linkClass}>{place.title}</a>)}
        </nav>
      )}
      {places.map(place => <Exhibit key={place.id} place={place} />)}
    </section>
  );
}
