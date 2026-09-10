export const READER_RANKING_MIN_VOTES = 3;
export const RATING_SCALE_MIN = 1;
export const RATING_SCALE_MAX = 5;
export const RATING_SAMPLE_CONFIDENCE = 0.8;

const RATING_SCALE_RANGE = RATING_SCALE_MAX - RATING_SCALE_MIN;
const RATING_SAMPLE_TAIL = 1 - RATING_SAMPLE_CONFIDENCE;

/**
 * Conservative sample-size adjustment for bounded 1–5 ratings.
 *
 * The penalty is the one-sided Hoeffding radius for the chosen confidence
 * level. It depends only on the public rating scale and vote count, not on a
 * mutable site-wide mean or editorial score. It is deliberately presented to
 * readers as a conservative sample adjustment, not as a claim that voters are
 * a representative random sample.
 */
export function ratingSamplePenalty(votes: number) {
  if (!Number.isFinite(votes) || votes <= 0) return Number.POSITIVE_INFINITY;
  return RATING_SCALE_RANGE * Math.sqrt(Math.log(1 / RATING_SAMPLE_TAIL) / (2 * votes));
}

export function hasQualifiedRatingSample(votes: number) {
  return Number.isInteger(votes) && votes >= READER_RANKING_MIN_VOTES;
}

export function sampleAwareRatingIndex(mean: number | null | undefined, votes: number): number | null {
  if (typeof mean !== 'number' || !Number.isFinite(mean) || !hasQualifiedRatingSample(votes)) return null;

  const boundedMean = Math.min(RATING_SCALE_MAX, Math.max(RATING_SCALE_MIN, mean));
  return Math.min(
    RATING_SCALE_MAX,
    Math.max(RATING_SCALE_MIN, boundedMean - ratingSamplePenalty(votes)),
  );
}
