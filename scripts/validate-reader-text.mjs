import fs from 'node:fs';

const source = fs.readFileSync('src/components/poet-detail/InteractivePoemText.tsx', 'utf8');
const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

expect(source.includes('data-poem-canonical'), 'reader text must expose a canonical DOM layer');
expect(source.includes('data-poem-canonical-word'), 'canonical words must remain targetable for interaction');
expect(source.includes('data-poem-visual'), 'reader text must expose a presentation layer');
expect(source.includes('aria-hidden="true"'), 'presentation layer must be hidden from assistive technology');
expect(source.includes("style={{ userSelect: 'text', WebkitUserSelect: 'text' }}"), 'canonical layer must remain selectable');
expect(source.includes('whitespace-pre-wrap'), 'canonical layer must preserve source whitespace and line breaks');
expect(source.includes('line.split(/(\\s+)/u)'), 'canonical layer must preserve every whitespace token instead of collapsing spaces');
expect(source.includes("data-poem-canonical-word"), 'canonical word spans must remain available for pointer interaction');
expect(source.includes('onPointerEnter={() => startDwell(key)}'), 'canonical words must drive the existing dwell interaction');
expect(source.includes('onPointerLeave={stopDwell}'), 'canonical words must release dwell state consistently');
expect(!source.includes('select-none'), 'reader text must not disable native text selection');

if (failures.length) {
  console.error('Reader text validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Reader text validation passed.');
