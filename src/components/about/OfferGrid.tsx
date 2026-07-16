import { BookOpen, FileText, Music } from '../PremiumIcons';
import { titleCase } from '../../utils/titleCase';

const offers = [
  {
    icon: BookOpen,
    title: 'Поэты и стихи',
    description: 'Биографии, анализ творчества и полные тексты стихотворений с внимательным литературным разбором.',
  },
  {
    icon: FileText,
    title: 'Статьи и анализы',
    description: 'Глубокие исследования поэзии, исторические справки и отдельные тексты о вере, культуре и нравственной оценке.',
  },
  {
    icon: Music,
    title: 'Музыка',
    description: 'Музыкальные интерпретации стихов и переходы к опубликованным материалам проекта.',
  },
];

export default function OfferGrid() {
  return (
    <section className="mb-12">
      <h2 className="mb-8 font-serif text-3xl font-bold text-white">{titleCase('Что мы предлагаем')}</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {offers.map((item) => (
          <div key={item.title} className="luxury-card rounded-xl border border-cyan-400/10 bg-[#061018]/60 p-6 text-center">
            <div className="mb-4 flex justify-center"><item.icon size={32} className="text-luxury-gold" /></div>
            <h3 className="mb-3 font-serif text-xl font-semibold text-white">{titleCase(item.title)}</h3>
            <p className="text-sm leading-relaxed text-cyan-100/50">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}