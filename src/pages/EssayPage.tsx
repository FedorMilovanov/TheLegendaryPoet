import { useParams } from 'react-router-dom';
import { getAllEssays, getEssayBySlug } from '../data/essays';
import LongformPage from '../components/essay/LongformPage';
import { Link } from '../components/ui/Link';
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
    keywords: essay?.tags.join(','),
  });

  if (!essay) {
    return (
      <div className="min-h-screen bg-[#050505] pt-32 pb-24 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-4 font-serif text-4xl">{titleCase('Статья не найдена')}</h1>
          <Link
            to="/articles"
            className="inline-flex min-h-11 items-center text-cyan-300 hover:text-cyan-200"
          >
            Вернуться к статьям
          </Link>
        </div>
      </div>
    );
  }

  const seriesEntries = essay.series
    ? getAllEssays().filter((entry) => entry.series?.id === essay.series?.id)
    : [];

  return <LongformPage essay={essay} seriesEntries={seriesEntries} />;
}
