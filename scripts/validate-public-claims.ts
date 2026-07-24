import { getAllEssays, getEssayBySlug } from '../src/data/essays/index';
import type { EssayBlock } from '../src/types/essay';

const failures: string[] = [];

function blockText(block: EssayBlock): string {
  switch (block.type) {
    case 'lead':
    case 'paragraph':
    case 'note':
    case 'epigraph':
    case 'pullquote':
    case 'reflection':
      return 'text' in block ? block.text : '';
    case 'section':
      return block.heading;
    case 'poem':
      return `${block.title ?? ''}\n${block.lines}\n${block.note ?? ''}`;
    case 'voice':
      return `${block.quote}\n${block.author}\n${block.role}\n${block.source}`;
    case 'image':
      return `${block.alt}\n${block.caption}`;
    case 'divider':
      return '';
  }
}

function essayText(slug: string): string {
  const essay = getEssayBySlug(slug);
  if (!essay) {
    failures.push(`Missing essay: ${slug}`);
    return '';
  }
  return essay.blocks.map(blockText).join('\n');
}

function requireText(where: string, text: string, marker: string) {
  if (!text.includes(marker)) failures.push(`${where}: missing required boundary marker: ${marker}`);
}

function forbidText(where: string, text: string, marker: string) {
  if (text.includes(marker)) failures.push(`${where}: forbidden overclaim or obsolete wording: ${marker}`);
}

const yesenin = essayText('yesenin-kutezhi');
requireText(
  'yesenin-kutezhi',
  yesenin,
  'Спас-Клепиковской второклассной учительской школе, находившейся в духовном ведомстве',
);
requireText(
  'yesenin-kutezhi',
  yesenin,
  'без самой истории болезни нельзя уверенно определить',
);
requireText(
  'yesenin-kutezhi',
  yesenin,
  'доступный обзор не устанавливает, что кровь принадлежала именно Есенину',
);
forbidText('yesenin-kutezhi', yesenin, 'Спас-Клепиковской церковно-учительской школе');
forbidText('yesenin-kutezhi', yesenin, 'написанное собственной кровью');
forbidText('yesenin-kutezhi', yesenin, 'вправду кровью, подтвердят');

const mayakovskyLate = essayText('mayakovsky-gromovoy');
requireText('mayakovsky-gromovoy', mayakovskyLate, 'И выставка «20 лет работы» не пустовала');
forbidText('mayakovsky-gromovoy', mayakovskyLate, 'на выставку никто не пришёл');
forbidText('mayakovsky-gromovoy', mayakovskyLate, 'выставку никто не посетил');

const allPublicEssayText = getAllEssays()
  .flatMap((essay) => essay.blocks.map(blockText))
  .join('\n');

for (const marker of [
  'Маяковскому отказали в визе',
  'Маяковского не выпустили за границу',
  'письменный визовый отказ Маяковскому',
  'семь полных автографов Татьяне Яковлевой',
]) {
  forbidText('all essays', allPublicEssayText, marker);
}

if (failures.length) {
  console.error('\nPublic-claim boundary validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Public-claim boundaries passed: Yesenin clinic/forensics/school and Mayakovsky exhibition/visa claims remain within verified evidence.');
