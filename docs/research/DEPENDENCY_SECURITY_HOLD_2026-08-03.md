# Dependency security HOLD — 3 August 2026

**Lane:** `editorial/longform-marathon-2026-08` / PR #271  
**Status:** `REVIEWED WARNING / LOCK REFRESH NOT CLAIMED / NO SILENT FORCE UPDATE`

## Observed state

The exact-head GitHub Actions `npm ci` output reports:

```yaml
reported_total_vulnerabilities: 5
reported_low: 1
reported_high: 4
reported_moderate: 0
reported_critical: 0
```

Current direct build/runtime versions recorded in the committed dependency files include:

```yaml
vite: 7.2.4
@vitejs/plugin-react: 5.1.1
react-router-dom: ^7.14.2
node_ci_runtime: 24
```

## Closure boundary

The warning is not suppressed and the repository is not described as vulnerability-free. A green content/build/browser run proves the tested application state, but does not erase package advisories.

A safe dependency change requires all of the following on the same generated lock:

```text
npm registry resolution
npm-generated package.json/package-lock.json
npm ci
npm audit review
content and type checks
production build and SEO checks
cross-browser QA
```

The connected execution environment available during this closure pass could not complete a trustworthy npm lock regeneration. Temporary workflow experiments intended to generate reviewable lock artifacts were removed after GitHub did not accept them as usable branch/PR workflows. No hand-written integrity hashes, silent major-version migration or `npm audit fix --force` was committed.

## Decision

```yaml
security_warning_status: HOLD
package_lock_refreshed: false
advisories_suppressed: false
force_update_applied: false
production_exploitability_claimed: false
merge_permission_granted_by_this_review: false
```

Dependency remediation remains a bounded technical follow-up. It must not be confused with the source, rights, medical-document, forensic, visual-binary or owner-send gates that independently keep the editorial marathon in draft.
