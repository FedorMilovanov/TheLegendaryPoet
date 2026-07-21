import fs from 'node:fs';

const file = 'scripts/validate-literary-style.ts';
let current = fs.readFileSync(file, 'utf8');

const replacements: Array<[string, string]> = [
  [
    "    'не христианское мученичество',\n    'нарушение брачного обета',",
    "    'не является мученичеством за Христа',\n    'нарушение брачного обета',",
  ],
  [
    "    'Неизвестный людям последний миг остаётся в Божьем ведении, но возможность такого мига',",
    "    'Неизвестный людям последний миг остаётся в Божьем ведении, но возможность такого мига не является исторической версией и не даёт права смягчать документированный финал',",
  ],
];

for (const [from, to] of replacements) {
  if (!current.includes(from)) {
    throw new Error(`Expected validation marker not found: ${from}`);
  }
  current = current.replace(from, to);
}

fs.writeFileSync(file, current, 'utf8');
console.log('Corrected Gumilev and Yesenin validation markers.');
