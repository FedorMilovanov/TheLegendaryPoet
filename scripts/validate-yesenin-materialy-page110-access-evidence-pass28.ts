import { YESENIN_MATERIALY_PAGE_110_ACCESS_EVIDENCE_PASS_TWENTY_EIGHT as evidence } from '../src/data/essays/yeseninMaterialyPage110AccessEvidencePassTwentyEight';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const sha256Pattern = /^[a-f0-9]{64}$/u;
const expectedCardIds = [
  'P28-RSL-01001662767',
  'P28-NEB-RGDB-33452',
  'P28-NEB-RSL-001662767',
  'P28-NEB-0RC-70200',
];

assert(evidence.pass === 28, 'expected pass 28');
assert(evidence.target.isbn10 === '5860000073', 'ISBN-10 changed');
assert(evidence.target.isbn13 === '9785860000070', 'ISBN-13 changed');
assert(evidence.target.ncid === 'BA22825504', 'NCID changed');
assert(evidence.target.oclc === '29957297', 'OCLC changed');
assert(evidence.target.printedPage === 110, 'target page changed');

assert(evidence.acceptedDiagnostic.pullRequest === 212, 'diagnostic PR changed');
assert(evidence.acceptedDiagnostic.merged === false, 'diagnostic must remain unmerged');
assert(evidence.acceptedDiagnostic.exactHead === '35acd2d03783f87b59ffc84086e28723a4de78cd', 'diagnostic head changed');
assert(evidence.acceptedDiagnostic.workflowRunId === 30178774225, 'diagnostic run changed');
assert(evidence.acceptedDiagnostic.artifactId === 8625057559, 'diagnostic artifact changed');
assert(evidence.acceptedDiagnostic.artifactDigest === 'sha256:4ecb89ee182b938842de3e50e4b923e8d0fe24f0ec9da63d711b8de34cc9d759', 'artifact digest changed');
assert(evidence.acceptedDiagnostic.conclusion === 'success', 'diagnostic conclusion changed');

assert(evidence.exactIdentityWitness.authority === 'CiNii Research / NII', 'identity authority changed');
assert(evidence.exactIdentityWitness.url === 'https://ci.nii.ac.jp/ncid/BA22825504', 'CiNii URL changed');
assert(evidence.exactIdentityWitness.status === 200, 'CiNii response changed');
assert(evidence.exactIdentityWitness.bytes === 71_143, 'CiNii byte envelope changed');
assert(sha256Pattern.test(evidence.exactIdentityWitness.sha256), 'invalid CiNii SHA');
assert(sha256Pattern.test(evidence.exactIdentityWitness.visibleTextSha256), 'invalid CiNii visible-text SHA');
assert(evidence.exactIdentityWitness.exactTitlePresent, 'exact title marker lost');
assert(evidence.exactIdentityWitness.isbn10Present, 'ISBN marker lost');
assert(evidence.exactIdentityWitness.ncidPresent, 'NCID marker lost');
assert(evidence.exactIdentityWitness.page110LiteralPresent === false, 'page 110 must not be promoted from identity card');

assert(evidence.acceptedExactOfficialCards.length === 4, 'expected four exact official cards');
assert(JSON.stringify(evidence.acceptedExactOfficialCards.map((card) => card.id)) === JSON.stringify(expectedCardIds), 'card order or identity changed');
assert(new Set(evidence.acceptedExactOfficialCards.map((card) => card.url)).size === 4, 'duplicate exact card URL');
for (const card of evidence.acceptedExactOfficialCards) {
  assert(card.status === 200, `${card.id}: expected HTTP 200`);
  assert(card.bytes > 70_000, `${card.id}: implausible byte envelope`);
  assert(sha256Pattern.test(card.sha256), `${card.id}: invalid SHA-256`);
  assert(card.isbn10Present, `${card.id}: exact ISBN marker lost`);
  assert(card.physicalHolding, `${card.id}: holding marker lost`);
  assert(card.loginRequired, `${card.id}: login boundary lost`);
}

const rsl = evidence.acceptedExactOfficialCards[0];
assert(rsl.url === 'https://search.rsl.ru/ru/record/01001662767', 'RSL exact record changed');
assert(rsl.bytes === 72_848, 'RSL byte envelope changed');
assert(rsl.sha256 === '898cdc8b93f4a351d09cdfd60675dc3c3bcd14a6aa3606ceedd6efc2ecd4ad9a', 'RSL SHA changed');
assert(rsl.visibleTextSha256 === 'f8059623638f5c2b11afd75893304d6d7dad538c56737b7ff43af9baa0937142', 'RSL visible-text SHA changed');
assert(rsl.fragmentOrderUrl === 'https://search.rsl.ru/ru/fragment-eorder/rsl01001662767', 'literal fragment route changed');
assert(rsl.readingRoomOnly === false, 'RSL fragment service is not a reading-room-only card');

for (const card of evidence.acceptedExactOfficialCards.slice(1)) {
  assert(card.authority === 'Национальная электронная библиотека', `${card.id}: NEB authority changed`);
  assert(card.fragmentOrderUrl === null, `${card.id}: no fragment route was returned`);
  assert(card.readingRoomOnly, `${card.id}: reading-room boundary lost`);
  assert(card.visibleTextSha256 === null, `${card.id}: unpinned visible-text SHA must remain null`);
}

assert(evidence.discoveryCoverage.literalOfficialCandidateLinks === 26, 'candidate-link count changed');
assert(evidence.discoveryCoverage.acceptedExactOfficialCards === 4, 'accepted-card count changed');
assert(evidence.discoveryCoverage.exactFullTextCandidates === 0, 'full-text candidate count changed');
assert(evidence.discoveryCoverage.exactFragmentOrderCandidates === 1, 'fragment candidate count changed');
assert(evidence.discoveryCoverage.legalDigitalFullTextFound === false, 'legal full text remains unavailable');
assert(evidence.discoveryCoverage.page110LiteralOnAcceptedCard === false, 'page 110 must remain absent from accepted cards');

assert(evidence.effectiveState.state === 'exact-edition-and-fragment-order-route-verified-page110-uninspected', 'effective state changed');
assert(evidence.effectiveState.exactEditionVerified, 'exact edition verification lost');
assert(evidence.effectiveState.exactRslRecordResolved, 'RSL record resolution lost');
assert(evidence.effectiveState.literalFragmentOrderRouteResolved, 'fragment route resolution lost');
for (const [key, value] of Object.entries(evidence.effectiveState)) {
  if (['legalDigitalFullTextFound', 'printedPage110Inspected', 'fullBookAcquired', 'requestSubmitted', 'personalDataProvided', 'paymentAuthorized', 'paymentMade', 'scanAcquired', 'recordIdConstructed', 'viewerIdConstructed', 'pdfRouteConstructed', 'neighboringIdArithmeticUsed', 'ocrUsedForEvidence', 'syntheticContentUsed', 'productionAuthorized', 'articlePublished'].includes(key)) {
    assert(value === false, `${key} must remain false`);
  }
}
assert(evidence.effectiveState.remainingTarget.includes('01001662767'), 'remaining target must retain exact RSL record');
assert(evidence.effectiveState.remainingTarget.includes('page 110'), 'remaining target must retain exact page');

console.log('Yesenin Materialy page 110 access evidence pass 28 OK: exact edition and literal fragment-order route verified; page 110 uninspected.');
