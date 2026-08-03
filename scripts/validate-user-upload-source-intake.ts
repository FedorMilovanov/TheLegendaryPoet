import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const researchDir = 'docs/research';
const intakePath = join(
  researchDir,
  'USER_UPLOAD_INTAKE_YESENIN_MAYAKOVSKY_2026-08-03.md',
);
const requiredPasses = [
  'MAYAKOVSKY_LATE_SOURCE_PASS_STRIZHNEVA_2005_2026-08.md',
  'MAYAKOVSKY_USER_UPLOAD_SOURCE_CORPUS_PASS_02_05_2026-08.md',
  'YESENIN_DECEMBER_1925_SOURCE_PASS_IMLI_2003_2026-08.md',
  'YESENIN_MEMOIR_CORPUS_SOURCE_PASS_1986_USER_UPLOAD_2026-08.md',
  'USER_UPLOAD_NON_PDF_SOURCE_PASS_2026-08-03.md',
].map((name) => join(researchDir, name));

for (const path of [intakePath, ...requiredPasses]) {
  if (!existsSync(path)) throw new Error(`missing user-upload intake control file: ${path}`);
}

const intake = readFileSync(intakePath, 'utf8');
const passes = requiredPasses.map((path) => readFileSync(path, 'utf8'));

for (const required of [
  '11/11 INGESTED / SHA VERIFIED / 9 CONTENT-MAPPED / 2 DJVU STRUCTURE-ONLY / ALL RIGHTS-HOLD',
  'objects_ingested: 11',
  'outer_SHA_verified: 11',
  'PDF_title_imprint_verified: 6',
  'PDF_content_source_passes: 6',
  'ZIP_inner_member_SHA_verified: 3',
  'DOC_texts_extracted_private: 2',
  'EPUB_cover_TOC_verified: 1',
  'DJVU_structure_verified: 2',
  'DJVU_title_imprint_verified: 0',
  'content_mapped_objects: 9',
  'structure_only_objects: 2',
  'exact_duplicate_hits_against_inspected_manifests: 0',
  'canonical_library_promotions: 0',
  'production_rights_closed: 0',
  'private_Drive_urls_allowed_in_public_essay_sources: false',
  'page_components: 640',
  'total_FORM_chunks: 667',
  'page_components: 1092',
  'total_FORM_chunks: 1202',
  'embedded_TXTz_chunks: 1084',
  'No new item is added to `src/data/essays` with a private Drive URL',
]) {
  if (!intake.includes(required)) throw new Error(`user-upload intake lost required boundary/result: ${required}`);
}

const itemIds = [...intake.matchAll(/UYM-2026-08-03-(\d{2})/gu)].map((match) => match[1]);
const uniqueItemIds = new Set(itemIds);
for (let number = 1; number <= 11; number += 1) {
  const id = String(number).padStart(2, '0');
  if (!uniqueItemIds.has(id)) throw new Error(`missing user-upload intake object UYM-2026-08-03-${id}`);
}

const expectedHashes = [
  '771ff33635afb489383dfc96c02aa3518fad1d694bb8d9780d258e5853eeed02',
  '9ff434570c592a0207ebbfeea2ea11c16c5d11fd05da2e3f5512734dd51e13bb',
  '521b439e33a3965e5788cd3ec63d67d16f5f8b8870c9cff821945f2c324f9b08',
  '48ed960feb2392a45e7b867fd3fb1479e70ad433704e87efe96bf4f22ac50321',
  '0da8c1369ce4672067baa663c995802bd27b9bfaaa8b475f35bcd15d6a35a318',
  '1be866ffee1d66ab8b1a7df8b40e32050a8f3713151472acd377bf59dfc3d0bd',
  'b60d949f8317164f29b41aa3e295efe49fea772bfe078a663c1a9ea3eb2a65cd',
  '1f205770874e875737e9b732f6730645c550277082b575ac968401d3144cc896',
  '2115ac558e226557cdad0b44e5cc461196a204bf25261bbc00b6015fe85ea778',
  '182d24a0984b88c6d66aeeb846b7ac3b13a0f2edb39245b8b1e03912ba7d4a7c',
  'ec5e78cd1d4d1adee0c7f4f08714c3bed7a37a1907941039681ba57f60ff72a9',
  'a89fa2fd28915c8ab70d397a6b6d96c5fd8be0cc06ee87fe32da37d04a4acd9f',
  '08d1ac9432f7bcde99bdd72205b099537c3b63b8714a265a646bc06bd65ba224',
  '42cdf6dcacf25b4383ce307a900a030859b25bb0d47c215acc910d2dc939612e',
];
for (const hash of expectedHashes) {
  if (!intake.includes(hash)) throw new Error(`user-upload intake lost expected SHA-256: ${hash}`);
}

