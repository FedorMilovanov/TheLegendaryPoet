import { useMemo, useState } from 'react';
import { CommentEntry } from '../../types/community';
import CommentCard from './CommentCard';
import CommentSortBar from './CommentSortBar';

interface CommentListProps {
  comments: CommentEntry[];
  onHelpful: (id: string) => { ok: boolean; message: string };
  onStatus?: (message: string, tone: 'success' | 'warning') => void;
}

export default function CommentList({
  comments,
  onHelpful,
  onStatus,
}: CommentListProps) {
  const [sortMode, setSortMode] = useState<'helpful' | 'newest'>('helpful');

  const visibleComments = useMemo(() => {
    return comments
      .slice()
      .sort((a, b) =>
        sortMode === 'helpful'
          ? b.helpful - a.helpful
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [comments, sortMode]);

  if (!comments.length) {
    return (
      <p className="text-sm text-cyan-100/38">
        Комментариев пока нет. Можно стать первым внимательным читателем.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <CommentSortBar value={sortMode} onChange={setSortMode} />
      {visibleComments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          onHelpful={(id) => {
            const result = onHelpful(id);
            onStatus?.(result.message, result.ok ? 'success' : 'warning');
          }}
        />
      ))}
    </div>
  );
}
