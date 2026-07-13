import { titleCase } from '../../utils/titleCase';

export default function MissionSection() {
  return (
    <section className="luxury-card mb-12 rounded-2xl border border-cyan-400/10 bg-[#061018]/70 p-8">
      <h2 className="mb-6 font-serif text-3xl font-bold text-white">{titleCase('Наша миссия')}</h2>
      <div className="space-y-4 leading-relaxed text-cyan-100/58">
        <p>
          Проект <strong className="text-cyan-300">THE LEGENDARY POET</strong> — это глубокое исследование жизни и творчества великих поэтов. Мы сохраняем память о поэтах, их стихах и судьбах.
        </p>
        <p>
          Отдельное направление проекта — <strong className="text-luxury-gold">осторожный христианский анализ</strong>. Он применяется только там, где текст, биография или исторический контекст действительно дают для этого основания.
        </p>
      </div>
    </section>
  );
}