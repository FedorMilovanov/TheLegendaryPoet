import {
  comparePlaybackClaims,
  isPlaybackCoordinationClaim,
  nextPlaybackClaimTimestamp,
  shouldYieldToRemotePlayback,
  type PlaybackCoordinationClaim,
} from '../src/components/music/audioCoordination';

const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

const claim = (instanceId: string, timestamp: number, trackId = 'track-a'): PlaybackCoordinationClaim => ({
  type: 'playing',
  instanceId,
  trackId,
  timestamp,
});

const aOld = claim('instance-a', 100);
const bNew = claim('instance-b', 101, 'track-b');
expect(comparePlaybackClaims(bNew, aOld) > 0, 'newer playback claim must win');
expect(comparePlaybackClaims(aOld, bNew) < 0, 'older playback claim must lose');

const aTie = claim('instance-a', 200);
const bTie = claim('instance-b', 200, 'track-b');
expect(comparePlaybackClaims(bTie, aTie) > 0, 'equal timestamps must use deterministic instance-id tie-break');
expect(comparePlaybackClaims(aTie, bTie) < 0, 'tie-break order must be symmetric');
expect(comparePlaybackClaims(aTie, { ...aTie }) === 0, 'identical claims must compare equal');

expect(shouldYieldToRemotePlayback(aOld, bNew, 'instance-a'), 'older local playback must yield to a newer remote claim');
expect(!shouldYieldToRemotePlayback(bNew, aOld, 'instance-b'), 'newer local playback must ignore a stale remote claim');
expect(shouldYieldToRemotePlayback(aTie, bTie, 'instance-a'), 'one side of an equal-timestamp race must yield by tie-break');
expect(!shouldYieldToRemotePlayback(bTie, aTie, 'instance-b'), 'the tie-break winner must remain playing');
expect(!shouldYieldToRemotePlayback(aOld, aOld, 'instance-a'), 'self claims must never pause local playback');
expect(shouldYieldToRemotePlayback(null, bNew, 'instance-a'), 'a playing tab without a local claim must yield conservatively to a valid peer claim');

// Model the exact simultaneous-start race: both tabs are locally playing before
// either peer message is delivered. A total order must leave exactly one winner.
const simultaneousA = claim('instance-a', 300, 'track-a');
const simultaneousB = claim('instance-b', 300, 'track-b');
const aPauses = shouldYieldToRemotePlayback(simultaneousA, simultaneousB, 'instance-a');
const bPauses = shouldYieldToRemotePlayback(simultaneousB, simultaneousA, 'instance-b');
expect(Number(aPauses) + Number(bPauses) === 1, 'simultaneous cross-tab starts must leave exactly one active player');

// A duplicate winning peer claim should not change the decision; the provider's
// paused guard makes the second transport delivery operationally idempotent.
expect(
  shouldYieldToRemotePlayback(simultaneousA, simultaneousB, 'instance-a') === aPauses,
  'duplicate winning claims must preserve the same arbitration decision',
);

expect(nextPlaybackClaimTimestamp(400, 400) === 401, 'a same-millisecond local replay must advance beyond already-seen peer time');
expect(nextPlaybackClaimTimestamp(400, 450) === 450, 'normal wall-clock progress must remain unchanged');
expect(nextPlaybackClaimTimestamp(Number.NaN, 25) === 25, 'invalid prior coordination time must not poison the local clock');

const peerBeforeResume = claim('instance-z', 500, 'track-z');
const resumedLocal = claim('instance-a', nextPlaybackClaimTimestamp(peerBeforeResume.timestamp, 500), 'track-a');
expect(
  !shouldYieldToRemotePlayback(resumedLocal, peerBeforeResume, 'instance-a'),
  'a delayed duplicate of an already-seen peer claim must not pause a later explicit local replay',
);

expect(isPlaybackCoordinationClaim(bNew), 'valid playback coordination claims must be accepted');
expect(!isPlaybackCoordinationClaim({ ...bNew, timestamp: Number.NaN }), 'non-finite timestamps must be rejected');
expect(!isPlaybackCoordinationClaim({ ...bNew, instanceId: '' }), 'empty instance ids must be rejected');
expect(!isPlaybackCoordinationClaim({ ...bNew, trackId: '' }), 'empty track ids must be rejected');

for (const failure of failures) console.error(`ERROR audio-coordination: ${failure}`);
console.log(`Audio coordination validation: ${failures.length} error(s); deterministic sequential, simultaneous, stale, duplicate, monotonic-clock, tie and self-claim semantics checked.`);
if (failures.length) process.exit(1);
