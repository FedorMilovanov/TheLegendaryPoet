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