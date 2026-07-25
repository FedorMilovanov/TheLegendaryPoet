import { YESENIN_PRAVDA_RSL_ACCESS_EVIDENCE_PASS_TWENTY_SIX as evidence } from '../src/data/essays/yeseninPravdaRslAccessEvidencePassTwentySix';
import { yeseninPartOnePravdaPassFifteenAccess } from '../src/data/essays/yeseninPartOneNewspaperPassFourteen';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const sha256Pattern = /^[a-f0-9]{64}$/u;
const expectedResponseIds = [
  'P26-RSL-PRAVDA-PARENT',
  'P26-RSL-PRAVDA-FRAGMENT-ENTRY',
  'P26-RSL-PRAVDA-FRONTEND-POLICY',
  'P26-RSL-PRAVDA-MARC21-AUTH-BOUNDARY',
];

assert(evidence.pass === 26, 'expected pass 26');
assert(evidence.historicalHoldId === 'PW6-YE1-PRAVDA-1921-11-09', 'historical hold changed');
assert(evidence.previousAccessRecordId === 'PR15-YE1-PRAVDA-1921-11-09', 'previous access record changed');
assert(yeseninPartOnePravdaPassFifteenAccess.historicalHoldId === evidence.historicalHoldId, 'pass 15/pass 26 HOLD mismatch');
assert(yeseninPartOnePravdaPassFifteenAccess.state === 'no-literal-official-central-moscow-match', 'pass 15 negative discovery boundary changed');
assert(yeseninPartOnePravdaPassFifteenAccess.acceptedCentralMoscowCards === 0, 'pass 15 must remain zero-card discovery');

assert(evidence.acceptedDiagnostics.length === 2, 'expected two accepted diagnostics');
const diagnostic209 = evidence.acceptedDiagnostics[0];
assert(diagnostic209.pullRequest === 209, 'unexpected first diagnostic PR');
assert(diagnostic209.merged === false, 'diagnostic 209 must remain unmerged');
assert(diagnostic209.exactHead === '29a5dcdee69c376190de41d1a52f724983c50f8b', 'diagnostic 209 head changed');
assert(diagnostic209.workflowRunId === 30178011446, 'diagnostic 209 run changed');
assert(diagnostic209.artifactId === 8624757934, 'diagnostic 209 artifact changed');
assert(diagnostic209.artifactDigest === 'sha256:9d3cf5765baee2d556edeb8b84a8cad841539595d0a89d347b65a941eb8176d7', 'diagnostic 209 digest changed');
assert(diagnostic209.conclusion === 'success', 'diagnostic 209 conclusion changed');

const diagnostic208 = evidence.acceptedDiagnostics[1];
assert(diagnostic208.pullRequest === 208, 'unexpected second diagnostic PR');
assert(diagnostic208.merged === false, 'diagnostic 208 must remain unmerged');
assert(diagnostic208.exactHead === 'a000b9f23747a82d805761df8b5cfde44c6b3c7d', 'diagnostic 208 artifact head changed');
assert(diagnostic208.workflowRunId === 30178147821, 'diagnostic 208 run changed');
assert(diagnostic208.artifactId === 8624794011, 'diagnostic 208 artifact changed');
assert(diagnostic208.artifactDigest === 'sha256:ae92e70c2d3d6b73b2316416d2d37df4437f338432d03d3ef6d102a1a90ac2b4', 'diagnostic 208 digest changed');
assert(diagnostic208.conclusion === 'failure-with-complete-artifact', 'diagnostic 208 bounded failure changed');
assert(diagnostic208.failureClassification === 'brittle-parent-text-normalization-not-acquisition-failure', 'diagnostic 208 failure classification changed');

