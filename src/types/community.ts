export type FeedbackTargetType = 'poet' | 'poem' | 'track' | 'article';
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

/** Device-owned optimistic data only. Remote public corpora never enter this envelope. */
export interface FeedbackSnapshot {
  ratings: RatingEntry[];
  comments: CommentEntry[];
}

export type CommunitySyncPhase = 'local' | 'idle' | 'syncing' | 'online' | 'offline';

export interface CommunitySyncState {
  phase: CommunitySyncPhase;
  pendingCount: number;
  lastSyncedAt: string | null;
  message: string | null;
}

export interface CommunityAggregate {
  targetType: FeedbackTargetType;
  targetId: string;
  ratingCount: number;
  commentCount: number;
  overall: number;
  dimensions: Record<string, number>;
  distribution: Record<number, number>;
  deviation: number | null;
}

export interface CommentCursor {
  createdAt: string;
  id: string;
}

export interface CommunityCommentPage {
  comments: CommentEntry[];
  nextCursor: CommentCursor | null;
}
