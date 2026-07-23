import { useEffect, useState } from 'react';
import { Cloud, CloudOff, Clock3, LoaderCircle, MessageSquare, ShieldCheck, WifiOff } from 'lucide-react';
import type { FeedbackTargetType, RatingDimension } from '../../types/community';
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
  const shell = compact ? 'rounded-[1.5rem] p-5' : 'rounded-[2rem] p-8 md:p-10';
  const topGrid = compact ? 'mb-5 flex flex-col gap-3' : 'mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between';
  const analyticsGrid = compact ? 'mb-5 space-y-5' : 'mb-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]';
  const actionGrid = compact ? 'space-y-5' : 'grid gap-6 lg:grid-cols-[0.9fr_1.1fr]';

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const syncPresentation = (() => {
    if (feedback.sync.phase === 'local') return {
      Icon: WifiOff,
      className: 'text-amber-100/52',
      text: 'Локальный режим: ответы сохраняются только в этом браузере.',
      spin: false,
    };
    if (feedback.sync.phase === 'syncing') return {
      Icon: LoaderCircle,
      className: 'text-cyan-100/58',
      text: feedback.sync.message ?? 'Синхронизируем общую базу…',
      spin: true,
    };
    if (feedback.sync.phase === 'offline') return {
      Icon: CloudOff,
      className: 'text-amber-100/58',
      text: feedback.sync.pendingCount > 0
        ? `Сервер недоступен. В очереди: ${feedback.sync.pendingCount}; ничего не потеряно.`
        : (feedback.sync.message ?? 'Сервер временно недоступен; показан локальный кэш.'),
      spin: false,
    };
    if (feedback.sync.phase === 'idle') return {
      Icon: Clock3,
      className: 'text-cyan-100/48',
      text: 'Общая база подключена; ожидаем первую синхронизацию.',
      spin: false,
    };
    return {
      Icon: Cloud,
      className: feedback.sync.pendingCount > 0 ? 'text-amber-100/58' : 'text-emerald-200/58',
      text: feedback.sync.pendingCount > 0
        ? `Общая база подключена. В очереди на отправку: ${feedback.sync.pendingCount}.`
        : 'Общая база синхронизирована: оценки и комментарии видны всем посетителям.',
      spin: false,
    };
  })();

  return (
    <section className={`luxury-card relative border border-cyan-400/15 bg-[#061018]/70 ${shell}`}>
      {toast && <div className="pointer-events-none absolute right-4 top-4 z-20 w-[min(320px,calc(100%-2rem))]"><ActionToast message={toast.message} tone={toast.tone} /></div>}
      <div className={topGrid}>
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
            <ShieldCheck size={13} /> Оценка сообщества
          </div>
          <h3 className={`break-words font-serif font-bold leading-tight text-white ${compact ? 'text-xl' : 'text-2xl'}`}>{title}</h3>
          <p className={`mt-2 flex max-w-xl items-start gap-2 leading-relaxed ${compact ? 'text-[11px]' : 'text-xs'} ${syncPresentation.className}`} aria-live="polite">
            <syncPresentation.Icon size={13} className={`mt-0.5 shrink-0 ${syncPresentation.spin ? 'animate-spin' : ''}`} />
            <span>{syncPresentation.text}</span>
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
            initialScores={feedback.ownRating?.scores}
            onSubmit={feedback.addRating}
            onStatus={(message, tone) => setToast({ message, tone })}
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white"><MessageSquare size={17} className="text-cyan-300" /> Комментарии</div>
          <CommentComposer onSubmit={feedback.addComment} onStatus={(message, tone) => setToast({ message, tone })} />
          <CommentList
            comments={feedback.comments}
            onHelpful={feedback.markHelpful}
            isHelpfulMarked={feedback.hasMarkedHelpful}
            onStatus={(message, tone) => setToast({ message, tone })}
          />
        </div>
      </div>
    </section>
  );
}
