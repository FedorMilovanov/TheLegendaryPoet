import type { FeedbackTargetType } from '../types/community';

export const ratingDimensionKeysByTarget = {
  poet: ['language', 'depth', 'legacy', 'truth'],
  poem: ['beauty', 'form', 'impact'],
  track: ['voice', 'music', 'text'],
  article: ['clarity', 'depth', 'fairness'],
} as const satisfies Record<FeedbackTargetType, readonly string[]>;

export function hasCanonicalRatingScores(
  targetType: FeedbackTargetType,
  value: Record<string, number>,
) {
  const expected = ratingDimensionKeysByTarget[targetType];
  const keys = Object.keys(value);
  return keys.length === expected.length
    && expected.every((key) => Number.isInteger(value[key]) && value[key] >= 1 && value[key] <= 5);
}
