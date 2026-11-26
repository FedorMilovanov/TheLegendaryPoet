import { lazy, Suspense, use, useRef } from 'react';
import { useLocation, useParams } from 'react-router';
import { getBrowserPoem, getPreparedPoem, prepareDirectPoem } from '../data/runtime/browserPoemData';
export { prepareDirectPoem as prepareDirectEntry };
import type { PoemPageModel } from '../lib/poemPageModel';
import PoemReadingBody, { type PoemInternalLinkProps } from '../components/poet-detail/PoemReadingBody';
import { Link } from '../components/ui/Link';
import { useSeo } from '../hooks/useSeo';
import NotFoundPage from './NotFoundPage';
import PoemArchiveAction from '../components/poet-detail/PoemArchiveAction';
import ReadingProgress from '../components/articles/ReadingProgress';
import ShareLine from '../components/ui/ShareLine';
import { poemRatingDimensions } from '../data/ratingDimensions';

const CommunityPanel = lazy(() => import('../components/community/CommunityPanel'));

function AppPoemLink({ href, ...props }: PoemInternalLinkProps) {
  return <Link to={href} {...props} />;
}

function PublishedPoem({ page }: { page: PoemPageModel }) {
  useSeo({ title: page.title, description: page.description, path: page.path,
    image: page.image, imageAlt: 'Портрет: ' + page.authorName, breadcrumbs: page.breadcrumbs, jsonLd: page.schema });
  const articleRef = useRef<HTMLElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);
  return (
    <div className="pt-24 sm:pt-28">
      <ReadingProgress key={page.poemId} articleRef={articleRef} label="Прогресс чтения стихотворения" />
      <ShareLine key={page.poemId} scopeRef={verseRef} />
      <PoemReadingBody page={page} articleRef={articleRef} verseRef={verseRef} internalLink={AppPoemLink}
        actions={<PoemArchiveAction key={page.poemId} poemId={page.poemId} title={page.heading} />} />
      <div className="mx-auto max-w-4xl px-4 pb-12 sm:px-8">
        <Suspense fallback={<p role="status" className="theme-functional-muted py-4 text-sm">Загрузка оценок и комментариев…</p>}>
          <CommunityPanel key={page.poemId} compact deferRemote targetType="poem" targetId={page.poemId}
            title={'Оценка стихотворения: ' + page.heading} dimensions={poemRatingDimensions} />
        </Suspense>
      </div>
    </div>
  );
}
export default function PoemDetailPage() {
  const { id = '', slug = '' } = useParams<{ id: string; slug: string }>();
  const location = useLocation();
  const prepared = getPreparedPoem(id, slug, location.pathname, location.key);
  return prepared ? <PublishedPoem page={prepared} /> : <DeferredPoem id={id} slug={slug} pathname={location.pathname} visitKey={location.key} />;
}

function DeferredPoem({ id, slug, pathname, visitKey }: { id: string; slug: string; pathname: string; visitKey: string }) {
  const page = use(getBrowserPoem(id, slug, pathname, visitKey));
  return page ? <PublishedPoem page={page} /> : <NotFoundPage />;
}
