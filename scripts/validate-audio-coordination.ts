import {
  comparePlaybackClaims,
  isPlaybackCoordinationClaim,
  nextPlaybackCoordinationClock,
  observePlaybackCoordinationClaim,
  playbackClaimSequence,
  shouldYieldToRemotePlayback,
  type PlaybackCoordinationClaim,
  type PlaybackCoordinationClock,
} from '../src/components/music/audioCoordination';

const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

const claim = (
  instanceId: string,
  timestamp: number,
  trackId = 'track-a',
  sequence?: string,
): PlaybackCoordinationClaim => ({
  type: 'playing',
  instanceId,
  trackId,
  timestamp,
  ...(sequence === undefined ? {} : { sequence }),
});

const clock = (timestamp: number, sequence = 0n): PlaybackCoordinationClock => ({ timestamp, sequence });

const aOld = claim('instance-a', 100);
const bNew = claim('instance-b', 101, 'track-b');
expect(comparePlaybackClaims(bNew, aOld) > 0, 'newer playback claim must win');
expect(comparePlaybackClaims(aOld, bNew) < 0, 'older playback claim must lose');

const aTie = claim('instance-a', 200);
const bTie = claim('instance-b', 200, 'track-b');
expect(comparePlaybackClaims(bTie, aTie) > 0, 'equal clocks must use deterministic instance-id tie-break');
expect(comparePlaybackClaims(aTie, bTie) < 0, 'tie-break order must be symmetric');
expect(comparePlaybackClaims(aTie, { ...aTie }) === 0, 'identical claims must compare equal');
expect(playbackClaimSequence(aTie) === 0n, 'legacy sequence-less claims must normalize to logical sequence zero');

const sequencedWinner = claim('instance-a', 200, 'track-a', '1');
expect(
  comparePlaybackClaims(sequencedWinner, bTie) > 0,
  'logical sequence must outrank instance-id ordering at the same wall timestamp',
);

expect(shouldYieldToRemotePlayback(aOld, bNew, 'instance-a'), 'older local playback must yield to a newer remote claim');
expect(!shouldYieldToRemotePlayback(bNew, aOld, 'instance-b'), 'newer local playback must ignore a stale remote claim');
expect(shouldYieldToRemotePlayback(aTie, bTie, 'instance-a'), 'one side of an equal-clock race must yield by tie-break');
expect(!shouldYieldToRemotePlayback(bTie, aTie, 'instance-b'), 'the tie-break winner must remain playing');
expect(!shouldYieldToRemotePlayback(aOld, aOld, 'instance-a'), 'self claims must never pause local playback');
expect(shouldYieldToRemotePlayback(null, bNew, 'instance-a'), 'a playing tab without a local claim must yield conservatively to a valid peer claim');

// Model the exact simultaneous-start race: both tabs are locally playing before
// either peer message is delivered. An equal wall timestamp + sequence still
// needs the stable instance-id tie-break to leave exactly one winner.
const simultaneousA = claim('instance-a', 300, 'track-a', '0');
const simultaneousB = claim('instance-b', 300, 'track-b', '0');
const aPauses = shouldYieldToRemotePlayback(simultaneousA, simultaneousB, 'instance-a');
const bPauses = shouldYieldToRemotePlayback(simultaneousB, simultaneousA, 'instance-b');
expect(Number(aPauses) + Number(bPauses) === 1, 'simultaneous cross-tab starts must leave exactly one active player');
expect(
  shouldYieldToRemotePlayback(simultaneousA, simultaneousB, 'instance-a') === aPauses,
  'duplicate winning claims must preserve the same arbitration decision',
);

const sameMillisecond = nextPlaybackCoordinationClock(clock(400), 400);
expect(
  sameMillisecond.timestamp === 400 && sameMillisecond.sequence === 1n,
  'same-millisecond local replay must advance the logical sequence without mutating wall time',
);
const laterWallClock = nextPlaybackCoordinationClock(clock(400, 17n), 450);
expect(
  laterWallClock.timestamp === 450 && laterWallClock.sequence === 0n,
  'later safe wall time must establish a fresh clock and reset its logical sequence',
);
const invalidWallClock = nextPlaybackCoordinationClock(clock(400, 17n), Number.NaN);
expect(
  invalidWallClock.timestamp === 400 && invalidWallClock.sequence === 18n,
  'invalid wall time must not poison or roll back an existing logical clock',
);

