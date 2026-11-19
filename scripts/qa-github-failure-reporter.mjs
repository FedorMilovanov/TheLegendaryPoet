import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';

const escapeData = (value) => stripVTControlCharacters(String(value))
  .replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
const escapeProperty = (value) => escapeData(value).replaceAll(':', '%3A').replaceAll(',', '%2C');

// Keep the line reporter and exit policy authoritative. Expose final failures
// through check annotations too, when signed log/artifact delivery is unavailable.
export default class GithubFailureReporter {
  onBegin(_config, suite) {
    this.suite = suite;
  }

  onEnd() {
    for (const test of this.suite.allTests()) {
      const outcome = test.outcome();
      if (outcome !== 'unexpected' && outcome !== 'flaky') continue;
      const errors = test.results.flatMap((result) => result.errors ?? []);
      // The same helper can be asserted on arrival, Back and Forward. Keep
      // its call site, not the full Playwright internals or traces.
      const detail = errors.map(error => [error.message ?? error.value,
        ...(error.stack ?? '').split('\n').filter(line => /^\s+at .*[/\\]qa[/\\]/.test(line)).slice(0, 3),
      ].filter(Boolean).join('\n')).join('\n');
      const title = `${outcome}: ${test.titlePath().join(' › ')}`;
      const file = path.relative(process.cwd(), test.location.file).replaceAll('\\', '/');
      const message = (detail || `Final test outcome: ${outcome}`).slice(0, 8000);
      console.error(`::error file=${escapeProperty(file)},line=${test.location.line},title=${escapeProperty(title)}::${escapeData(message)}`);
    }
  }
}
