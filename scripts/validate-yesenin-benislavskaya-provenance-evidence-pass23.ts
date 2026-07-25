import { createHash } from 'node:crypto';
import {
  yeseninBenislavskayaProvenanceBoundariesPassTwentyThree as boundaries,
  yeseninBenislavskayaProvenanceCategoryCountsPassTwentyThree as categoryCounts,
  yeseninBenislavskayaProvenanceEnvelopePassTwentyThree as envelope,
  yeseninBenislavskayaProvenanceRecordsPassTwentyThree as records,
} from '../src/data/essays/yeseninBenislavskayaProvenancePassTwentyThree';

const errors: string[] = [];
const fail = (message: string) => errors.push(message);
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

if (envelope.runId !== 30174202283) fail('diagnostic run changed');
if (envelope.exactHead !== 'ec4392ce5b8e02f1a4daf9be3172723de10a73c5') fail('diagnostic head changed');
if (envelope.artifactId !== 8623752441) fail('artifact id changed');
if (envelope.artifactDigest !== 'df2b5b4b32feb8ccf7a8dbfe4ec9196980e37d0cce58b39656b88fccc5b42aa6') fail('artifact digest changed');
if (envelope.commentsUrl !== 'https://feb-web.ru/feb/esenin/texts/es6/es6-233-.htm?cmd=p') fail('comments URL changed');
if (envelope.commentsHtmlBytes !== 1_132_285) fail('comments byte envelope changed');
if (envelope.commentsHtmlSha256 !== 'aeb225d31c35ae52a9d44e06fd37d070bbd547b2c0f9c432b69bb51640ae4124') fail('comments HTML SHA changed');
if (envelope.commentsVisibleTextSha256 !== 'efc2cb78b2cc83acdd6e0468e321a64d0b3859dcdfff6425fa133673249ec383') fail('comments visible-text SHA changed');
if (envelope.mainSectionCount !== 257 || envelope.selectedSectionCount !== 35) fail('PSS section counts changed');

if (records.length !== 35) fail(`record count ${records.length} != 35`);
const expectedPages = [127,136,159,160,160,166,167,167,170,170,175,179,180,183,184,186,186,187,189,191,197,201,201,202,202,202,207,208,209,211,211,212,212,214,215];
if (JSON.stringify(records.map((record) => record.printedPage)) !== JSON.stringify(expectedPages)) fail('printed-page sequence changed');
if (new Set(records.map((record) => record.documentNumber)).size !== 35) fail('document numbers are not unique');
if (records.some((record, index) => record.sequence !== index + 1)) fail('sequence is not 1–35');
if (records.some((record) => !/^[a-f0-9]{64}$/.test(record.sectionVisibleSha256))) fail('section SHA malformed');
if (records.some((record) => !record.sourceFormula.startsWith('Печатается') && !record.sourceFormula.startsWith('Публикуется'))) fail('source formula marker missing');
const joint = records.filter((record) => record.coRecipient !== null);
if (joint.length !== 1 || joint[0]?.documentNumber !== 215 || joint[0]?.coRecipient !== 'Е. А. Есениной') fail('joint-recipient state changed');

const observedCounts = Object.fromEntries(Object.keys(categoryCounts).map((category) => [category, records.filter((record) => record.category === category).length]));
if (JSON.stringify(observedCounts) !== JSON.stringify(categoryCounts)) fail(`category distribution changed: ${JSON.stringify(observedCounts)}`);
if (categoryCounts['photocopy-of-autograph'] !== 22) fail('photocopy-of-autograph count changed');
if (Object.values(categoryCounts).reduce((sum, count) => sum + count, 0) !== 35) fail('category counts do not total 35');

const digest = sha256(JSON.stringify(records.map((record) => ({
  sequence: record.sequence,
  documentNumber: record.documentNumber,
  dateLabel: record.dateLabel,
  printedPage: record.printedPage,
  coRecipient: record.coRecipient,
  category: record.category,
  sourceFormula: record.sourceFormula,
  sectionHtmlBytes: record.sectionHtmlBytes,
  sectionVisibleSha256: record.sectionVisibleSha256,
}))));
if (digest !== envelope.recordMatrixDigest) fail(`matrix digest changed: ${digest}`);
if (envelope.recordMatrixDigest !== '546354f99e937e8f3da38192fe689c18529c27f3994c8228f3a0127ce7f18c13') fail('pinned matrix digest changed');

for (const [name, value] of Object.entries(boundaries)) {
  if (name === 'formulasAreAcademicCommentary') {
    if (value !== true) fail('academic-commentary boundary changed');
  } else if (value !== false) fail(`${name} must remain false`);
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
console.log(`Benislavskaya provenance pass 23: ${records.length}/35 PSS formulas, 11 provenance categories, 22 photocopies of autographs; archive originals and inbound texts remain unacquired.`);
