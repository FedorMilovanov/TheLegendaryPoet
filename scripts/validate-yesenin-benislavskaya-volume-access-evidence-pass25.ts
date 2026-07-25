import { YESENIN_BENISLAVSKAYA_VOLUME_ACCESS_PASS_TWENTY_FIVE as evidence } from '../src/data/essays/yeseninBenislavskayaVolumeAccessEvidencePassTwentyFive';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const shaPattern = /^[a-f0-9]{64}$/u;

assert(evidence.pass === 25, 'expected pass 25');
assert(evidence.acceptedDiagnostic.pullRequest === 201, 'unexpected diagnostic PR');
assert(evidence.acceptedDiagnostic.diagnosticMerged === false, 'diagnostic PR must remain unmerged');
assert(evidence.acceptedDiagnostic.workflowRunId === 30177127505, 'unexpected workflow run');
assert(evidence.acceptedDiagnostic.artifactId === 8624522473, 'unexpected artifact id');
assert(
  evidence.acceptedDiagnostic.artifactDigest ===
    'sha256:65f2aa3aa4b031e5707fd765a3b9676f033b9296c20add8d9c997ef4512c073d',
  'unexpected artifact digest',
);

assert(evidence.targetVolume.year === 1995, 'target year changed');
assert(evidence.targetVolume.extentPages === 607, 'target extent changed');
assert(evidence.targetVolume.isbn10 === '5-250-02529-3', 'target ISBN-10 changed');
assert(evidence.targetVolume.isbn13 === '978-5-250-02529-4', 'target ISBN-13 changed');
assert(evidence.targetVolume.ncid === 'BA27980118', 'target NCID changed');
assert(evidence.targetVolume.targetPrintedPageStart === 236, 'target start page changed');
assert(evidence.targetVolume.targetPrintedPageEnd === 280, 'target end page changed');
assert(evidence.targetVolume.targetPageCountInclusive === 45, 'inclusive page count changed');
assert(
  evidence.targetVolume.targetPrintedPageEnd - evidence.targetVolume.targetPrintedPageStart + 1 ===
    evidence.targetVolume.targetPageCountInclusive,
  'inclusive target page arithmetic drifted',
);

assert(evidence.records.length === 5, 'expected five retained access records');
assert(new Set(evidence.records.map((record) => record.id)).size === 5, 'duplicate record id');
assert(new Set(evidence.records.map((record) => record.requestedUrl)).size === 5, 'duplicate requested URL');
for (const record of evidence.records) {
  assert(record.requestedUrl.startsWith('https://'), `${record.id}: requested URL must be HTTPS`);
  assert(record.finalUrl.startsWith('https://'), `${record.id}: final URL must be HTTPS`);
  assert(record.htmlBytes > 500, `${record.id}: suspiciously small byte envelope`);
  assert(shaPattern.test(record.htmlSha256), `${record.id}: invalid HTML SHA`);
  assert(shaPattern.test(record.visibleTextSha256), `${record.id}: invalid visible-text SHA`);
  assert(record.legalDigitalFullTextFound === false, `${record.id}: full text must remain false`);
}

const exactRecords = evidence.records.filter((record) => record.exactIdentityPassed === true);
assert(exactRecords.length === 4, 'expected four exact institutional identity records');
assert(
  evidence.records.find((record) => record.id === 'P25-GORKY-EDD-POLICY')?.grade === 'A+',
  'Gorky EDD policy must remain A+',
);
assert(
  evidence.records.find((record) => record.id === 'P25-HEIDELBERG-REDIRECT-BOUNDARY')
    ?.exactIdentityPassed === null,
  'Heidelberg redirect must remain an unresolved identity boundary',
);

assert(evidence.remoteScanRoute.exactBookPageVerified, 'exact Gorky book page must remain verified');
assert(evidence.remoteScanRoute.officialEddPolicyVerified, 'official Gorky EDD policy must remain verified');
assert(evidence.remoteScanRoute.requestsMayBeSubmittedRemotely, 'remote request route must remain available');
assert(evidence.remoteScanRoute.shortBookFragmentsAllowed, 'short book fragments must remain policy-allowed');
assert(evidence.remoteScanRoute.pageRateRubles === 20, 'published page rate changed');
assert(evidence.remoteScanRoute.targetPageCountInclusive === 45, 'route page count changed');
assert(evidence.remoteScanRoute.estimatedBasePageCostRubles === 900, 'base cost arithmetic changed');
assert(
  evidence.remoteScanRoute.pageRateRubles * evidence.remoteScanRoute.targetPageCountInclusive ===
    evidence.remoteScanRoute.estimatedBasePageCostRubles,
  'base cost arithmetic drifted',
);
assert(evidence.remoteScanRoute.additionalSearchOrHolderChargesPossible, 'additional charge boundary lost');
assert(evidence.remoteScanRoute.fulfilmentSubjectToLibraryReview, 'library-review boundary lost');
assert(evidence.remoteScanRoute.requestSubmitted === false, 'request must remain unsubmitted');
assert(evidence.remoteScanRoute.paymentAuthorized === false, 'payment must remain unauthorized');
assert(evidence.remoteScanRoute.scanAcquired === false, 'scan must remain unacquired');

assert(evidence.excludedFalsePositives.ciniiSortOrderIsOrderRoute === false, 'CiNii false positive returned');
assert(evidence.excludedFalsePositives.dubnaJournalOrderAppliesToBook === false, 'Dubna false positive returned');
assert(evidence.excludedFalsePositives.servicePolicyPdfIsTargetBookFullText === false, 'policy PDF promoted to book');
assert(evidence.excludedFalsePositives.worldcatRateLimitIsEvidenceOfAbsence === false, '429 promoted to absence evidence');

assert(evidence.effectiveState.exactInstitutionalIdentityRecords === 4, 'effective identity count changed');
assert(evidence.effectiveState.legalDigitalFullTextFound === false, 'full text remains unresolved');
assert(evidence.effectiveState.relevantRemoteScanRouteVerified, 'scan route must remain verified');
assert(evidence.effectiveState.targetPagesAcquired === false, 'target pages are not acquired');
assert(evidence.effectiveState.requestSubmitted === false, 'request is not submitted');
assert(evidence.effectiveState.paymentMade === false, 'payment is not made');
assert(evidence.effectiveState.archiveOriginalsInspected === false, 'archive originals are not inspected');
assert(evidence.effectiveState.articlePublished === false, 'article remains unpublished');
assert(evidence.effectiveState.articleRegistered === false, 'article remains unregistered');
assert(evidence.effectiveState.productionAuthorized === false, 'production remains unauthorized');
assert(evidence.effectiveState.wikipediaUsedAsEvidence === false, 'Wikipedia evidence is forbidden');
assert(evidence.effectiveState.syntheticContentUsed === false, 'synthetic evidence is forbidden');

console.log(
  `Yesenin Benislavskaya volume access pass 25 OK: ${exactRecords.length} exact institutional records; one verified remote scan route; request held.`,
);
