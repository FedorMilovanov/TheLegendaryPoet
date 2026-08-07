export interface PlaybackCoordinationClaim {
  type: 'playing';
  instanceId: string;
  trackId: string;
  timestamp: number;
  /**
   * Decimal Lamport sequence for claims that share the same wall-clock
   * timestamp. Omitted sequence means zero so claims emitted by the #358
   * protocol remain compatible during deployment overlap.
   */
  sequence?: string;
}

export interface PlaybackCoordinationClock {
  timestamp: number;
  sequence: bigint;
}

const canonicalSequencePattern = /^(?:0|[1-9]\d*)$/;

function isPlaybackTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isPlaybackSequence(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === 'string' && canonicalSequencePattern.test(value));
}

export function playbackClaimSequence(claim: PlaybackCoordinationClaim): bigint {
  return claim.sequence === undefined ? 0n : BigInt(claim.sequence);
}

export function isPlaybackCoordinationClaim(value: unknown): value is PlaybackCoordinationClaim {
  if (!value || typeof value !== 'object') return false;
  const claim = value as Partial<PlaybackCoordinationClaim>;
  return claim.type === 'playing'
    && typeof claim.instanceId === 'string'
    && claim.instanceId.length > 0
    && typeof claim.trackId === 'string'
    && claim.trackId.length > 0
    && isPlaybackTimestamp(claim.timestamp)
    && isPlaybackSequence(claim.sequence);
}

/**
 * Fold an accepted peer claim into the local logical clock. The wall-clock
 * component remains a normal safe integer; an arbitrary-precision decimal
 * sequence owns Lamport advancement when timestamps are equal.
 */
export function observePlaybackCoordinationClaim(
  current: PlaybackCoordinationClock,
  claim: PlaybackCoordinationClaim,
): PlaybackCoordinationClock {
  const remoteSequence = playbackClaimSequence(claim);
  if (claim.timestamp > current.timestamp) {
    return { timestamp: claim.timestamp, sequence: remoteSequence };
  }
  if (claim.timestamp < current.timestamp || remoteSequence <= current.sequence) return current;
  return { timestamp: current.timestamp, sequence: remoteSequence };
}

/**
 * Produce the next local logical clock without incrementing the IEEE-754 wall
 * timestamp. A later wall-clock millisecond resets the sequence to zero;
 * otherwise the arbitrary-precision sequence advances by one.
 */
export function nextPlaybackCoordinationClock(
  current: PlaybackCoordinationClock,
  now: number,
): PlaybackCoordinationClock {
  const safeNow = isPlaybackTimestamp(now) ? now : 0;
  if (safeNow > current.timestamp) return { timestamp: safeNow, sequence: 0n };
  return { timestamp: current.timestamp, sequence: current.sequence + 1n };
}

/**
 * Returns a positive number when `left` wins over `right`, a negative number
 * when it loses, and zero only for the same logical claim.
 *
 * Wall-clock timestamp establishes ordinary recency. The explicit Lamport
 * sequence establishes recency when a later local action must advance beyond
 * an already-seen equal/future timestamp without relying on unsafe `number +
 * 1` arithmetic. instanceId resolves genuinely simultaneous equal-clock
 * starts, and trackId is only a final identity tie-break.
 */
export function comparePlaybackClaims(
  left: PlaybackCoordinationClaim,
  right: PlaybackCoordinationClaim,
): number {
  if (left.timestamp !== right.timestamp) return left.timestamp > right.timestamp ? 1 : -1;
  const leftSequence = playbackClaimSequence(left);
  const rightSequence = playbackClaimSequence(right);
  if (leftSequence !== rightSequence) return leftSequence > rightSequence ? 1 : -1;
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
