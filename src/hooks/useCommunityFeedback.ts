import { useMemo, useSyncExternalStore } from 'react';
import type { CommentEntry, CommentKind, FeedbackTargetType, RatingEntry } from '../types/community';
import {
  averageScores,
  canMarkHelpful,
  checkCooldown,
  commitCommentFeedback,
  commitHelpfulFeedback,
  commitRatingFeedback,
  distributionFromRatings,
  filterComments,
  filterRatings,
  flushCommunityOutbox,
  getCommunitySyncSnapshot,
  getFeedbackSnapshot,
  getOwnRating,
  makeFeedbackId,
  subscribeCommunitySync,
  subscribeFeedback,
  trustLabel,
} from '../utils/communityStore';
import { getCommunityDeviceId } from '../utils/communityIdentity';

export function useCommunityFeedback(targetType: FeedbackTargetType, targetId: string) {
  const snapshot = useSyncExternalStore(subscribeFeedback, getFeedbackSnapshot, getFeedbackSnapshot);
  const sync = useSyncExternalStore(subscribeCommunitySync, getCommunitySyncSnapshot, getCommunitySyncSnapshot);
  const ratingScope = `rating:${targetType}:${targetId}`;

  const ratings = useMemo(() => filterRatings(snapshot, targetType, targetId), [snapshot, targetType, targetId]);
  const comments = useMemo(() => filterComments(snapshot, targetType, targetId), [snapshot, targetType, targetId]);
  const summary = useMemo(() => averageScores(ratings), [ratings]);
  const distribution = useMemo(() => distributionFromRatings(ratings), [ratings]);
  const topComment = useMemo(() => comments
    .slice()
    .sort((left, right) => right.helpful - left.helpful || Date.parse(right.createdAt) - Date.parse(left.createdAt))[0], [comments]);
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

    const stored = commitRatingFeedback(entry, ratingScope, getCommunityDeviceId());
    if (!stored) return { ok: false as const, message: 'Не удалось сохранить: браузер блокирует локальное хранилище' };

    void flushCommunityOutbox();
    return { ok: true as const, message: previous ? 'Оценка обновлена' : 'Оценка сохранена' };
  };

  const addComment = (author: string, text: string, kind: CommentKind) => {
    const scope = `comment:${targetType}:${targetId}`;
    const cooldown = checkCooldown(scope);
    if (!cooldown.allowed) return { ok: false as const, message: `Подождите ${Math.ceil(cooldown.remainingMs / 1000)} сек.` };

    const normalizedText = text.replace(/\r\n?/g, '\n').trim();
    if (normalizedText.length < 8) return { ok: false as const, message: 'Комментарий слишком короткий' };
    if (normalizedText.length > 2000) return { ok: false as const, message: 'Комментарий превышает 2000 символов' };

    const entry: CommentEntry = {
      id: makeFeedbackId('comment'),
      targetType,
      targetId,
      author: author.trim().slice(0, 60) || 'Анонимный читатель',
      text: normalizedText,
      kind,
      helpful: 0,
      createdAt: new Date().toISOString(),
    };
    const stored = commitCommentFeedback(entry, scope, getCommunityDeviceId());
    if (!stored) return { ok: false as const, message: 'Не удалось сохранить: браузер блокирует локальное хранилище' };

    void flushCommunityOutbox();
    return { ok: true as const, message: 'Комментарий добавлен' };
  };

  const helpfulScope = (commentId: string) => `helpful:${targetType}:${targetId}:${commentId}`;
  const hasMarkedHelpful = (commentId: string) => !canMarkHelpful(helpfulScope(commentId));

  const markHelpful = (commentId: string) => {
    const scope = helpfulScope(commentId);
    if (!canMarkHelpful(scope)) return { ok: false as const, message: 'Вы уже отметили этот комментарий' };

    const stored = commitHelpfulFeedback(commentId, scope, getCommunityDeviceId());
    if (!stored) return { ok: false as const, message: 'Не удалось сохранить отметку' };

    void flushCommunityOutbox();
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
    sync,
    addRating,
    addComment,
    markHelpful,
    hasMarkedHelpful,
  };
}