assert(evidence.target.publication === 'Правда', 'target title changed');
assert(evidence.target.publicationPlace === 'Москва', 'target publication place changed');
assert(evidence.target.dateIso === '1921-11-09', 'target date changed');
assert(evidence.target.dateLabel === '9 ноября 1921', 'target date label changed');
assert(evidence.target.issueNumber === '252', 'target issue changed');
assert(evidence.target.parentRecordId === '01004548325', 'parent record ID changed');
assert(evidence.target.parentControlNumber === '004548325', 'parent control number changed');
assert(evidence.target.issn === '0233-4275', 'ISSN changed');
assert(evidence.target.exactIssueCardResolved === false, 'exact issue card remains unresolved');

assert(evidence.responses.length === 4, 'expected four pinned official responses');
assert(JSON.stringify(evidence.responses.map((record) => record.id)) === JSON.stringify(expectedResponseIds), 'response order or identity changed');
assert(new Set(evidence.responses.map((record) => record.url)).size === 4, 'duplicate official response URL');
for (const record of evidence.responses) {
  assert(record.status === 200, `${record.id}: expected HTTP 200`);
  assert(record.bytes > 1_000, `${record.id}: implausible byte envelope`);
  assert(sha256Pattern.test(record.sha256), `${record.id}: invalid response SHA-256`);
  assert(sha256Pattern.test(record.visibleTextSha256), `${record.id}: invalid visible-text SHA-256`);
}

const parent = evidence.responses[0];
assert(parent.grade === 'A+', 'parent must remain A+');
assert(parent.url === 'https://search.rsl.ru/ru/record/01004548325', 'parent URL changed');
assert(parent.bytes === 120_786, 'parent byte envelope changed');
assert(parent.sha256 === 'b15a009d0b68e32edab0c7369756b4a05b7d5d7ae174c6e872fb287cfa9b1eec', 'parent hash changed');
assert(parent.visibleTextSha256 === 'f885e303440e81bcb369ab37f2ac4ed69df7a3568f90c4aa08ef4d5107233c8c', 'parent visible-text hash changed');

const entry = evidence.responses[1];
assert(entry.grade === 'A+', 'fragment entry route must remain A+');
assert(entry.url === 'https://search.rsl.ru/ru/fragment-eorder/rsl01004548325', 'fragment entry URL changed');
assert(entry.bytes === 44_050, 'fragment entry byte envelope changed');
assert(entry.sha256 === '1ccffb88ba0564116a573c37b6d21d5148a9eb195e26855fabbefed4491cff1b', 'fragment entry hash changed');
assert(entry.visibleTextSha256 === '047376ed41493b141202536b1bed4bdcc37b94f5d94c8bcc91a147bf1b07bcb4', 'fragment entry visible hash changed');

const frontend = evidence.responses[2];
assert(frontend.grade === 'A+', 'frontend policy route must remain A+');
assert(frontend.url === 'https://search.rsl.ru/frontend/fragment-eorder/rsl01004548325', 'frontend policy URL changed');
assert(frontend.bytes === 46_619, 'frontend policy byte envelope changed');
assert(frontend.sha256 === '77657d72da8d349a43d8d184d80da10042797d9d91352daf269fff2d82f08a53', 'frontend policy hash changed');
assert(frontend.visibleTextSha256 === '43bfc5cf15270a347df106309d09172ee8dfeaf2ee22984c7f3bb366b7864763', 'frontend policy visible hash changed');

const marc = evidence.responses[3];
assert(marc.grade === 'BOUNDARY', 'MARC route must remain an authentication boundary');
assert(marc.url === 'https://search.rsl.ru/ru/download/marc21?id=01004548325', 'MARC route changed');
assert(marc.bytes === 11_249, 'MARC authentication byte envelope changed');
assert(marc.sha256 === '75834e018fbdf81a24c7f0a29a07dbf5390469087d9a22c463e7ce89e1476acd', 'MARC authentication hash changed');

