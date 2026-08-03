import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const researchDir = 'docs/research';
const acquisitionPassPath = join(
  researchDir,
  'PDF_ACQUISITION_PASS_03_YESENIN_1921_1925_2026-08.md',
);
const sourcePassPath = join(
  researchDir,
  'YESENIN_DUNCAN_RUSSIAN_DAYS_SOURCE_PASS_01_2026-08.md',
);
const pageMapPath = join(
  researchDir,
  'YESENIN_DUNCAN_RUSSIAN_DAYS_PAGE_MAP_PASS_01_2026-08.md',
);
const registryPath = join(
  researchDir,
  'YESENIN_PART_II_SOURCE_ID_REGISTRY_PASS_06_DUNCAN_RUSSIAN_DAYS_2026-08.md',
);
const gruzinovDerivedPath = join(
  researchDir,
  'YESENIN_GRUZINOV_WIKISOURCE_DERIVED_SOURCE_PASS_01_2026-08.md',
);

for (const path of [
  acquisitionPassPath,
  sourcePassPath,
  pageMapPath,
  registryPath,
  gruzinovDerivedPath,
]) {
  if (!existsSync(path)) throw new Error(`missing verified source-acquisition control file: ${path}`);
}

const acquisitionPass = readFileSync(acquisitionPassPath, 'utf8');
const sourcePass = readFileSync(sourcePassPath, 'utf8');
const pageMap = readFileSync(pageMapPath, 'utf8');
const registry = readFileSync(registryPath, 'utf8');
const gruzinovDerived = readFileSync(gruzinovDerivedPath, 'utf8');

const sha256 = 'f8ebbc91166916ff1a6e228e4b127a850b360eb64959d8441b7aa22bd2a0af17';
const sourceId = 'yes2-duncan-russian-days-1929-tu';
const batchFolderId = '1guVgPmnwnTR5wWaInK41Lp2HhMJ4ve6b';
const pdfDriveId = '1xs0SizFhEb0zDqN4MRWbBP0FsLpRfJH0';
const manifestDriveId = '1aEQDZDdDOmv_S77mxOT1n-d-Gz_7LXcV';
const sumsDriveId = '1n_m2v5pjqvL-w96fjA26YbfasqV9EAnv';

for (const required of [
  'DRIVE-VERIFIED RESEARCH MASTER',
  sourceId,
  'pdf_pages: 406',
  'catalog_description_pages: 384',
  'file_size_bytes: 18881149',
  sha256,
  'first_page_rendered: true',
  'title_page_pdf_page: 7',
  'title_page_rendered_and_inspected: true',
  `batch_folder_id: ${batchFolderId}`,
  `PDF_Drive_file_id: ${pdfDriveId}`,
  `manifest_Drive_file_id: ${manifestDriveId}`,
  `sha256sums_Drive_file_id: ${sumsDriveId}`,
  'Drive_parent_verified: true',
  'Drive_uploaded: true',
  'manifest_uploaded: true',
  'checksum_manifest_uploaded: true',
  'production_rights_closed: false',
]) {
  if (!sourcePass.includes(required)) throw new Error(`Duncan source pass lost verified field: ${required}`);
}

for (const forbidden of [
  /production_rights_closed:\s*true/u,
  /embedded_image_reuse:\s*(?:CLEARED|ALLOWED|true)/iu,
  /production_reuse:\s*(?:CLEARED|ALLOWED|true)/iu,
  /Drive_uploaded:\s*false/u,
]) {
  if (forbidden.test(sourcePass)) throw new Error(`Duncan source pass overstates or regresses status: ${forbidden}`);
}

for (const required of [
  sourceId,
  pdfDriveId,
  '| 103 | 97 |',
  '| 141–142 | 135–136 |',
  '| 163 | 155 |',
  '| 185 | 177 |',
  '| 213 | 203 |',
  'memoir_claim: beginning of November 1921',
  'project_status: DISPUTED / QUALIFIED',
  'forbidden: The first meeting certainly occurred in early November.',
  'academic_control: 3 February 1923',
  'academic_control: 3 August 1923',
  'no deportation order has been acquired',
  'Exact English quotation is not copied into Russian reader prose from this pass',
]) {
  if (!pageMap.includes(required)) throw new Error(`Duncan page map lost conflict/page boundary: ${required}`);
}

