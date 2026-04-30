import { ThumbsUp } from 'lucide-react';
import { commentKindLabels } from '../../data/commentKinds';
import { CommentEntry } from '../../types/community';
import ExpandableText from './ExpandableText';

interface CommentCardProps {
  comment: CommentEntry;
  onHelpful: (id: string) => void;
}

export default function CommentCard({ comment, onHelpful }: CommentCardProps) {
  return (
    <article className="rounded-2xl border border-cyan-400/10 bg-black/25 p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-white">{comment.author}</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/32">
            {new Date(comment.createdAt).toLocaleDateString('ru-RU')}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="rounded-full border border-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-cyan-200/50">
            {commentKindLabels[comment.kind] || 'Комментарий'}
          </span>
          <button
            type="button"
            onClick={() => onHelpful(comment.id)}
            className="inline-flex items-center gap-1 rounded-full border border-cyan-400/15 px-3 py-1 text-xs text-cyan-200/60 transition hover:text-cyan-300"
          >
            <ThumbsUp size={13} /> {comment.helpful}
          </button>
        </div>
      </div>
      <ExpandableText text={comment.text} />
    </article>
  );
}
