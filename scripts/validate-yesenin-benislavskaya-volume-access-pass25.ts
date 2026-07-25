import { YESENIN_BENISLAVSKAYA_VOLUME_ACCESS_PASS_TWENTY_FIVE as evidence } from '../src/data/essays/yeseninBenislavskayaVolumeAccessPassTwentyFive';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const sha256Pattern = /^[a-f0-9]{64}$/u;
const expectedWitnessIds = [
  'CINII-BA27980118',
  'GORKY-BOOK-PAGE',
  'GORKY-EDD-SERVICE',
  'DUBNA-BOOK-LISTING',
  'HEIDELBERG-ITEM-REDIRECT',
];

assert(evidence.pass === 25, 'expected pass 25');
assert(evidence.acceptedDiagnostic.workflowRunId === 30177127505, 'unexpected diagnostic run');
assert(evidence.acceptedDiagnostic.artifactId === 8624522473, 'unexpected diagnostic artifact');
assert(
  evidence.acceptedDiagnostic.artifactDigest ===
    'sha256:65f2aa3aa4b031e5707fd765a3b9676f033b9296c20add8d9c997ef4512c073d',
  'unexpected diagnostic artifact digest',
);
assert(evidence.acceptedDiagnostic.diagnosticHead === 'ef4c8ae361491e2ff2b13b788dc12fc40e646985', 'unexpected diagnostic head');
assert(evidence.acceptedDiagnostic.diagnosticPullRequest === 201, 'unexpected diagnostic pull request');
assert(evidence.acceptedDiagnostic.diagnosticMerged === false, 'diagnostic pull request must remain unmerged');
assert(evidence.acceptedDiagnostic.successfulTargets === 5, 'unexpected successful-target count');
assert(evidence.acceptedDiagnostic.attemptedTargets === 6, 'unexpected attempted-target count');

assert(evidence.targetVolume.year === 1995, 'target volume year changed');
assert(evidence.targetVolume.pages === 607, 'target volume extent changed');
assert(evidence.targetVolume.isbn10 === '5-250-02529-3', 'target ISBN-10 changed');
assert(evidence.targetVolume.isbn13 === '978-5-250-02529-4', 'target ISBN-13 changed');
assert(evidence.targetVolume.ncid === 'BA27980118', 'target NCID changed');
assert(evidence.targetVolume.targetPrintedPages === '236–280', 'target printed-page range changed');
assert(evidence.targetVolume.targetPageStart === 236, 'target page start changed');
assert(evidence.targetVolume.targetPageEnd === 280, 'target page end changed');
assert(
  evidence.targetVolume.targetPageEnd - evidence.targetVolume.targetPageStart + 1 ===
    evidence.targetVolume.targetPageCountInclusive,
  'inclusive target-page count drift',
);
assert(evidence.targetVolume.targetPageCountInclusive === 45, 'expected 45 target pages');

assert(evidence.witnesses.length === 5, 'expected five fetched institutional records');
assert(JSON.stringify(evidence.witnesses.map((record) => record.id)) === JSON.stringify(expectedWitnessIds), 'witness order or identity changed');
assert(new Set(evidence.witnesses.map((record) => record.requestedUrl)).size === 5, 'duplicate witness URL');
for (const record of evidence.witnesses) {
  assert(record.status === 200, `${record.id}: expected HTTP 200`);
  assert(record.bytes > 500, `${record.id}: suspicious byte count`);
  assert(sha256Pattern.test(record.sha256), `${record.id}: invalid byte hash`);
  assert(sha256Pattern.test(record.visibleTextSha256), `${record.id}: invalid visible-text hash`);
  assert(record.legalDigitalFullTextFound === false, `${record.id}: full-text state changed`);
}

const cinii = evidence.witnesses[0];
assert(cinii.bytes === 57073, 'CiNii byte envelope changed');
assert(cinii.sha256 === '5c01eaa84cb3c7041d9a02a5d12f061ecf384e4ea5ad2f29107610e69dbc056a', 'CiNii hash changed');
assert(cinii.exactIdentityPassed === true, 'CiNii exact identity must remain verified');

const gorkyBook = evidence.witnesses[1];
assert(gorkyBook.bytes === 40033, 'Gorky book-page byte envelope changed');
assert(gorkyBook.sha256 === 'fefd0d83d8a578f6bea883d645e9727355b793e5753d0517cb4c9ea575e5012f', 'Gorky book-page hash changed');
assert(gorkyBook.exactIdentityPassed === true, 'Gorky exact book identity must remain verified');

const gorkyService = evidence.witnesses[2];
assert(gorkyService.grade === 'A+', 'Gorky EDD policy must remain A+');
assert(gorkyService.bytes === 46359, 'Gorky EDD policy byte envelope changed');
assert(gorkyService.sha256 === '34e390bbfd0fc381f8f47b6998b9db926a2c64264fe1bb60e0755ae6ca6871f5', 'Gorky EDD policy hash changed');
assert(gorkyService.exactIdentityPassed === true, 'Gorky EDD policy markers must remain verified');

const dubna = evidence.witnesses[3];
assert(dubna.charset === 'windows-1251', 'Dubna charset boundary changed');
assert(dubna.bytes === 38453, 'Dubna byte envelope changed');
assert(dubna.sha256 === 'd9f18436ef9eb9a0dc7ffa1277a24e131e1831ddc8b972706a426afa2c080172', 'Dubna hash changed');
assert(dubna.exactIdentityPassed === true, 'Dubna exact identity must remain verified');

