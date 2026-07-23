import { Check, ThumbsUp } from 'lucide-react';
import { commentKindLabels } from '../../data/commentKinds';
import type { CommentEntry } from '../../types/community';
import ExpandableText from './ExpandableText';

interface CommentCardProps {
  comment: CommentEntry;
  helpfulMarked?: boolean;
  onHelpful: (id: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default function CommentCard({ comment, helpfulMarked = false, onHelpful }: CommentCardProps) {
  return (
    <article className="rounded-2xl border border-cyan-400/10 bg-black/25 p-4 transition hover:border-cyan-400/18">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-white" title={comment.author}>{comment.author}</div>
          <time dateTime={comment.createdAt} className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/32">
            {dateFormatter.format(new Date(comment.createdAt))}
          </time>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="rounded-full border border-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-cyan-200/50">
            {commentKindLabels[comment.kind] || 'Комментарий'}
          </span>
          <button
            type="button"
            onClick={() => onHelpful(comment.id)}
            disabled={helpfulMarked}
            aria-pressed={helpfulMarked}
            aria-label={helpfulMarked ? `Вы отметили комментарий полезным. Всего отметок: ${comment.helpful}` : `Отметить комментарий полезным. Сейчас отметок: ${comment.helpful}`}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${helpfulMarked ? 'cursor-default border-emerald-400/18 bg-emerald-400/[0.055] text-emerald-200/65' : 'border-cyan-400/15 text-cyan-200/60 hover:border-cyan-300/30 hover:text-cyan-300'}`}
          >
            {helpfulMarked ? <Check size={13} /> : <ThumbsUp size={13} />} Полезно · {comment.helpful}
          </button>
        </div>
      </div>
      <ExpandableText text={comment.text} />
    </article>
  );
}
