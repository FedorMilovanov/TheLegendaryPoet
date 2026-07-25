import { createHash } from 'node:crypto';
import {
  yeseninBenislavskayaCorrespondenceDiscoveryPassTwentyTwo as run,
  yeseninBenislavskayaCorrespondencePendingPassTwentyTwo as pending,
  yeseninBenislavskayaCorrespondenceRecordsPassTwentyTwo as records,
} from '../src/data/essays/yeseninBenislavskayaCorrespondenceEvidencePassTwentyTwo';

const errors: string[] = [];
const fail = (message: string) => errors.push(message);
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

if (run.runId !== 30173254271) fail('exact diagnostic run changed');
if (run.exactHead !== 'db9f8b3c0e17795248d9608d1b5ce84813df535b') fail('exact diagnostic head changed');
if (run.artifactId !== 8623497977) fail('artifact id changed');
if (run.artifactDigest !== '92248e604fca362148a070d8a7376c9d9e41ab4503df2c90a1d4aadc1a02541d') fail('artifact digest changed');
if (run.sitemapUrl !== 'https://feb-web.ru/feb/esenin/sitemap.htm') fail('FEB sitemap locator changed');
if (run.nameIndexUrl !== 'https://feb-web.ru/feb/esenin/texts/es6/es6-754-.htm?cmd=p') fail('PSS name-index locator changed');
if (!run.edition.includes('Т. 6') || !run.edition.includes('1999')) fail('controlling PSS edition changed');

for (const [name, actual, expected] of [
  ['sitemap candidates', run.sitemapCandidates, 35],
  ['index outbound documents', run.indexOutboundDocuments, 35],
  ['index inbound letters', run.indexInboundLetters, 14],
  ['acquired pages', run.acquiredOfficialPublishedPages, 35],
  ['official HTML bytes', run.totalOfficialHtmlBytes, 190_833],
  ['letter records', run.letterRecords, 33],
  ['telegram records', run.telegramRecords, 2],
  ['joint-recipient records', run.jointRecipientRecords, 1],
] as const) {
  if (actual !== expected) fail(`${name} changed: ${actual} !== ${expected}`);
}

for (const [name, value] of [
  ['inbound letter texts acquired', run.inboundLetterTextsAcquired],
  ['archive originals inspected', run.archiveOriginalsInspected],
  ['individual autograph status verified', run.autographStatusIndividuallyVerified],
  ['diplomatic transcription made', run.diplomaticTranscriptionMade],
  ['OCR used', run.ocrUsed],
  ['synthetic content used', run.syntheticContentUsed],
  ['production authorized', run.productionAuthorized],
  ['article published', run.articlePublished],
  ['article registered', run.articleRegistered],
  ['Wikipedia used as evidence', run.wikipediaUsedAsEvidence],
] as const) {
  if (value !== false) fail(`${name} must remain false`);
}

if (records.length !== 35) fail(`record count changed: ${records.length}`);
const urls = new Set<string>();
const hashes = new Set<string>();
let byteTotal = 0;
let letterCount = 0;
let telegramCount = 0;
let jointCount = 0;
const allPages: number[] = [];

records.forEach((record, index) => {
  const [sequence, label, url, bytes, hash, pages, kind, joint] = record;
  if (sequence !== index + 1) fail(`sequence ${sequence} is out of order at index ${index}`);
  if (!label.startsWith('Бениславской Г. А.')) fail(`${sequence}: exact recipient label changed`);
  if (!/^https:\/\/feb-web\.ru\/feb\/esenin\/texts\/es6\/es6-\d+\.htm\?cmd=p$/.test(url)) fail(`${sequence}: invalid FEB print URL`);
  if (urls.has(url)) fail(`${sequence}: duplicate URL`);
  urls.add(url);
  if (!Number.isInteger(bytes) || bytes < 4_000) fail(`${sequence}: invalid HTML byte count`);
  byteTotal += bytes;
  if (!/^[a-f0-9]{64}$/.test(hash)) fail(`${sequence}: malformed SHA-256`);
  if (hashes.has(hash)) fail(`${sequence}: duplicate SHA-256`);
  hashes.add(hash);
  if (pages.length === 0 || pages.some((page) => !Number.isInteger(page) || page < 127 || page > 215)) fail(`${sequence}: invalid printed-page markers`);
  allPages.push(...pages);
  if (kind === 'letter') letterCount += 1;
  else if (kind === 'telegram-or-telegram-text') telegramCount += 1;
  else fail(`${sequence}: unsupported document kind`);
  if (joint) jointCount += 1;
});

if (byteTotal !== run.totalOfficialHtmlBytes) fail(`record byte total ${byteTotal} != ${run.totalOfficialHtmlBytes}`);
if (letterCount !== 33 || telegramCount !== 2) fail(`kind distribution changed: ${letterCount}/${telegramCount}`);
if (jointCount !== 1 || records.find((record) => record[7])?.[0] !== 30) fail('joint-recipient record must remain sequence 30');
if (Math.min(...allPages) !== 127 || Math.max(...allPages) !== 215) fail('printed-page range must remain 127–215');
if (records[0]?.[1] !== 'Бениславской Г. А., 5 октября 1921') fail('first correspondence record changed');
if (records.at(-1)?.[1] !== 'Бениславской Г. А., 25 мая 1925') fail('last correspondence record changed');

const digestPayload = records.map(([sequence, label, url, bytes, sha, pages, kind, joint]) => ({
  sequence,
  label,
  url,
  bytes,
  sha,
  pages,
  kind,
  joint,
}));
const ledgerDigest = sha256(JSON.stringify(digestPayload));
if (ledgerDigest !== run.ledgerDigest) fail(`ledger digest changed: ${ledgerDigest}`);
if (run.ledgerDigest !== '195e7657e5f4daede70df16d3897d6a18dec61586ed875ea7a5934b344e7bd23') fail('pinned ledger digest changed');

if (pending.length !== 3) fail('pending-target count must remain three');
const pendingIds = new Set(pending.map(([id]) => id));
for (const id of ['benislavskaya-inbound-fourteen', 'benislavskaya-individual-provenance', 'benislavskaya-diary-facsimile']) {
  if (!pendingIds.has(id)) fail(`pending target disappeared: ${id}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(
  `Benislavskaya correspondence pass 22: ${records.length}/35 official FEB published-text pages, `
  + `${byteTotal} bytes, ${letterCount} letters, ${telegramCount} telegram records, `
  + `PSS index 35 outbound / 14 inbound; archive originals and inbound texts remain unacquired.`,
);
