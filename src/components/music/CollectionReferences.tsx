import { ArrowRight, Music2 } from 'lucide-react';
import { collectionPath } from '../../data/poetryCollections';
import type { PoetryCollection } from '../../types/poetryCollection';
import { Link } from '../ui/Link';
import './CollectionReferences.css';

export function CollectionReferences({ collections }: { collections: readonly PoetryCollection[] }) {
  if (!collections.length) return null;
  return (
    <aside className="collection-reference theme-elevated-surface rounded-2xl border px-5 py-4 my-5" aria-label="Связанные поэтические коллекции">
      <div className="collection-reference-label flex items-center gap-2 text-xs font-semibold mb-2"><Music2 size={17} aria-hidden="true" /> Поэтические Коллекции</div>
      {collections.map(collection => (
        <Link key={collection.id} to={collectionPath(collection.id)} className="collection-reference-link flex items-center justify-between gap-3 font-semibold leading-snug rounded-md">
          <span>{collection.title}</span><ArrowRight size={19} aria-hidden="true" />
        </Link>
      ))}
    </aside>
  );
}
