import { YESENIN_PRAVDA_EAST_VIEW_EVIDENCE_PASS_TWENTY_SEVEN as evidence } from '../src/data/essays/yeseninPravdaEastViewEvidencePassTwentySeven';
import { YESENIN_PRAVDA_RSL_ACCESS_EVIDENCE_PASS_TWENTY_SIX as rslPass } from '../src/data/essays/yeseninPravdaRslAccessEvidencePassTwentySix';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const sha256Pattern = /^[a-f0-9]{64}$/u;
const expectedDiagnosticPrs = [211, 213, 214, 215];
const expectedPageIds = [21670570, 21670575];
const expectedWitnessIds = [
  'P27-EASTVIEW-AUTH',
  'P27-EASTVIEW-PAGES',
  'P27-EASTVIEW-FULL-ACCESS-PAGE-1',
  'P27-EASTVIEW-FULL-ACCESS-PAGE-2',
  'P27-EASTVIEW-ARTICLE-PAGE-1',
  'P27-EASTVIEW-ARTICLE-PAGE-2',
];

assert(evidence.pass === 27, 'expected pass 27');
assert(evidence.historicalHoldId === 'PW6-YE1-PRAVDA-1921-11-09', 'historical HOLD changed');
assert(evidence.previousRslAccessPass === 26, 'previous RSL pass changed');
assert(rslPass.pass === 26, 'RSL predecessor pass changed');
assert(rslPass.historicalHoldId === evidence.historicalHoldId, 'pass 26/pass 27 HOLD mismatch');
assert(rslPass.effectiveState.exactIssueCardResolved === false, 'pass 26 must remain an unresolved RSL issue-card state');

assert(evidence.acceptedDiagnostics.length === 4, 'expected four accepted diagnostics');
assert(
  JSON.stringify(evidence.acceptedDiagnostics.map((record) => record.pullRequest)) === JSON.stringify(expectedDiagnosticPrs),
  'diagnostic PR order changed',
);
for (const diagnostic of evidence.acceptedDiagnostics) {
  assert(diagnostic.merged === false, `diagnostic PR ${diagnostic.pullRequest} must remain unmerged`);
  assert(sha256Pattern.test(diagnostic.artifactDigest.replace(/^sha256:/u, '')), `diagnostic PR ${diagnostic.pullRequest}: invalid artifact digest`);
  assert(/^[a-f0-9]{40}$/u.test(diagnostic.exactHead), `diagnostic PR ${diagnostic.pullRequest}: invalid exact head`);
  assert(diagnostic.workflowRunId > 0 && diagnostic.artifactId > 0, `diagnostic PR ${diagnostic.pullRequest}: missing run/artifact identity`);
}

assert(evidence.archive.authority === 'East View Information Services', 'archive authority changed');
assert(evidence.archive.name === 'Pravda Digital Archive (DA-PRA)', 'archive name changed');
assert(evidence.archive.udbId === 870, 'UDB ID changed');
assert(evidence.archive.titleId === 9305, 'title ID changed');
assert(evidence.archive.productSku === '2018581D', 'product SKU changed');
assert(evidence.archive.subscriptionProduct, 'subscription-product boundary lost');

assert(evidence.exactIssue.publication === 'Pravda', 'publication title changed');
assert(evidence.exactIssue.dateIso === '1921-11-09', 'target date changed');
assert(evidence.exactIssue.dateLabel === 'November 09, 1921', 'target date label changed');
assert(evidence.exactIssue.issueNumber === '252', 'target issue changed');
assert(evidence.exactIssue.featuredIssueId === 967207, 'featured issue ID changed');
assert(evidence.exactIssue.featuredUrl === 'https://on-demand.eastview.com/ondemand-featured/featured-articles?issueId=967207', 'featured issue URL changed');
assert(evidence.exactIssue.featuredResponseBytes === 25_979, 'featured response byte envelope changed');
assert(evidence.exactIssue.featuredResponseSha256 === '9875ff38193afc29ddf8de7b0394f33e6e1c0a402ac777898df9de0a445c9657', 'featured response hash changed');
assert(evidence.exactIssue.featuredVisibleTextSha256 === '800a0937ff98afc8c6ca5d76ab04c860d617b1006207c4bc23d19771e1771baf', 'featured visible-text hash changed');
assert(evidence.exactIssue.exactMetadataResolved, 'exact issue metadata must remain resolved');
assert(evidence.exactIssue.issuePriceUsd === '19.00', 'issue price metadata changed');
assert(evidence.exactIssue.pageCount === 2, 'issue page count changed');

