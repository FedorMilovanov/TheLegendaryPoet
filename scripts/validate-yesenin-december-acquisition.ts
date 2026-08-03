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
const sourcePassPath = join(
  researchDir,
  'YESENIN_DECEMBER_1925_SOURCE_PASS_IMLI_2003_2026-08.md',
);
const memoirPassPath = join(
  researchDir,
  'YESENIN_MEMOIR_CORPUS_SOURCE_PASS_1986_USER_UPLOAD_2026-08.md',
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

for (const path of [
  discoveryPath,
  registryPath,
  sourcePassPath,
  memoirPassPath,
  matrixPath,
  witnessPath,
  requestPackPath,
]) {
  if (!existsSync(path)) throw new Error(`missing December forensic control file: ${path}`);
}

const discovery = readFileSync(discoveryPath, 'utf8');
const registry = readFileSync(registryPath, 'utf8');
const sourcePass = readFileSync(sourcePassPath, 'utf8');
const memoirPass = readFileSync(memoirPassPath, 'utf8');
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
  if (forbidden.test(discovery)) throw new Error(`December discovery overstates its own pass: ${forbidden}`);
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
  'YESENIN_DECEMBER_1925_SOURCE_PASS_IMLI_2003_2026-08.md',
  'verified_research_source_files: 1',
  'verified_published_facsimile_packages: 1',
  'acquisition_objects_advanced: 6',
  'original_archive_objects_verified: 0',
  'medical_facsimile_acquired: true',
  'medical_file_original_acquired: false',
  'treatment_end_mechanism_acquired: false',
  'hotel_register_acquired: false',
  'inquiry_facsimile_corpus_acquired: true',
  'inquiry_file_original_acquired: false',
  'forensic_act_facsimile_acquired: true',
  'forensic_act_original_acquired: false',
  'lab_conclusion_2028_verified: true',
  'production_rights_closed: false',
  'complete_witness_rows: 0',
  'ready_for_chapter_15_draft: false',
  'published facsimile called the original',
  'no reproduction of IMLI book facsimiles until item-level rights are cleared',
]) {
  if (!registry.includes(required)) throw new Error(`December registry lost gate: ${required}`);
}

for (const forbidden of [
  /original_archive_objects_verified:\s*[1-9]/u,
  /medical_file_original_acquired:\s*true/u,
  /treatment_end_mechanism_acquired:\s*true/u,
  /hotel_register_acquired:\s*true/u,
  /inquiry_file_original_acquired:\s*true/u,
  /forensic_act_original_acquired:\s*true/u,
  /production_rights_closed:\s*true/u,
  /complete_witness_rows:\s*[1-9]/u,
  /ready_for_chapter_15_draft:\s*true/u,
]) {
  if (forbidden.test(registry)) throw new Error(`December registry overstates original/rights completion: ${forbidden}`);
}

for (const required of [
  'FILE-VERIFIED / PRIVATE RESEARCH ONLY / FACSIMILES VERIFIED / ORIGINALS AND RIGHTS STILL PENDING',
  'UYM-2026-08-03-10',
  'pdf_pages: 416',
  'file_size_bytes: 29439518',
  '182d24a0984b88c6d66aeeb846b7ac3b13a0f2edb39245b8b1e03912ba7d4a7c',
  'PDF_page: 37',
  'printed_page: 36',
  'PDF_pages: 369-371',
  '| История болезни С. А. Есенина | 373-375 |',
  '| Доверенность В. И. Эрлиху | 376 |',
  '| Акт Н. Горбова | 377 |',
  '| Опрос управляющего В. М. Назарова | 378-379 |',
  '| Опрос Г. Ф. Устинова | 380-381 |',
  '| Опрос Е. А. Устиновой | 382 |',
  '| Опрос В. И. Эрлиха | 383-386 |',
  '| Опись вещей в номере | 387 |',
  '| Акт А. Г. Гиляревского | 393-395 |',
  'verified_research_source_files: 1',
  'acquisition_objects_advanced: 6',
  'original_archive_objects_verified: 0',
  'production_rights_closed: 0',
  'chapter_15_prose_allowed: false',
]) {
  if (!sourcePass.includes(required)) throw new Error(`IMLI source pass lost verification/provenance field: ${required}`);
}

for (const forbidden of [
  /original_archive_objects_verified:\s*[1-9]/u,
  /production_rights_closed:\s*[1-9]/u,
  /chapter_15_prose_allowed:\s*true/u,
  /public_route_allowed:\s*true/u,
]) {
  if (forbidden.test(sourcePass)) throw new Error(`IMLI source pass overstates original/rights completion: ${forbidden}`);
}

for (const required of [
  '2 SOURCE ARCHIVES VERIFIED / INNER DOCS VERIFIED / PRIVATE RESEARCH ONLY / DERIVED OCR REPRESENTATION',
  '1f205770874e875737e9b732f6730645c550277082b575ac968401d3144cc896',
  '08d1ac9432f7bcde99bdd72205b099537c3b63b8714a265a646bc06bd65ba224',
  '2115ac558e226557cdad0b44e5cc461196a204bf25261bbc00b6015fe85ea778',
  '42cdf6dcacf25b4383ce307a900a030859b25bb0d47c215acc910d2dc939612e',
  'first_publication: сборник «Памяти Есенина», Москва, 1926',
  'edition_basis_here: abridged text of «Право на песнь»',
  'first_publication: сборник «Воспоминания», 1926',
  'source_archives_verified: 2',
  'inner_DOC_SHA_verified: 2',
  'derivative_PDFs_uploaded: 0',
  'production_rights_closed: 0',
  'chapter_15_prose_allowed: false',
]) {
  if (!memoirPass.includes(required)) throw new Error(`Yesenin memoir corpus lost version/provenance field: ${required}`);
}

for (const forbidden of [
  /derivative_PDFs_uploaded:\s*[1-9]/u,
  /canonical_library_promotions:\s*[1-9]/u,
  /production_rights_closed:\s*[1-9]/u,
  /chapter_15_prose_allowed:\s*true/u,
]) {
  if (forbidden.test(memoirPass)) throw new Error(`Yesenin memoir corpus overstates completion: ${forbidden}`);
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
  'PDF_pages: 383-386',
  'later book reduces the reported phrase to Тебе',
  'PDF_page: 382',
  'first_publication: Воспоминания, 1926',
  'PDF_pages: 380-381',
  'Красная газета, evening edition, 29 December 1925, no. 314',
  'PDF_pages: 378-379',
  'A memoir and Nazarov protocol are not the hotel register',
  'PDF_page: 377',
  'PDF_pages: 393-395',
  'witness_rows_created: 11',
  'complete_witness_rows: 0',
  'protocol_facsimile_mapped_rows: 4',
  'memoir_version_mapped_rows: 3',
  'presence_reported_rows: 4',
  'official_document_mapped_rows: 2',
  'document_witness_pending_rows: 1',
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
  if (forbidden.test(requestPack)) throw new Error(`archive request pack overstates its own request status: ${forbidden}`);
}

const researchFiles = readdirSync(researchDir);
const premature = researchFiles.find((name) => /YESENIN_PART_II_DRAFT_CH15/iu.test(name));
if (premature) throw new Error(`chapter 15 narrative prose appeared before acquisition gates: ${premature}`);

console.log(
  'Yesenin December acquisition: 40 discovery queries, 12 acquisition objects, 1 verified IMLI source file/facsimile package, 2 verified memoir source archives, 6 advanced objects, 11 mapped witness/document rows and 0 verified originals/complete witnesses; chapter 15 prose and public route remain blocked.',
);
