import { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from '../components/ui/Link';
import ShareLine from '../components/ui/ShareLine';
import { ArrowLeft, ArrowRight, BookOpen, FileText, Layers3 } from 'lucide-react';
import { getAllEssays, getEssayBySlug } from '../data/essays';
import { poets } from '../data/poets';
import ReadingProgress from '../components/articles/ReadingProgress';
import EssayHero from '../components/essay/EssayHero';
import ArticleRenderer, { getEssayToc } from '../components/essay/ArticleRenderer';
import SectionChip from '../components/essay/SectionChip';
import SourceLibrary from '../components/essay/SourceLibrary';
import CommunityPanel from '../components/community/CommunityPanel';
import { articleRatingDimensions } from '../data/ratingDimensions';
import { useSeo } from '../hooks/useSeo';
import { titleCase } from '../utils/titleCase';

export default function EssayPage() {
  const { slug } = useParams<{ slug: string }>();
  const essay = slug ? getEssayBySlug(slug) : undefined;
  const articleRef = useRef<HTMLElement>(null);

  useSeo({
    title: essay ? `${essay.title} — THE LEGENDARY POET` : 'Статья не найдена — THE LEGENDARY POET',
    description: essay ? essay.excerpt : 'Статья не найдена.',
    path: `/essays/${slug ?? ''}`,
    type: 'article',
    image: essay?.cover,
    publishedTime: essay?.date,
    author: essay?.author,
    keywords: essay?.tags.join(','),
  });

  if (!essay) {
    return (
      <div className="min-h-screen bg-[#050505] pt-32 pb-24 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-4 font-serif text-4xl">{titleCase('Статья не найдена')}</h1>
          <Link to="/articles" className="inline-flex min-h-11 items-center text-cyan-300 hover:text-cyan-200">Вернуться к статьям</Link>
        </div>
      </div>
    );
  }

  const toc = getEssayToc(essay.blocks);
  const poet = essay.poetId ? poets.find((p) => p.id === essay.poetId) : undefined;
  const seriesEntries = essay.series
    ? getAllEssays()
        .filter((entry) => entry.series?.id === essay.series?.id)
        .sort((a, b) => (a.series?.part ?? 0) - (b.series?.part ?? 0))
    : [];
  const previous = seriesEntries.find((entry) => entry.series?.part === (essay.series?.part ?? 0) - 1);
  const next = seriesEntries.find((entry) => entry.series?.part === (essay.series?.part ?? 0) + 1);
  const sourceCount = essay.sources?.length ?? 0;
  const primarySourceCount = essay.sources?.filter((source) => source.kind === 'primary').length ?? 0;

  return (
    <div className="min-h-screen bg-[#050505] pt-28 pb-24 text-white">
      <ReadingProgress />
      <SectionChip toc={toc} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/articles"
          className="mb-8 inline-flex min-h-11 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
        >
          <ArrowLeft size={14} /> Все статьи
        </Link>

        <EssayHero essay={essay} />

        <div className="mx-auto mt-14 grid max-w-6xl gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              {toc.length > 0 && (
                <nav className="rounded-2xl border border-luxury-gold/10 bg-[#0a0a0a]/70 p-5 backdrop-blur-xl">
                  <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-luxury-gold/70">Оглавление</div>
                  <ul className="space-y-1">
                    {toc.map((section) => (
                      <li key={section.anchor}>
                        <a href={`#${section.anchor}`} className="flex min-h-9 items-center gap-2.5 rounded-lg py-1.5 text-sm text-luxury-gray-light/70 transition-colors hover:bg-white/[0.03] hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/60">
                          <span className="font-serif text-[12px] font-semibold tabular-nums text-luxury-gold/55">{String(section.number).padStart(2, '0')}</span>
                          <span>{section.heading}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              {sourceCount > 0 && (
                <a
                  href="#sources"
                  className="mt-4 flex min-h-11 items-center gap-3 rounded-2xl border border-luxury-gold/12 bg-luxury-gold/[0.025] p-4 text-sm text-luxury-gray-light/65 transition hover:-translate-y-0.5 hover:border-luxury-gold/30 hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/60"
                >
                  <FileText size={15} className="shrink-0 text-luxury-gold/60" />
                  <span>
                    <span className="block">{sourceCount} источников</span>
                    {primarySourceCount > 0 && (
                      <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-luxury-gray-light/35">
                        {primarySourceCount} первичных
                      </span>
                    )}
                  </span>
                </a>
              )}
              {poet && (
                <Link
                  to={`/poets/${poet.id}`}
                  className="mt-4 flex min-h-11 items-center gap-2 rounded-2xl border border-cyan-400/15 bg-[#061018]/60 p-4 text-sm text-cyan-100/70 transition hover:-translate-y-0.5 hover:border-cyan-400/35 hover:text-cyan-200"
                >
                  <BookOpen size={15} /> Страница поэта: {poet.name}
                </Link>
              )}
            </div>
          </aside>

          <article ref={articleRef} className="min-w-0 max-w-3xl">
            <ShareLine scopeRef={articleRef} />
            <ArticleRenderer blocks={essay.blocks} sources={essay.sources} />

            {seriesEntries.length > 1 && (
              <nav aria-label="Навигация по серии" className="mt-14 rounded-[2rem] border border-luxury-gold/10 bg-[#0a0a0a]/60 p-6 md:p-8">
                <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gold/65">
                  <Layers3 size={13} /> {essay.series?.label}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {previous ? (
                    <Link to={`/essays/${previous.slug}`} className="group flex min-h-24 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-left transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-luxury-gold/25 hover:bg-luxury-gold/[0.03]">
                      <ArrowLeft size={16} className="shrink-0 text-luxury-gold/55 transition group-hover:-translate-x-1" />
                      <span>
                        <span className="block text-[9px] uppercase tracking-[0.16em] text-luxury-gray-light/40">Предыдущая часть</span>
                        <span className="mt-1 block font-serif text-lg text-white/85">{previous.title}</span>
                      </span>
                    </Link>
                  ) : <span />}
                  {next ? (
                    <Link to={`/essays/${next.slug}`} className="group flex min-h-24 items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-right transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-luxury-gold/25 hover:bg-luxury-gold/[0.03]">
                      <span>
                        <span className="block text-[9px] uppercase tracking-[0.16em] text-luxury-gray-light/40">Следующая часть</span>
                        <span className="mt-1 block font-serif text-lg text-white/85">{next.title}</span>
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-luxury-gold/55 transition group-hover:translate-x-1" />
                    </Link>
                  ) : null}
                </div>
              </nav>
            )}

            {essay.sources && essay.sources.length > 0 && <SourceLibrary sources={essay.sources} />}
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
