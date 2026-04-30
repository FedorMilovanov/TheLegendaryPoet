import { useMemo, useState } from 'react';
import { CommentEntry, CommentKind, FeedbackTargetType, RatingEntry } from '../types/community';
import { averageScores, canMarkHelpful, checkCooldown, distributionFromRatings, filterComments, filterRatings, hasRated, loadFeedback, makeFeedbackId, rememberHelpful, rememberRated, saveFeedback, setCooldown, trustLabel } from '../utils/communityStore';

export function useCommunityFeedback(targetType: FeedbackTargetType, targetId: string) {
  const [snapshot, setSnapshot] = useState(() => loadFeedback());

  const ratings = useMemo(() => filterRatings(snapshot, targetType, targetId), [snapshot, targetType, targetId]);
  const comments = useMemo(() => filterComments(snapshot, targetType, targetId), [snapshot, targetType, targetId]);
  const summary = useMemo(() => averageScores(ratings), [ratings]);
  const distribution = useMemo(() => distributionFromRatings(ratings), [ratings]);
  const topComment = useMemo(() => comments.slice().sort((a, b) => b.helpful - a.helpful)[0], [comments]);
  const trust = useMemo(() => trustLabel(ratings.length), [ratings.length]);

  const addRating = (scores: Record<string, number>) => {
    const scope = `rating:${targetType}:${targetId}`;
    if (hasRated(scope)) {
      return { ok: false as const, message: 'Ваш голос уже учтён для этого объекта' };
    }
    const cooldown = checkCooldown(scope);
    if (!cooldown.allowed) {
      return { ok: false as const, message: `Подождите ${Math.ceil(cooldown.remainingMs / 1000)} сек.` };
    }
    const entry: RatingEntry = {
      id: makeFeedbackId('rating'),
      targetType,
      targetId,
      scores,
      createdAt: new Date().toISOString(),
    };
    const next = { ...snapshot, ratings: [...snapshot.ratings, entry] };
    saveFeedback(next);
    setSnapshot(next);
    rememberRated(scope);
    setCooldown(scope);
    return { ok: true as const, message: 'Оценка сохранена' };
  };

  const addComment = (author: string, text: string, kind: CommentKind) => {
    const scope = `comment:${targetType}:${targetId}`;
    const cooldown = checkCooldown(scope);
    if (!cooldown.allowed) {
      return { ok: false as const, message: `Подождите ${Math.ceil(cooldown.remainingMs / 1000)} сек.` };
    }
    const entry: CommentEntry = {
      id: makeFeedbackId('comment'),
      targetType,
      targetId,
      author: author.trim() || 'Анонимный читатель',
      text: text.trim(),
      kind,
      helpful: 0,
      createdAt: new Date().toISOString(),
    };
    const next = { ...snapshot, comments: [entry, ...snapshot.comments] };
    saveFeedback(next);
    setSnapshot(next);
    setCooldown(scope);
    return { ok: true as const, message: 'Комментарий добавлен' };
  };

  const markHelpful = (commentId: string) => {
    const scope = `helpful:${targetType}:${targetId}:${commentId}`;
    if (!canMarkHelpful(scope)) {
      return { ok: false as const, message: 'Вы уже отметили этот комментарий' };
    }
    const next = {
      ...snapshot,
      comments: snapshot.comments.map((comment) => comment.id === commentId ? { ...comment, helpful: comment.helpful + 1 } : comment),
    };
    saveFeedback(next);
    setSnapshot(next);
    rememberHelpful(scope);
    return { ok: true as const, message: 'Спасибо, мнение учтено' };
  };

  return { ratings, comments, summary, distribution, topComment, trust, addRating, addComment, markHelpful };
}