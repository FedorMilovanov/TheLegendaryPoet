import { YESENIN_PRAVDA_EASTVIEW_EVIDENCE_PASS_TWENTY_SEVEN as evidence } from '../src/data/essays/yeseninPravdaEastViewEvidencePassTwentySeven';
import { YESENIN_PRAVDA_RSL_ACCESS_EVIDENCE_PASS_TWENTY_SIX as previous } from '../src/data/essays/yeseninPravdaRslAccessEvidencePassTwentySix';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const sha256Pattern = /^[a-f0-9]{64}$/u;

assert(evidence.pass === 27, 'expected pass 27');
assert(evidence.historicalHoldId === previous.historicalHoldId, 'historical HOLD changed');
assert(previous.effectiveState.exactIssueCardResolved === false, 'pass 26 boundary changed');
assert(evidence.supersedesAccessState === previous.effectiveState.state, 'pass 26 supersession changed');

assert(evidence.acceptedDiagnostics.length === 2, 'expected two accepted diagnostics');
const discovery = evidence.acceptedDiagnostics[0];
assert(discovery.pullRequest === 211 && discovery.merged === false, 'diagnostic 211 identity changed');
assert(discovery.exactHead === '1c92bc8dd614c0f35f89356018bf5d7812c1e4f5', 'diagnostic 211 head changed');
assert(discovery.workflowRunId === 30178654274, 'diagnostic 211 run changed');
assert(discovery.artifactId === 8624927195, 'diagnostic 211 artifact changed');
assert(discovery.artifactDigest === 'sha256:db9d6cba74e64af2d546eb89460ff0d6a62da183e630d4d1783b9fa83db2c15e', 'diagnostic 211 digest changed');
assert(discovery.conclusion === 'success-with-parser-false-negative', 'diagnostic 211 classification changed');

const targetDiagnostic = evidence.acceptedDiagnostics[1];
assert(targetDiagnostic.pullRequest === 213 && targetDiagnostic.merged === false, 'diagnostic 213 identity changed');
assert(targetDiagnostic.exactHead === '851da0b889c2678ee2f7c723817da877d37fdc12', 'diagnostic 213 head changed');
assert(targetDiagnostic.workflowRunId === 30178998459, 'diagnostic 213 run changed');
assert(targetDiagnostic.artifactId === 8625011612, 'diagnostic 213 artifact changed');
assert(targetDiagnostic.artifactDigest === 'sha256:81e4121e16d486557926a4291286165bb546f1a209f6956579cfc7230fff2ffc', 'diagnostic 213 digest changed');
assert(targetDiagnostic.conclusion === 'failure-with-complete-artifact', 'diagnostic 213 conclusion changed');
assert(targetDiagnostic.failureClassification === 'source-anchor-parser-false-negative-not-evidence-failure', 'diagnostic 213 failure classification changed');

assert(evidence.authority.name === 'East View Information Services', 'authority changed');
assert(evidence.authority.archiveId === '870', 'archive ID changed');
assert(evidence.authority.titleId === '9305', 'title ID changed');
assert(evidence.target.dateIso === '1921-11-09', 'target date changed');
assert(evidence.target.issueNumber === '252', 'target issue changed');
assert(evidence.target.literalFeaturedIssueId === '967207', 'literal featured ID changed');
assert(evidence.target.sourceAnchorText === 'November 09, 1921, No. 252', 'source anchor text changed');
assert(evidence.target.literalFeaturedUrl.endsWith('issueId=967207'), 'literal target URL changed');

assert(evidence.sourceWitness.status === 200, 'source witness must remain HTTP 200');
assert(evidence.sourceWitness.bytes === 4_540_127, 'source byte envelope changed');
assert(sha256Pattern.test(evidence.sourceWitness.artifactSha256), 'invalid source artifact SHA');
assert(sha256Pattern.test(evidence.sourceWitness.repeatedFetchSha256), 'invalid repeated source SHA');
assert(sha256Pattern.test(evidence.sourceWitness.visibleTextSha256), 'invalid source visible-text SHA');
assert(evidence.sourceWitness.literalFeaturedUrlCount === 1, 'literal target URL must occur once');
assert(evidence.sourceWitness.literalAnchorTextCount === 1, 'literal anchor text must occur once');
assert(evidence.sourceWitness.parserReportedCount === 0, 'parser false-negative provenance changed');
assert(evidence.sourceWitness.parserReportCorrectedByRawArtifactInspection, 'raw-artifact correction lost');

