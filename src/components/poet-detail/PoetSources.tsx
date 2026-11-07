import type { Poet } from '../../types/poet';

export default function PoetSources({ poet }: { poet: Poet }) {
  return (
    <>
            {poet.sources && poet.sources.length > 0 && (
              <section aria-labelledby="poet-sources-heading" className="rounded-2xl border border-luxury-gold/10 bg-[#080b0d] p-6 md:p-8">
                <h2 id="poet-sources-heading" className="mb-4 font-serif text-2xl text-luxury-gold">Источники и редакции текстов</h2>
                <ul className="space-y-3">
                  {poet.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm leading-relaxed text-cyan-200/75 underline decoration-cyan-200/25 underline-offset-4 transition hover:text-cyan-100">
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
