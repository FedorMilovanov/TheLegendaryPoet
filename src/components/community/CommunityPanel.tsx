import { useEffect, useState } from 'react';
import { MessageSquare, ShieldCheck } from 'lucide-react';
import { FeedbackTargetType, RatingDimension } from '../../types/community';
import { useCommunityFeedback } from '../../hooks/useCommunityFeedback';
import ActionToast from './ActionToast';
import CommentComposer from './CommentComposer';
import CommentList from './CommentList';
import CommunityInsights from './CommunityInsights';
import FeedbackPair from './FeedbackPair';
import RatingBars from './RatingBars';
import RatingDistribution from './RatingDistribution';
import RatingForm from './RatingForm';
import RatingStars from './RatingStars';
import { getCriticalComment, getPositiveComment } from '../../utils/commentHighlights';

interface CommunityPanelProps {
  targetType: FeedbackTargetType;
  targetId: string;
  title: string;
  dimensions: RatingDimension[];
  compact?: boolean;
}

export default function CommunityPanel({ targetType, targetId, title, dimensions, compact = false }: CommunityPanelProps) {
  const feedback = useCommunityFeedback(targetType, targetId);
  const hasRatings = feedback.ratings.length > 0;
  const positiveComment = getPositiveComment(feedback.comments);
  const criticalComment = getCriticalComment(feedback.comments);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'warning' } | null>(null);
  const shell = compact ? 'p-5 rounded-[1.5rem]' : 'p-8 md:p-10 rounded-[2rem]';
  const topGrid = compact ? 'mb-5 flex flex-col gap-3' : 'mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between';
  const analyticsGrid = compact ? 'mb-5 space-y-5' : 'mb-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]';
  const actionGrid = compact ? 'space-y-5' : 'grid gap-6 lg:grid-cols-[0.9fr_1.1fr]';

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <section className={`relative luxury-card border border-cyan-400/15 bg-[#061018]/70 ${shell}`}>
      {toast && (
        <div className="pointer-events-none absolute right-4 top-4 z-20 w-[min(320px,calc(100%-2rem))]">
          <ActionToast message={toast.message} tone={toast.tone} />
        </div>
      )}
      <div className={topGrid}>
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
            <ShieldCheck size={13} /> Оценка сообщества
          </div>
          <h3 className={`break-words font-serif font-bold leading-tight text-white ${compact ? 'text-xl' : 'text-2xl'}`}>{title}</h3>
          <p className={`mt-2 leading-relaxed text-cyan-100/38 ${compact ? 'max-w-none text-[11px]' : 'max-w-xl text-xs'}`}>
            Прототип локального голосования: данные сохраняются в браузере. После подключения аккаунтов оценки можно будет синхронизировать и модерировать.
          </p>
        </div>
        <div className="text-left md:text-right">
          <div className={`mb-1 font-bold text-white ${compact ? 'text-2xl' : 'text-3xl'}`}>{hasRatings ? feedback.summary.overall.toFixed(1) : '—'}</div>
          <RatingStars value={Math.round(feedback.summary.overall)} size={compact ? 15 : 18} />
          <div className="mt-1 text-xs text-cyan-100/40">{feedback.ratings.length} оценок · {feedback.trust}</div>
        </div>
      </div>

      <div className={analyticsGrid}>
        <div className="space-y-5">
          <CommunityInsights dimensions={dimensions} values={feedback.summary.dimensions} />
          <RatingBars dimensions={dimensions} values={feedback.summary.dimensions} />
          {!compact && <RatingDistribution distribution={feedback.distribution} total={feedback.ratings.length} />}
        </div>
        {!compact && <FeedbackPair positive={positiveComment} critical={criticalComment} />}
      </div>

      <div className={actionGrid}>
        <div className="space-y-5">
          <RatingForm
            dimensions={dimensions}
            onSubmit={feedback.addRating}
            onStatus={(message, tone) => setToast({ message, tone })}
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <MessageSquare size={17} className="text-cyan-300" /> Комментарии
          </div>
          <CommentComposer
            onSubmit={feedback.addComment}
            onStatus={(message, tone) => setToast({ message, tone })}
          />
          <CommentList
            comments={feedback.comments}
            onHelpful={feedback.markHelpful}
            onStatus={(message, tone) => setToast({ message, tone })}
          />
        </div>
      </div>
    </section>
  );
}