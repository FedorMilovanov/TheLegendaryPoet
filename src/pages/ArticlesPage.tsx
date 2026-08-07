import { use, useState } from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import { getBrowserEssayCatalog } from '../data/essays/browserEssayData';
import type { EssaySummary } from '../types/essay';
import EssayCard from '../components/essay/EssayCard';
import ResilientImage from '../components/media/ResilientImage';
import Reveal from '../components/Reveal';
import { useSeo } from '../hooks/useSeo';
import { titleCase } from '../utils/titleCase';

const poetCategoryIds = new Set([
  'sergei-yesenin',
  'vladimir-mayakovsky',
  'mikhail-lermontov',
]);

const categories = [
  { value: '', label: 'Все материалы' },
  { value: 'biography', label: 'Большие биографии' },
  { value: 'documents', label: 'Документальные расследования' },
  { value: 'fate', label: 'Судьба и нравственный анализ' },
  { value: 'sergei-yesenin', label: 'Сергей Есенин' },
  { value: 'vladimir-mayakovsky', label: 'Владимир Маяковский' },
  { value: 'mikhail-lermontov', label: 'Михаил Лермонтов' },
];

function matchesCategory(essay: EssaySummary, category: string) {
  if (!category) return true;
  if (poetCategoryIds.has(category)) return essay.poetId === category;

  const searchable = [essay.kicker ?? '', essay.title, ...essay.tags].join(' ').toLocaleLowerCase('ru-RU');
  if (category === 'biography') return Boolean(essay.series) || /биограф/.test(searchable);
  if (category === 'documents') return /документ|архив|источник/.test(searchable);
  if (category === 'fate') return /судьба|нравствен|саморазруш/.test(searchable);
  return true;
}

export default function ArticlesPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const essays = use(getBrowserEssayCatalog());

  useSeo({
    title: 'Исследования и большие статьи — THE LEGENDARY POET',
    description: 'Документальные биографии и большие исследования русской поэзии с открытой библиографией, проверенными формулировками и редакционными иллюстрациями.',
    path: '/articles',
  });

  const filteredEssays = essays.filter((essay) => matchesCategory(essay, selectedCategory));

  return (
    <div className="min-h-screen bg-[#050505] pb-20">
      <div className="relative overflow-hidden pt-40 pb-16">
        <ResilientImage
          src="/images/sections/articles-cover.jpg"
          alt=""
          aria-hidden="true"
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/60 to-[#050505]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="mb-4 font-serif text-5xl font-bold">
              <span className="neon-blue-gradient neon-glow-text">{titleCase('Исследования')}</span>{' '}
              {titleCase('и большие статьи', { isHeadingStart: false })}
            </h1>
            <p className="max-w-3xl text-xl text-cyan-100/55">
              Полноценные документальные материалы: источники, библиография, осторожные формулировки и отдельная редакционная работа с каждой иллюстрацией.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="mb-10 rounded-3xl border border-cyan-400/10 bg-[#061018]/60 p-6"
        >
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
            <Filter size={14} /> Навигация по исследованиям
          </div>
          <div className="flex flex-wrap gap-3" aria-label="Фильтр исследований">
            {categories.map((category) => {
              const active = selectedCategory === category.value;
              return (
                <button
                  key={category.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(0,212,255,0.28)]'
                      : 'border border-cyan-400/15 text-cyan-100/45 hover:border-cyan-400/35 hover:text-cyan-200'
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        <Reveal direction="up">
          <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-luxury-gold">
            <span className="h-px w-8 bg-luxury-gold/50" /> Проверенные публикации · {filteredEssays.length}
          </div>
          <div className="space-y-6">
            {filteredEssays.map((essay) => (
              <EssayCard key={essay.id} essay={essay} variant="feature" />
            ))}
          </div>
        </Reveal>

        {filteredEssays.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-cyan-100/45">В этом разделе пока нет материалов.</p>
          </div>
        )}
      </div>
    </div>
  );
}
