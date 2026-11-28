/** @jsxRuntime automatic */
import type { ComponentType, ReactNode, Ref } from 'react';
import type { PoemPageModel, ReadingLink } from '../../lib/poemPageModel';

const linkClass = 'theme-text inline-flex min-h-11 items-center underline decoration-current underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';

/** Shared server/client reading body. Pure markup: no route/store/window access,
 * no hidden SEO copy, no independently implemented static HTML template.
 * Interactive Reader controls can be attached around this single content owner.
 */
export type PoemInternalLinkProps = { href: string; className: string; children: ReactNode };

function StaticPoemLink(props: PoemInternalLinkProps) {
  return <a {...props} />;
}

interface PoemReadingBodyProps {
  internalLink?: ComponentType<PoemInternalLinkProps>;
  page: PoemPageModel;
  articleRef?: Ref<HTMLElement>;
  verseRef?: Ref<HTMLDivElement>;
  actions?: ReactNode;
  facsimileViewer?: ReactNode;
}
export default function PoemReadingBody({ page, articleRef, verseRef, actions, facsimileViewer, internalLink: InternalLink = StaticPoemLink }: PoemReadingBodyProps) {
  const neighbours: Array<{ label: string; link: ReadingLink }> = [];
  if (page.previous) neighbours.push({ label: 'Предыдущее стихотворение', link: page.previous });
  if (page.next) neighbours.push({ label: 'Следующее стихотворение', link: page.next });
  return (
    <article ref={articleRef} data-poem-reading-page={page.poemId} className="theme-page-surface mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 md:py-16">
      <nav aria-label="Хлебные крошки" className="theme-functional-muted mb-8 text-sm">
        <ol className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {page.breadcrumbs.map((item, index) => (
            <li key={item.path} className="min-w-0 break-words">
              {index === page.breadcrumbs.length - 1
                ? <span aria-current="page">{item.name}</span>
                : <InternalLink className={linkClass} href={item.path}>{item.name}</InternalLink>}
            </li>
          ))}
        </ol>
      </nav>
      <header className="mb-8 border-b border-[var(--tlp-border-subtle)] pb-7">
        <InternalLink href={page.authorHref} className={linkClass}>{page.authorName}</InternalLink>
        <h1 className="theme-text mt-3 break-words font-serif text-4xl leading-tight sm:text-5xl">{page.heading}</h1>
        {(page.yearLabel || page.editionYear !== undefined) && (
          <p className="theme-functional-muted mt-4 text-sm">{[page.yearLabel, page.editionYear !== undefined ? 'редакция ' + page.editionYear + ' г.' : undefined].filter(Boolean).join(' · ')}</p>
        )}
        {page.yearNote && <p className="theme-functional-muted mt-2 max-w-prose text-sm leading-relaxed">{page.yearNote}</p>}
        {page.scope === 'excerpt' && (
          <p data-poem-excerpt-notice role="note" className="theme-functional-muted mt-4 border-l-2 border-current pl-4 text-sm leading-relaxed">
            Здесь представлен фрагмент произведения, а не полный текст.
          </p>
        )}
        {actions}
      </header>
      <section aria-labelledby="poem-text-heading" className="theme-elevated-surface mb-10 rounded-2xl border p-5 sm:p-9 md:p-12">
        <h2 id="poem-text-heading" className="theme-functional-muted mb-5 text-sm font-semibold">{page.scope === 'excerpt' ? 'Фрагмент' : 'Текст стихотворения'}</h2>
        {page.epigraph && (
          <blockquote className="theme-functional-muted mb-7 whitespace-pre-wrap break-words font-serif text-lg italic leading-relaxed">
            {page.epigraph.text}<footer className="mt-2 text-sm">— {page.epigraph.attribution}</footer>
          </blockquote>
        )}
        <div ref={verseRef} data-poem-canonical className="theme-text whitespace-pre-wrap break-words font-serif text-xl leading-[1.85] sm:text-2xl">{page.text}</div>
        <a href={page.source} rel="noopener noreferrer" className={linkClass + ' mt-6 text-sm'}>Источник текста</a>
      </section>
      {page.facsimile && (
        <div data-poem-facsimile-record className="theme-elevated-surface mb-9 rounded-2xl border p-5 sm:p-7">
          <h2 className="theme-text mb-3 font-serif text-2xl">Архивная страница первой публикации</h2>
          <p className="theme-text leading-relaxed">{page.facsimile.publication} · издано в {page.facsimile.publicationYear} г.</p>
          <p className="theme-functional-muted mt-2 text-sm leading-relaxed">{page.facsimile.credit}</p>
          <ul className="mt-3 space-y-2">
            {page.facsimile.pages.map(leaf => <li key={leaf.src} className="flex flex-wrap gap-x-4">
              <a href={leaf.src} className={linkClass}>Открыть лист {leaf.printPage}</a>
              <a href={leaf.originalUrl} rel="noopener noreferrer" className={linkClass}>Архивный источник</a>
            </li>)}
          </ul>
          {facsimileViewer}
        </div>
      )}
      <section aria-labelledby="poem-analysis-heading" className="mb-9">
        <h2 id="poem-analysis-heading" className="theme-text mb-4 font-serif text-3xl">Литературный анализ</h2>
        <p data-poem-analysis className="theme-text whitespace-pre-wrap break-words text-base leading-8">{page.analysis}</p>
      </section>
      {page.textualNote && (
        <section aria-labelledby="poem-edition-heading" className="theme-elevated-surface mb-9 rounded-2xl border p-5 sm:p-7">
          <h2 id="poem-edition-heading" className="theme-text mb-4 font-serif text-2xl">История текста и редакции</h2>
          <p className="theme-text whitespace-pre-wrap break-words leading-7">{page.textualNote}</p>
          {page.textualSource && <a className={linkClass + ' mt-3 text-sm'} href={page.textualSource} rel="noopener noreferrer">Текстологический источник</a>}
        </section>
      )}
      {!page.textualNote && page.textualSource && <p className="mb-9"><a className={linkClass} href={page.textualSource} rel="noopener noreferrer">Текстологический источник</a></p>}
      {page.biblicalPerspective && (
        <section aria-labelledby="poem-perspective-heading" className="theme-elevated-surface mb-9 rounded-2xl border p-5 sm:p-7">
          <h2 id="poem-perspective-heading" className="theme-text mb-4 font-serif text-2xl">Христианский взгляд</h2>
          <p className="theme-text whitespace-pre-wrap break-words leading-7">{page.biblicalPerspective}</p>
        </section>
      )}
      {page.music.length > 0 && (
        <section aria-labelledby="poem-music-heading" className="mb-9">
          <h2 id="poem-music-heading" className="theme-text mb-3 font-serif text-2xl">Музыкальные интерпретации</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {page.music.map(track => <li key={track.href}><InternalLink className={linkClass} href={track.href}>{track.title}</InternalLink></li>)}
          </ul>
        </section>
      )}
      <nav aria-label="Другие стихотворения" className="border-t border-[var(--tlp-border-subtle)] pt-6">
        <InternalLink className={linkClass + ' mb-4'} href={page.legacyPath}>Стихотворение в собрании автора</InternalLink>
        {neighbours.length > 0 && <ul className="grid gap-4 sm:grid-cols-2">
          {neighbours.map(item => <li key={item.link.href} className="theme-elevated-surface rounded-xl border p-4">
            <p className="theme-functional-muted text-sm">{item.label}</p>
            <InternalLink className={linkClass + ' break-words'} href={item.link.href}>{item.link.title}</InternalLink>
          </li>)}
        </ul>}
      </nav>
    </article>
  );
}
