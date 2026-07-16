import { useState } from 'react';
import { commentKindLabels } from '../../data/commentKinds';
import type { CommentEntry } from '../../types/community';
import ExpandableText from './ExpandableText';
import { ThumbsUp } from '../PremiumIcons';
import { formatRelativeRu } from '../../utils/feedbackValidation';

interface CommentCardProps {
  comment: CommentEntry;
  markedHelpful?: boolean;
  onHelpful: (id: string) => void;
}

export default function CommentCard({ comment, markedHelpful = false, onHelpful }: CommentCardProps) {
  const [pending, setPending] = useState(false);
  const absolute = new Date(comment.createdAt).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleHelpful = () => {
    if (markedHelpful || pending) return;
    setPending(true);
    try {
      onHelpful(comment.id);
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="rounded-2xl border border-cyan-400/10 bg-black/25 p-4 transition hover:border-cyan-400/18">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-white">{comment.author}</div>
          <time
            dateTime={comment.createdAt}
            title={absolute}
            className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/32"
          >
            {formatRelativeRu(comment.createdAt)}
          </time>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="rounded-full border border-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-cyan-200/50">
            {commentKindLabels[comment.kind] || 'Комментарий'}
          </span>
          <button
            type="button"
            onClick={handleHelpful}
            disabled={markedHelpful || pending}
            aria-pressed={markedHelpful}
            aria-label={
              markedHelpful
                ? `Вы отметили полезным (${comment.helpful})`
                : `Отметить полезным (${comment.helpful})`
            }
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${
              markedHelpful
                ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-200'
                : 'border-cyan-400/15 text-cyan-200/60 hover:text-cyan-300 disabled:opacity-50'
            }`}
          >
            <ThumbsUp size={13} />
            <span className="tabular-nums">{comment.helpful}</span>
          </button>
        </div>
      </div>
      <ExpandableText text={comment.text} />
    </article>
  );
}
