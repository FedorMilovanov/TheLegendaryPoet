import fs from 'node:fs';

const file = 'scripts/validate-literary-style.ts';
const current = fs.readFileSync(file, 'utf8');
const from = "    'полный сохранившийся текст был впервые реконструирован',";
const to = "    'Полный сохранившийся текст был впервые реконструирован',";

if (!current.includes(from)) {
  throw new Error('Expected lowercase Brik audit marker was not generated.');
}

fs.writeFileSync(file, current.replace(from, to), 'utf8');
console.log('Corrected Brik audit marker casing.');
