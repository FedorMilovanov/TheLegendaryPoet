import { YESENIN_BENISLAVSKAYA_INBOUND_PASS_TWENTY_FOUR as evidence } from '../src/data/essays/yeseninBenislavskayaInboundEvidencePassTwentyFour';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const sha256Pattern = /^[a-f0-9]{64}$/u;
const expectedPages = [239, 250, 251, 256, 258, 263, 268, 269, 271];

assert(evidence.pass === 24, 'expected pass 24');
assert(evidence.acceptedDiagnostic.workflowRunId === 30176423189, 'unexpected diagnostic run');
assert(evidence.acceptedDiagnostic.artifactId === 8624338504, 'unexpected artifact id');
assert(
  evidence.acceptedDiagnostic.artifactDigest ===
    'sha256:dc46b27eef5fd052b189a9549f7b113593dfa5f9993f8318bffecd21c7a1acd5',
  'unexpected artifact digest',
);
assert(evidence.acceptedDiagnostic.diagnosticMerged === false, 'diagnostic PR must remain unmerged');

assert(evidence.academicIndex.grade === 'A+', 'FEB index must remain A+');
assert(evidence.academicIndex.charset === 'windows-1251', 'FEB charset boundary changed');
assert(evidence.academicIndex.htmlBytes === 121198, 'FEB index byte count changed');
assert(sha256Pattern.test(evidence.academicIndex.htmlSha256), 'invalid FEB index hash');
assert(sha256Pattern.test(evidence.academicIndex.visibleTextSha256), 'invalid FEB visible-text hash');
assert(evidence.academicIndex.yeseninToBenislavskayaDocuments === 35, 'outbound document count changed');
assert(evidence.academicIndex.yeseninGiftInscriptionsToBenislavskaya === 1, 'gift count changed');
assert(evidence.academicIndex.benislavskayaToYeseninLetters === 14, 'inbound letter count changed');
assert(evidence.academicIndex.exactCombinedStatementVerified, 'exact 35/1/14 statement must be verified');

assert(evidence.sourceVolumeIdentity.title.includes('Письма. Документы'), 'source volume title changed');
assert(evidence.sourceVolumeIdentity.year === 1995, 'source volume year changed');
assert(evidence.sourceVolumeIdentity.pages === 607, 'source volume extent changed');
assert(evidence.sourceVolumeIdentity.isbn === '5-250-02529-3', 'source volume ISBN changed');
assert(evidence.sourceVolumeIdentity.ncid === 'BA27980118', 'source volume NCID changed');
assert(evidence.sourceVolumeIdentity.fullVolumeAcquired === false, 'full source volume is not acquired');
assert(evidence.sourceVolumeIdentity.targetPrintedPages === '236–280', 'target page range changed');

assert(evidence.officialHtmlWitnesses.length === 12, 'expected twelve official HTML witnesses');
assert(new Set(evidence.officialHtmlWitnesses.map((record) => record.id)).size === 12, 'duplicate witness id');
assert(new Set(evidence.officialHtmlWitnesses.map((record) => record.url)).size === 12, 'duplicate witness URL');
for (const record of evidence.officialHtmlWitnesses) {
  assert(record.url.startsWith('https://feb-web.ru/'), `${record.id}: non-FEB witness URL`);
  assert(record.htmlBytes > 5_000, `${record.id}: suspicious byte count`);
  assert(sha256Pattern.test(record.htmlSha256), `${record.id}: invalid HTML hash`);
  assert(sha256Pattern.test(record.visibleTextSha256), `${record.id}: invalid visible-text hash`);
  assert(record.inboundExcerptWitnesses >= 0, `${record.id}: negative witness count`);
}
const aggregateBytes = evidence.officialHtmlWitnesses.reduce((sum, record) => sum + record.htmlBytes, 0);
const aggregateParagraphs = evidence.officialHtmlWitnesses.reduce(
  (sum, record) => sum + record.inboundExcerptWitnesses,
  0,
);
assert(aggregateBytes === 4650945, `unexpected official HTML aggregate: ${aggregateBytes}`);
assert(aggregateParagraphs === 11, `unexpected official excerpt aggregate: ${aggregateParagraphs}`);
assert(evidence.officialExcerptLayer.officialCommentPagesFetched === 12, 'comment-page count changed');
assert(evidence.officialExcerptLayer.aggregateHtmlBytes === aggregateBytes, 'aggregate byte ledger drift');
assert(
  evidence.officialExcerptLayer.inboundExcerptWitnessParagraphs === aggregateParagraphs,
  'excerpt paragraph ledger drift',
);
assert(
  JSON.stringify(evidence.officialExcerptLayer.witnessedSourceVolumePages) === JSON.stringify(expectedPages),
  'officially witnessed source-volume pages changed',
);
assert(evidence.officialExcerptLayer.fullFourteenLetterTextsAcquired === false, 'full fourteen-letter corpus is not acquired');
assert(evidence.officialExcerptLayer.allFourteenLettersIndividuallyResolved === false, 'fourteen letters are not individually resolved');

