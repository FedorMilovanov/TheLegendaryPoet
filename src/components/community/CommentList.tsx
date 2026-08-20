import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, LoaderCircle, MessageSquareText } from 'lucide-react';
import { commentKindOptions } from '../../data/commentKinds';
import type { CommentEntry, CommentKind } from '../../types/community';
import CommentCard from './CommentCard';
import CommentSortBar from './CommentSortBar';

interface CommentListProps {
  comments: CommentEntry[];
  total: number | null;
  hasMore: boolean;
  phase?: 'idle' | 'loading' | 'ready' | 'error';
  loading?: boolean;
  onLoadMore?: () => void | Promise<void>;
  onHelpful: (id: string) => { ok: boolean; message: string };
  isHelpfulMarked?: (id: string) => boolean;
  onStatus?: (message: string, tone: 'success' | 'warning') => void;
}

const PAGE_SIZE = 5;
type KindFilter = 'all' | CommentKind;

export default function CommentList({
  comments,
  total,
  hasMore,
  phase = 'ready',
  loading = false,
  onLoadMore,
  onHelpful,
  isHelpfulMarked,
  onStatus,
}: CommentListProps) {
  const [sortMode, setSortMode] = useState<'helpful' | 'newest'>('helpful');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);

  const availableKinds = useMemo(() => new Set(comments.map((comment) => comment.kind)), [comments]);
  const matchingComments = useMemo(() => comments
    .filter((comment) => kindFilter === 'all' || comment.kind === kindFilter)
    .slice()
    .sort((left, right) => {
      if (sortMode === 'helpful') {
        return right.helpful - left.helpful
          || Date.parse(right.createdAt) - Date.parse(left.createdAt)
          || left.id.localeCompare(right.id);
      }
      return Date.parse(right.createdAt) - Date.parse(left.createdAt)
        || right.helpful - left.helpful
        || left.id.localeCompare(right.id);
    }), [comments, kindFilter, sortMode]);

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [kindFilter, sortMode]);

  if (!comments.length && (loading || phase === 'idle' || phase === 'loading')) {
    return (
      <div className="rounded-2xl border border-dashed border-cyan-400/10 px-5 py-8 text-center" role="status" aria-live="polite">
        <LoaderCircle className="mx-auto animate-spin text-cyan-100/25" size={24} aria-hidden="true" />
        <p className="mt-3 text-sm text-cyan-100/42">Загружаем комментарии…</p>
      </div>
    );
  }

  if (!comments.length && phase === 'error') {
    return (
      <div className="rounded-2xl border border-dashed border-amber-400/15 px-5 py-8 text-center" role="status" aria-live="polite">
        <MessageSquareText className="mx-auto text-amber-100/25" size={24} aria-hidden="true" />
        <p className="mt-3 text-sm text-amber-100/58">Комментарии сейчас недоступны. Это не означает, что их нет.</p>
      </div>
    );
  }

  if (!comments.length) {
    return (
      <div className="rounded-2xl border border-dashed border-cyan-400/10 px-5 py-8 text-center">
        <MessageSquareText className="mx-auto text-cyan-100/20" size={24} aria-hidden="true" />
        <p className="mt-3 text-sm text-cyan-100/38">Комментариев пока нет. Можно стать первым внимательным читателем.</p>
      </div>
    );
  }

  const visibleComments = matchingComments.slice(0, visibleLimit);
  const remainingLoaded = Math.max(0, matchingComments.length - visibleComments.length);
  const canRequestMore = hasMore && remainingLoaded === 0;
  const knownTotal = total !== null ? Math.max(0, total) : null;
  const allLabel = knownTotal === null
    ? `Все · ${comments.length}${hasMore ? '+' : ''}`
    : `Все · ${knownTotal}`;
  const resultLabel = kindFilter === 'all'
    ? knownTotal === null
      ? `Показано ${visibleComments.length}; общий итог временно недоступен`
      : `Показано ${visibleComments.length} из ${knownTotal}`
    : `Показано ${visibleComments.length} из ${matchingComments.length} загруженных этого типа${hasMore ? '; в общей ленте есть ещё страницы' : ''}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-cyan-400/[0.08] bg-black/15 p-3">
        <CommentSortBar value={sortMode} onChange={setSortMode} />
        <p className="text-[10px] leading-relaxed text-cyan-100/32">
          {hasMore
            ? 'Сортировка и фильтр применяются к уже загруженным комментариям; кнопка ниже расширяет выборку следующей страницей общей ленты.'
            : 'Все доступные комментарии загружены; сортировка и фильтр охватывают весь полученный корпус.'}
        </p>
        {availableKinds.size > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Фильтр загруженных комментариев по типу">
            <button
              type="button"
              onClick={() => setKindFilter('all')}
              aria-pressed={kindFilter === 'all'}
              className={`min-h-9 flex-none rounded-full border px-3 text-[9px] font-bold uppercase tracking-[0.12em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${kindFilter === 'all' ? 'border-cyan-300/35 bg-cyan-300/10 text-cyan-100' : 'border-white/[0.07] text-white/35 hover:text-white/70'}`}
            >
              {allLabel}
            </button>
            {commentKindOptions.filter((option) => availableKinds.has(option.value)).map((option) => {
              const count = comments.filter((comment) => comment.kind === option.value).length;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setKindFilter(option.value)}
                  aria-pressed={kindFilter === option.value}
                  className={`min-h-9 flex-none rounded-full border px-3 text-[9px] font-bold uppercase tracking-[0.1em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
                    kindFilter === option.value
                      ? 'border-luxury-gold/35 bg-luxury-gold/10 text-luxury-gold'
                      : 'border-white/[0.07] text-white/35 hover:text-white/70'
                  }`}
                >
                  {option.label} · {count}{hasMore ? '+' : ''}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[10px] uppercase tracking-[0.13em] text-cyan-100/30" role="status" aria-live="polite" aria-atomic="true">
        {resultLabel}
      </div>

      {visibleComments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          helpfulMarked={isHelpfulMarked?.(comment.id) ?? false}
          onHelpful={(id) => {
            const result = onHelpful(id);
            onStatus?.(result.message, result.ok ? 'success' : 'warning');
          }}
        />
      ))}

      {(remainingLoaded > 0 || canRequestMore || loading) && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (remainingLoaded > 0) setVisibleLimit((current) => current + PAGE_SIZE);
              else void onLoadMore?.();
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-cyan-400/12 px-4 text-xs font-bold text-cyan-100/48 transition hover:border-cyan-300/28 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-wait disabled:opacity-50"
          >
            {loading ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
            {loading
              ? 'Загружаем…'
              : remainingLoaded > 0
                ? `Показать ещё ${Math.min(PAGE_SIZE, remainingLoaded)}`
                : kindFilter === 'all' && sortMode === 'newest'
                  ? 'Загрузить ещё комментарии'
                  : 'Загрузить ещё из общей ленты'}
          </button>
        </div>
      )}
    </div>
  );
}