assert(evidence.pages.length === 2, 'expected exactly two East View page records');
assert(JSON.stringify(evidence.pages.map((page) => page.articleId)) === JSON.stringify(expectedPageIds), 'page article IDs changed');
assert(JSON.stringify(evidence.pages.map((page) => page.pageNumber)) === JSON.stringify([1, 2]), 'page order changed');
for (const page of evidence.pages) {
  assert(page.literalUrl === `https://on-demand.eastview.com/browse/doc/${page.articleId}`, `page ${page.pageNumber}: literal URL changed`);
  assert(page.runtimeUrl === `${page.literalUrl}/page-${page.pageNumber}`, `page ${page.pageNumber}: runtime URL changed`);
  assert(page.runtimeDomBytes > 120_000, `page ${page.pageNumber}: suspicious DOM envelope`);
  assert(sha256Pattern.test(page.runtimeDomSha256), `page ${page.pageNumber}: invalid DOM hash`);
  assert(page.runtimeVisibleTextBytes > 2_000, `page ${page.pageNumber}: suspicious viewer-shell text envelope`);
  assert(sha256Pattern.test(page.runtimeVisibleTextSha256), `page ${page.pageNumber}: invalid visible-text hash`);
  assert(page.apiPayloadBytes > 3_000, `page ${page.pageNumber}: suspicious API payload envelope`);
  assert(sha256Pattern.test(page.apiPayloadSha256), `page ${page.pageNumber}: invalid API payload hash`);
  assert(page.autoExtractedTextBytes > 2_000, `page ${page.pageNumber}: suspicious auto-text envelope`);
  assert(sha256Pattern.test(page.autoExtractedTextSha256), `page ${page.pageNumber}: invalid auto-text hash`);
}
assert(evidence.pages[0].runtimeDomSha256 === '19a3896cf71e21b102086f9407c18a61706d757a262073cb5f4a5717c59031df', 'page 1 DOM hash changed');
assert(evidence.pages[1].runtimeDomSha256 === 'e75d3d6456e963615e7cda8e151d203cda1e7f77b13aa0bbe30d5d27d2ab74c0', 'page 2 DOM hash changed');
assert(evidence.pages[0].apiPayloadSha256 === '3233186abaf92ffadbb936c1fb47f6e98102c28a3c91e7a66344c8929e1e91ab', 'page 1 API payload hash changed');
assert(evidence.pages[1].apiPayloadSha256 === '54f9b1b9b0391198dd80999705414ce8fbb67d2634af85bccaf57a1554fea2b1', 'page 2 API payload hash changed');

assert(evidence.apiWitnesses.length === 6, 'expected six pinned API witnesses');
assert(JSON.stringify(evidence.apiWitnesses.map((record) => record.id)) === JSON.stringify(expectedWitnessIds), 'API witness order changed');
for (const record of evidence.apiWitnesses) {
  assert(record.grade === 'A+', `${record.id}: expected A+ official runtime witness`);
  assert(record.status === 200, `${record.id}: expected HTTP 200`);
  assert(record.bytes > 0, `${record.id}: empty response`);
  assert(sha256Pattern.test(record.sha256), `${record.id}: invalid SHA-256`);
}
assert(evidence.apiWitnesses[0].sha256 === '0ef5dfee20375fda1dd4a0bcd7a87e1cd0df72974fd31d10999e2c653831a7fb', 'auth response hash changed');
assert(evidence.apiWitnesses[1].sha256 === '9f7be637d07e6df4abaac80bafab632f972408ea01d9f3f3358c7c1b4c009aad', 'page-map response hash changed');
assert(evidence.apiWitnesses[2].sha256 === evidence.apiWitnesses[3].sha256, 'full-access responses must remain byte-identical false states');

const access = evidence.runtimeAccessState;
assert(access.authenticated === false, 'anonymous session must remain unauthenticated');
assert(access.userId === null && access.individualUserId === null, 'user IDs must remain null');
assert(access.cartItems === 0 && access.freeContentCounter === 0, 'cart/free-content counters changed');
assert(access.fullAccessPage1 === false && access.fullAccessPage2 === false, 'full access must remain false');
assert(access.issuePageMapExact, 'two-page issue map must remain exact');
assert(access.page1MappedArticleId === 21670570 && access.page2MappedArticleId === 21670575, 'page map changed');
assert(access.hasEnglishTranslation === false, 'English-translation state changed');
assert(access.showPdfPage1 === false && access.showPdfPage2 === false, 'showPdf must remain false');
assert(access.pdfsAreAvailableMetadataPage1 && access.pdfsAreAvailableMetadataPage2, 'PDF-availability metadata changed');
assert(access.fullImageUrlPage1 === null && access.fullImageUrlPage2 === null, 'full-image URLs must remain null');
assert(access.literalDownloadPathPage1 === '/util/savearticle?id=21670570', 'page 1 download path changed');
assert(access.literalDownloadPathPage2 === '/util/savearticle?id=21670575', 'page 2 download path changed');
assert(access.downloadPathsFetched === false, 'download paths were not fetched');
assert(access.evodArticlePricePage1 === '0.00' && access.evodArticlePricePage2 === '0.00', 'article-level price metadata changed');
assert(access.evodOnDemandFullAccessPage1 === false && access.evodOnDemandFullAccessPage2 === false, 'EVOD full access must remain false');
assert(access.warningShownPage1 && access.warningShownPage2, 'access warning state changed');
assert(access.sellableUnitPage1 && access.sellableUnitPage2, 'sellable-unit state changed');

