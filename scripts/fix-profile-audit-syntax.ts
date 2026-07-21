import fs from 'node:fs';

const file = 'scripts/strengthen-profile-conclusions.ts';
const current = fs.readFileSync(file, 'utf8');
const from = '      errors.push(`${poet.id}: отсутствует обязательный усиленный вывод «${marker}»`);';
const to = "      errors.push(poet.id + ': отсутствует обязательный усиленный вывод «' + marker + '»');";

if (!current.includes(from)) {
  throw new Error('Nested validator template line was not found.');
}

fs.writeFileSync(file, current.replace(from, to), 'utf8');
console.log('Replaced nested validator template with string concatenation.');
