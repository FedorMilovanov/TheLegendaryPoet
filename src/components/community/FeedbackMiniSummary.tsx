import { MessageSquare, Star } from 'lucide-react';
import { FeedbackTargetType } from '../../types/community';
import { useCommunityFeedback } from '../../hooks/useCommunityFeedback';

interface FeedbackMiniSummaryProps {
  targetType: FeedbackTargetType;
  targetId: string;
}

export default function FeedbackMiniSummary({ targetType, targetId }: FeedbackMiniSummaryProps) {
  const feedback = useCommunityFeedback(targetType, targetId);

  if (!feedback.ratings.length && !feedback.comments.length) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-cyan-100/45">
      {feedback.ratings.length > 0 && (
        <div className="inline-flex items-center gap-1 rounded-full border border-cyan-400/10 bg-cyan-950/20 px-2.5 py-1">
          <Star size={12} className="fill-cyan-300 text-cyan-300" />
          <span>{feedback.summary.overall.toFixed(1)}</span>
          <span className="text-cyan-100/30">· {feedback.ratings.length}</span>
        </div>
      )}
      {feedback.comments.length > 0 && (
        <div className="inline-flex items-center gap-1 rounded-full border border-cyan-400/10 bg-cyan-950/20 px-2.5 py-1">
          <MessageSquare size={12} className="text-cyan-300" />
          <span>{feedback.comments.length} мнений</span>
        </div>
      )}
    </div>
  );
}