for (const forbidden of [
  /project_status:\s*VERIFIED[\s\S]{0,200}beginning of November/iu,
  /memoir_claim:\s*5 August 1923[\s\S]{0,200}status:\s*VERIFIED/iu,
  /project_status:\s*VERIFIED[\s\S]{0,240}deportation/iu,
  /memoir_claim:\s*end of January[\s\S]{0,200}project_status:\s*VERIFIED/iu,
]) {
  if (forbidden.test(pageMap)) throw new Error(`Duncan page map silently upgrades memoir conflict: ${forbidden}`);
}

for (const required of [
  'DRIVE-VERIFIED BINARY / PAGE-MAPPED EARLY CONNECTED MEMOIR / CONFLICTS PRESERVED',
  sourceId,
  `Drive_folder_id: ${batchFolderId}`,
  `Drive_file_id: ${pdfDriveId}`,
  `Drive_manifest_id: ${manifestDriveId}`,
  `Drive_sha256sums_id: ${sumsDriveId}`,
  'status: MEMOIR-CONFLICT',
  'academic_control: departure from New York on 3 February 1923',
  'academic_control: 3 August 1923',
  'production_rights: HOLD',
  'no public route or final reader prose created',
]) {
  if (!registry.includes(required)) throw new Error(`Duncan source registry lost stable boundary: ${required}`);
}

for (const required of [
  'BATCH-0002 OPEN / 1 DRIVE-VERIFIED MASTER / 6 BINARY-PENDING',
  '| P03-04 | Duncan/Macdougall',
  '`DRIVE-VERIFIED / BATCH ITEM 01`',
  `sha256: ${sha256}`,
  `Drive_file_id: ${pdfDriveId}`,
  'accepted_binary_pending_items: 6',
  'accepted_Drive_masters: 1',
  'Drive_PDF_file_ids_returned: 1',
  'empty_batch_folders_created: 0',
  'fake_or_HTML_as_PDF_files_created: 0',
]) {
  if (!acquisitionPass.includes(required)) throw new Error(`general acquisition pass lost accepted-master counter: ${required}`);
}

for (const forbidden of [
  /accepted_Drive_masters:\s*0/u,
  /Drive_PDF_file_ids_returned:\s*0/u,
  /P03-04[^\n]*BINARY-PENDING/u,
  /fake_or_HTML_as_PDF_files_created:\s*[1-9]/u,
]) {
  if (forbidden.test(acquisitionPass)) throw new Error(`general acquisition pass regressed verified master: ${forbidden}`);
}

for (const required of [
  'DRIVE-VERIFIED DERIVED TEXT / NOT A 1927 FACSIMILE / ORIGINAL SCAN STILL BINARY-PENDING',
  'yes2-gruzinov-conversations-wikisource-derived',
  'source_kind: DERIVED_TEXT_PDF',
  'facsimile_of_1927_edition: false',
  'canonical_archival_master: false',
  'pdf_pages: 41',
  'file_size_bytes: 297273',
  '9a9de51a32d73175392aed9bb35ad4e0f6e76aa867a0a2a0728005e1ad4a4cae',
  'first_page_rendered: true',
  'derived_folder_id: 1crO4gqDJDE2h7yDrD7U_eVq3tNc-hGp7',
  'PDF_Drive_file_id: 1SNcIOGipekg8t19CL9V-pkqcRN9YkpmW',
  'manifest_Drive_file_id: 1InGztTEEe7wrB7hFY331QkOfCaRNJ8Fx',
  'sha256sums_Drive_file_id: 17PXM_jRpkLTnkvQjh1DriDl0_6NGXfjl',
  'derived_Drive_uploaded: true',
  'original_1927_facsimile_acquired: false',
  'original_1927_facsimile_status: BINARY-PENDING',
  'do not cite PDF page 1–41 as the pagination of the 1927 edition',
  'do not close P03-03\'s original-facsimile acquisition gate',
]) {
  if (!gruzinovDerived.includes(required)) {
    throw new Error(`Gruzinov derived source lost representation/Drive boundary: ${required}`);
  }
}

for (const forbidden of [
  /facsimile_of_1927_edition:\s*true/u,
  /canonical_archival_master:\s*true/u,
  /original_1927_facsimile_acquired:\s*true/u,
  /original_1927_facsimile_status:\s*(?:VERIFIED|ACQUIRED|DRIVE-VERIFIED)/iu,
  /production_visual_rights_closed:\s*true/u,
]) {
  if (forbidden.test(gruzinovDerived)) {
    throw new Error(`Gruzinov derived source overstates facsimile/original status: ${forbidden}`);
  }
}

console.log(
  'Yesenin source acquisitions: 1 Drive-verified institutional master plus 1 separately stored Drive-verified derived text; SHA/pages/Drive IDs pinned, memoir conflicts and original-facsimile/rights HOLDs preserved.',
);
