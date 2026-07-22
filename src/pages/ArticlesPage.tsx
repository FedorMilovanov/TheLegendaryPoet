import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpenText, Filter, Network } from 'lucide-react';
import { getAllArticles } from '../utils/articleLibrary';
import { getAllEssays } from '../data/essays';
import type { Essay } from '../types/essay';
import ArticleCard from '../components/articles/ArticleCard';
import EssayCard from '../components/essay/EssayCard';
import Reveal from '../components/Reveal';
import { useSeo } from '../hooks/useSeo';
import { asset } from '../utils/asset';
import { titleCase } from '../utils/titleCase';

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

type EssayGroup = {
  id: string;
  label: string;
  essays: Essay[];
  clustered: boolean;
};

function groupEssays(essays: Essay[]): EssayGroup[] {
  const groups = new Map<string, EssayGroup>();

  for (const essay of essays) {
    const id = essay.cluster?.id ?? 'standalone';
    const label = essay.cluster?.label ?? 'Отдельные исследования';
    const group = groups.get(id) ?? { id, label, essays: [], clustered: Boolean(essay.cluster) };
    group.essays.push(essay);
    groups.set(id, group);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      essays: [...group.essays].sort((a, b) => {
        const order = (a.cluster?.order ?? 999) - (b.cluster?.order ?? 999);
        if (order !== 0) return order;
        return b.date.localeCompare(a.date);
      }),
    }))
    .sort((a, b) => {
      if (a.clustered !== b.clustered) return a.clustered ? -1 : 1;
      return b.essays.length - a.essays.length || a.label.localeCompare(b.label, 'ru');
    });
}

export default function ArticlesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  useSeo({
    title: 'Статьи, биографии и литературные исследования — THE LEGENDARY POET',
    description: 'Большие биографии поэтов, документальные расследования, история произведений, архивные источники и литературный анализ с внутренними тематическими связями.',
    path: '/articles',
    keywords: 'биографии поэтов, литературные исследования, анализ стихотворений, Маяковский, Есенин, архивные документы',
  });

  const articles = getAllArticles();
  const essays = getAllEssays();
  const essayGroups = useMemo(() => groupEssays(essays), [essays]);
  const visibleEssayGroups = selectedCluster
    ? essayGroups.filter((group) => group.id === selectedCluster)
    : essayGroups;

  const filteredArticles = selectedCategory
    ? articles.filter((article) => article.category === selectedCategory)
    : articles;

  return (
    <div className="min-h-screen bg-[#050505] pb-20">
      <div className="relative overflow-hidden pt-40 pb-16">
        <img
          src={asset('/images/sections/articles-cover.jpg')}
          alt=""
          aria-hidden="true"
          loading="eager"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/60 to-[#050505]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-5xl font-serif font-bold mb-4">
              <span className="neon-blue-gradient neon-glow-text">{titleCase('Статьи')}</span> {titleCase('и Анализы', { isHeadingStart: false })}
            </h1>
            <p className="text-xl text-cyan-100/55 max-w-3xl">
              Большие биографии, история произведений и документальные расследования, собранные в связанные тематические кластеры.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {essays.length > 0 && !selectedCategory && (
          <Reveal direction="up" className="mb-14">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-luxury-gold/10 pb-5">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-luxury-gold">
                  <BookOpenText size={15} /> Большие исследования · {essays.length}
                </div>
                <h2 className="font-serif text-3xl font-bold text-white md:text-4xl">
                  {titleCase('Биографии, произведения и архив')}
                </h2>
              </div>
              <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCluster('')}
                  aria-pressed={!selectedCluster}
                  className={`min-h-10 shrink-0 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${!selectedCluster ? 'bg-luxury-gold text-black' : 'border border-luxury-gold/15 text-luxury-gray-light/55 hover:text-luxury-gold'}`}
                >
                  Все кластеры
                </button>
                {essayGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedCluster(group.id === selectedCluster ? '' : group.id)}
                    aria-pressed={selectedCluster === group.id}
                    className={`min-h-10 shrink-0 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${selectedCluster === group.id ? 'bg-cyan-300 text-[#041014]' : 'border border-cyan-400/15 text-cyan-100/50 hover:text-cyan-200'}`}
                  >
                    {group.label} · {group.essays.length}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-14">
              {visibleEssayGroups.map((group) => {
                const [featured, ...rest] = group.essays;
                return (
                  <section key={group.id} aria-labelledby={`essay-group-${group.id}`} className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="mb-1 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/45">
                          <Network size={12} /> {group.clustered ? 'Тематический кластер' : 'Самостоятельные материалы'}
                        </div>
                        <h3 id={`essay-group-${group.id}`} className="font-serif text-2xl font-bold text-white md:text-3xl">
                          {group.label}
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-luxury-gray-light/35">
                        {group.essays.length} материалов
                      </span>
                    </div>

                    {featured && <EssayCard essay={featured} variant="feature" />}
                    {rest.length > 0 && (
                      <div className="grid gap-6 md:grid-cols-2">
                        {rest.map((essay) => <EssayCard key={essay.id} essay={essay} />)}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </Reveal>
        )}

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
