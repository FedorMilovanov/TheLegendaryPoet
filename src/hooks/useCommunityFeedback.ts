import { useMemo, useSyncExternalStore } from 'react';
import type { CommentEntry, CommentKind, FeedbackTargetType, RatingEntry } from '../types/community';
import {
  canMarkHelpful,
  checkCooldown,
  commitCommentFeedback,
  commitHelpfulFeedback,
  commitRatingFeedback,
  compactCommunityLocalCache,
  flushCommunityOutbox,
  getCommunitySyncSnapshot,
  getOwnRating,
  makeFeedbackId,
  subscribeCommunitySync,
  trustLabel,
} from '../utils/communityStore';
import {
  getFeedbackTargetSnapshot,
  loadMoreFeedbackComments,
  refreshFeedbackTarget,
  subscribeFeedbackTarget,
} from '../utils/communityTargetStore';
import { getCommunityDeviceId } from '../utils/communityIdentity';

export function useCommunityFeedback(targetType: FeedbackTargetType, targetId: string) {
  const targetStore = useMemo(() => ({
    subscribe: (listener: () => void) => subscribeFeedbackTarget(targetType, targetId, listener),
    getSnapshot: () => getFeedbackTargetSnapshot(targetType, targetId),
  }), [targetId, targetType]);
  const snapshot = useSyncExternalStore(targetStore.subscribe, targetStore.getSnapshot, targetStore.getSnapshot);
  const sync = useSyncExternalStore(subscribeCommunitySync, getCommunitySyncSnapshot, getCommunitySyncSnapshot);
  const ratingScope = `rating:${targetType}:${targetId}`;

  const comments = snapshot.comments;
  const topComment = useMemo(() => comments
    .slice()
    .sort((left, right) => right.helpful - left.helpful || Date.parse(right.createdAt) - Date.parse(left.createdAt))[0], [comments]);
  const trust = useMemo(() => trustLabel(snapshot.aggregate.ratingCount), [snapshot.aggregate.ratingCount]);
  const ownRating = useMemo(() => getOwnRating(ratingScope), [ratingScope, snapshot]);

  const revalidateAfterWrite = () => {
    compactCommunityLocalCache();
    void flushCommunityOutbox().then(() => refreshFeedbackTarget(targetType, targetId));
  };

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

    revalidateAfterWrite();
    return { ok: true as const, message: previous ? 'Оценка обновлена' : 'Оценка сохранена' };
  };

  const addComment = (author: string, text: string, kind: CommentKind) => {
    const scope = `comment:${targetType}:${targetId}`;
    const cooldown = checkCooldown(scope);
    if (!cooldown.allowed) return { ok: false as const, message: `Подождите ${Math.ceil(cooldown.remainingMs / 1000)} сек.` };

    const normalizedText = text.replace(/\r\n?/g, '\n').trim();
    if (normalizedText.length < 8) return { ok: false as const, message: 'Комментарий слишком короткий' };
    if (normalizedText.length > 1200) return { ok: false as const, message: 'Комментарий превышает 1200 символов' };

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

    revalidateAfterWrite();
    return { ok: true as const, message: 'Комментарий добавлен' };
  };

  const helpfulScope = (commentId: string) => `helpful:${targetType}:${targetId}:${commentId}`;
  const hasMarkedHelpful = (commentId: string) => !canMarkHelpful(helpfulScope(commentId));

  const markHelpful = (commentId: string) => {
    const scope = helpfulScope(commentId);
    if (!canMarkHelpful(scope)) return { ok: false as const, message: 'Вы уже отметили этот комментарий' };

    const stored = commitHelpfulFeedback(commentId, scope, getCommunityDeviceId());
    if (!stored) return { ok: false as const, message: 'Не удалось сохранить отметку' };

    revalidateAfterWrite();
    return { ok: true as const, message: 'Спасибо, мнение учтено' };
  };

  return {
    ratings: [] as RatingEntry[],
    ratingCount: snapshot.aggregate.ratingCount,
    commentCount: snapshot.aggregate.commentCount,
    comments,
    summary: {
      overall: snapshot.aggregate.overall,
      dimensions: snapshot.aggregate.dimensions,
    },
    distribution: snapshot.aggregate.distribution,
    topComment,
    trust,
    ownRating,
    sync,
    targetPhase: snapshot.phase,
    targetMessage: snapshot.message,
    hasMoreComments: snapshot.hasMoreComments,
    loadingMoreComments: snapshot.loadingMore,
    loadMoreComments: () => loadMoreFeedbackComments(targetType, targetId),
    addRating,
    addComment,
    markHelpful,
    hasMarkedHelpful,
  };
}
