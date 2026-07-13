import { titleCase } from '../../utils/titleCase';

export default function AboutHero() {
  return (
    <div className="mb-16 text-center">
      <h1 className="mb-4 font-serif text-5xl font-bold">
        {titleCase('О проекте')} <span className="neon-blue-gradient neon-glow-text">THE LEGENDARY POET</span>
      </h1>
      <p className="text-xl text-luxury-gray-light">
        Поэзия. Анализ. История. И отдельные тексты о вере, культуре и нравственной ответственности.
      </p>
    </div>
  );
}