import { readFileSync } from 'node:fs';

const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (path: string) => readFileSync(path, 'utf8');

const app = read('src/App.tsx');
const config = read('src/utils/communityConfig.ts');
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
expect(config.includes('__TLP_COMMUNITY_TEST_CONFIG__') && config.includes('LOOPBACK_HOSTS'), 'loopback browser config must be isolated in communityConfig');
expect(!/fetchAllRemote|MAX_REMOTE_ROWS|20_?000/.test(remote), 'remote client must not retain a global 20k corpus reader');
expect(remote.includes("const SUMMARY_VIEW = 'tlp_feedback_summary_public'"), 'remote client must use the aggregate summary view');
expect(remote.includes('fetchTargetAggregate') && remote.includes('fetchTargetCommentsPage') && remote.includes('fetchPoetAggregates'), 'remote client must expose target aggregate, cursor comments and aggregate leaderboard readers');
expect(/target_type:\s*`eq\.\$\{targetType\}`/.test(remote) && /target_id:\s*`eq\.\$\{targetId\}`/.test(remote), 'detail requests must bind both target type and target id');
expect(remote.includes("order: 'created_at.desc,id.desc'"), 'comments must use stable newest/id ordering');
expect(remote.includes('created_at.eq.${cursor.createdAt},id.lt.${cursor.id}'), 'comments cursor must break equal timestamps by id');
expect(remote.includes('limit: String(limit + 1)'), 'comments must use a bounded page plus sentinel');
expect(remote.includes('MAX_LEADERBOARD_TARGETS = 100'), 'leaderboard target list must be bounded');
expect(!/fetchPoetAggregates[\s\S]*Promise\.all\(ids\.map\([^)]*fetchTargetAggregateFallback/.test(remote), 'leaderboard must fail closed when aggregate view is unavailable');
expect(remote.includes("COMMUNITY_WRITE_FUNCTION = 'community-write'"), 'writes must leave the Data API and pass through the trusted Edge Function');
expect(!remote.includes('/rest/v1/rpc/tlp_submit_') && !remote.includes('/rest/v1/rpc/tlp_mark_helpful'), 'browser must not call mutation RPCs directly');

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
expect(schema.includes('grant select on public.tlp_ratings_public, public.tlp_comments_public, public.tlp_feedback_summary_public'), 'safe public views must remain readable');
expect(schema.includes('tlp_ratings_target_cursor_idx') && schema.includes('tlp_comments_target_cursor_idx'), 'stable target cursors must be backed by created_at/id indexes');
expect(schema.includes('tlp_take_community_budget') && schema.includes('tlp_submit_rating_server'), 'schema must expose the trusted server-side mutation contract');
expect(schema.includes('drop function if exists public.tlp_submit_rating'), 'legacy browser-authoritative RPC must be removed');

const scripts = packageJson.scripts ?? {};
expect(scripts['validate:community-store']?.includes('validate-community-store.ts'), 'package must expose the v3 store validator');
expect(scripts['validate:community-target-store']?.includes('validate-community-target-store.ts'), 'package must expose the target/cursor validator');
expect(scripts['validate:community-scaling']?.includes('validate-community-scaling.ts'), 'package must expose the static scaling contract');
expect(scripts['validate:community-authority']?.includes('validate-community-authority.ts'), 'package must expose the trusted mutation authority validator');
expect(scripts['check:content']?.includes('validate:community-scaling') && scripts['check:content']?.includes('validate:community-authority'), 'repository-wide checks must include scaling and authority contracts');
expect(desktopTopology.includes('registerCommunityRequestTopologyTests'), 'mandatory desktop browser QA must register request topology');
expect(topologyCases.includes('__TLP_COMMUNITY_TEST_CONFIG__'), 'request topology must activate loopback-only backend before bundle evaluation');
expect(topologyCases.includes("localStorage.getItem('tlp-community-feedback:v3')"), 'request topology must inspect bounded v3 persistence');
expect(topologyCases.includes('/functions/v1/community-write'), 'request topology must exercise the Edge mutation boundary');
expect(mobileTopology.includes("projects: ['android-pixel7', 'iphone-safari']"), 'mobile topology must cover Android Chrome and iPhone Safari');
expect(playwright.includes('community-request-topology'), 'Playwright mobile projects must admit mobile topology entrypoint');
expect(browserWorkflow.includes('qa/community-request-topology.spec.mjs') && browserWorkflow.includes('--project=android-pixel7'), 'Manual Browser QA must run community topology on Android Chrome');
expect(webkitRunner.includes("id: 'community-request-topology'") && webkitRunner.includes("file: 'qa/community-request-topology.spec.mjs'"), 'fresh-process iPhone Safari must run community topology');
expect(browserWorkflow.includes('TESTED_SHA') && browserWorkflow.includes('git rev-parse HEAD'), 'browser workflow must pin and verify exact tested head');

for (const failure of failures) console.error(`ERROR community-scaling: ${failure}`);
console.log(`Community scaling contract: ${failures.length} error(s); target/cursor/aggregate/persistence/browser topology and trusted mutation routing checked.`);
if (failures.length) process.exit(1);
