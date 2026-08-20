import type { CommentKind } from '../types/community';

export const COMMUNITY_COMMENT_MIN_LENGTH = 8;
export const COMMUNITY_COMMENT_MAX_LENGTH = 2000;
export const COMMUNITY_AUTHOR_MAX_LENGTH = 60;
export const COMMUNITY_COMMENT_COOLDOWN_MS = 20_000;

export const communityCommentKinds = [
  'literary',
  'history',
  'moral',
  'performance',
] as const satisfies readonly CommentKind[];

export function isCommunityCommentKind(value: unknown): value is CommentKind {
  return typeof value === 'string'
    && communityCommentKinds.some((kind) => kind === value);
}
