// Checked Markdown projections of existing owners, not a prose/NLP validator.
// Keep normative status in these tables; link to the owner for explanatory detail.
export function runtimeDocumentationFacts(project, hall) {
  const pick = (source, keys) => Object.fromEntries(keys.map((key) => {
    const value = key.split('.').reduce((node, part) => node?.[part], source);
    if (!['string', 'boolean'].includes(typeof value)) throw new Error(`Missing runtime fact: ${key}`);
    return [key, String(value)];
  }));
  return [
    { path: project.documentation.currentState, id: 'hall', values: pick(hall, [
      'phase', 'productionRoute.path', 'productionRoute.mode', 'productionRoute.runtimeModule',
      'productionRoute.allowThreeRuntimeImports', 'productionRoute.allowLegacyHallImports',
      'productionRoute.allowRightsPendingDocumentaryMedia', 'gates.offlineVisualApproval',
      'gates.webVerticalSlice', 'gates.fullMuseumScaleOut', 'tracking.autonomousProductTransactionSelected',
    ]) },
    { path: 'docs/APP_SHELL_RUNTIME.md', id: 'scroll', values: pick(project, [
      'runtime.scrollMode', 'runtime.scrollCoordinator', 'runtime.scrollUtilities', 'runtime.scrollValidator',
    ]) },
  ];
}

export function validateFactTable(text, { id, values }) {
  const start = `<!-- runtime-facts:${id}:start -->`;
  const end = `<!-- runtime-facts:${id}:end -->`;
  if (text.split(start).length !== 2 || text.split(end).length !== 2 || text.indexOf(end) < text.indexOf(start)) {
    return [`${id}: expected exactly one ordered fact block`];
  }
  const body = text.slice(text.indexOf(start) + start.length, text.indexOf(end));
  const rows = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const failures = [];
  const actual = new Map();
  if (!/^\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|$/.test(rows[1] ?? '')) {
    return [`${id}: expected a two-column Markdown table`];
  }
  for (const row of rows.slice(2)) {
    const cells = row.split('|');
    if (cells.length !== 4 || cells[0] || cells[3]) {
      failures.push(`${id}: malformed fact row: ${row}`);
      continue;
    }
    const [key, value] = cells.slice(1, 3).map((cell) => cell.replaceAll('`', '').trim());
    if (actual.has(key)) failures.push(`${id}: duplicate fact ${key}`);
    if (!Object.hasOwn(values, key)) failures.push(`${id}: unknown fact ${key}`);
    actual.set(key, value);
  }
  for (const [key, expected] of Object.entries(values)) {
    if (actual.get(key) !== expected) failures.push(`${id}: ${key} expected ${expected}, found ${actual.get(key) ?? '(missing)'}`);
  }
  return failures;
}
