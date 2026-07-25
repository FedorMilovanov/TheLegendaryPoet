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

assert(evidence.acceptedDiagnostics.length === 2, 'expected two accepted diagnostics');
const discovery = evidence.acceptedDiagnostics[0];
assert(discovery.pullRequest === 212, 'discovery diagnostic PR changed');
assert(discovery.merged === false, 'diagnostic 212 must remain unmerged');
assert(discovery.exactHead === '35acd2d03783f87b59ffc84086e28723a4de78cd', 'diagnostic 212 head changed');
assert(discovery.workflowRunId === 30178774225, 'diagnostic 212 run changed');
assert(discovery.artifactId === 8625057559, 'diagnostic 212 artifact changed');
assert(discovery.artifactDigest === 'sha256:4ecb89ee182b938842de3e50e4b923e8d0fe24f0ec9da63d711b8de34cc9d759', 'diagnostic 212 digest changed');
assert(discovery.conclusion === 'success', 'diagnostic 212 conclusion changed');

const routeDiagnostic = evidence.acceptedDiagnostics[1];
assert(routeDiagnostic.pullRequest === 216, 'route diagnostic PR changed');
assert(routeDiagnostic.merged === false, 'diagnostic 216 must remain unmerged');
assert(routeDiagnostic.exactHead === 'd14805d18a018fc7be387737e215c77d6dafaf46', 'diagnostic 216 head changed');
assert(routeDiagnostic.workflowRunId === 30179443923, 'diagnostic 216 run changed');
assert(routeDiagnostic.artifactId === 8625136560, 'diagnostic 216 artifact changed');
assert(routeDiagnostic.artifactDigest === 'sha256:7e670ba7ffe5149634ebf6da8b76b8f29536a1278a520b5811f7b46f4f668d47', 'diagnostic 216 digest changed');
assert(routeDiagnostic.conclusion === 'success', 'diagnostic 216 conclusion changed');

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
  assert(card.readingRoomLoginRequired, `${card.id}: reading-room login boundary lost`);
}

const rsl = evidence.acceptedExactOfficialCards[0];
assert(rsl.url === 'https://search.rsl.ru/ru/record/01001662767', 'RSL exact record changed');
assert(rsl.bytes === 72_848, 'RSL byte envelope changed');
assert(rsl.sha256 === '898cdc8b93f4a351d09cdfd60675dc3c3bcd14a6aa3606ceedd6efc2ecd4ad9a', 'RSL SHA changed');
assert(rsl.visibleTextSha256 === 'f8059623638f5c2b11afd75893304d6d7dad538c56737b7ff43af9baa0937142', 'RSL visible-text SHA changed');
assert(rsl.fragmentOrderUrl === 'https://search.rsl.ru/ru/fragment-eorder/rsl01001662767', 'literal fragment route changed');
assert(rsl.readingRoomOrderUrl === 'https://search.rsl.ru/ru/eorder/request?id=01001662767', 'reading-room route changed');
assert(rsl.readingRoomOnly === false, 'RSL fragment service is not a reading-room-only card');

for (const card of evidence.acceptedExactOfficialCards.slice(1)) {
  assert(card.authority === 'Национальная электронная библиотека', `${card.id}: NEB authority changed`);
  assert(card.fragmentOrderUrl === null, `${card.id}: no fragment route was returned`);
  assert(card.readingRoomOrderUrl === null, `${card.id}: no reading-room order URL was pinned`);
  assert(card.readingRoomOnly, `${card.id}: reading-room boundary lost`);
  assert(card.visibleTextSha256 === null, `${card.id}: unpinned visible-text SHA must remain null`);
}

const fragment = evidence.liveFragmentRouteWitness;
assert(fragment.requestedUrl === rsl.fragmentOrderUrl, 'fragment request provenance changed');
assert(fragment.finalUrl === 'https://forms.yandex.ru/cloud/624acd6d7eeddb283d331d10/', 'live fragment form URL changed');
assert(fragment.status === 200, 'fragment form must remain HTTP 200');
assert(fragment.bytes === 79_518, 'fragment form byte envelope changed');
assert(fragment.sha256 === '97db4589e10344ec41d5636c92a66c185aed4ccb7740d5c43f980d0ad7a63154', 'fragment form SHA changed');
assert(fragment.visibleTextBytes === 2_331, 'fragment visible-text envelope changed');
assert(fragment.visibleTextSha256 === 'e4bfb81e0b685d6b24c0b0424ac45e8fddb05b85f567cb8a010af24f0af918b1', 'fragment visible-text SHA changed');
assert(fragment.title.includes('Заказ копии фрагмента документа'), 'fragment form title changed');
assert(fragment.authenticationRequired === false, 'fragment form must remain reachable without login');
assert(fragment.genericOrderInputFieldsPresent, 'fragment input fields lost');
assert(fragment.anonymousOrderFieldsClassifiedAvailable === false, 'runner classification of anonymous order fields changed');
assert(fragment.exactBookPreloaded === false, 'exact book was not preloaded');
assert(fragment.isbnPreloaded === false, 'ISBN was not preloaded');
assert(fragment.printedPage110Preloaded === false, 'page 110 was not preloaded');
assert(fragment.explicitPageRangeFieldPresent === false, 'explicit page range field was not identified');
assert(fragment.priceInformationPresent, 'price information marker lost');
assert(fragment.paymentFormPresent === false, 'payment form remains absent');
assert(fragment.requestSubmitted === false, 'fragment request remains unsubmitted');