assert(evidence.targetResponse.status === 200, 'target response must remain HTTP 200');
assert(evidence.targetResponse.bytes === 25_979, 'target response byte envelope changed');
assert(sha256Pattern.test(evidence.targetResponse.sha256), 'invalid target response SHA');
assert(sha256Pattern.test(evidence.targetResponse.visibleTextSha256), 'invalid target visible-text SHA');
assert(evidence.targetResponse.exactDatePresent, 'exact date marker lost');
assert(evidence.targetResponse.exactIssuePresent, 'exact issue marker lost');
assert(evidence.targetResponse.archiveIdentityPresent, 'archive identity marker lost');
assert(evidence.targetResponse.signInPresent, 'sign-in boundary lost');
assert(evidence.targetResponse.subscriptionPresent, 'subscription boundary lost');
assert(evidence.targetResponse.literalDownstreamLinkCount === 0, 'downstream link count changed');

assert(evidence.classification.exactIssueMetadataVerified, 'exact issue metadata must remain verified');
assert(evidence.classification.exactFeaturedIssueUrlResolved, 'exact featured URL must remain resolved');
assert(evidence.classification.literalFeaturedIssueIdIsNotBrowseIssueId, 'featured/browse ID distinction lost');
assert(evidence.classification.literalFeaturedIssueIdIsNotDocumentId, 'featured/document ID distinction lost');
assert(evidence.classification.literalFeaturedIssueIdIsNotViewerId, 'featured/viewer ID distinction lost');
assert(evidence.classification.browseIssueRouteResolved === false, 'browse issue route remains unresolved');
assert(evidence.classification.documentOrPageRouteResolved === false, 'document route remains unresolved');
assert(evidence.classification.facsimileBytesAcquired === false, 'facsimile bytes remain unacquired');
assert(evidence.classification.issueContentInspected === false, 'issue content remains uninspected');
assert(evidence.classification.constructedBrowseIssueId === false, 'browse ID construction forbidden');
assert(evidence.classification.constructedDocumentId === false, 'document ID construction forbidden');
assert(evidence.classification.constructedViewerId === false, 'viewer ID construction forbidden');
assert(evidence.classification.neighboringIdArithmeticUsed === false, 'neighbor arithmetic forbidden');

assert(evidence.effectiveState.state === 'exact-featured-issue-metadata-verified-subscription-facsimile-unresolved', 'effective state changed');
assert(evidence.effectiveState.historicalHoldRemainsActiveForFacsimile, 'facsimile HOLD must remain active');
assert(evidence.effectiveState.exactIssueMetadataResolved, 'metadata resolution lost');
assert(evidence.effectiveState.exactIssueUrl === evidence.target.literalFeaturedUrl, 'effective exact URL mismatch');
for (const [key, value] of Object.entries(evidence.effectiveState)) {
  if (['exactIssuePdfAcquired', 'facsimileAcquired', 'contentInspected', 'requestSubmitted', 'credentialsProvided', 'subscriptionPurchased', 'paymentAuthorized', 'paymentMade', 'ocrUsedForEvidence', 'syntheticContentUsed', 'wikipediaUsedAsEvidence', 'articlePublished', 'articleRegistered', 'productionAuthorized'].includes(key)) {
    assert(value === false, `${key} must remain false`);
  }
}
assert(evidence.effectiveState.remainingTarget.includes('967207'), 'remaining target must retain literal featured issue ID');

console.log('Yesenin Pravda East View evidence pass 27 OK: exact issue metadata and literal URL verified; subscription/facsimile HOLD active.');
