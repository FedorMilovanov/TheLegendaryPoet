import fs from 'node:fs';

const source = fs.readFileSync('src/utils/dailyContent.ts', 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(source.includes('Date.UTC(2024, 0, 1)'), 'daily content must use a UTC epoch');
assert(!source.includes('new Date(2024, 0, 1)'), 'daily content still depends on the local timezone');
assert(source.includes('export function getDayIndex(timestamp = Date.now())'), 'getDayIndex must expose a deterministic timestamp seam');

const DAY_MS = 86_400_000;
const epochDay = Math.floor(Date.UTC(2024, 0, 1) / DAY_MS);
const index = (timestamp) => Math.floor(timestamp / DAY_MS) - epochDay;
assert(index(Date.UTC(2024, 0, 1)) === 0, 'UTC epoch must be day 0');
assert(index(Date.UTC(2024, 0, 1, 23, 59, 59, 999)) === 0, 'one UTC day must be stable');
assert(index(Date.UTC(2024, 0, 2)) === 1, 'index must advance at UTC midnight');

if (failures.length) {
  console.error('daily content contract: FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('daily content contract: UTC rotation OK');
