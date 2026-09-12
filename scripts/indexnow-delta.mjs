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
