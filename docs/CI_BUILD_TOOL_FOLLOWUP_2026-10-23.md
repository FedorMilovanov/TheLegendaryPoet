# Bounded build-tool follow-up — 2026-10-23

## Authority and confirmed baseline

Owner authorized a separate CI follow-up after merged #518. Clean source baseline:
`23156bf9dd333586aa8a423ca0744012b69df0f7`. Contracts, npm check and production
build PASS before edits. Main analytics job120555637134 spent1705s installing
FFmpeg, then exhausted its unchanged30m limit during browser installation.
APT succeeded; its cached candidate was `7:6.1.1-3ubuntu5`. An inactivity timeout
is not a total transfer/install deadline. Exact mirror, throughput or lock cause
is unproven: both run-log and direct job-log delivery return EOF here.

## Single owner, migration and rollback

The existing `.github/actions/install-build-tools` remains the sole owner.
All existing callers inherit the change; no routes, application dependencies,
Playwright setup, acceptance commands, thresholds or job limits change.
Rollback is limited to this action and its corresponding setup tests.

- Share only `.deb` archives via immutable-SHA-pinned cache restore/save actions.
  Key includes image identity, architecture and missing package candidates. No
  prefix restores; unknown image identities disable sharing. This is not a
  package/dependency version lock. GitHub's normal cache ref scopes still apply;
  a PR cache must not be assumed available to main.
- APT still selects/installs packages on cache hits; dpkg and runnable FFmpeg
  verification remain mandatory. Installed binaries, dpkg state, APT indexes and
  package trust policy are not cached or bypassed. Preserve `_apt` partial-dir
  ownership. Save archives only after setup succeeds, before later test steps.
- Bound each APT invocation to600s, with10s kill grace, retaining failure status.
  This is a stricter setup-phase limit, not increased job time or a green result
  on timeout. Cache segment downloads are bounded to2m. Cold cache misses may
  still fail; no retry-until-green or universally-fast-install claim is made.
- Expose transfer summaries plus final output for slow successes/failures through
  sanitized annotations, preserving workflow-command escaping and URL redaction.

## Verification

Actual baseline installer against the added behavioral tests:4 FAIL; candidate:
14/14 PASS. Includes a real stalled subprocess terminated through GNU timeout,
cache-key separation, archive-hit verification and failed-download propagation.
Full Node42/42, Prorok4/4, npm check/build/contracts PASS; diff whitespace clean.
Native exact-head cold/warm cache behavior, latency and full CI remain pending.
No merge is authorized by a local pass. Source #519 media recovery and the
separately discovered npm audit findings remain out of scope and unresolved.
