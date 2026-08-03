import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const researchDir = 'docs/research';
const chapterPath = join(
  researchDir,
  'YESENIN_PART_II_DRAFT_CH14_SOFIA_CLINIC_PARTIAL_V01_2026-08.md',
);
const quotationPassPath = join(
  researchDir,
  'YESENIN_PART_II_QUOTATION_PASS_CH14_2026-08.md',
);

for (const path of [chapterPath, quotationPassPath]) {
  if (!existsSync(path)) throw new Error(`missing chapter-14 quotation control file: ${path}`);
}

const chapter = readFileSync(chapterPath, 'utf8');
const quotationPass = readFileSync(quotationPassPath, 'utf8');

for (const required of [
  'PARTIAL V03 / EXACT DOCUMENTARY QUOTATION PASS',
  'YESENIN_PART_II_QUOTATION_PASS_CH14_2026-08.md',
  'На днях пришлю тебе лирику «Стихи о которой».',
  'Немедленно найди две-три комнаты. 20 числах переезжаю жить Ленинград. Телеграфируй. Есенин.',
  'Сжатый телеграфный синтаксис сохраняется в цитате',
  'справка не называет полный диагноз',
  'не выделяется как драматическая цитата',
  'Письмо сохранилось в автографе РГАЛИ, но не было своевременно передано адресату',
  'обещание нельзя автоматически считать исполненным',
  'практические действия не опровергают тяжесть кризиса',
  'ни наличие или отсутствие последнего покаяния',
]) {
  if (!chapter.includes(required)) throw new Error(`chapter 14 lost exact quotation/boundary: ${required}`);
}

for (const forbidden of [
  /«[^»]{0,180}удостоверени[ея] №\s*1037[^»]{0,500}»/iu,
  /Немедленно найди две-три комнаты\. В двадцатых числах/iu,
  /На днях пришлю тебе лирику[^.]{0,180}(?:доказывает|подтверждает)[^.]{0,120}(?:достав|издан|получен)/iu,
  /удостоверени[ея] №\s*1037[^.]{0,300}(?:полный диагноз|история болезни)[^.]{0,120}(?:содержит|устанавливает|доказывает)/iu,
  /телеграфировал[^.]{0,500}(?:здоров|выздоров|стабил|не собирался умирать)/iu,
]) {
  if (forbidden.test(chapter)) throw new Error(`chapter 14 overstates or corrupts documentary quotation context: ${forbidden}`);
}

for (const required of [
  'TWO EXACT DOCUMENTARY QUOTATIONS PINNED / CERTIFICATE PARAPHRASED',
  'chapter_14_exact_fragments_approved: 2',
  'chapter_14_deliberate_no_quote_objects: 6',
  'certificate_direct_quote_selected: false',
  'certificate_safe_paraphrase_pinned: true',
  'primary_document_classes_distinguished: true',
  'medical_boundary_reviewed: true',
  'moral_theological_boundary_reviewed: true',
  'full_medical_file_acquired: false',
  'registry_image_acquired: false',
  'production_rights_closed: false',
  'public_route_allowed: false',
  'Preserve the compressed telegram syntax',
  'The chapter does not quote',
]) {
  if (!quotationPass.includes(required)) throw new Error(`chapter-14 quotation pass lost control field: ${required}`);
}

for (const forbidden of [
  /certificate_direct_quote_selected:\s*true/u,
  /full_medical_file_acquired:\s*true/u,
  /registry_image_acquired:\s*true/u,
  /production_rights_closed:\s*true/u,
  /public_route_allowed:\s*true/u,
  /chapter_14_exact_fragments_approved:\s*(?!2\b)\d+/u,
]) {
  if (forbidden.test(quotationPass)) throw new Error(`chapter-14 quotation pass overstates completion: ${forbidden}`);
}

console.log(
  'Yesenin chapter 14 quotations: 2 exact documentary fragments, 1 certificate no-quote decision and 6 deliberate no-quote objects pinned; medical, legal and moral/theological boundaries preserved.',
);
