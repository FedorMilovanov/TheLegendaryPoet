import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, LoaderCircle, MessageSquareText } from 'lucide-react';
import { commentKindOptions } from '../../data/commentKinds';
import type { CommentEntry, CommentKind } from '../../types/community';
import CommentCard from './CommentCard';
import CommentSortBar from './CommentSortBar';

interface CommentListProps {
  comments: CommentEntry[];
  total: number;
  hasMore: boolean;
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

  if (!comments.length && !loading) {
    return (
      <div className="rounded-2xl border border-dashed border-cyan-400/10 px-5 py-8 text-center">
        <MessageSquareText className="mx-auto text-cyan-100/20" size={24} />
        <p className="mt-3 text-sm text-cyan-100/38">Комментариев пока нет. Можно стать первым внимательным читателем.</p>
      </div>
    );
  }

  const visibleComments = matchingComments.slice(0, visibleLimit);
  const remainingLoaded = Math.max(0, matchingComments.length - visibleComments.length);
  const canRequestMore = kindFilter === 'all' && hasMore && remainingLoaded === 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-cyan-400/[0.08] bg-black/15 p-3">
        <CommentSortBar value={sortMode} onChange={setSortMode} />
        {availableKinds.size > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Фильтр комментариев по типу">
            <button
              type="button"
              onClick={() => setKindFilter('all')}
              aria-pressed={kindFilter === 'all'}
              className={`min-h-9 flex-none rounded-full border px-3 text-[9px] font-bold uppercase tracking-[0.12em] transition ${kindFilter === 'all' ? 'border-cyan-300/35 bg-cyan-300/10 text-cyan-100' : 'border-white/[0.07] text-white/35 hover:text-white/70'}`}
            >
              Все · {total}
            </button>
            {commentKindOptions.filter((option) => availableKinds.has(option.value)).map((option) => {
              const count = comments.filter((comment) => comment.kind === option.value).length;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setKindFilter(option.value)}
                  aria-pressed={kindFilter === option.value}
                  className={`min-h-9 flex-none rounded-full border px-3 text-[9px] font-bold uppercase tracking-[0.1em] transition ${kindFilter === option.value ? 'border-luxury-gold/35 bg-luxury-gold/10 text-luxury-gold' : 'border-white/[0.07] text-white/35 hover:text-white/70'}`}
                >
                  {option.label} · {count}{hasMore ? '+' : ''}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[10px] uppercase tracking-[0.13em] text-cyan-100/30" aria-live="polite">
        Показано {visibleComments.length} из {kindFilter === 'all' ? total : matchingComments.length}
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
            {loading ? <LoaderCircle size={15} className="animate-spin" /> : <ChevronDown size={15} />}
            {loading ? 'Загружаем…' : remainingLoaded > 0 ? `Показать ещё ${Math.min(PAGE_SIZE, remainingLoaded)}` : 'Загрузить ещё комментарии'}
          </button>
        </div>
      )}
    </div>
  );
}
