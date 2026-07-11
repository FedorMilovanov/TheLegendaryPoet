import { useMemo, useSyncExternalStore } from 'react';
import { CommentEntry, CommentKind, FeedbackTargetType, RatingEntry } from '../types/community';
import { averageScores, canMarkHelpful, checkCooldown, distributionFromRatings, filterComments, filterRatings, getFeedbackSnapshot, hasRated, makeFeedbackId, mutateFeedback, rememberHelpful, rememberRated, setCooldown, subscribeFeedback, trustLabel } from '../utils/communityStore';
import { bumpHelpfulRemote, insertCommentRemote, insertRatingRemote } from '../utils/communityRemote';

export function useCommunityFeedback(targetType: FeedbackTargetType, targetId: string) {
  // Single shared source of truth: every panel on the page reads the same
  // snapshot and re-renders when any panel writes (fixes cross-panel clobber
  // and stale summaries).
  const snapshot = useSyncExternalStore(subscribeFeedback, getFeedbackSnapshot, getFeedbackSnapshot);

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
    const stored = mutateFeedback((prev) => ({ ...prev, ratings: [...prev.ratings, entry] }));
    if (!stored) {
      return { ok: false as const, message: 'Не удалось сохранить: браузер блокирует локальное хранилище' };
    }
    rememberRated(scope);
    setCooldown(scope);
    void insertRatingRemote(entry); // share to backend if configured; local copy already saved
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
    const stored = mutateFeedback((prev) => ({ ...prev, comments: [entry, ...prev.comments] }));
    if (!stored) {
      return { ok: false as const, message: 'Не удалось сохранить: браузер блокирует локальное хранилище' };
    }
    setCooldown(scope);
    void insertCommentRemote(entry); // share to backend if configured
    return { ok: true as const, message: 'Комментарий добавлен' };
  };

  const markHelpful = (commentId: string) => {
    const scope = `helpful:${targetType}:${targetId}:${commentId}`;
    if (!canMarkHelpful(scope)) {
      return { ok: false as const, message: 'Вы уже отметили этот комментарий' };
    }
    let newHelpful = 0;
    mutateFeedback((prev) => ({
      ...prev,
      comments: prev.comments.map((comment) => {
        if (comment.id !== commentId) return comment;
        newHelpful = comment.helpful + 1;
        return { ...comment, helpful: newHelpful };
      }),
    }));
    rememberHelpful(scope);
    void bumpHelpfulRemote(commentId, newHelpful); // share to backend if configured
    return { ok: true as const, message: 'Спасибо, мнение учтено' };
  };

  return { ratings, comments, summary, distribution, topComment, trust, addRating, addComment, markHelpful };
}