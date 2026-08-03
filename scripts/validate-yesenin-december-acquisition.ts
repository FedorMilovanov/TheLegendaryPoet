import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const researchDir = 'docs/research';
const discoveryPath = join(
  researchDir,
  'YESENIN_DECEMBER_1925_DISCOVERY_PASS_40_PLUS_2026-08.md',
);
const registryPath = join(
  researchDir,
  'YESENIN_DECEMBER_1925_ACQUISITION_REGISTRY_2026-08.md',
);
const matrixPath = join(
  researchDir,
  'YESENIN_DECEMBER_1925_DAY_LEVEL_SOURCE_MATRIX_PASS_01_2026-08.md',
);
const witnessPath = join(
  researchDir,
  'YESENIN_DECEMBER_1925_WITNESS_MATRIX_PASS_01_2026-08.md',
);
const requestPackPath = join(
  researchDir,
  'YESENIN_ARCHIVE_REQUEST_PACK_2026-08.md',
);

for (const path of [discoveryPath, registryPath, matrixPath, witnessPath, requestPackPath]) {
  if (!existsSync(path)) throw new Error(`missing December forensic control file: ${path}`);
}

const discovery = readFileSync(discoveryPath, 'utf8');
const registry = readFileSync(registryPath, 'utf8');
const matrix = readFileSync(matrixPath, 'utf8');
const witnesses = readFileSync(witnessPath, 'utf8');
const requestPack = readFileSync(requestPackPath, 'utf8');

