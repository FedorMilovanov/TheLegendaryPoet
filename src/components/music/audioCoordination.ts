export interface PlaybackCoordinationClaim {
  type: 'playing';
  instanceId: string;
  trackId: string;
  timestamp: number;
}

export function isPlaybackCoordinationClaim(value: unknown): value is PlaybackCoordinationClaim {
  if (!value || typeof value !== 'object') return false;
  const claim = value as Partial<PlaybackCoordinationClaim>;
  return claim.type === 'playing'
    && typeof claim.instanceId === 'string'
    && claim.instanceId.length > 0
    && typeof claim.trackId === 'string'
    && claim.trackId.length > 0
    && Number.isFinite(claim.timestamp);
}

/**
 * Advance the per-tab coordination clock without waiting. Once a tab has seen
 * a peer claim, its next explicit local play must outrank that already-seen
 * claim even when both actions fall inside the same wall-clock millisecond.
 */
export function nextPlaybackClaimTimestamp(lastSeen: number, now: number): number {
  const safeLastSeen = Number.isFinite(lastSeen) ? lastSeen : 0;
  const safeNow = Number.isFinite(now) ? now : 0;
  return Math.max(safeNow, safeLastSeen + 1);
}

/**
 * Returns a positive number when `left` wins over `right`, a negative number
 * when it loses, and zero only for the same logical claim.
 *
 * The monotonic timestamp establishes recency; instanceId gives genuinely
 * simultaneous equal-timestamp starts a deterministic total order. trackId is
 * only a final identity tie-break for malformed/duplicated logical identities.
 */
export function comparePlaybackClaims(
  left: PlaybackCoordinationClaim,
  right: PlaybackCoordinationClaim,
): number {
  if (left.timestamp !== right.timestamp) return left.timestamp > right.timestamp ? 1 : -1;
  if (left.instanceId !== right.instanceId) return left.instanceId > right.instanceId ? 1 : -1;
  if (left.trackId !== right.trackId) return left.trackId > right.trackId ? 1 : -1;
  return 0;
}

export function shouldYieldToRemotePlayback(
  localClaim: PlaybackCoordinationClaim | null,
  remoteClaim: PlaybackCoordinationClaim,
  localInstanceId: string,
): boolean {
  if (remoteClaim.instanceId === localInstanceId) return false;
  if (!localClaim) return true;
  return comparePlaybackClaims(remoteClaim, localClaim) > 0;
}
