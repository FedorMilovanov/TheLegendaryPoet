import type {
  CommentEntry,
  CommunityAggregate,
  FeedbackTargetType,
  RatingDistribution,
  RatingEntry,
} from '../types/community';
import type { PendingTargetFeedback } from './communityStore';

export function emptyCommunityAggregate(
  targetType: FeedbackTargetType,
  targetId: string,
): CommunityAggregate {
  return {
    targetType,
    targetId,
    ratingCount: 0,
    commentCount: 0,
    overall: 0,
    dimensions: {},
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    deviation: null,
  };
}

export function ratingAverage(scores: Record<string, number>) {
  const values = Object.values(scores).filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function distributionBucket(scores: Record<string, number>) {
  return Math.max(1, Math.min(5, Math.round(ratingAverage(scores)))) as 1 | 2 | 3 | 4 | 5;
}

export function aggregateCommunityRatings(
  targetType: FeedbackTargetType,
  targetId: string,
  ratings: RatingEntry[],
  commentCount: number,
): CommunityAggregate {
  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};
  const overallValues: number[] = [];
  const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const rating of ratings) {
    const average = ratingAverage(rating.scores);
    if (average > 0) {
      overallValues.push(average);
      distribution[distributionBucket(rating.scores)] += 1;
    }
    for (const [key, value] of Object.entries(rating.scores)) {
      if (!Number.isFinite(value) || value < 1 || value > 5) continue;
      totals[key] = (totals[key] ?? 0) + value;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  const dimensions = Object.fromEntries(
    Object.keys(totals).map((key) => [key, totals[key] / counts[key]]),
  );
  const dimensionValues = Object.values(dimensions);
  const overall = dimensionValues.length
    ? dimensionValues.reduce((sum, value) => sum + value, 0) / dimensionValues.length
    : 0;
  const mean = overallValues.length
    ? overallValues.reduce((sum, value) => sum + value, 0) / overallValues.length
    : 0;
  const deviation = overallValues.length > 1
    ? Math.sqrt(overallValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / overallValues.length)
    : null;

  return {
    targetType,
    targetId,
    ratingCount: ratings.length,
    commentCount,
    overall,
    dimensions,
    distribution,
    deviation,
  };
}

export function overlayPendingAggregate(
  base: CommunityAggregate,
  pending: PendingTargetFeedback,
): CommunityAggregate {
  let ratingCount = base.ratingCount;
  const sums = Object.fromEntries(
    Object.entries(base.dimensions).map(([key, value]) => [key, value * ratingCount]),
  ) as Record<string, number>;
  const distribution: RatingDistribution = { ...base.distribution };

  for (const operation of pending.ratings) {
    if (operation.previousScores) {
      for (const [key, value] of Object.entries(operation.previousScores)) {
        sums[key] = (sums[key] ?? 0) - value;
      }
      const previousBucket = distributionBucket(operation.previousScores);
      distribution[previousBucket] = Math.max(0, distribution[previousBucket] - 1);
    } else {
      ratingCount += 1;
    }

    for (const [key, value] of Object.entries(operation.entry.scores)) {
      sums[key] = (sums[key] ?? 0) + value;
    }
    distribution[distributionBucket(operation.entry.scores)] += 1;
  }

  const dimensions = ratingCount > 0
    ? Object.fromEntries(Object.entries(sums).map(([key, value]) => [key, value / ratingCount]))
    : {};
  const values = Object.values(dimensions);
  const overall = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  return {
    ...base,
    ratingCount,
    commentCount: base.commentCount + pending.comments.length,
    overall,
    dimensions,
    distribution,
    deviation: pending.ratings.length ? null : base.deviation,
  };
}

export function mergeTargetComments(
  remote: CommentEntry[],
  pending: PendingTargetFeedback,
) {
  const byId = new Map(remote.map((comment) => [comment.id, comment]));
  for (const comment of pending.comments) byId.set(comment.id, comment);

  const localById = new Map(pending.localComments.map((comment) => [comment.id, comment]));
  for (const commentId of pending.helpfulCommentIds) {
    const current = byId.get(commentId);
    if (!current) continue;
    const local = localById.get(commentId);
    byId.set(commentId, {
      ...current,
      helpful: Math.max(current.helpful + 1, local?.helpful ?? 0),
    });
  }

  return [...byId.values()].sort((left, right) =>
    Date.parse(right.createdAt) - Date.parse(left.createdAt) || right.id.localeCompare(left.id));
}