assert(Object.values(evidence.parentIdentity).every((value) => value === true || value === false), 'parent identity contains non-boolean state');
assert(evidence.parentIdentity.exactRecordIdPresent, 'parent ID marker lost');
assert(evidence.parentIdentity.titlePravdaPresent, 'parent title marker lost');
assert(evidence.parentIdentity.moscowPublicationPresent, 'Moscow publication marker lost');
assert(evidence.parentIdentity.holdings1912Through1923Present, '1912–1923 holdings marker lost');
assert(evidence.parentIdentity.remoteElectronicArchiveNotePresent, 'remote archive note lost');
assert(evidence.parentIdentity.microfilmCoverageIncludes1921, '1921 microfilm coverage lost');
assert(evidence.parentIdentity.literalFragmentOrderLinkPresent, 'literal fragment-order link lost');
assert(evidence.parentIdentity.serialParentVerified, 'serial parent must remain verified');
assert(evidence.parentIdentity.parentIsExactIssueCard === false, 'serial parent cannot be promoted to exact issue');

assert(evidence.fragmentEntryBoundary.pageTitle === 'Заказ фрагмента документа - Search RSL', 'fragment page title changed');
assert(evidence.fragmentEntryBoundary.routeReachable, 'fragment route must remain reachable');
assert(evidence.fragmentEntryBoundary.authenticationOrReaderRegistrationRequired, 'authentication boundary lost');
assert(evidence.fragmentEntryBoundary.anonymousDocumentOrderFormAvailable === false, 'anonymous order form must remain false');
assert(evidence.fragmentEntryBoundary.genericAdvancedSearchFormsPresent, 'generic forms marker lost');
assert(evidence.fragmentEntryBoundary.genericSearchFormsMustNotCountAsOrderForm, 'generic-form correction lost');
assert(evidence.fragmentEntryBoundary.requestSubmitted === false, 'request has not been submitted');
assert(evidence.fragmentEntryBoundary.personalDataProvided === false, 'personal data has not been provided');
assert(evidence.fragmentEntryBoundary.paymentAuthorized === false, 'payment has not been authorized');

assert(evidence.frontendServicePolicy.routeReachedThroughLiteralParentHtmlAttribute, 'frontend route provenance changed');
assert(evidence.frontendServicePolicy.paidService, 'paid-service policy marker lost');
assert(evidence.frontendServicePolicy.shortFragmentOnly, 'short-fragment boundary lost');
assert(evidence.frontendServicePolicy.fullOriginalFreeOnlyInRslReadingRoom, 'reading-room full-original boundary lost');
assert(evidence.frontendServicePolicy.serviceInTestMode, 'test-mode marker lost');
assert(evidence.frontendServicePolicy.civilCodeArticle1275Referenced, 'Civil Code marker lost');
assert(evidence.frontendServicePolicy.documentSpecificTitleLoaded === false, 'document title was not loaded');
assert(evidence.frontendServicePolicy.targetDateLoaded === false, 'target date was not loaded');
assert(evidence.frontendServicePolicy.targetIssueNumberLoaded === false, 'target issue was not loaded');
assert(evidence.frontendServicePolicy.pageRangeControlsLoaded === false, 'page controls were not loaded');
assert(evidence.frontendServicePolicy.priceLoaded === false, 'price was not loaded');
assert(evidence.frontendServicePolicy.authenticatedOrderSessionEstablished === false, 'authenticated session was not established');

assert(evidence.literalDiscoveryCoverage.successfulOfficialResponses === 20, 'successful-response count changed');
assert(evidence.literalDiscoveryCoverage.officialExactQueryControls === 2, 'RSL exact-query count changed');
assert(evidence.literalDiscoveryCoverage.literalExactIssueLinks === 0, 'literal exact issue link remains absent');
assert(evidence.literalDiscoveryCoverage.exactDateAndIssueRecords === 0, 'exact target record remains absent');
assert(evidence.literalDiscoveryCoverage.dateOnlyRecords === 0, 'date-only record count changed');
assert(evidence.literalDiscoveryCoverage.issueOnlyRecords === 0, 'issue-only record count changed');
assert(evidence.literalDiscoveryCoverage.pdfRecords === 0, 'no PDF record was discovered');
assert(evidence.literalDiscoveryCoverage.viewerUrlResolved === false, 'viewer URL remains unresolved');
assert(evidence.literalDiscoveryCoverage.genericReadOnlineModalTemplatePresent, 'generic read-online modal marker lost');
assert(evidence.literalDiscoveryCoverage.genericReadOnlineModalIsNotViewerEvidence, 'generic modal correction lost');

