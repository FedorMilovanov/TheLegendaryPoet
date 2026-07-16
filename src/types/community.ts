/**
 * Community feedback model.
 *
 * One rating/comment is always scoped to a (targetType, targetId) pair.
 * `essay` is a first-class target so long-form pieces never collide with
 * short articles that happen to share a numeric-looking id.
 */

export type FeedbackTargetType = 'poet' | 'poem' | 'track' | 'article' | 'essay';
export type CommentKind = 'literary' | 'history' | 'moral' | 'performance';

export interface RatingDimension {
  key: string;
  label: string;
  hint: string;
}

export interface RatingEntry {
  id: string;
  targetType: FeedbackTargetType;
  targetId: string;
  scores: Record<string, number>;
  createdAt: string;
}

export interface CommentEntry {
  id: string;
  targetType: FeedbackTargetType;
  targetId: string;
  author: string;
  text: string;
  kind: CommentKind;
  helpful: number;
  createdAt: string;
}

export interface FeedbackSnapshot {
  ratings: RatingEntry[];
  comments: CommentEntry[];
}

/** Result of any write action — kept uniform so forms/toasts can share handlers. */
export interface FeedbackActionResult {
  ok: boolean;
  message: string;
}

/** Editorial limits — single source for UI copy and store validation. */
export const FEEDBACK_LIMITS = {
  authorMax: 48,
  commentMin: 12,
  commentMax: 1200,
  scoreMin: 1,
  scoreMax: 5,
  listPageSize: 5,
  cooldownMs: 30_000,
} as const;
