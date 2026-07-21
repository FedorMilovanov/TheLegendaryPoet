import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const replacements = [
  {
    file: 'src/data/essays/yeseninKutezhi.ts',
    from: `  title: 'Есенин: маска «Москвы кабацкой» и дорога к гибели',`,
    to: `  title: 'Есенин: маска «Москвы кабацкой» и цена саморазрушения',`,
  },
  {
    file: 'src/data/essays/yeseninKutezhi.ts',
    from: `  excerpt: 'Как маска скандалиста стала рабством, почему совесть и великий дар не смогли освободить Есенина и как мирская печаль, не обращённая ко Христу, завершилась страшным концом.',`,
    to: `  excerpt: 'История выбранной маски, алкогольной зависимости и позднего саморазоблачения — по стихам, письмам и милицейским документам, без кабацкой романтики и выдуманного покаяния.',`,
  },
  {
    file: 'src/data/essays/brikCase.ts',
    from: `  subtitle: 'Что показывают письма, документы и воспоминания — и где поздняя легенда либо обеляет союз, либо превращает его в недоказанный заговор.',`,
    to: `  subtitle: 'Что показывают письма, документы и воспоминания; где заканчивается факт и начинаются поздние версии — оправдательные или обвинительные.',`,
  },
  {
    file: 'src/data/essays/brikCase.ts',
    from: `  excerpt: 'История Маяковского и Бриков по письмам и документам: творческий союз, прелюбодейная конструкция, эмоциональная зависимость и поздние спорные свидетельства без музейного глянца.',`,
    to: `  excerpt: 'История Маяковского и Бриков по письмам и документам: творческое сотрудничество, супружеская неверность, эмоциональная зависимость и поздние спорные свидетельства — без мемориального глянца и сенсационной схемы.',`,
  },
];

for (const replacement of replacements) {
  const filePath = path.join(root, replacement.file);
  let text = fs.readFileSync(filePath, 'utf8');
  const occurrences = text.split(replacement.from).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${replacement.file}: expected one metadata occurrence, found ${occurrences}`);
  }
  text = text.replace(replacement.from, replacement.to);
  fs.writeFileSync(filePath, text, 'utf8');
}

const validatorPath = path.join(root, 'scripts/validate-literary-style.ts');
let validator = fs.readFileSync(validatorPath, 'utf8');
const oldBlock = `  'yesenin-kutezhi': [
    'Мирская печаль, которая произвела смерть',
    'человек ещё считал, что пользуется скандалом, когда скандал уже пользовался им',
    'Кабак разрушал Есенина-человека и одновременно давал',
    'Поэт действительно «горел ярче»',
    'Различались идолы; хозяин сердца не менялся',
  ],`;
const newBlock = `  'yesenin-kutezhi': [
    'Мирская печаль, которая произвела смерть',
    'человек ещё считал, что пользуется скандалом, когда скандал уже пользовался им',
    'Кабак разрушал Есенина-человека и одновременно давал',
    'Поэт действительно «горел ярче»',
    'Различались идолы; хозяин сердца не менялся',
    'дорога к гибели',
    'почему совесть и великий дар не смогли освободить Есенина',
  ],`;
if (validator.split(oldBlock).length - 1 !== 1) {
  throw new Error('validator: Yesenin marker block did not match exactly once');
}
validator = validator.replace(oldBlock, newBlock);

const oldBrikEnd = `    'Правильная прямота не требует',
  ],`;
const newBrikEnd = `    'Правильная прямота не требует',
    'прелюбодейная конструкция',
  ],`;
if (validator.split(oldBrikEnd).length - 1 !== 1) {
  throw new Error('validator: Brik marker block did not match exactly once');
}
validator = validator.replace(oldBrikEnd, newBrikEnd);
fs.writeFileSync(validatorPath, validator, 'utf8');

console.log(`Polished ${replacements.length} essay metadata fields.`);
