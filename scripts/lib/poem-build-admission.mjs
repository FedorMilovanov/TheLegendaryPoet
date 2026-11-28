// Build only the interactive standalone reader when the generated admission
// index contains at least one approved route. Slug assignment is not approval.
export function hasApprovedPoemPages(index) {
  if (index?.schemaVersion !== 1 || !index.pages || typeof index.pages !== 'object' || Array.isArray(index.pages)) {
    throw new Error('Invalid standalone poem build admission index');
  }
  const route = /^\/poets\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/;
  const work = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const entries = Object.entries(index.pages);
  if (entries.some(([path, id]) => !route.test(path) || typeof id !== 'string' || !work.test(id))) {
    throw new Error('Invalid standalone poem build admission entry');
  }
  return entries.length > 0;
}

/** Only runtime navigation fields enter the browser; the full contract remains the build/QA authority. */
export function projectBrowserRouteContract(contract) {
  if (contract?.schemaVersion !== 1 || !Array.isArray(contract.routes) || !Array.isArray(contract.redirects)) {
    throw new Error('Invalid browser route contract');
  }
  return {
    schemaVersion: contract.schemaVersion,
    routes: contract.routes.map(({ id, path, page, prefetch, audit, discoveryState }) => ({ id, path, page, prefetch, audit, discoveryState })),
    redirects: contract.redirects.map(({ from, to }) => ({ from, to })),
  };
}
