import { useMemo, useSyncExternalStore } from 'react';
import {
  COMMUNITY_AUTHOR_MAX_LENGTH,
  COMMUNITY_COMMENT_MAX_LENGTH,
  COMMUNITY_COMMENT_MIN_LENGTH,
  communityTextLength,
  truncateCommunityText,
} from '../data/communityContract';
import type { CommentEntry, CommentKind, FeedbackTargetType, RatingEntry } from '../types/community';
import {
  canMarkHelpful,
  checkCooldown,
  commitCommentFeedback,
  commitHelpfulFeedback,
  commitRatingFeedback,
  flushCommunityOutbox,
  getCommunitySyncSnapshot,
  getOwnRating,
  makeFeedbackId,
  subscribeCommunitySync,
  trustLabel,
} from '../utils/communityStore';
import {
  getFeedbackTargetSnapshot,
  loadMoreFeedbackTargetComments,
  retryFeedbackTarget,
  subscribeFeedbackTarget,
  type CommunityTargetLoadMode,
} from '../utils/communityTargetStore';
import { getCommunityDeviceId } from '../utils/communityIdentity';

interface CommunityFeedbackOptions {
  mode?: CommunityTargetLoadMode;
}

export function useCommunityFeedback(
  targetType: FeedbackTargetType,
  targetId: string,
  options: CommunityFeedbackOptions = {},
) {
  const mode = options.mode ?? 'full';
  const targetStore = useMemo(() => ({
    subscribe: (listener: () => void) => subscribeFeedbackTarget(targetType, targetId, listener, mode),
    getSnapshot: () => getFeedbackTargetSnapshot(targetType, targetId),
  }), [mode, targetId, targetType]);
  const snapshot = useSyncExternalStore(targetStore.subscribe, targetStore.getSnapshot, targetStore.getSnapshot);
  const sync = useSyncExternalStore(subscribeCommunitySync, getCommunitySyncSnapshot, getCommunitySyncSnapshot);
  const ratingScope = `rating:${targetType}:${targetId}`;

  const comments = snapshot.comments;
  const summary = useMemo(() => ({
    overall: snapshot.aggregate.overall,
    dimensions: snapshot.aggregate.dimensions,
  }), [snapshot.aggregate.dimensions, snapshot.aggregate.overall]);
  const distribution = snapshot.aggregate.distribution;
  const topComment = useMemo(() => comments
    .slice()
    .sort((left, right) => right.helpful - left.helpful || Date.parse(right.createdAt) - Date.parse(left.createdAt))[0], [comments]);
  const trust = trustLabel(snapshot.aggregate.ratingCount);
  const ownRating = useMemo(() => getOwnRating(ratingScope), [ratingScope, snapshot]);

  const addRating = (scores: Record<string, number>) => {
    const previous = getOwnRating(ratingScope);
    const entry: RatingEntry = {
      id: previous?.id ?? makeFeedbackId('rating'),
      targetType,
      targetId,
      scores,
      createdAt: new Date().toISOString(),
    };

    const stored = commitRatingFeedback(entry, ratingScope, getCommunityDeviceId());
    if (!stored) return { ok: false as const, message: 'Не удалось сохранить: локальное хранилище или очередь недоступны' };

    void flushCommunityOutbox({ interactive: true });
    return { ok: true as const, message: previous ? 'Оценка обновлена' : 'Оценка сохранена' };
  };

  const addComment = (author: string, text: string, kind: CommentKind) => {
    const scope = `comment:${targetType}:${targetId}`;
    const cooldown = checkCooldown(scope);
    if (!cooldown.allowed) return { ok: false as const, message: `Подождите ${Math.ceil(cooldown.remainingMs / 1000)} сек.` };

    const normalizedText = text.replace(/\r\n?/g, '\n').trim();
    const textLength = communityTextLength(normalizedText);
    if (textLength < COMMUNITY_COMMENT_MIN_LENGTH) return { ok: false as const, message: 'Комментарий слишком короткий' };
    if (textLength > COMMUNITY_COMMENT_MAX_LENGTH) return { ok: false as const, message: `Комментарий превышает ${COMMUNITY_COMMENT_MAX_LENGTH} символов` };

    const entry: CommentEntry = {
      id: makeFeedbackId('comment'),
      targetType,
      targetId,
      author: truncateCommunityText(author.trim(), COMMUNITY_AUTHOR_MAX_LENGTH) || 'Анонимный читатель',
      text: normalizedText,
      kind,
      helpful: 0,
      createdAt: new Date().toISOString(),
    };
    const stored = commitCommentFeedback(entry, scope, getCommunityDeviceId());
    if (!stored) return { ok: false as const, message: 'Не удалось сохранить: локальное хранилище или очередь недоступны' };

    void flushCommunityOutbox({ interactive: true });
    return { ok: true as const, message: 'Комментарий добавлен' };
  };

  const helpfulScope = (commentId: string) => `helpful:${targetType}:${targetId}:${commentId}`;
  const hasMarkedHelpful = (commentId: string) => !canMarkHelpful(helpfulScope(commentId));

  const markHelpful = (commentId: string) => {
    const scope = helpfulScope(commentId);
    if (!canMarkHelpful(scope)) return { ok: false as const, message: 'Вы уже отметили этот комментарий' };

    const stored = commitHelpfulFeedback(commentId, scope, getCommunityDeviceId());
    if (!stored) return { ok: false as const, message: 'Не удалось сохранить отметку: локальная очередь недоступна' };

    void flushCommunityOutbox({ interactive: true });
    return { ok: true as const, message: 'Спасибо, мнение учтено' };
  };

  return {
    comments,
    ratingCount: snapshot.aggregate.ratingCount,
    commentCount: snapshot.aggregate.commentCount,
    summary,
    distribution,
    topComment,
    trust,
    ownRating,
    sync,
    summaryPhase: snapshot.summaryPhase,
    commentsPhase: snapshot.commentsPhase,
    hasMoreComments: snapshot.hasMoreComments,
    error: snapshot.error,
    addRating,
    addComment,
    markHelpful,
    hasMarkedHelpful,
    loadMoreComments: () => loadMoreFeedbackTargetComments(targetType, targetId),
    retry: () => retryFeedbackTarget(targetType, targetId, mode),
  };
}