const queryNumbers = [...discovery.matchAll(/^([1-9]|[1-3][0-9]|40)\.\s+`/gmu)].map(
  (match) => Number(match[1]),
);
const uniqueQueries = new Set(queryNumbers);
if (uniqueQueries.size !== 40) {
  throw new Error(`expected 40 numbered forensic discovery queries, found ${uniqueQueries.size}`);
}
for (let number = 1; number <= 40; number += 1) {
  if (!uniqueQueries.has(number)) throw new Error(`missing forensic discovery query no. ${number}`);
}

for (const required of [
  '40 SEARCHES COMPLETE',
  'web_search_queries_completed: 40',
  'Drive_exact_searches_completed: 5',
  'binaries_downloaded_in_this_pass: 0',
  'binaries_uploaded_to_Drive: 0',
  'item_verified_objects: 0',
  'chapter_15_prose_created: false',
  'public_route_created: false',
  'IMLI f.32 op.2 storage unit 37',
  'https://rusneb.ru/catalog/000199_000009_011625583/',
]) {
  if (!discovery.includes(required)) {
    throw new Error(`December discovery pass lost required boundary/result: ${required}`);
  }
}

for (const forbidden of [
  /binaries_downloaded_in_this_pass:\s*[1-9]/u,
  /binaries_uploaded_to_Drive:\s*[1-9]/u,
  /item_verified_objects:\s*[1-9]/u,
  /chapter_15_prose_created:\s*true/u,
  /public_route_created:\s*true/u,
]) {
  if (forbidden.test(discovery)) throw new Error(`December discovery overstates acquisition: ${forbidden}`);
}

const acquisitionObjects = [...registry.matchAll(/^### DEC-ACQ-(\d{2})\s+—/gmu)].map(
  (match) => Number(match[1]),
);
if (new Set(acquisitionObjects).size !== 12) {
  throw new Error(`expected 12 December acquisition objects, found ${new Set(acquisitionObjects).size}`);
}
for (let number = 1; number <= 12; number += 1) {
  if (!acquisitionObjects.includes(number)) {
    throw new Error(`missing December acquisition object DEC-ACQ-${String(number).padStart(2, '0')}`);
  }
}

for (const required of [
  'YESENIN_DECEMBER_1925_DISCOVERY_PASS_40_PLUS_2026-08.md',
  'IMLI, fund 32, inventory 2, storage unit 37',
  'archive cipher means the file has been inspected',
  'narrative_prose_allowed: false',
  'public_route_allowed: false',
  'forensic_registry_created: true',
  'acquisition_objects: 12',
  'item_verified_objects: 0',
  'complete_witness_rows: 0',
  'medical_file_acquired: false',
  'hotel_register_acquired: false',
  'inquiry_file_acquired: false',
  'forensic_act_acquired: false',
  'photo_provenance_closed: false',
  'ready_for_chapter_15_draft: false',
]) {
  if (!registry.includes(required)) throw new Error(`December registry lost gate: ${required}`);
}

for (const required of [
  'A memoir is not a hotel register',
  'An evidentiary gap is not positive homicide evidence',
  'no body photograph in the reader article',
  'no staged hotel-room reconstruction as evidence',
]) {
  if (!matrix.includes(required)) throw new Error(`December source matrix lost hard stop: ${required}`);
}

for (const required of [
  'No row in pass 01 is `COMPLETE`',
  'written: 28 January 1926 according to academic comments',
  'later book reduces the reported transfer formula to Тебе',
  'first_publication: Сергей Александрович Есенин. Воспоминания',
  'Красная газета, evening edition, 29 December 1925, no. 314',
  'A memoir is not a hotel register',
  'witness_rows_created: 10',
  'complete_witness_rows: 0',
  'partial_rows: 3',
  'presence_reported_rows: 4',
  'document_witness_pending_rows: 3',
  'composite_everyone_remembered_paragraph_allowed: false',
  'chapter_15_prose_allowed: false',
]) {
  if (!witnesses.includes(required)) throw new Error(`December witness matrix lost boundary: ${required}`);
}

for (const forbidden of [
  /complete_witness_rows:\s*[1-9]/u,
  /composite_everyone_remembered_paragraph_allowed:\s*true/u,
  /chapter_15_prose_allowed:\s*true/u,
]) {
  if (forbidden.test(witnesses)) throw new Error(`December witness matrix overstates completion: ${forbidden}`);
}

for (const required of [
  'READY-TO-SEND TEMPLATES / NOT SENT / RESPONSES NOT RECEIVED',
  'ИМЛИ, ф. 32, оп. 2, ед. хр. 37',
  'roirli.copy@yandex.ru',
  'info@imli.ru',
  'https://rusneb.ru/catalog/000199_000009_011625583/',
  'http://dlib.rsl.ru/rsl01011000000/rsl01011625000/rsl01011625583/rsl01011625583.pdf',
  'https://rusneb.ru/catalog/000199_000009_007513586/',
  'https://rusneb.ru/catalog/000199_000009_012474152/',
  'request_templates_ready: 4',
  'manual_NEB_RSL_cards_ready: 4',
  'requests_sent: 0',
  'responses_received: 0',
  'files_received: 0',
  'item_verified_objects: 0',
  'Drive_batch_created: false',
  'chapter_15_prose_allowed: false',
]) {
  if (!requestPack.includes(required)) throw new Error(`archive request pack lost boundary/route: ${required}`);
}

for (const forbidden of [
  /requests_sent:\s*[1-9]/u,
  /responses_received:\s*[1-9]/u,
  /files_received:\s*[1-9]/u,
  /item_verified_objects:\s*[1-9]/u,
  /Drive_batch_created:\s*true/u,
  /chapter_15_prose_allowed:\s*true/u,
]) {
  if (forbidden.test(requestPack)) throw new Error(`archive request pack overstates progress: ${forbidden}`);
}

const researchFiles = readdirSync(researchDir);
const premature = researchFiles.find((name) => /YESENIN_PART_II_DRAFT_CH15/iu.test(name));
if (premature) throw new Error(`chapter 15 narrative prose appeared before acquisition gates: ${premature}`);

console.log(
  'Yesenin December acquisition: 40 discovery queries, 12 acquisition objects, 10 partial/pending witness rows, 4 request templates, 4 institutional download cards, 0 sent requests, 0 received/verified files and 0 complete witnesses; chapter 15 prose and public route remain blocked.',
);