const autoText = evidence.autoExtractedTextBoundary;
assert(autoText.payloadsAcquired === 2, 'expected two auto-extracted text payloads');
assert(autoText.machineExtractedTextPresent, 'machine-extracted text presence changed');
assert(autoText.diplomaticTranscription === false, 'machine text cannot be diplomatic transcription');
assert(autoText.originalFacsimileText === false, 'machine text cannot be original facsimile text');
assert(autoText.controllingContentInspection === false, 'machine text cannot close controlling content inspection');
assert(autoText.literalMarkerScanPerformed, 'literal marker scan must remain recorded');
assert(autoText.markerCounts.yesenin === 0, 'Yesenin marker count changed');
assert(autoText.markerCounts.duncan === 0, 'Duncan marker count changed');
assert(autoText.markerCounts.isadora === 0, 'Isadora marker count changed');
assert(autoText.markerCounts.dance === 0, 'dance marker count changed');
assert(autoText.markerCounts.school === 0, 'school marker count changed');
assert(autoText.markerCounts.november7 === 0, '7 November marker count changed');
assert(autoText.markerCounts.moscow === 2, 'Moscow marker count changed');
assert(autoText.negativeMarkerResultControlling === false, 'noisy auto-text negative result cannot be controlling');

assert(Object.values(evidence.classificationCorrections).every((value) => value === true || value === false), 'classification corrections must remain boolean');
assert(evidence.classificationCorrections.interfaceLogosAndErrorIconsAreNotFacsimile, 'interface-asset correction lost');
assert(evidence.classificationCorrections.viewerShellTextIsNotNewspaperText, 'viewer-shell correction lost');
assert(evidence.classificationCorrections.articleTextIsNotDiplomaticTranscription, 'auto-text correction lost');
assert(evidence.classificationCorrections.articlePriceZeroDoesNotOverrideFullAccessFalse, 'price/full-access correction lost');
assert(evidence.classificationCorrections.pdfsAreAvailableMetadataDoesNotMeanPdfAcquired, 'PDF metadata correction lost');
assert(evidence.classificationCorrections.literalDownloadPathDoesNotMeanDownloadAcquired, 'download-path correction lost');
assert(evidence.classificationCorrections.issueIdConstructed === false, 'issue ID construction forbidden');
assert(evidence.classificationCorrections.articleIdsConstructed === false, 'article ID construction forbidden');
assert(evidence.classificationCorrections.apiRoutesConstructed === false, 'API route construction forbidden');
assert(evidence.classificationCorrections.neighboringIdArithmeticUsed === false, 'neighbor-ID arithmetic forbidden');

const state = evidence.effectiveState;
assert(state.state === 'exact-eastview-issue-and-page-map-resolved-full-access-and-facsimile-unavailable', 'effective state changed');
assert(state.historicalHoldIssueIdentityResolved, 'issue-identity component of HOLD must be resolved');
assert(state.exactIssueMetadataResolved && state.exactPageDocumentsResolved, 'exact issue/page metadata must remain resolved');
assert(state.autoExtractedTextPayloadAcquired, 'auto-extracted text acquisition state changed');
assert(state.originalFacsimileAcquired === false, 'original facsimile remains unacquired');
assert(state.originalFacsimileInspected === false, 'original facsimile remains uninspected');
assert(state.controllingPageContentInspection === false, 'controlling page inspection remains false');
assert(state.subscriptionPurchased === false, 'subscription remains unpurchased');
assert(state.credentialsProvided === false, 'credentials remain unprovided');
assert(state.requestSubmitted === false, 'request remains unsubmitted');
assert(state.paymentAuthorized === false && state.paymentMade === false, 'payment remains unauthorized/unpaid');
assert(state.ocrPerformedByProject === false, 'project OCR remains false');
assert(state.syntheticContentUsed === false, 'synthetic evidence forbidden');
assert(state.wikipediaUsedAsEvidence === false, 'Wikipedia evidence forbidden');
assert(state.articlePublished === false && state.articleRegistered === false, 'article remains unpublished/unregistered');
assert(state.productionAuthorized === false, 'production remains unauthorized');
assert(state.remainingTarget.includes('original two-page Pravda no. 252 facsimile'), 'remaining facsimile target changed');

console.log(
  `Yesenin Pravda East View evidence pass 27 OK: exact issue ${evidence.exactIssue.featuredIssueId}, ` +
    `${evidence.pages.length} page documents, ${evidence.apiWitnesses.length} API witnesses; full access/facsimile false.`,
);
