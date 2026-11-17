import type { Poet } from '../../types/poet';

export default function PoetSources({ poet }: { poet: Poet }) {
  const items = poet.sources ?? [];
  if (items.length === 0) return null;

  // Shared treatment for long bibliographies: featured entries when curated,
  // otherwise preserve editorial order. Native details retain all links.
  const shouldCollapse = items.length > 6;
  const hasFeatured = items.some((item) => item.featured);
  const featured = !shouldCollapse ? items : hasFeatured ? items.filter((item) => item.featured) : items.slice(0, 6);
  const additional = !shouldCollapse ? [] : hasFeatured ? items.filter((item) => !item.featured) : items.slice(6);

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
      <ul className={shouldCollapse ? 'grid gap-x-6 gap-y-2 sm:grid-cols-2' : 'space-y-3'}>
        {featured.map(sourceLink)}
      </ul>
      {additional.length > 0 && (
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