for (const forbidden of [
  /canonical_library_promotions:\s*[1-9]/u,
  /production_rights_closed:\s*[1-9]/u,
  /private_Drive_urls_allowed_in_public_essay_sources:\s*true/u,
  /DJVU_title_imprint_verified:\s*[1-9]/u,
  /UYM-2026-08-03-06[^\n]{0,200}(?:666 pages|\| 666 \|)/u,
  /UYM-2026-08-03-11[^\n]{0,200}(?:1201 pages|\| 1201 \|)/u,
]) {
  if (forbidden.test(intake)) throw new Error(`user-upload intake restored a forbidden overclaim: ${forbidden}`);
}

for (const [index, pass] of passes.entries()) {
  if (!pass.includes('PRIVATE RESEARCH ONLY') && !pass.includes('PRIVATE-RESEARCH-ONLY')) {
    throw new Error(`source pass ${requiredPasses[index]} lost private-research boundary`);
  }
  if (!pass.includes('production_rights_closed: 0') && !pass.includes('rights_status:')) {
    throw new Error(`source pass ${requiredPasses[index]} lost rights boundary`);
  }
}

const driveFileIds = [
  '1SUu4HTatNpWq776bE0TyRe7ZEoEa1kUi',
  '1oXfqbdGSneRV8e9WLFSysvjDZ61hJjU4',
  '1oICUf4wSmEnzVSrhvmy-JA05xN81dteD',
  '12j6N0b_riMh8jhqaSkJRoEMsMHu3LZYv',
  '1CyaW9Pcz5x8vpIKhKl5bT0NTx8F1ZZK0',
  '13dACZDCMQQVJ2FoZ-Vs0tTXCqY_G_4jR',
  '1zoOkMxfed76w2FOQNXUM2oz5ymoAehoY',
  '1GsDn4KyY4WMN6g6hKdeVSdF0OdlDkvHs',
  '1VMtxiXehYRdk_1ynUpjYKG2IthO9PyYP',
  '1veLlXGVblw_RGV9qH4Dh7FdywQKdsnZy',
  '1nbSM4EF87AU-tEemw6qv9grHZ3b93Mh0',
];

const walkFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkFiles(path) : [path];
  });

for (const path of walkFiles('src')) {
  if (!/\.(?:ts|tsx|js|jsx|json|md)$/u.test(path)) continue;
  const content = readFileSync(path, 'utf8');
  for (const id of driveFileIds) {
    if (content.includes(id)) {
      throw new Error(`private user-upload Drive id leaked into public/runtime source: ${id} in ${path}`);
    }
  }
}

for (const root of ['public', 'src']) {
  const leakedBinary = walkFiles(root).find((path) =>
    /(?:Стрижнева|Михайлов|Янгфельдт|Прилепин|Есенин в воспоминаниях|Имя этой теме|Документы, факты, версии)/iu.test(path),
  );
  if (leakedBinary) throw new Error(`private source binary/derivative leaked into repository runtime tree: ${leakedBinary}`);
}

console.log(
  'User-upload source intake: 11/11 outer hashes, 9 content-mapped objects, 2 structure-only DjVu objects, 0 duplicates/promotions/rights closures and no private Drive ids in runtime sources.',
);
