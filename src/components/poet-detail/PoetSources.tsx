import type { Poet } from '../../types/poet';

export default function PoetSources({ poet }: { poet: Poet }) {
  return (
    <>
            {poet.sources && poet.sources.length > 0 && (
              <section aria-labelledby="poet-sources-heading" className="theme-elevated-surface rounded-2xl border p-6 md:p-8">
                <h2 id="poet-sources-heading" className="theme-poet-accent mb-4 font-serif text-2xl">Источники и редакции текстов</h2>
                <ul className="space-y-3">
                  {poet.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="theme-text text-sm leading-relaxed underline decoration-luxury-gold/40 underline-offset-4 transition hover:decoration-luxury-gold">
                        {source.title} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
    </>
  );
}
