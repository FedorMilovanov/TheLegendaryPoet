import fs from 'node:fs';

const file = 'scripts/strengthen-profile-conclusions.ts';
const current = fs.readFileSync(file, 'utf8');
const obsolete = `replaceRequired(
  'docs/PRIMARY_SOURCE_REAUDIT_2026-07-21.md',
  \`Проведён новый поиск и сопоставление более сорока первичных, архивных, академических и книжных позиций.\`,
  \`Проведён новый поиск и сопоставление сорока восьми первичных, архивных, академических и книжных позиций.\`,
);
`;

if (!current.includes(obsolete)) {
  throw new Error('Obsolete audit-doc replacement block was not found.');
}

fs.writeFileSync(file, current.replace(obsolete, ''), 'utf8');
console.log('Removed invalid audit-doc status replacement.');
