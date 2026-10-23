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
      const detail = errors.map((error) => error.message ?? error.value ?? '').join('\n');
      const title = `${outcome}: ${test.titlePath().join(' › ')}`;
      const file = path.relative(process.cwd(), test.location.file).replaceAll('\\', '/');
      const message = (detail || `Final test outcome: ${outcome}`).slice(0, 8000);
      console.error(`::error file=${escapeProperty(file)},line=${test.location.line},title=${escapeProperty(title)}::${escapeData(message)}`);
    }
  }
}