const heidelberg = evidence.witnesses[4];
assert(heidelberg.grade === 'BOUNDARY', 'Heidelberg record must remain a redirect boundary');
assert(heidelberg.finalUrl === 'https://uni-heidelberg.on.worldcat.org/oclc/174224104', 'Heidelberg redirect destination changed');
assert(heidelberg.bytes === 628, 'Heidelberg redirect byte envelope changed');
assert(heidelberg.sha256 === 'dd483a204e573819c0895c539812568e9badc91395fbe186958feadeb19202ec', 'Heidelberg redirect hash changed');
assert(heidelberg.exactIdentityPassed === null, 'Heidelberg shell must not be promoted to exact identity');

assert(evidence.failedDiscoveryControl.grade === 'FAILED-DISCOVERY', 'WorldCat control must remain failed discovery');
assert(evidence.failedDiscoveryControl.status === 429, 'WorldCat failure status changed');
assert(evidence.failedDiscoveryControl.responseBytes === 8486, 'WorldCat failure byte envelope changed');
assert(evidence.failedDiscoveryControl.promotedToEvidence === false, 'WorldCat failure cannot be promoted');

assert(evidence.remoteRequestRoute.grade === 'A+', 'remote request route must remain A+');
assert(evidence.remoteRequestRoute.exactBookPageVerified, 'exact Gorky book page must remain verified');
assert(evidence.remoteRequestRoute.servicePolicyVerified, 'Gorky service policy must remain verified');
assert(evidence.remoteRequestRoute.orderFormUrl === 'https://www.gorkilib.ru/feedback/forma_electronic_document/', 'order form changed');
assert(evidence.remoteRequestRoute.serviceEmail === 'mba@gorkilib.ru', 'service email changed');
assert(evidence.remoteRequestRoute.requestMayBeSubmittedRemotely, 'remote request capability changed');
assert(evidence.remoteRequestRoute.policyAllowsShortBookFragmentsForPersonalScientificEducationalUse, 'allowed-use policy changed');
assert(evidence.remoteRequestRoute.pagePriceRublesObserved === 20, 'observed page rate changed');
assert(evidence.remoteRequestRoute.estimatedBasePageCostRubles === 900, 'base estimate changed');
assert(
  evidence.remoteRequestRoute.pagePriceRublesObserved * evidence.targetVolume.targetPageCountInclusive ===
    evidence.remoteRequestRoute.estimatedBasePageCostRubles,
  'page-rate calculation drift',
);
assert(evidence.remoteRequestRoute.estimateIsNotInvoice, 'estimate must not be represented as an invoice');
assert(evidence.remoteRequestRoute.fulfilmentSubjectToLibraryReview, 'fulfilment must remain subject to library review');
assert(evidence.remoteRequestRoute.priceAndAvailabilityMayChange, 'price and availability caveat must remain explicit');
assert(evidence.remoteRequestRoute.userContactAndPaymentDetailsRequired, 'request requires user-supplied contact/payment details');
assert(evidence.remoteRequestRoute.requestSubmitted === false, 'request has not been submitted');
assert(evidence.remoteRequestRoute.paymentAuthorized === false, 'payment has not been authorized');
assert(evidence.remoteRequestRoute.paymentMade === false, 'payment has not been made');
assert(evidence.remoteRequestRoute.scanAcquired === false, 'scan has not been acquired');

assert(evidence.classificationCorrections.ciniiSortorderIsNotOrderRoute, 'CiNii sortorder correction lost');
assert(evidence.classificationCorrections.dubnaJournalOrderIsIrrelevant, 'Dubna journal-order correction lost');
assert(evidence.classificationCorrections.gorkyPolicyPdfIsServiceDocumentNotTargetBook, 'Gorky service-PDF correction lost');
assert(evidence.classificationCorrections.heidelbergRedirectIsCatalogShellNotFullText, 'Heidelberg shell correction lost');

assert(evidence.effectiveState.exactInstitutionalIdentityRecords === 4, 'exact institutional identity count changed');
assert(evidence.effectiveState.legalDigitalFullTextFound === false, 'legal digital full text remains unavailable');
assert(evidence.effectiveState.relevantRemoteScanRouteVerified, 'remote scan route must remain verified');
assert(evidence.effectiveState.targetPagesAcquired === false, 'target pages remain unacquired');
assert(evidence.effectiveState.requestSubmitted === false, 'no request may be claimed');
assert(evidence.effectiveState.paymentAuthorized === false, 'no payment authorization may be claimed');
assert(evidence.effectiveState.paymentMade === false, 'no payment may be claimed');
assert(evidence.effectiveState.scanAcquired === false, 'no scan may be claimed');
assert(evidence.effectiveState.archiveOriginalsInspected === false, 'archive originals remain uninspected');
assert(evidence.effectiveState.diplomaticTranscriptionsClaimed === false, 'no diplomatic transcription may be claimed');
assert(evidence.effectiveState.wikipediaUsedAsEvidence === false, 'Wikipedia evidence is forbidden');
assert(evidence.effectiveState.syntheticContentUsed === false, 'synthetic evidence is forbidden');
assert(evidence.effectiveState.articlePublished === false, 'article remains unpublished');
assert(evidence.effectiveState.articleRegistered === false, 'article remains unregistered');
assert(evidence.effectiveState.productionAuthorized === false, 'production remains unauthorized');

console.log(
  `Yesenin Benislavskaya volume access pass 25 OK: ${evidence.witnesses.length}/6 fetched controls; ` +
    `${evidence.targetVolume.targetPageCountInclusive} target pages; remote route verified; request not submitted; scan not acquired.`,
);
