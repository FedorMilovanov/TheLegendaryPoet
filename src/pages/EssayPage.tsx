import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import { getEssayBySlug } from '../data/essays';
import { poets } from '../data/poets';
import ReadingProgress from '../components/articles/ReadingProgress';
import EssayHero from '../components/essay/EssayHero';
import ArticleRenderer, { getEssayToc } from '../components/essay/ArticleRenderer';
import CommunityPanel from '../components/community/CommunityPanel';
import { articleRatingDimensions } from '../data/ratingDimensions';
import { useSeo } from '../hooks/useSeo';
import { titleCase } from '../utils/titleCase';

export default function EssayPage() {
  const { slug } = useParams<{ slug: string }>();
  const essay = slug ? getEssayBySlug(slug) : undefined;

  useSeo({
    title: essay ? `${essay.title} — THE LEGENDARY POET` : 'Статья не найдена — THE LEGENDARY POET',
    description: essay ? essay.excerpt : 'Статья не найдена.',
    path: `/essays/${slug ?? ''}`,
    type: 'article',
    image: essay?.cover,
    publishedTime: essay?.date,
    author: essay?.author,
    keywords: essay?.tags.join(', '),
  });

  if (!essay) {
    return (
      <div className="min-h-screen bg-[#050505] pt-32 pb-24 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-4 font-serif text-4xl">{titleCase('Статья не найдена')}</h1>
          <Link to="/articles" className="text-cyan-300 hover:text-cyan-200">Вернуться к статьям</Link>
        </div>
      </div>
    );
  }

  const toc = getEssayToc(essay.blocks);
  const poet = essay.poetId ? poets.find((p) => p.id === essay.poetId) : undefined;

  return (
    <div className="min-h-screen bg-[#050505] pt-28 pb-24 text-white">
      <ReadingProgress />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/articles"
          className="mb-8 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70 transition-colors hover:text-cyan-300"
        >
          <ArrowLeft size={14} /> Все статьи
        </Link>

        <EssayHero essay={essay} />

        <div className="mx-auto mt-14 grid max-w-6xl gap-10 lg:grid-cols-[220px_1fr]">
          {/* Sticky table of contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              {toc.length > 0 && (
                <nav className="rounded-2xl border border-luxury-gold/10 bg-[#0a0a0a]/70 p-5">
                  <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-luxury-gold/70">Оглавление</div>
                  <ul className="space-y-2">
                    {toc.map((s) => (
                      <li key={s.anchor}>
                        <a href={`#${s.anchor}`} className="flex items-baseline gap-2.5 text-sm text-luxury-gray-light/70 transition-colors hover:text-luxury-gold">
                          <span className="font-mono text-[10px] tabular-nums text-luxury-gold/40">{String(s.number).padStart(2, '0')}</span>
                          <span>{s.heading}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              {poet && (
                <Link
                  to={`/poets/${poet.id}`}
                  className="mt-4 flex items-center gap-2 rounded-2xl border border-cyan-400/15 bg-[#061018]/60 p-4 text-sm text-cyan-100/70 transition hover:border-cyan-400/35 hover:text-cyan-200"
                >
                  <BookOpen size={15} /> Страница поэта: {poet.name}
                </Link>
              )}
            </div>
          </aside>

          <article className="min-w-0 max-w-3xl">
            <ArticleRenderer blocks={essay.blocks} />

            {essay.sources && essay.sources.length > 0 && (
              <section className="mt-14 rounded-[2rem] border border-luxury-gold/10 bg-[#0a0a0a]/60 p-8">
                <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-luxury-gold">Источники</h2>
                <ul className="space-y-3">
                  {essay.sources.map((s, i) => (
                    <li key={i} className="text-sm leading-relaxed text-luxury-gray-light/80">
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-luxury-gray-light/80 transition-colors hover:text-luxury-gold">
                          {s.title} <ExternalLink size={12} className="mt-1 shrink-0 opacity-60" />
                        </a>
                      ) : (
                        s.title
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        </div>

        <section className="mx-auto mt-16 max-w-6xl">
          <CommunityPanel
            targetType="article"
            targetId={essay.id}
            title={`Оценка материала: ${essay.title}`}
            dimensions={articleRatingDimensions}
          />
        </section>
      </div>
    </div>
  );
}
