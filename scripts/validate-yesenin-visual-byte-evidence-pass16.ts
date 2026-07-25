import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  yeseninVisualByteEvidencePassSixteen,
  yeseninVisualByteEvidencePassSixteenEnvelope,
} from '../src/data/essays/yeseninVisualByteEvidencePassSixteen';
import {
  yeseninVisualPlacementEffectiveStatePassSixteen,
  yeseninVisualPlacementEffectiveStatePassSixteenSummary,
} from '../src/data/essays/yeseninVisualPlacementEffectiveStatePassSixteen';

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const fail = (message: string): never => {
  throw new Error(`[yesenin-visual-byte-evidence-pass16] ${message}`);
};

if (yeseninVisualByteEvidencePassSixteen.length !== 12) {
  fail(`expected 12 institutional objects, found ${yeseninVisualByteEvidencePassSixteen.length}`);
}

const ids = new Set<string>();
const shas = new Set<string>();
let totalBytes = 0;
let rgali = 0;
let loc = 0;
let production = 0;
for (const record of yeseninVisualByteEvidencePassSixteen) {
  if (ids.has(record.id)) fail(`duplicate id ${record.id}`);
  ids.add(record.id);
  if (shas.has(record.sha256)) fail(`duplicate SHA ${record.sha256}`);
  shas.add(record.sha256);
  if (!/^[a-f0-9]{64}$/.test(record.sha256)) fail(`${record.id}: malformed SHA-256`);
  if (!record.recordUrl.startsWith('https://') || !record.directOriginalUrl.startsWith('https://')) {
    fail(`${record.id}: institutional URLs must use HTTPS`);
  }
  if (record.mime !== 'image/jpeg') fail(`${record.id}: unexpected MIME ${record.mime}`);
  if (record.width < 400 || record.height < 700 || record.bytes < 100_000) {
    fail(`${record.id}: implausible dimensions or byte count`);
  }
  if (
    record.artifactRunId !== 30163323587 ||
    record.artifactId !== 8620844115 ||
    !record.acquiredFromExactInstitutionalUrl ||
    !record.magicBytesVerified ||
    !record.dimensionsVerified ||
    !record.visuallyInspected ||
    record.syntheticContentUsed
  ) {
    fail(`${record.id}: acquisition verification flags regressed`);
  }
  if (record.productionAuthorized) production += 1;
  if (record.authority === 'РГАЛИ') rgali += 1;
  if (record.authority === 'Library of Congress') loc += 1;
  totalBytes += record.bytes;
}

if (rgali !== 8 || loc !== 4) fail(`authority distribution changed: RGALI=${rgali}, LOC=${loc}`);
if (totalBytes !== 37_391_355) fail(`aggregate bytes changed: ${totalBytes}`);
if (production !== 0) fail(`production authorization must remain zero, found ${production}`);

const envelope = yeseninVisualByteEvidencePassSixteenEnvelope;
if (
  envelope.artifactRunId !== 30163323587 ||
  envelope.artifactId !== 8620844115 ||
  envelope.artifactDigest !== 'sha256:62ba5931ce8bbdfc503dd44419b9f49809920a6877c69664f9d364c4d7874277' ||
  envelope.objects !== 12 ||
  envelope.rgaliObjects !== 8 ||
  envelope.locObjects !== 4 ||
  envelope.totalBytes !== 37_391_355 ||
  !envelope.allMagicBytesVerified ||
  !envelope.allDimensionsVerified ||
  !envelope.allVisuallyInspected ||
  envelope.syntheticContentUsed ||
  envelope.productionAuthorizedObjects !== 0
) {
  fail('artifact envelope regressed');
}

const exactRecords = new Map(yeseninVisualByteEvidencePassSixteen.map((record) => [record.id, record]));
const expected: Record<string, readonly [number, number, number, string]> = {
  'VBE16-RGALI-86424': [2064, 3222, 2_799_185, 'b294564e3275c2c237edc5220f2bf24edfb5d0cca019caba8909cf76966b9d15'],
  'VBE16-RGALI-86425': [4149, 2674, 7_606_620, '912887c91222368835477feaa9fa8f7df04e955ebb4f2758237abe801fa59583'],
  'VBE16-RGALI-86426': [1991, 2599, 3_441_322, 'bf174f074f7d075cf4a2deb13cd4872f5db842efd349a555e3b0d7287ebb20a9'],
  'VBE16-RGALI-86427': [1039, 1999, 1_355_987, 'ba3053edd512937e716966941219307a51a3cf9612f8ddc1fd864bf88fc4175b'],
  'VBE16-RGALI-86428': [3132, 4209, 9_494_398, '8304f8e20f93c09726d4e7f9cf725710ac21e904cf3d7061a673904aadf3a55b'],
  'VBE16-RGALI-86429': [1984, 2572, 3_382_701, '13524e1b54b81a0cc986d830bdb0e09511b53cfcd1bec31784b56844376bba35'],
  'VBE16-RGALI-86430': [490, 796, 177_412, 'f786b1dcbe20df419217a53f9cc2c589c5a6f50ffdea0d81c179ccfc4c79948b'],
  'VBE16-RGALI-86431': [2310, 3521, 8_214_899, '1e14cae5027ce84efd30f8a58422e7ce444ef966e4229104642c95a22fb53768'],
  'VBE16-LOC-7A14235': [743, 1024, 158_927, '49dba4d0511e74d87d24a6140e7e1765b3bbb109a6ec042d0ae12e53745d053b'],
  'VBE16-LOC-7A00247': [1024, 791, 317_331, '0d63f9221634cadc12f5ea2cd1acdf51e783f880a0b17a04a4fccad35c6a9e55'],
  'VBE16-LOC-7A00253': [1024, 786, 317_252, '9e1658e9ce47da8484a2bdcee3b34fd6e28a7b39f21bac244d2c08931e224c77'],
  'VBE16-LOC-BAIN-05654': [744, 1024, 125_321, '4a75c98714a547331f02409413f97cc1d9aacded0def55aae90fe0fd432e1783'],
};
for (const [id, [width, height, bytes, sha]] of Object.entries(expected)) {
  const record = exactRecords.get(id as (typeof yeseninVisualByteEvidencePassSixteen)[number]['id']);
  if (!record) fail(`missing exact record ${id}`);
  if (record.width !== width || record.height !== height || record.bytes !== bytes || record.sha256 !== sha) {
    fail(`${id}: exact byte identity changed`);
  }
}

