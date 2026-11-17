import type { Poet } from '../../types/poet';

export default function PoetSources({ poet }: { poet: Poet }) {
  const items = poet.sources ?? [];
  if (items.length === 0) return null;

  // Keep Blok's scholarly apparatus available without a twenty-link text wall.
  // Native details retain all external destinations in the DOM.
  const isBlok = poet.id === 'alexander-blok' && items.length > 6;
  const preferred = isBlok ? items.filter((item) => ["rvb.ru/20vek/blok/pss20/toc","ro.pushkinskijdom.ru/stocks","litexpress.goslitmuz.ru","pstgu.ru"].some((part) => item.url.includes(part))).slice(0, 4) : [];
  const featured = isBlok ? preferred : items;
  const additional = isBlok ? items.filter((item) => !preferred.some((pick) => pick.url === item.url)) : [];

  const sourceLink = ({ title, url }: { title: string; url: string }) => (
    <li key={url} className="min-w-0">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="theme-text inline-flex min-h-11 max-w-full items-center break-words rounded-lg py-1 text-sm leading-relaxed underline decoration-luxury-gold/40 underline-offset-4 transition hover:decoration-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold"
      >
        {title} <span aria-hidden="true" className="ml-1 shrink-0">↗</span>
      </a>
    </li>
  );

  return (
    <section aria-labelledby="poet-sources-heading" className="theme-elevated-surface rounded-2xl border p-6 md:p-8">
      <h2 id="poet-sources-heading" className="theme-poet-accent mb-4 font-serif text-2xl">
        Источники и редакции текстов
      </h2>
      <ul className={isBlok ? 'grid gap-x-6 gap-y-2 sm:grid-cols-2' : 'space-y-3'}>
        {featured.map(sourceLink)}
      </ul>
      {isBlok && (
        <details className="group mt-5 border-t border-luxury-gold/15 pt-4">
          <summary className="theme-poet-accent flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold [&::-webkit-details-marker]:hidden">
            <span>Полная библиография · ещё {additional.length} источников</span>
            <span aria-hidden="true" className="text-lg transition-transform group-open:rotate-45">+</span>
          </summary>
          <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {additional.map(sourceLink)}
          </ul>
        </details>
      )}
    </section>
  );
}
