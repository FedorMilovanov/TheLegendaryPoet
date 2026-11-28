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