const dancer = exactRecords.get('VBE16-LOC-7A14235');
const duncan = exactRecords.get('VBE16-LOC-BAIN-05654');
if (!dancer || !duncan) fail('Duncan correction records missing');
if (
  dancer.placementId !== null ||
  !dancer.captionBoundary.includes('не портрет самой Айседоры') ||
  duncan.placementId !== 'VIS-YE1-P15-016' ||
  !duncan.captionBoundary.includes('запрещены подписи «Москва, 1921»')
) {
  fail('Genthe dancer / Bain Duncan correction regressed');
}

if (yeseninVisualPlacementEffectiveStatePassSixteen.length !== 16) {
  fail('effective visual placement count changed');
}
if (
  yeseninVisualPlacementEffectiveStatePassSixteenSummary.byteAcquiredPlacements !== 9 ||
  yeseninVisualPlacementEffectiveStatePassSixteenSummary.pendingPlacements !== 7 ||
  yeseninVisualPlacementEffectiveStatePassSixteenSummary.acquiredInstitutionalObjects !== 12 ||
  yeseninVisualPlacementEffectiveStatePassSixteenSummary.acquiredBytes !== 37_391_355 ||
  yeseninVisualPlacementEffectiveStatePassSixteenSummary.productionAuthorizedPlacements !== 0 ||
  yeseninVisualPlacementEffectiveStatePassSixteenSummary.duncanPortraitPlacement !== 'VBE16-LOC-BAIN-05654' ||
  yeseninVisualPlacementEffectiveStatePassSixteenSummary.gentheDancerExcludedFromPortraitPlacement !== 'VBE16-LOC-7A14235'
) {
  fail('effective visual placement summary regressed');
}

const effectiveDuncan = yeseninVisualPlacementEffectiveStatePassSixteen.find(
  (placement) => placement.placementId === 'VIS-YE1-P15-016',
);
if (
  !effectiveDuncan ||
  effectiveDuncan.byteEvidenceId !== 'VBE16-LOC-BAIN-05654' ||
  effectiveDuncan.title !== 'Айседора Дункан. Фотография Bain News Service' ||
  effectiveDuncan.originalSha256 !== '4a75c98714a547331f02409413f97cc1d9aacded0def55aae90fe0fd432e1783' ||
  effectiveDuncan.productionAuthorized !== false ||
  !effectiveDuncan.supersessionNote?.includes('7a14235')
) {
  fail('effective Duncan placement is not pinned to the visually verified Bain portrait');
}

const docPath = 'research/yesenin/PART_ONE_VISUAL_BYTE_EVIDENCE_PASS16_2026-07-25.md';
const doc = read(docPath);
for (const marker of [
  '12/12-INSTITUTIONAL-JPEG',
  '37,391,355-BYTES',
  'PRODUCTION-AUTHORIZATION-ZERO',
  '30163323587',
  '8620844115',
  'sha256:62ba5931ce8bbdfc503dd44419b9f49809920a6877c69664f9d364c4d7874277',
  'танцовщица школы Дункан',
  'Bain `LC-DIG-ggbain-05654`',
  '9 получили реальные institutional bytes',
  '0 разрешены для production',
] as const) {
  if (!doc.includes(marker)) fail(`${docPath}: missing marker ${marker}`);
}
if ((doc.match(/^\| VBE16-/gm) ?? []).length !== 12) fail(`${docPath}: evidence table lost objects`);

const essayIndex = read('src/data/essays/index.ts');
if (essayIndex.includes('essay-yesenin-1895-1921') || essayIndex.includes("slug: 'yesenin-1895-1921'")) {
  fail('unpublished article was registered');
}

console.log(JSON.stringify({
  objects: yeseninVisualByteEvidencePassSixteen.length,
  authorities: { rgali, loc },
  totalBytes,
  effectivePlacements: yeseninVisualPlacementEffectiveStatePassSixteen.length,
  acquiredPlacements: yeseninVisualPlacementEffectiveStatePassSixteenSummary.byteAcquiredPlacements,
  pendingPlacements: yeseninVisualPlacementEffectiveStatePassSixteenSummary.pendingPlacements,
  duncanPortrait: yeseninVisualPlacementEffectiveStatePassSixteenSummary.duncanPortraitPlacement,
  gentheDancerExcluded: yeseninVisualPlacementEffectiveStatePassSixteenSummary.gentheDancerExcludedFromPortraitPlacement,
  productionAuthorized: 0,
  articleRegistered: false,
}, null, 2));
