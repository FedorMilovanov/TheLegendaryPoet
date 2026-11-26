import { use } from 'react';
import { useLocation, useParams } from 'react-router';
import { getBrowserPoem, getPreparedPoem, prepareDirectPoem } from '../data/runtime/browserPoemData';
export { prepareDirectPoem as prepareDirectEntry };
import type { PoemPageModel } from '../lib/poemPageModel';
import PoemReadingBody from '../components/poet-detail/PoemReadingBody';
import { useSeo } from '../hooks/useSeo';
import NotFoundPage from './NotFoundPage';

function PublishedPoem({ page }: { page: PoemPageModel }) {
  useSeo({ title: page.title, description: page.description, path: page.path,
    image: page.image, imageAlt: 'Портрет: ' + page.authorName, breadcrumbs: page.breadcrumbs, jsonLd: page.schema });
  return <div className="pt-24 sm:pt-28"><PoemReadingBody page={page} /></div>;
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
