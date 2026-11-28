import { ArrowDownRight, ArrowRight, BookOpen, ExternalLink, Music2 } from 'lucide-react';
import { poetryCollections, type PoetryCollection } from '../../data/poetryCollections';
import { Link } from '../ui/Link';
import ResilientImage from '../media/ResilientImage';
import './PoetryCollections.css';

const releaseDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

function CollectionCard({ collection }: { collection: PoetryCollection }) {
  return (
    <article id={collection.id} className="theme-dark-island poetry-collection" aria-labelledby={`${collection.id}-title`}>
      <div className="poetry-collection-hero grid items-center gap-6 lg:gap-10 lg:grid-cols-2">
        <div className="poetry-collection-intro min-w-0">
          <div className="poetry-collection-eyebrow flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-widest"><span aria-hidden="true" /> Продолжающийся Цикл</div>
          <h3 id={`${collection.id}-title`} className="font-serif poetry-collection-title text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 break-words text-balance">{collection.title}</h3>
          <p>{collection.description}</p>
          <div className="poetry-collection-actions flex flex-wrap gap-2 mt-5">
            <a className="poetry-collection-primary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold" href={collection.playlistUrl} target="_blank" rel="noopener noreferrer">
              <Music2 size={18} aria-hidden="true" /> Плейлист на YouTube <ExternalLink size={15} aria-hidden="true" />
            </a>
            <a className="poetry-collection-secondary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold" href={`#${collection.id}-releases`}>
              Произведения <ArrowDownRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
        <figure className="poetry-collection-figure min-w-0 m-0 order-first lg:order-none">
          <div className="poetry-collection-image relative aspect-video overflow-hidden rounded-2xl border">
            <ResilientImage src={collection.cover} alt={collection.coverAlt} width={1280} height={720} loading="lazy" />
            <svg className="poetry-collection-ribbon absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 640 360" preserveAspectRatio="none" aria-hidden="true">
              <path d="M-30 320 C160 140 320 440 670 80" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M-30 334 C150 154 340 430 670 100" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".45" />
            </svg>
          </div>
          <figcaption className="text-xs leading-relaxed mt-2">{collection.coverCredit}</figcaption>
        </figure>
      </div>
      <div id={`${collection.id}-releases`} className="poetry-collection-releases mt-8 pt-5 border-t">
        <div className="poetry-collection-section-heading flex flex-wrap justify-between items-center gap-2 mb-4">
          <h4 className="font-serif text-xl sm:text-2xl font-semibold">Произведения Цикла</h4>
          <span>{collection.entries.length === 1 ? '1 композиция' : `Композиций: ${collection.entries.length}`}</span>
        </div>
        {collection.entries.map((entry, index) => (
          <div key={entry.id} id={`${collection.id}-${entry.id}`} className="poetry-collection-entry grid gap-3 sm:grid-cols-[3rem_minmax(0,1fr)] rounded-2xl border p-4 sm:p-6">
            <div className="poetry-collection-entry-number font-serif text-xl sm:text-2xl tabular-nums" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
            <div className="poetry-collection-entry-content min-w-0">
              <Link to={`/poets/${entry.poetId}`} className="poetry-collection-poet inline-flex items-center gap-1 text-sm font-semibold">{entry.poetName} <ArrowRight size={14} aria-hidden="true" /></Link>
              <h5 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight break-words mb-2">{entry.title}</h5>
              <p className="poetry-collection-date text-sm leading-relaxed">{entry.video.status === 'scheduled' ? 'Запланированный выпуск: ' : 'Опубликовано: '}<time dateTime={entry.video.status === 'scheduled' ? entry.video.scheduledFor : entry.video.publishedAt}>{releaseDateFormatter.format(new Date(entry.video.status === 'scheduled' ? entry.video.scheduledFor : entry.video.publishedAt))} МСК</time>{entry.video.status === 'scheduled' ? '. Видео доступно после публикации на YouTube.' : '.'}</p>
              <div className="poetry-collection-entry-actions flex flex-wrap gap-2 mt-4">
                <Link to={`/essays/${entry.essaySlug}`} className="poetry-collection-secondary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
                  <BookOpen size={17} aria-hidden="true" /> История и Смысл <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <a className="poetry-collection-secondary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold" href={entry.video.url} target="_blank" rel="noopener noreferrer">
                  {entry.video.status === 'scheduled' ? 'Видео на YouTube' : 'Смотреть Клип'} <ExternalLink size={15} aria-hidden="true" />
                </a>
              </div>
              <details className="poetry-collection-sources mt-5 border-t pt-2">
                <summary className="flex items-center flex-wrap gap-2 rounded-lg py-2 text-sm font-semibold cursor-pointer"><span>Из Каких Строк Создана Композиция</span><span className="poetry-collection-source-count text-xs font-normal whitespace-nowrap">{entry.sources.length} источников</span><span className="poetry-collection-chevron text-2xl leading-none" aria-hidden="true">⌄</span></summary>
                <ol className="poetry-collection-source-list grid gap-2 lg:grid-cols-2 list-none mt-2 p-0">
                  {entry.sources.map(source => (
                    <li key={source.id} className="min-w-0 flex flex-col rounded-xl border">
                      <Link className="poetry-collection-source-main grid gap-2 rounded-xl p-3" to={`/essays/${entry.essaySlug}#literary-fragment-${source.id}`}>
                        <span className="poetry-collection-source-date text-xs tabular-nums">{source.date}</span>
                        <span className="poetry-collection-source-body min-w-0 grid gap-1 text-sm leading-snug break-words">
                          <span>{source.title}</span>
                          <span className="poetry-collection-fragment font-serif italic">«{source.fragment}»</span>
                        </span>
                        <ArrowRight className="poetry-collection-source-arrow mt-1" size={16} aria-hidden="true" />
                      </Link>
                      {source.poemId && (
                        <Link className="poetry-collection-original poetry-collection-library-link flex items-center justify-between gap-2 px-3 py-2 text-xs border-t" to={`/poets/${entry.poetId}#poem-${source.poemId}`} aria-label={`Читать в библиотеке: ${source.title}`}>
                          Читать в Библиотеке <BookOpen size={15} aria-hidden="true" />
                        </Link>
                      )}
                      <a className="poetry-collection-original flex items-center justify-between gap-2 px-3 py-2 text-xs border-t" href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`Первоисточник: ${source.title}`}>
                        {source.prose ? 'Публикация Письма' : 'Полный Текст в Источнике'} <ExternalLink size={14} aria-hidden="true" />
                      </a>
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
      <div className="poetry-collections-heading flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-6">
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
