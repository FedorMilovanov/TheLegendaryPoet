import { Scale, AlertTriangle } from 'lucide-react';
import { titleCase } from '../../utils/titleCase';

/**
 * «Моральный портрет» — честная, реалистичная оценка жизни поэта без
 * идеализации. Здесь мы называем задокументированные грехи по имени
 * (прелюбодеяние, пьянство, дуэльный азарт, богоборчество) и даём им
 * библейскую оценку — то, о чём обычно молчит хрестоматийный, «светлый»
 * школьный портрет. Без умиления, без злорадства, без непечатной брани.
 *
 * Текст — данные (`poet.moralPortrait`); компонент только оформляет. См.
 * POET_AUTHORING_GUIDE.md и THEOLOGICAL_GUIDELINES.md.
 */
interface MoralPortraitProps {
  content: string;
}

export default function MoralPortrait({ content }: MoralPortraitProps) {
  return (
    <section
      aria-label="Моральный портрет"
      className="luxury-card relative overflow-hidden rounded-[2.5rem] border border-red-900/30 bg-gradient-to-br from-[#100808] via-[#0a0606] to-[#050505] p-10 shadow-xl md:p-12"
    >
      {/* приглушённое тёмное свечение — намёк на серьёзность раздела */}
      <div className="pointer-events-none absolute -right-12 -top-12 text-red-900/10">
        <Scale size={240} />
      </div>
      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-red-700/40 bg-red-950/40 text-red-300/80">
            <Scale size={18} aria-hidden="true" />
          </span>
          <h2 className="font-serif text-2xl font-bold text-white md:text-3xl">
            {titleCase('Моральный портрет')}
          </h2>
        </div>

        <div className="mb-6 flex items-start gap-2 rounded-2xl border border-red-900/25 bg-red-950/20 p-4 text-sm leading-relaxed text-red-100/70">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400/70" aria-hidden="true" />
          <p>
            Раздел говорит о задокументированных грехах и падениях открыто, в духе
            библейского реализма: мы не боготворим талант и не оправдываем им
            беззакония. О непристойном говорится прямо, но без воспроизведения брани.
          </p>
        </div>

        <div className="poetry-text space-y-5 text-lg leading-[1.85] text-luxury-gray-light font-light md:text-xl">
          {content
            .split('\n\n')
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </div>
      </div>
    </section>
  );
}
