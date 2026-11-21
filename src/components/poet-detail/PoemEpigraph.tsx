import type { Poem } from '../../types/poet';

type Epigraph = NonNullable<Poem['epigraph']>;

/** Render another author's epigraph apart from the poem's canonical reading layer. */
export default function PoemEpigraph({ epigraph }: { epigraph: Epigraph }) {
  return (
    <figure
      data-poem-epigraph
      aria-label="Эпиграф к стихотворению"
      className="theme-dark-island mx-auto mb-8 max-w-3xl rounded-3xl border border-luxury-gold/20 bg-[#0d0d0b] px-5 py-6 shadow-inner sm:px-8 sm:py-7"
    >
      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-luxury-gold-light/80">
        Эпиграф
      </div>
      <blockquote className="whitespace-pre-line break-words font-serif text-base italic leading-[1.85] text-luxury-gray-light sm:text-lg">
        {epigraph.text}
      </blockquote>
      <figcaption className="mt-4 text-right text-xs tracking-[0.08em] text-luxury-gold-light/80">
        — {epigraph.attribution}
      </figcaption>
    </figure>
  );
}
