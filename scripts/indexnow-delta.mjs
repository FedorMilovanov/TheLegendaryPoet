function assertManifest(manifest, label) {
  if (!manifest || manifest.schemaVersion !== 1 || typeof manifest.site !== 'string' || !Array.isArray(manifest.canonicalUrls)) {
    throw new Error(`IndexNow: invalid ${label} discovery manifest`);
  }

  const seen = new Set();
  for (const record of manifest.canonicalUrls) {
    if (!record || typeof record.url !== 'string' || record.state !== 'ready' || !/^[a-f0-9]{64}$/.test(record.fingerprint || '')) {
      throw new Error(`IndexNow: invalid ${label} canonical URL record`);
    }
    const url = new URL(record.url);
    if (url.origin !== manifest.site) throw new Error(`IndexNow: ${label} URL outside manifest site: ${record.url}`);
    if (seen.has(record.url)) throw new Error(`IndexNow: duplicate ${label} URL: ${record.url}`);
    seen.add(record.url);
  }
}

export function computeIndexNowDelta(currentManifest, previousManifest = null, options = {}) {
  assertManifest(currentManifest, 'current');

  const forceFull = options.forceFull === true;
  if (forceFull || previousManifest === null) {
    return {
      mode: forceFull ? 'forced-full' : 'bootstrap',
      urls: currentManifest.canonicalUrls.map((record) => record.url).sort(),
      added: currentManifest.canonicalUrls.map((record) => record.url).sort(),
      changed: [],
      deleted: [],
    };
  }

  assertManifest(previousManifest, 'previous');
  if (previousManifest.site !== currentManifest.site) {
    throw new Error(`IndexNow: manifest site changed from ${previousManifest.site} to ${currentManifest.site}; use explicit INDEXNOW_FORCE_FULL=1 for a site-wide migration`);
  }

  const current = new Map(currentManifest.canonicalUrls.map((record) => [record.url, record.fingerprint]));
  const previous = new Map(previousManifest.canonicalUrls.map((record) => [record.url, record.fingerprint]));
  const added = [];
  const changed = [];
  const deleted = [];

  for (const [url, fingerprint] of current) {
    if (!previous.has(url)) added.push(url);
    else if (previous.get(url) !== fingerprint) changed.push(url);
  }
  for (const url of previous.keys()) {
    if (!current.has(url)) deleted.push(url);
  }

  const urls = [...new Set([...added, ...changed, ...deleted])].sort();
  return {
    mode: 'delta',
    urls,
    added: added.sort(),
    changed: changed.sort(),
    deleted: deleted.sort(),
  };
}

// The trigger SHA is not necessarily the source SHA of a manually dispatched
// Pages build. Compare the regenerated discovery snapshot with the live one
// before announcing either a delta or a no-op.
function stableSnapshot(value) {
  if (Array.isArray(value)) return value.map(stableSnapshot);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableSnapshot(value[key])]));
  }
  return value;
}

export async function assertLiveDiscoverySnapshot(currentManifest, site, { fetchImpl = globalThis.fetch, nonce = '' } = {}) {
  assertManifest(currentManifest, 'current');
  if (currentManifest.site !== site) throw new Error('IndexNow: current snapshot site mismatch');
  const response = await fetchImpl(
    `${site}/discovery-manifest.json?indexnow_verify=${encodeURIComponent(nonce)}`,
    {
      cache: 'no-store',
      redirect: 'error',
      headers: { 'cache-control': 'no-cache', 'user-agent': 'TLP-IndexNow/1.0' },
      signal: globalThis.AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) throw new Error(`IndexNow: live discovery snapshot returned HTTP ${response.status}`);
  const liveManifest = await response.json();
  assertManifest(liveManifest, 'live');
  if (JSON.stringify(stableSnapshot(liveManifest)) !== JSON.stringify(stableSnapshot(currentManifest))) {
    throw new Error('IndexNow: live discovery snapshot does not match the candidate; no notification sent');
  }
}

// A workflow success without a completed submit job is not a notification.
// Store an exact checkpoint for every successful submission or verified no-op.
export function priorNotificationRuns(runs, currentRunNumber) {
  if (!Number.isSafeInteger(currentRunNumber) || currentRunNumber < 1 || !Array.isArray(runs)) {
    throw new Error('IndexNow: invalid notification history');
  }
  return runs.filter(run => run.event === 'workflow_run' && run.head_branch === 'main'
    && run.conclusion === 'success' && Number.isSafeInteger(run.run_number)
    && run.run_number < currentRunNumber)
    .sort((a, b) => b.run_number - a.run_number);
}

export async function resolveNotificationCheckpoint({ listRuns, listJobs, listArtifacts, currentRunNumber, seed }) {
  if (currentRunNumber <= seed.runNumber) throw new Error('IndexNow: workflow predates checkpoint cutover');
  // Bounded history lookup. A skipped trigger is not a successful submission.
  for (let page = 1; page <= 10; page++) {
    const runs = await listRuns(page);
    if (!Array.isArray(runs)) throw new Error('IndexNow: invalid workflow history response');
    if (runs.some(run => run.event === 'workflow_run' && run.head_branch === 'main'
      && run.conclusion === 'success' && run.run_number > currentRunNumber)) {
      throw new Error('IndexNow: newer notification run already completed; refusing stale rerun');
    }
    for (const run of priorNotificationRuns(runs, currentRunNumber)) {
      if (run.run_number <= seed.runNumber) {
        if (run.run_number !== seed.runNumber || run.id !== seed.runId || run.head_sha !== seed.sourceSha) {
          throw new Error('IndexNow: audited cutover run is missing or does not match');
        }
        return { kind: 'seed', ...seed };
      }
      const jobs = await listJobs(run);
      if (!Array.isArray(jobs)) throw new Error('IndexNow: invalid workflow job history');
      if (!jobs.some(job => job.name === 'submit' && job.conclusion === 'success')) continue;
      const artifacts = await listArtifacts(run);
      if (!Array.isArray(artifacts)) throw new Error('IndexNow: invalid checkpoint artifacts');
      const matches = artifacts.filter(artifact => artifact.name === `indexnow-discovery-${run.run_attempt}`);
      if (matches.length !== 1 || matches[0].expired) {
        throw new Error('IndexNow: prior successful notification checkpoint unavailable; recover explicitly');
      }
      return { kind: 'artifact', runId: run.id, artifactId: matches[0].id };
    }
    if (runs.length < 100) throw new Error('IndexNow: no verified checkpoint or audited cutover run found');
  }
  throw new Error('IndexNow: notification history lookup exhausted; no submission');
}
