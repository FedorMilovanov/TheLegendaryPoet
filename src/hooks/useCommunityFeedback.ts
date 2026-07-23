import { useMemo, useSyncExternalStore } from 'react';
import { CommentEntry, CommentKind, FeedbackTargetType, RatingEntry } from '../types/community';
import {
  averageScores,
  canMarkHelpful,
  checkCooldown,
  distributionFromRatings,
  filterComments,
  filterRatings,
  getFeedbackSnapshot,
  getOwnRating,
  makeFeedbackId,
  mutateFeedback,
  rememberHelpful,
  rememberRating,
  setCooldown,
  subscribeFeedback,
  trustLabel,
} from '../utils/communityStore';
import { markHelpfulRemote, submitCommentRemote, submitRatingRemote } from '../utils/communityRemote';
import { getCommunityDeviceId } from '../utils/communityIdentity';

export function useCommunityFeedback(targetType: FeedbackTargetType, targetId: string) {
  const snapshot = useSyncExternalStore(subscribeFeedback, getFeedbackSnapshot, getFeedbackSnapshot);
  const ratingScope = `rating:${targetType}:${targetId}`;

  const ratings = useMemo(() => filterRatings(snapshot, targetType, targetId), [snapshot, targetType, targetId]);
  const comments = useMemo(() => filterComments(snapshot, targetType, targetId), [snapshot, targetType, targetId]);
  const summary = useMemo(() => averageScores(ratings), [ratings]);
  const distribution = useMemo(() => distributionFromRatings(ratings), [ratings]);
  const topComment = useMemo(() => comments.slice().sort((a, b) => b.helpful - a.helpful)[0], [comments]);
  const trust = useMemo(() => trustLabel(ratings.length), [ratings.length]);
  const ownRating = useMemo(() => getOwnRating(ratingScope), [ratingScope, snapshot]);

  const addRating = (scores: Record<string, number>) => {
    const cooldown = checkCooldown(ratingScope);
    if (!cooldown.allowed) {
      return { ok: false as const, message: `Подождите ${Math.ceil(cooldown.remainingMs / 1000)} сек.` };
    }

    const previous = getOwnRating(ratingScope);
    const entry: RatingEntry = {
      id: previous?.id ?? makeFeedbackId('rating'),
      targetType,
      targetId,
      scores,
      createdAt: new Date().toISOString(),
    };

    const stored = mutateFeedback((current) => ({
      ...current,
      ratings: [...current.ratings.filter((rating) => rating.id !== entry.id), entry],
    }));
    if (!stored) return { ok: false as const, message: 'Не удалось сохранить: браузер блокирует локальное хранилище' };

    rememberRating(ratingScope, { id: entry.id, scores, updatedAt: entry.createdAt });
    setCooldown(ratingScope);
    void submitRatingRemote(entry, getCommunityDeviceId());
    return { ok: true as const, message: previous ? 'Оценка обновлена' : 'Оценка сохранена' };
  };

  const addComment = (author: string, text: string, kind: CommentKind) => {
    const scope = `comment:${targetType}:${targetId}`;
    const cooldown = checkCooldown(scope);
    if (!cooldown.allowed) return { ok: false as const, message: `Подождите ${Math.ceil(cooldown.remainingMs / 1000)} сек.` };

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
    const stored = mutateFeedback((current) => ({ ...current, comments: [entry, ...current.comments] }));
    if (!stored) return { ok: false as const, message: 'Не удалось сохранить: браузер блокирует локальное хранилище' };

    setCooldown(scope);
    void submitCommentRemote(entry, getCommunityDeviceId());
    return { ok: true as const, message: 'Комментарий добавлен' };
  };

  const markHelpful = (commentId: string) => {
    const scope = `helpful:${targetType}:${targetId}:${commentId}`;
    if (!canMarkHelpful(scope)) return { ok: false as const, message: 'Вы уже отметили этот комментарий' };

    mutateFeedback((current) => ({
      ...current,
      comments: current.comments.map((comment) => comment.id === commentId ? { ...comment, helpful: comment.helpful + 1 } : comment),
    }));
    rememberHelpful(scope);
    void markHelpfulRemote(commentId, getCommunityDeviceId());
    return { ok: true as const, message: 'Спасибо, мнение учтено' };
  };

  return {
    ratings,
    comments,
    summary,
    distribution,
    topComment,
    trust,
    ownRating,
    addRating,
    addComment,
    markHelpful,
  };
}
