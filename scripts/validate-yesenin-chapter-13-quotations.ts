import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const researchDir = 'docs/research';
const chapterPath = join(
  researchDir,
  'YESENIN_PART_II_DRAFT_CH13_LATE_POETRY_V01_2026-08.md',
);
const quotationPassPath = join(
  researchDir,
  'YESENIN_PART_II_QUOTATION_PASS_CH13_2026-08.md',
);

for (const path of [chapterPath, quotationPassPath]) {
  if (!existsSync(path)) throw new Error(`missing chapter-13 quotation control file: ${path}`);
}

const chapter = readFileSync(chapterPath, 'utf8');
const quotationPass = readFileSync(quotationPassPath, 'utf8');

for (const required of [
  'V03 / EXACT QUOTATION AND PUNCTUATION PASS',
  'YESENIN_PART_II_QUOTATION_PASS_CH13_2026-08.md',
  'Язык сограждан стал мне как чужой',
  'В своей стране я словно иностранец',
  'Отдам всю душу октябрю и маю',
  'Но только лиры милой не отдам',
  'Незрело знающий работу',
  'О любви в словах не говорят',
  'О любви вздыхают лишь украдкой',
  'Многие видел я страны',
  'Счастья искал повсюду',
  'Только удел желанный',
  'Больше искать не буду',
  'Я один... И — разбитое зеркало...',
  'не доказательство устойчивого выздоровления',
  'не исповедание покаяния перед Богом',
  'не медицинский диагноз',
  'не прямая записка о декабрьской смерти',
  'дополнительная декоративная цитата не вставляется',
  'Зачёркнутые строки черновика остаются вариантами работы',
]) {
  if (!chapter.includes(required)) throw new Error(`chapter 13 lost exact quotation/boundary: ${required}`);
}

for (const forbidden of [
  /Но зрело знающий работу/u,
  /Отдам всю душу октябрю и маю,[\s\S]{0,80}Язык сограждан стал мне как чужой/u,
  /«Глупое сердце[^»]*»[^.]{0,350}(?:доказывает|подтверждает)[^.]{0,150}(?:выздоровлен|покаян|обращен)/iu,
  /Я один\.\.\. И — разбитое зеркало\.\.\.[^.]{0,250}(?:диагноз|самоубийств|предсмертн)/iu,
  /Кл[её]н[^.]{0,250}(?:пророчество|диагноз)[^.]{0,120}(?:доказывает|подтверждает)/iu,
]) {
  if (forbidden.test(chapter)) throw new Error(`chapter 13 overstates or corrupts quotation context: ${forbidden}`);
}

for (const required of [
  'EXACT SHORT QUOTATIONS PINNED / PUNCTUATION CHECKED',
  'chapter_13_exact_fragments_approved: 5',
  'chapter_13_poems_with_no_extra_quote: 2',
  'punctuation_checked: true',
  'academic_child_urls_pinned: true',
  'theological_boundary_reviewed_for_selected_fragments: true',
  'physical_first_editions_acquired_for_all: false',
  'manuscript_visual_rights_closed: false',
  'public_route_allowed: false',
  'fragment_1:',
  'fragment_2:',
  'rejected_variant: Но зрело знающий работу',
  'do not silently replace `ё`/`е` inside an exact quotation',
]) {
  if (!quotationPass.includes(required)) throw new Error(`chapter-13 quotation pass lost control field: ${required}`);
}

for (const forbidden of [
  /physical_first_editions_acquired_for_all:\s*true/u,
  /manuscript_visual_rights_closed:\s*true/u,
  /public_route_allowed:\s*true/u,
  /chapter_13_exact_fragments_approved:\s*(?!5\b)\d+/u,
]) {
  if (forbidden.test(quotationPass)) throw new Error(`chapter-13 quotation pass overstates completion: ${forbidden}`);
}

console.log(
  'Yesenin chapter 13 quotations: 5 exact short fragments and 2 deliberate no-extra-quote decisions pinned; punctuation, medical and theological boundaries preserved.',
);
