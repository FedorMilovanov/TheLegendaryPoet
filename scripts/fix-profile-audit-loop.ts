import fs from 'node:fs';

const file = 'scripts/strengthen-profile-conclusions.ts';
const current = fs.readFileSync(file, 'utf8');

const pattern = /replaceRequired\(\n  'scripts\/validate-literary-style\.ts',\n  `for \(const poet of poets\) \{\\n  const prose = proseOfPoet\(poet\);`,\n  `for \(const poet of poets\) \{\n  const prose = proseOfPoet\(poet\);\n\n  for \(const marker of requiredPoetConclusionMarkers\[poet\.id\] \?\? \[\]\) \{\n    if \(!prose\.includes\(marker\)\) \{\n      errors\.push\(poet\.id \+ ': отсутствует обязательный усиленный вывод «' \+ marker \+ '»'\);\n    \}\n  \}`,\n\);/;

const replacement = `replaceRequired(
  'scripts/validate-literary-style.ts',
  \`for (const poet of poets) {\\n  const text = proseOfPoet(poet);\\n\\n  for (const marker of requiredPoetMarkers[poet.id] ?? []) {\`,
  \`for (const poet of poets) {
  const text = proseOfPoet(poet);

  for (const marker of requiredPoetConclusionMarkers[poet.id] ?? []) {
    if (!text.includes(marker)) {
      error(poet.id, 'required strengthened conclusion is missing: “' + marker + '”');
    }
  }

  for (const marker of requiredPoetMarkers[poet.id] ?? []) {\`,
);`;

if (!pattern.test(current)) {
  throw new Error('Outdated poet-loop replacement block was not found after syntax fix.');
}

fs.writeFileSync(file, current.replace(pattern, replacement), 'utf8');
console.log('Updated profile audit to the current validator poet loop.');
