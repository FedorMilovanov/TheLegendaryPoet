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

export interface FeedbackSnapshot {
  ratings: RatingEntry[];
  comments: CommentEntry[];
}

export type RatingDistribution = Record<1 | 2 | 3 | 4 | 5, number>;

export interface CommunityAggregate {
  targetType: FeedbackTargetType;
  targetId: string;
  ratingCount: number;
  commentCount: number;
  overall: number;
  dimensions: Record<string, number>;
  distribution: RatingDistribution;
  deviation: number | null;
}

export interface CommentCursor {
  createdAt: string;
  id: string;
}

export type CommunityLoadPhase = 'local' | 'loading' | 'online' | 'offline';

export interface CommunityTargetSnapshot {
  aggregate: CommunityAggregate;
  comments: CommentEntry[];
  cursor: CommentCursor | null;
  hasMoreComments: boolean;
  phase: CommunityLoadPhase;
  message: string | null;
  source: 'local' | 'aggregate' | 'target-fallback';
  loadingMore: boolean;
}

export interface CommunityLeaderboardSnapshot {
  rows: CommunityAggregate[];
  phase: CommunityLoadPhase;
  message: string | null;
}

export type CommunitySyncPhase = 'local' | 'idle' | 'syncing' | 'online' | 'offline';

export interface CommunitySyncState {
  phase: CommunitySyncPhase;
  pendingCount: number;
  lastSyncedAt: string | null;
  message: string | null;
}