assert(evidence.giftInscription.grade === 'A+', 'gift witness must remain A+');
assert(evidence.giftInscription.printedPage === 203, 'gift printed page changed');
assert(evidence.giftInscription.date === 'январь 1922', 'gift date changed');
assert(evidence.giftInscription.text === 'Милой Гале, виновнице некоторых глав', 'gift text changed');
assert(evidence.giftInscription.htmlBytes === 5610, 'gift page byte count changed');
assert(sha256Pattern.test(evidence.giftInscription.htmlSha256), 'invalid gift page hash');
assert(evidence.giftInscription.commentaryHtmlBytes === 432382, 'gift commentary byte count changed');
assert(sha256Pattern.test(evidence.giftInscription.commentaryHtmlSha256), 'invalid gift commentary hash');
assert(evidence.giftInscription.currentPhysicalLocationKnown === false, 'gift object remains unlocated');
assert(evidence.giftInscription.archiveOriginalInspected === false, 'gift original remains uninspected');
assert(evidence.giftInscription.productionAuthorized === false, 'gift reproduction is not authorized');

assert(evidence.excludedLocator.grade === 'EXCLUDED', 'locator must remain excluded');
assert(evidence.excludedLocator.numberedSections === 13, 'locator numbered-section count changed');
assert(evidence.excludedLocator.reconstructedDocumentCandidates === 14, 'locator candidate count changed');
assert(evidence.excludedLocator.locatorOnly, 'locator must remain locator-only');
assert(evidence.excludedLocator.claimEvidenceAllowed === false, 'locator cannot support claims');
assert(sha256Pattern.test(evidence.excludedLocator.htmlSha256), 'invalid excluded-locator hash');

assert(evidence.effectiveState.academicInboundCountConfirmed, 'academic inbound count must be confirmed');
assert(evidence.effectiveState.fullInboundCorpusAcquired === false, 'full inbound corpus is not acquired');
assert(evidence.effectiveState.sourceVolumePages236To280Acquired === false, 'printed pages 236–280 are not acquired');
assert(evidence.effectiveState.archiveOriginalsInspected === false, 'archive originals are not inspected');
assert(evidence.effectiveState.diplomaticTranscriptionsClaimed === false, 'no diplomatic transcription may be claimed');
assert(evidence.effectiveState.giftPublishedPageAcquired, 'gift published page must remain acquired');
assert(evidence.effectiveState.giftPhysicalObjectLocated === false, 'gift physical object remains unlocated');
assert(evidence.effectiveState.wikipediaUsedAsEvidence === false, 'Wikipedia evidence is forbidden');
assert(evidence.effectiveState.syntheticContentUsed === false, 'synthetic evidence is forbidden');
assert(evidence.effectiveState.articlePublished === false, 'article remains unpublished');
assert(evidence.effectiveState.articleRegistered === false, 'article remains unregistered');
assert(evidence.effectiveState.productionAuthorized === false, 'production remains unauthorized');

console.log(
  `Yesenin Benislavskaya inbound evidence pass 24 OK: ${evidence.academicIndex.benislavskayaToYeseninLetters} academic inbound letters; ${aggregateParagraphs} official excerpt witnesses; gift page acquired; full corpus held.`,
);