const readingRoom = evidence.readingRoomRouteWitness;
assert(readingRoom.requestedUrl === rsl.readingRoomOrderUrl, 'reading-room request provenance changed');
assert(readingRoom.finalUrl === rsl.url, 'reading-room route must return to exact card anonymously');
assert(readingRoom.status === 200, 'reading-room route must remain HTTP 200');
assert(readingRoom.bytes === 72_848, 'reading-room byte envelope changed');
assert(readingRoom.sha256 === '2c1dd0e167d5739122778dd3c2394b6abf16c6013d21e608117297c6f5c9a720', 'reading-room SHA changed');
assert(readingRoom.visibleTextSha256 === 'f8059623638f5c2b11afd75893304d6d7dad538c56737b7ff43af9baa0937142', 'reading-room visible-text SHA changed');
assert(readingRoom.exactBookPresent && readingRoom.isbn10Present, 'reading-room exact identity lost');
assert(readingRoom.authenticationRequired, 'reading-room authentication boundary lost');
assert(readingRoom.orderSessionEstablished === false, 'anonymous reading-room order session must remain false');

assert(evidence.discoveryCoverage.literalOfficialCandidateLinks === 26, 'candidate-link count changed');
assert(evidence.discoveryCoverage.acceptedExactOfficialCards === 4, 'accepted-card count changed');
assert(evidence.discoveryCoverage.exactFullTextCandidates === 0, 'full-text candidate count changed');
assert(evidence.discoveryCoverage.exactFragmentOrderCandidates === 1, 'fragment candidate count changed');
assert(evidence.discoveryCoverage.liveFragmentFormResolved, 'live fragment form resolution lost');
assert(evidence.discoveryCoverage.legalDigitalFullTextFound === false, 'legal full text remains unavailable');
assert(evidence.discoveryCoverage.page110LiteralOnAcceptedCard === false, 'page 110 must remain absent from accepted cards');

assert(evidence.effectiveState.state === 'exact-edition-and-live-fragment-form-verified-page110-uninspected', 'effective state changed');
assert(evidence.effectiveState.exactEditionVerified, 'exact edition verification lost');
assert(evidence.effectiveState.exactRslRecordResolved, 'RSL record resolution lost');
assert(evidence.effectiveState.literalFragmentOrderRouteResolved, 'fragment route resolution lost');
assert(evidence.effectiveState.liveFragmentFormResolved, 'live form resolution lost');
assert(evidence.effectiveState.fragmentFormAuthenticationRequired === false, 'fragment form authentication state changed');
assert(evidence.effectiveState.readingRoomAuthenticationRequired, 'reading-room authentication state changed');
for (const [key, value] of Object.entries(evidence.effectiveState)) {
  if (['legalDigitalFullTextFound', 'printedPage110Inspected', 'fullBookAcquired', 'requestSubmitted', 'personalDataProvided', 'paymentAuthorized', 'paymentMade', 'scanAcquired', 'recordIdConstructed', 'viewerIdConstructed', 'pdfRouteConstructed', 'neighboringIdArithmeticUsed', 'ocrUsedForEvidence', 'syntheticContentUsed', 'productionAuthorized', 'articlePublished'].includes(key)) {
    assert(value === false, `${key} must remain false`);
  }
}
assert(evidence.effectiveState.remainingTarget.includes('01001662767'), 'remaining target must retain exact RSL record');
assert(evidence.effectiveState.remainingTarget.includes('page 110'), 'remaining target must retain exact page');
assert(evidence.effectiveState.remainingTarget.includes('separately authorized'), 'remaining target must require separate authorization');

console.log('Yesenin Materialy page 110 access evidence pass 28 OK: exact edition and live RSL fragment form verified; no request submitted; page 110 uninspected.');
