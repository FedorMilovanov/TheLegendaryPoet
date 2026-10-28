// Shared timeout-margin authority for conditional exact-head certification lanes.
//
// One lane is certified when a canonical workflow finishes on the exact head and
// an observing waiter job polls that workflow to a terminal success. Three
// numbers must therefore stay ordered, or a slow-but-passing canonical run is
// reported as a certification failure:
//
//   canonical job timeout  <<  waiter poll timeout  <<  waiter job timeout
//
// docs/merge-certification.json is the SSOT for all three; this module is the
// single place that checks their relationship and is used both by the
// repository validator and by its regression test.

export const QUEUE_SLACK_SECONDS = 600; // canonical queue + startup before the waiter begins polling
export const POLL_HEADROOM_SECONDS = 3600; // bounded upper headroom above the canonical timeout
export const WAITER_SLACK_SECONDS = 300; // waiter checkout + startup before polling begins
export const WAITER_HEADROOM_SECONDS = 1800; // bounded upper headroom above the poll timeout

function jobTimeoutMinutes(yamlText, jobName) {
  const lines = (yamlText ?? '').split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^  ${jobName}:\\s*$`).test(line));
  if (start < 0) return null;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^  [A-Za-z0-9_-]+:\s*$/.test(lines[index])) break;
    const match = /^\s+timeout-minutes:\s*(\d+)\s*$/.exec(lines[index]);
    if (match) return Number(match[1]);
  }
  return null;
}

export function laneTimeoutFailures(lane, canonicalWorkflowText, waiterWorkflowText) {
  const failures = [];
  const canonicalMinutes = Number(lane?.canonicalJobTimeoutMinutes);
  const waiterMinutes = Number(lane?.waiterJobTimeoutMinutes);
  const pollSeconds = Number(lane?.pollTimeoutSeconds);
  const laneId = lane?.workflowFile ?? 'lane';

  if (!Number.isFinite(canonicalMinutes) || canonicalMinutes <= 0) {
    failures.push(`${laneId} canonicalJobTimeoutMinutes must be a positive number`);
  }
  if (!Number.isFinite(waiterMinutes) || waiterMinutes <= 0) {
    failures.push(`${laneId} waiterJobTimeoutMinutes must be a positive number`);
  }
  if (!Number.isFinite(pollSeconds) || pollSeconds <= 0) {
    failures.push(`${laneId} pollTimeoutSeconds must be a positive number`);
  }
  if (failures.length) return failures;

  const actualCanonical = jobTimeoutMinutes(canonicalWorkflowText, lane.canonicalJob);
  if (actualCanonical !== canonicalMinutes) {
    failures.push(`${laneId} canonical job ${lane.canonicalJob} timeout drifted: workflow=${actualCanonical} contract=${canonicalMinutes}`);
  }

  const actualWaiter = jobTimeoutMinutes(waiterWorkflowText, lane.waiterJob);
  if (actualWaiter !== waiterMinutes) {
    failures.push(`${laneId} waiter job ${lane.waiterJob} timeout drifted: workflow=${actualWaiter} contract=${waiterMinutes}`);
  }

  const canonicalSeconds = canonicalMinutes * 60;
  const waiterSeconds = waiterMinutes * 60;

  if (pollSeconds < canonicalSeconds + QUEUE_SLACK_SECONDS) {
    failures.push(`${laneId} poll timeout ${pollSeconds}s cannot cover the canonical job timeout ${canonicalMinutes}m plus ${QUEUE_SLACK_SECONDS}s queue headroom`);
  }
  if (pollSeconds > canonicalSeconds + POLL_HEADROOM_SECONDS) {
    failures.push(`${laneId} poll timeout ${pollSeconds}s exceeds bounded headroom above the canonical job timeout ${canonicalMinutes}m`);
  }
  if (waiterSeconds < pollSeconds + WAITER_SLACK_SECONDS) {
    failures.push(`${laneId} waiter job timeout ${waiterMinutes}m cannot cover its ${pollSeconds}s poll window plus ${WAITER_SLACK_SECONDS}s startup`);
  }
  if (waiterSeconds > pollSeconds + WAITER_HEADROOM_SECONDS) {
    failures.push(`${laneId} waiter job timeout ${waiterMinutes}m exceeds bounded headroom above its ${pollSeconds}s poll window`);
  }

  return failures;
}
