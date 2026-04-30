import { AlertTriangle, Sparkles } from 'lucide-react';
import { CommentEntry } from '../../types/community';
import { commentKindLabels } from '../../data/commentKinds';

interface FeedbackPairProps {
  positive?: CommentEntry;
  critical?: CommentEntry;
}

function Item({
  tone,
  title,
  comment,
}: {
  tone: 'positive' | 'critical';
  title: string;
  comment?: CommentEntry;
}) {
  if (!comment) {
    return (
      <div className="rounded-3xl border border-cyan-400/10 bg-black/20 p-5 text-sm text-cyan-100/35">
        {tone === 'positive'
          ? 'Пока нет выделенного положительного отзыва.'
          : 'Пока нет выделенного критического отзыва.'}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-cyan-400/12 bg-black/20 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-cyan-300">
          {tone === 'positive' ? <Sparkles size={12} /> : <AlertTriangle size={12} />}
          {title}
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/35">
          {commentKindLabels[comment.kind] || 'Комментарий'}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-cyan-50/72">{comment.text}</p>
      <div className="mt-3 text-xs text-cyan-100/34">{comment.author}</div>
    </div>
  );
}

export default function FeedbackPair({ positive, critical }: FeedbackPairProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Item tone="positive" title="Положительный отзыв" comment={positive} />
      <Item tone="critical" title="Критический отзыв" comment={critical} />
    </div>
  );
}
