import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import { getAllArticles } from '../utils/articleLibrary';
import ArticleCard from '../components/articles/ArticleCard';
import { useSeo } from '../hooks/useSeo';

const categories = [
  { value: '', label: 'Все статьи' },
  { value: 'biblical', label: 'Библейский анализ' },
  { value: 'moral', label: 'Моральный анализ' },
  { value: 'history', label: 'История' },
  { value: 'analysis', label: 'Литературный анализ' },
  { value: 'biography', label: 'Биография' },
];

const categoryLabels: Record<string, string> = {
  biblical: 'Библейский анализ',
  moral: 'Моральный анализ',
  history: 'История',
  analysis: 'Литературный анализ',
  biography: 'Биография',
};

export default function ArticlesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  useSeo({
    title: 'Статьи и анализы — THE LEGENDARY POET',
    description: 'Глубокие исследования поэзии, истории и литературы, а также отдельные тексты о вере, культуре и нравственной оценке.',
    path: '/articles',
  });
  const articles = getAllArticles();

  const filteredArticles = selectedCategory
    ? articles.filter((article) => article.category === selectedCategory)
    : articles;

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <h1 className="text-5xl font-serif font-bold mb-4">
            <span className="neon-blue-gradient neon-glow-text">Статьи</span> и Анализы
          </h1>
          <p className="text-xl text-cyan-100/55 max-w-3xl">
            Глубокие исследования поэзии, истории, литературы и отдельные тексты о вере, культуре и нравственной оценке.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="mb-10 rounded-3xl border border-cyan-400/10 bg-[#061018]/60 p-6"
        >
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
            <Filter size={14} /> Фильтр разделов
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                  selectedCategory === category.value
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(0,212,255,0.28)]'
                    : 'border border-cyan-400/15 text-cyan-100/45 hover:border-cyan-400/35 hover:text-cyan-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              categoryLabel={categoryLabels[article.category] || article.category}
            />
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-cyan-100/45">В этой категории пока нет материалов.</p>
          </div>
        )}
      </div>
    </div>
  );
}
