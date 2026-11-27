import { ArrowDownRight, ArrowRight, BookOpen, ExternalLink, Music2 } from 'lucide-react';
import { poetryCollections, collectionPath, type PoetryCollection } from '../../data/poetryCollections';
import { Link } from '../ui/Link';
import ResilientImage from '../media/ResilientImage';
import './PoetryCollections.css';

function CollectionCard({ collection }: { collection: PoetryCollection }) {
  return (
    <article id={collection.id} className="theme-dark-island poetry-collection" aria-labelledby={`${collection.id}-title`}>
      <div className="poetry-collection-hero">
        <div className="poetry-collection-intro">
          <div className="poetry-collection-eyebrow"><span aria-hidden="true" /> Продолжающийся Цикл</div>
          <h3 id={`${collection.id}-title`} className="font-serif poetry-collection-title">{collection.title}</h3>
          <p>{collection.description}</p>
          <div className="poetry-collection-actions">
            <a className="poetry-collection-primary" href={collection.playlistUrl} target="_blank" rel="noopener noreferrer">
              <Music2 size={18} aria-hidden="true" /> Плейлист на YouTube <ExternalLink size={15} aria-hidden="true" />
            </a>
            <a className="poetry-collection-secondary" href={`#${collection.id}-releases`}>
              Произведения <ArrowDownRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
        <figure className="poetry-collection-figure">
          <div className="poetry-collection-image">
            <ResilientImage src={collection.cover} alt={collection.coverAlt} width={1280} height={720} loading="lazy" />
            <svg className="poetry-collection-ribbon" viewBox="0 0 640 360" preserveAspectRatio="none" aria-hidden="true">
              <path d="M-30 320 C160 140 320 440 670 80" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M-30 334 C150 154 340 430 670 100" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".45" />
            </svg>
          </div>
          <figcaption>{collection.coverCredit}</figcaption>
        </figure>
      </div>
      <div id={`${collection.id}-releases`} className="poetry-collection-releases">
        <div className="poetry-collection-section-heading">
          <h4 className="font-serif">Произведения Цикла</h4>
          <span>{collection.entries.length === 1 ? '1 композиция' : `Композиций: ${collection.entries.length}`}</span>
        </div>
        {collection.entries.map((entry, index) => (
          <div key={entry.id} className="poetry-collection-entry">
            <div className="poetry-collection-entry-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
            <div className="poetry-collection-entry-content">
              <Link to={`/poets/${entry.poetId}`} className="poetry-collection-poet">{entry.poetName} <ArrowRight size={14} aria-hidden="true" /></Link>
              <h5 className="font-serif">{entry.title}</h5>
              {entry.video.status === 'scheduled' && entry.video.scheduledFor && (
                <p className="poetry-collection-date">Премьера запланирована: <time dateTime={entry.video.scheduledFor}>{entry.video.scheduleLabel}</time></p>
              )}
              <div className="poetry-collection-entry-actions">
                <Link to={`/essays/${entry.essaySlug}`} className="poetry-collection-secondary">
                  <BookOpen size={17} aria-hidden="true" /> История и Смысл <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <a className="poetry-collection-secondary" href={entry.video.url} target="_blank" rel="noopener noreferrer">
                  {entry.video.status === 'scheduled' ? 'Страница Премьеры' : 'Смотреть Клип'} <ExternalLink size={15} aria-hidden="true" />
                </a>
              </div>
              <details className="poetry-collection-sources">
                <summary><span>Из Каких Строк Создана Композиция</span><span className="poetry-collection-source-count">{entry.sources.length} источников</span><span className="poetry-collection-chevron" aria-hidden="true">⌄</span></summary>
                <ol className="poetry-collection-source-list">
                  {entry.sources.map(source => (
                    <li key={source.id}>
                      <Link to={`/essays/${entry.essaySlug}#source-${source.id}`}>
                        <span className="poetry-collection-source-date">{source.date}</span>
                        <span className="poetry-collection-source-body">
                          <span>{source.title}</span>
                          <span className="poetry-collection-fragment">«{source.fragment}»</span>
                        </span>
                        <ArrowRight className="poetry-collection-source-arrow" size={16} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ol>
              </details>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function PoetryCollections() {
  if (!poetryCollections.length) return null;
  return (
    <section id="poetry-collections" className="poetry-collections mt-16 sm:mt-20" aria-labelledby="poetry-collections-title">
      <div className="poetry-collections-heading">
        <div>
          <div className="section-label mb-3">Поэзия · Музыка · История</div>
          <h2 id="poetry-collections-title" className="theme-text font-serif text-3xl font-bold sm:text-4xl">Поэтические Коллекции</h2>
        </div>
        <p className="theme-functional-muted">Тематические циклы: от музыкального произведения — к автору, подлинным строкам и литературному исследованию.</p>
      </div>
      <div className="grid gap-8">{poetryCollections.map(collection => <CollectionCard key={collection.id} collection={collection} />)}</div>
    </section>
  );
}

export function CollectionReferences({ collections }: { collections: readonly PoetryCollection[] }) {
  if (!collections.length) return null;
  return (
    <aside className="collection-reference theme-elevated-surface" aria-label="Связанные поэтические коллекции">
      <div className="collection-reference-label"><Music2 size={17} aria-hidden="true" /> Поэтические Коллекции</div>
      {collections.map(collection => (
        <Link key={collection.id} to={collectionPath(collection.id)} className="collection-reference-link">
          <span>{collection.title}</span><ArrowRight size={19} aria-hidden="true" />
        </Link>
      ))}
    </aside>
  );
}
