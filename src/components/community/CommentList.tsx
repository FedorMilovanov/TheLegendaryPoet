import { useMemo, useState } from 'react';
import { FEEDBACK_LIMITS, type CommentEntry, type FeedbackActionResult } from '../../types/community';
import CommentCard from './CommentCard';
import CommentSortBar from './CommentSortBar';
import { canMarkHelpful, helpfulScope } from '../../utils/communityStore';
import { pluralRu } from '../../utils/feedbackValidation';

interface CommentListProps {
  comments: CommentEntry[];
  targetType: CommentEntry['targetType'];
  targetId: string;
  onHelpful: (id: string) => FeedbackActionResult;
  onStatus?: (message: string, tone: 'success' | 'warning') => void;
}

export default function CommentList({
  comments,
  targetType,
  targetId,
  onHelpful,
  onStatus,
}: CommentListProps) {
  const [sortMode, setSortMode] = useState<'helpful' | 'newest'>('helpful');
  const [page, setPage] = useState(1);
  const pageSize = FEEDBACK_LIMITS.listPageSize;

  const sorted = useMemo(() => {
    return comments.slice().sort((a, b) =>
      sortMode === 'helpful'
        ? b.helpful - a.helpful || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [comments, sortMode]);

  const visible = sorted.slice(0, page * pageSize);
  const remaining = sorted.length - visible.length;

  if (!comments.length) {
    return (
      <p className="rounded-2xl border border-dashed border-cyan-400/12 px-4 py-6 text-center text-sm text-cyan-100/38">
        Комментариев пока нет. Можно стать первым внимательным читателем.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CommentSortBar
          value={sortMode}
          onChange={(mode) => {
            setSortMode(mode);
            setPage(1);
          }}
        />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100/30">
          {comments.length}{' '}
          {pluralRu(comments.length, 'мнение', 'мнения', 'мнений')}
        </span>
      </div>

      {visible.map((comment) => {
        const scope = helpfulScope(targetType, targetId, comment.id);
        return (
          <CommentCard
            key={comment.id}
            comment={comment}
            markedHelpful={!canMarkHelpful(scope)}
            onHelpful={(id) => {
              const result = onHelpful(id);
              onStatus?.(result.message, result.ok ? 'success' : 'warning');
            }}
          />
        );
      })}

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          className="w-full rounded-full border border-cyan-400/15 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200/60 transition hover:border-cyan-400/30 hover:text-cyan-200"
        >
          Ещё {remaining} {pluralRu(remaining, 'комментарий', 'комментария', 'комментариев')}
        </button>
      )}
    </div>
  );
}
