import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Expand, ExternalLink, Minus, Plus, X } from 'lucide-react';
import type { PoemFacsimile as FacsimileData } from '../../data/poemFacsimiles';

export default function PoemFacsimile({ document }: { document: FacsimileData }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef('');
  const titleId = useId();
  const [pageIndex, setPageIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const page = document.pages[pageIndex];
  const firstPage = document.pages[0];

  useEffect(() => () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
      documentBodyRestore();
    }
  }, []);

  function documentBodyRestore() {
    if (typeof window !== 'undefined') window.document.body.style.overflow = previousOverflow.current;
  }

  function openViewer() {
    if (!dialogRef.current || dialogRef.current.open) return;
    previousOverflow.current = window.document.body.style.overflow;
    dialogRef.current.showModal();
    window.document.body.style.overflow = 'hidden';
    setPageIndex(0);
    setZoomed(false);
  }

  function closeViewer() {
    dialogRef.current?.close();
  }

  function onClosed() {
    documentBodyRestore();
    setZoomed(false);
    openButtonRef.current?.focus();
  }

  // Native <dialog> may restore focus to the viewport after controls rerender.
  // Listen while the modal is open instead of relying on one focused child.
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!dialogRef.current?.open) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setPageIndex((index) => Math.min(document.pages.length - 1, index + 1));
        setZoomed(false);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setPageIndex((index) => Math.max(0, index - 1));
        setZoomed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [document.pages.length]);


  return (
    <section data-poem-facsimile data-rights-status={document.rights} aria-label="Первопечатное издание" className="relative mt-8 min-w-0">
      <div className="facsimile-bleed relative isolate overflow-hidden bg-transparent px-2 py-10 sm:px-8 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, #000 25%, #000 70%, transparent 100%)' }}
        >
          <img
            src={firstPage.src}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            width={firstPage.width}
            height={firstPage.height}
            className="pointer-events-none absolute -right-[20%] -top-[28%] h-[164%] w-[85%] rotate-[-3deg] object-cover object-top opacity-[0.14] grayscale saturate-0 sm:-right-[1%] sm:w-[59%] sm:opacity-45"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, #000 24%, #000 78%, transparent 100%)',
            }}
          />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{
          background: 'radial-gradient(ellipse 62% 78% at 0% 50%, var(--tlp-facsimile-wash), transparent 95%)',
          maskImage: 'linear-gradient(to bottom, transparent, #000 19%, #000 80%, transparent)',
        }} />
        <div className="relative z-10 max-w-[23rem]">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-gold-light/75">
            Подлинная печать <span className="mx-2 text-white/65">/</span> {document.publicationYear}
          </p>
          <h4 className="max-w-[18rem] font-serif text-[clamp(1.5rem,4vw,2rem)] leading-[1.12] text-white">
            Стихи сквозь время
          </h4>
          <p className="mt-3 max-w-[21rem] text-sm leading-6 text-white/65">{document.publication}</p>
          <button
            ref={openButtonRef}
            type="button"
            onClick={openViewer}
            className="mt-5 -ml-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-luxury-gold-light transition-colors duration-200 hover:bg-luxury-gold/10 hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold motion-reduce:transition-none"
            aria-label="Рассмотреть полный оригинальный лист"
          >
            <Expand size={16} aria-hidden="true" />
            Рассмотреть оригинал
          </button>
        </div>
        <p className="pointer-events-none absolute bottom-3 right-3 z-10 text-[10px] font-medium tracking-[0.16em] text-white/70 sm:right-8">
          {document.pages.length === 1 ? '1 ЛИСТ' : `${document.pages.length} ЛИСТА`}
        </p>
      </div>

      <dialog
        ref={dialogRef}
        onClose={onClosed}
        aria-labelledby={titleId}
        className="fixed inset-0 m-auto h-[min(96dvh,970px)] max-h-[96dvh] w-[min(96vw,1150px)] max-w-[96vw] overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border-0 bg-[#080b10] p-0 text-white shadow-[0_24px_100px_rgba(0,0,0,.75)] backdrop:bg-black/90"
      >
        <div className="flex h-full min-h-0 flex-col">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-luxury-gold-light/75">Первопечатный лист · {document.publicationYear}</p>
              <h3 id={titleId} className="truncate font-serif text-lg text-white sm:text-xl">{document.publication}</h3>
            </div>
            <button type="button" onClick={closeViewer} aria-label="Закрыть оригинал" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold"><X size={21} /></button>
          </header>
          <div data-facsimile-stage className="min-h-0 flex-1 overflow-auto overscroll-contain bg-[#0b0d10]">
            <div className={zoomed
                ? 'flex min-h-full w-max min-w-full items-center justify-center p-3 sm:p-5'
                : 'flex min-h-full w-full min-w-0 items-center justify-center p-3 sm:p-5'}>
              <img
                key={page.src}
                src={page.src}
                alt={page.alt}
                width={page.width}
                height={page.height}
                decoding="async"
                className="block h-auto shrink-0 shadow-[0_12px_35px_rgba(0,0,0,.38)]"
                style={{ width: zoomed ? page.width * 1.6 : `min(100%, ${page.width}px)`, maxWidth: zoomed ? 'none' : '100%' }}
              />
            </div>
          </div>
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => { setPageIndex((i) => Math.max(0, i - 1)); setZoomed(false); }} disabled={pageIndex === 0} aria-label="Предыдущая страница" className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 disabled:opacity-25"><ArrowLeft size={19} /></button>
              <span className="min-w-16 text-center text-xs text-white/65" aria-live="polite">{pageIndex + 1} / {document.pages.length}</span>
              <button type="button" onClick={() => { setPageIndex((i) => Math.min(document.pages.length - 1, i + 1)); setZoomed(false); }} disabled={pageIndex === document.pages.length - 1} aria-label="Следующая страница" className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 disabled:opacity-25"><ArrowRight size={19} /></button>
              <span className="hidden text-xs text-white/45 sm:inline">с. {page.printPage}</span>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setZoomed((value) => !value)} aria-label={zoomed ? 'Уменьшить оригинал' : 'Увеличить оригинал'} aria-pressed={zoomed} className="flex h-11 items-center gap-1 rounded-lg px-2 text-xs text-white/75 transition hover:bg-white/10">
                {zoomed ? <Minus size={17} /> : <Plus size={17} />} {zoomed ? 'Уменьшить' : 'Увеличить'}
              </button>
              <a href={page.originalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-luxury-gold-light underline decoration-luxury-gold/40 underline-offset-4 hover:text-white">
                Источник <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
            <p className="w-full text-[10px] text-white/45">{document.credit} · Факсимиле без ретуши</p>
          </footer>
        </div>
      </dialog>
    </section>
  );
}