assert(evidence.classificationCorrections.parentSerialRecordIsNotIssue252, 'parent/issue correction lost');
assert(evidence.classificationCorrections.hashOnlyReadOnlineAnchorIsNotViewerRoute, 'hash-only viewer correction lost');
assert(evidence.classificationCorrections.genericSiteFormsAreNotFragmentOrderForm, 'generic form correction lost');
assert(evidence.classificationCorrections.frontendPolicyShellIsNotDocumentSpecificOrder, 'frontend shell correction lost');
assert(evidence.classificationCorrections.marc21AuthenticationRedirectIsNotIssueAcquisition, 'MARC auth correction lost');
assert(evidence.classificationCorrections.catalogueIdConstructed === false, 'catalogue ID construction forbidden');
assert(evidence.classificationCorrections.viewerIdConstructed === false, 'viewer ID construction forbidden');
assert(evidence.classificationCorrections.pdfRouteConstructed === false, 'PDF construction forbidden');
assert(evidence.classificationCorrections.neighboringIdArithmeticUsed === false, 'neighbor-ID arithmetic forbidden');

assert(evidence.effectiveState.state === 'parent-and-authenticated-fragment-service-verified-exact-issue-unresolved', 'effective state changed');
assert(evidence.effectiveState.historicalHoldRemainsActive, 'historical HOLD must remain active');
assert(evidence.effectiveState.officialParentVerified, 'parent verification lost');
assert(evidence.effectiveState.officialFragmentServiceVerified, 'fragment service verification lost');
assert(evidence.effectiveState.exactIssueCardResolved === false, 'exact issue card remains unresolved');
assert(evidence.effectiveState.exactIssueUrl === null, 'exact issue URL remains null');
assert(evidence.effectiveState.exactIssuePdfAcquired === false, 'exact issue PDF remains unacquired');
assert(evidence.effectiveState.facsimileAcquired === false, 'facsimile remains unacquired');
assert(evidence.effectiveState.contentInspected === false, 'content remains uninspected');
assert(evidence.effectiveState.requestSubmitted === false, 'request remains unsubmitted');
assert(evidence.effectiveState.personalDataProvided === false, 'personal data remains unprovided');
assert(evidence.effectiveState.paymentAuthorized === false, 'payment remains unauthorized');
assert(evidence.effectiveState.paymentMade === false, 'payment remains unpaid');
assert(evidence.effectiveState.ocrUsedForEvidence === false, 'OCR evidence forbidden');
assert(evidence.effectiveState.syntheticContentUsed === false, 'synthetic evidence forbidden');
assert(evidence.effectiveState.wikipediaUsedAsEvidence === false, 'Wikipedia evidence forbidden');
assert(evidence.effectiveState.articlePublished === false, 'article remains unpublished');
assert(evidence.effectiveState.articleRegistered === false, 'article remains unregistered');
assert(evidence.effectiveState.productionAuthorized === false, 'production remains unauthorized');
assert(evidence.effectiveState.remainingTarget.includes('no. 252'), 'remaining target must retain exact issue number');
assert(evidence.effectiveState.remainingTarget.includes('9 November 1921'), 'remaining target must retain exact date');

console.log(
  `Yesenin Pravda RSL access evidence pass 26 OK: ${evidence.responses.length} official response records; ` +
    `${evidence.literalDiscoveryCoverage.successfulOfficialResponses} literal responses inspected; exact issue unresolved; HOLD active.`,
);
