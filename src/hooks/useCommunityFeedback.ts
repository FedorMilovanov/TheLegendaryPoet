import { useMemo, useSyncExternalStore } from 'react';
import {
  type CommentEntry,
  type CommentKind,
  type FeedbackActionResult,
  type FeedbackTargetType,
  type RatingDimension,
  type RatingEntry,
} from '../types/community';
import {
  averageScores,
  canMarkHelpful,
  checkCooldown,
  commentScope,
  distributionFromRatings,
  filterComments,
  filterRatings,
  getFeedbackSnapshot,
  hasRated,
  helpfulScope,
  isFeedbackShared,
  makeFeedbackId,
  mutateFeedback,
  ratingScope,
  rememberHelpful,
  rememberRated,
  setCooldown,
  subscribeFeedback,
  trustLabel,
} from '../utils/communityStore';
import { bumpHelpfulRemote, insertCommentRemote, insertRatingRemote } from '../utils/communityRemote';
import { validateCommentInput, validateScores } from '../utils/feedbackValidation';

export function useCommunityFeedback(targetType: FeedbackTargetType, targetId: string) {
  // Single shared source of truth: every panel on the page reads the same
  // snapshot and re-renders when any panel writes.
  const snapshot = useSyncExternalStore(subscribeFeedback, getFeedbackSnapshot, getFeedbackSnapshot);

  const ratings = useMemo(
    () => filterRatings(snapshot, targetType, targetId),
    [snapshot, targetType, targetId],
  );
  const comments = useMemo(
    () => filterComments(snapshot, targetType, targetId),
    [snapshot, targetType, targetId],
  );
  const summary = useMemo(() => averageScores(ratings), [ratings]);
  const distribution = useMemo(() => distributionFromRatings(ratings), [ratings]);
  const topComment = useMemo(
    () => comments.slice().sort((a, b) => b.helpful - a.helpful)[0],
    [comments],
  );
  const trust = useMemo(() => trustLabel(ratings.length), [ratings.length]);

  const rateScope = ratingScope(targetType, targetId);
  const alreadyRated = hasRated(rateScope);

  const addRating = (
    scores: Record<string, number>,
    dimensions: RatingDimension[],
  ): FeedbackActionResult => {
    if (hasRated(rateScope)) {
      return { ok: false, message: 'Ваш голос уже учтён для этого материала' };
    }
    const validated = validateScores(scores, dimensions);
    if (!validated.ok) return validated;

    const cooldown = checkCooldown(rateScope);
    if (!cooldown.allowed) {
      return { ok: false, message: `Подождите ${Math.ceil(cooldown.remainingMs / 1000)} сек.` };
    }

    const entry: RatingEntry = {
      id: makeFeedbackId('rating'),
      targetType,
      targetId,
      scores: validated.scores,
      createdAt: new Date().toISOString(),
    };

    const stored = mutateFeedback((prev) => ({ ...prev, ratings: [...prev.ratings, entry] }));
    if (!stored) {
      return { ok: false, message: 'Не удалось сохранить: браузер блокирует локальное хранилище' };
    }
    rememberRated(rateScope);
    setCooldown(rateScope);
    void insertRatingRemote(entry);
    return {
      ok: true,
      message: isFeedbackShared ? 'Оценка сохранена и видна всем' : 'Оценка сохранена на этом устройстве',
    };
  };

  const addComment = (author: string, text: string, kind: CommentKind): FeedbackActionResult => {
    const scope = commentScope(targetType, targetId);
    const validated = validateCommentInput(author, text, kind);
    if (!validated.ok) return validated;

    const cooldown = checkCooldown(scope);
    if (!cooldown.allowed) {
      return { ok: false, message: `Подождите ${Math.ceil(cooldown.remainingMs / 1000)} сек.` };
    }

    const entry: CommentEntry = {
      id: makeFeedbackId('comment'),
      targetType,
      targetId,
      author: validated.author,
      text: validated.text,
      kind: validated.kind,
      helpful: 0,
      createdAt: new Date().toISOString(),
    };

    const stored = mutateFeedback((prev) => ({ ...prev, comments: [entry, ...prev.comments] }));
    if (!stored) {
      return { ok: false, message: 'Не удалось сохранить: браузер блокирует локальное хранилище' };
    }
    setCooldown(scope);
    void insertCommentRemote(entry);
    return {
      ok: true,
      message: isFeedbackShared ? 'Комментарий опубликован' : 'Комментарий сохранён на этом устройстве',
    };
  };

  const markHelpful = (commentId: string): FeedbackActionResult => {
    const scope = helpfulScope(targetType, targetId, commentId);
    if (!canMarkHelpful(scope)) {
      return { ok: false, message: 'Вы уже отметили этот комментарий' };
    }
    const exists = comments.some((c) => c.id === commentId);
    if (!exists) {
      return { ok: false, message: 'Комментарий не найден' };
    }

    let newHelpful = 0;
    const stored = mutateFeedback((prev) => ({
      ...prev,
      comments: prev.comments.map((comment) => {
        if (comment.id !== commentId) return comment;
        newHelpful = comment.helpful + 1;
        return { ...comment, helpful: newHelpful };
      }),
    }));
    if (!stored) {
      return { ok: false, message: 'Не удалось сохранить: браузер блокирует локальное хранилище' };
    }
    rememberHelpful(scope);
    void bumpHelpfulRemote(commentId, newHelpful);
    return { ok: true, message: 'Спасибо, мнение учтено' };
  };

  return {
    ratings,
    comments,
    summary,
    distribution,
    topComment,
    trust,
    alreadyRated,
    isShared: isFeedbackShared,
    addRating,
    addComment,
    markHelpful,
  };
}
