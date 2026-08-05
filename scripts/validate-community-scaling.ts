import { readFileSync } from 'node:fs';

const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (path: string) => readFileSync(path, 'utf8');

const app = read('src/App.tsx');
const remote = read('src/utils/communityRemote.ts');
const store = read('src/utils/communityStore.ts');
const targetStore = read('src/utils/communityTargetStore.ts');
const leaderboard = read('src/utils/communityLeaderboardStore.ts');
const ratingsPage = read('src/pages/RatingsPage.tsx');
const mini = read('src/components/community/FeedbackMiniSummary.tsx');
const schema = read('docs/community-schema.sql');
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
const desktopTopology = read('qa/manual-e2e.spec.mjs');
const topologyCases = read('qa/community-request-topology.cases.mjs');
const mobileTopology = read('qa/community-request-topology.spec.mjs');
const playwright = read('playwright.config.mjs');
const browserWorkflow = read('.github/workflows/manual-browser-qa.yml');
const webkitRunner = read('scripts/run-webkit-process-isolated.mjs');

expect(!/hydrateFromRemote|fetchAllRemote/.test(app), 'App must not start global community hydration');
expect(!/fetchAllRemote|MAX_REMOTE_ROWS|20_?000/.test(remote), 'remote client must not retain a global 20k corpus reader');
expect(remote.includes("const SUMMARY_VIEW = 'tlp_feedback_summary_public'"), 'remote client must use the aggregate summary view');
expect(remote.includes('__TLP_COMMUNITY_TEST_CONFIG__') && remote.includes('LOOPBACK_HOSTS'), 'browser topology may inject remote config only on loopback hosts');
expect(remote.includes('fetchTargetAggregate') && remote.includes('fetchTargetCommentsPage') && remote.includes('fetchPoetAggregates'), 'remote client must expose target aggregate, cursor comments and aggregate leaderboard readers');
expect(/target_type:\s*`eq\.\$\{targetType\}`/.test(remote) && /target_id:\s*`eq\.\$\{targetId\}`/.test(remote), 'detail requests must bind both target type and target id');
expect(remote.includes("order: 'created_at.desc,id.desc'"), 'comments must use stable newest/id ordering');
expect(remote.includes('created_at.eq.${cursor.createdAt},id.lt.${cursor.id}'), 'comments cursor must break equal timestamps by id');
expect(remote.includes('limit: String(limit + 1)'), 'comments must use a bounded page plus sentinel');
expect(remote.includes('MAX_LEADERBOARD_TARGETS = 100'), 'leaderboard target list must be bounded');
expect(!/fetchPoetAggregates[\s\S]*Promise\.all\(ids\.map\([^)]*fetchTargetAggregateFallback/.test(remote), 'leaderboard must fail closed when the aggregate view is unavailable instead of downloading raw ratings per poet');

expect(store.includes("const STORE_KEY = 'tlp-community-feedback:v3'"), 'browser state must use the bounded v3 envelope');
expect(!/hydrateFromRemote|fetchAllRemote/.test(store), 'community store must not own remote corpus reads');
expect(store.includes('localSnapshot') && store.includes('MAX_LOCAL_ENTRIES = 500'), 'browser persistence must be device-owned and bounded');
expect(store.includes('function migrateV2') && store.includes('pendingRatingIds') && store.includes('pendingCommentIds'), 'v2 migration must preserve pending/device work while dropping public corpus rows');
expect(store.includes('flushCommunityOutbox') && store.includes('subscribeCommunityRemoteMutations'), 'outbox retry and target invalidation must remain present');
expect(store.includes('remoteReadFailed'), 'concurrent remote reads must preserve a failed epoch');

expect(targetStore.includes("export type CommunityTargetLoadMode = 'passive' | 'summary' | 'full'"), 'target store must separate passive, summary and full modes');
expect(targetStore.includes('fetchTargetAggregate') && targetStore.includes('fetchTargetCommentsPage'), 'target store must load aggregate and comments independently');
expect(targetStore.includes('records.delete') && targetStore.includes('releaseSharedSubscriptionsIfIdle'), 'target records/subscriptions must be released after unmount');
expect(leaderboard.includes('fetchPoetAggregates'), 'leaderboard must use aggregate rows');
expect(!/filterRatings|getFeedbackSnapshot|fetchTargetCommentsPage/.test(leaderboard), 'leaderboard must not inspect global ratings or comments');
expect(ratingsPage.includes('useCommunityLeaderboard'), 'ratings page must use the aggregate-only leaderboard hook');
expect(!/getFeedbackSnapshot|filterRatings\(/.test(ratingsPage), 'ratings page must not compute from a raw global corpus');
expect(mini.includes("mode: 'passive'"), 'homepage/card mini summaries must perform zero automatic remote reads');

expect(schema.includes('create or replace view public.tlp_feedback_summary_public'), 'backend schema must expose an aggregate summary view');
expect(schema.includes('stddev_pop(overall)') && schema.includes('rating_summary.deviation'), 'aggregate view must expose consensus deviation without raw ratings');
expect(schema.includes('grant select on public.tlp_ratings_public, public.tlp_comments_public, public.tlp_feedback_summary_public'), 'summary view must receive the same safe public grant');
expect(schema.includes("'^rating-[a-z0-9][a-z0-9-]{7,199}$'"), 'rating RPC must accept the UUID IDs generated by the client');
expect(schema.includes("'^comment-[a-z0-9][a-z0-9-]{7,199}$'"), 'comment/helpful RPCs must accept the UUID IDs generated by the client');
expect(schema.includes('char_length(clean_text) > 2000'), 'backend comment length must match the client contract');
expect(schema.includes('tlp_ratings_target_cursor_idx') && schema.includes('tlp_comments_target_cursor_idx'), 'stable target cursors must be backed by created_at/id indexes');

const scripts = packageJson.scripts ?? {};
expect(scripts['validate:community-store']?.includes('validate-community-store.ts'), 'package must expose the v3 store validator');
expect(scripts['validate:community-target-store']?.includes('validate-community-target-store.ts'), 'package must expose the target/cursor validator');
expect(scripts['validate:community-scaling']?.includes('validate-community-scaling.ts'), 'package must expose the static scaling contract');
expect(scripts['check:content']?.includes('validate:community-scaling'), 'repository-wide content checks must include community scaling');
expect(desktopTopology.includes('registerCommunityRequestTopologyTests'), 'mandatory desktop browser QA must register the request-topology contour');
expect(topologyCases.includes('__TLP_COMMUNITY_TEST_CONFIG__'), 'request topology must activate the loopback-only backend before bundle evaluation');
expect(topologyCases.includes("localStorage.getItem('tlp-community-feedback:v3')"), 'request topology must inspect the bounded v3 persistence envelope');
expect(topologyCases.includes("operation.kind === 'helpful'") && topologyCases.includes('localSnapshot?.comments'), 'request topology must prove remote helpful outbox semantics without persisting public comments');
expect(mobileTopology.includes("projects: ['android-pixel7', 'iphone-safari']"), 'mobile topology entrypoint must cover Android Chrome and iPhone Safari');
expect(playwright.includes('community-request-topology'), 'Playwright mobile projects must admit the mobile topology entrypoint');
expect(browserWorkflow.includes('qa/community-request-topology.spec.mjs') && browserWorkflow.includes('--project=android-pixel7'), 'Manual Browser QA must run community topology on Android Chrome');
expect(webkitRunner.includes("id: 'community-request-topology'") && webkitRunner.includes("file: 'qa/community-request-topology.spec.mjs'"), 'fresh-process base iPhone Safari must run community topology');
expect(browserWorkflow.includes('TESTED_SHA') && browserWorkflow.includes('git rev-parse HEAD'), 'consolidated browser workflow must pin and verify the exact tested head');

for (const failure of failures) console.error(`ERROR community-scaling: ${failure}`);
console.log(`Community scaling contract: ${failures.length} error(s); startup, target, cursor, aggregate, persistence, consolidated mobile topology and schema boundaries checked.`);
if (failures.length) process.exit(1);