const peerBeforeResume = claim('instance-z', 500, 'track-z');
const observedPeer = observePlaybackCoordinationClaim(clock(0), peerBeforeResume);
const resumedClock = nextPlaybackCoordinationClock(observedPeer, 500);
const resumedLocal = claim('instance-a', resumedClock.timestamp, 'track-a', resumedClock.sequence.toString());
expect(
  comparePlaybackClaims(resumedLocal, peerBeforeResume) > 0,
  'a later explicit local replay must outrank an already-seen peer even when its instance id sorts lower',
);
expect(
  !shouldYieldToRemotePlayback(resumedLocal, peerBeforeResume, 'instance-a'),
  'a delayed duplicate of an already-seen peer claim must not pause a later explicit local replay',
);

// Precision boundary: MAX_SAFE_INTEGER is a valid integer wall timestamp, but
// it must never be incremented as a Number. The explicit sequence carries
// Lamport progress while the wall timestamp remains unchanged.
const maxSafePeer = claim('instance-z', Number.MAX_SAFE_INTEGER, 'track-z');
expect(isPlaybackCoordinationClaim(maxSafePeer), 'MAX_SAFE_INTEGER legacy claims must remain interpretable');
const maxObserved = observePlaybackCoordinationClaim(clock(0), maxSafePeer);
const maxReplayClock = nextPlaybackCoordinationClock(maxObserved, Date.now());
const maxReplay = claim('instance-a', maxReplayClock.timestamp, 'track-a', maxReplayClock.sequence.toString());
expect(
  maxReplayClock.timestamp === Number.MAX_SAFE_INTEGER && maxReplayClock.sequence === 1n,
  'MAX_SAFE_INTEGER replay must advance sequence instead of overflowing numeric wall time',
);
expect(
  comparePlaybackClaims(maxReplay, maxSafePeer) > 0,
  'later replay at MAX_SAFE_INTEGER must beat the already-seen peer before instance-id tie-break',
);

const hugeSequencePeer = claim(
  'instance-z',
  Number.MAX_SAFE_INTEGER,
  'track-z',
  '9999999999999999999999999999999999999999',
);
expect(isPlaybackCoordinationClaim(hugeSequencePeer), 'canonical arbitrary-precision logical sequences must be accepted');
const hugeObserved = observePlaybackCoordinationClaim(clock(0), hugeSequencePeer);
const hugeReplayClock = nextPlaybackCoordinationClock(hugeObserved, Date.now());
expect(
  hugeReplayClock.sequence === 10000000000000000000000000000000000000000n,
  'logical sequence must advance beyond Number precision without saturation',
);

expect(isPlaybackCoordinationClaim(bNew), 'valid legacy playback coordination claims must be accepted');
expect(isPlaybackCoordinationClaim({ ...bNew, sequence: '0' }), 'canonical sequenced claims must be accepted');
expect(!isPlaybackCoordinationClaim({ ...bNew, timestamp: Number.NaN }), 'non-finite timestamps must be rejected');
expect(!isPlaybackCoordinationClaim({ ...bNew, timestamp: 2 ** 53 }), 'unsafe finite timestamps must be rejected');
expect(!isPlaybackCoordinationClaim({ ...bNew, timestamp: 1.5 }), 'fractional timestamps must be rejected');
expect(!isPlaybackCoordinationClaim({ ...bNew, timestamp: -1 }), 'negative timestamps must be rejected');
expect(!isPlaybackCoordinationClaim({ ...bNew, sequence: '' }), 'empty logical sequences must be rejected');
expect(!isPlaybackCoordinationClaim({ ...bNew, sequence: '01' }), 'non-canonical logical sequences must be rejected');
expect(!isPlaybackCoordinationClaim({ ...bNew, sequence: '-1' }), 'negative logical sequences must be rejected');
expect(!isPlaybackCoordinationClaim({ ...bNew, sequence: 1 }), 'numeric logical sequences must be rejected');
expect(!isPlaybackCoordinationClaim({ ...bNew, instanceId: '' }), 'empty instance ids must be rejected');
expect(!isPlaybackCoordinationClaim({ ...bNew, trackId: '' }), 'empty track ids must be rejected');

for (const failure of failures) console.error(`ERROR audio-coordination: ${failure}`);
console.log(`Audio coordination validation: ${failures.length} error(s); deterministic sequential, simultaneous, stale, duplicate, precision-boundary, arbitrary-sequence, tie and self-claim semantics checked.`);
if (failures.length) process.exit(1);
