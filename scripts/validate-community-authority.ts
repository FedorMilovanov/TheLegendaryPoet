import { readFileSync } from 'node:fs';
import { getAllEssays } from '../src/data/essays';
import { musicTracks, poets } from '../src/data/poets';

const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (path: string) => readFileSync(path, 'utf8');

const remote = read('src/utils/communityRemote.ts');
const config = read('src/utils/communityConfig.ts');
const auth = read('src/utils/communityAuth.ts');
const identity = read('src/utils/communityIdentity.ts');
const edge = read('supabase/functions/community-write/index.ts');
const edgeConfig = read('supabase/config.toml');
const schema = read('docs/community-schema.sql');
const migration = read('supabase/migrations/20260819010000_community_authority.sql');
const setup = read('docs/COMMENTS_SETUP.md');
const storageDoc = read('docs/COMMUNITY_FEEDBACK_STORAGE.md');
const manifest = JSON.parse(read('public/community-targets.json')) as {
  version?: number;
  targets?: Record<string, string[]>;
};

const canonical = {
  poet: [...new Set(poets.map((poet) => poet.id))].sort((a, b) => a.localeCompare(b, 'en')),
  poem: [...new Set(poets.flatMap((poet) => poet.poems.map((poem) => poem.id)))].sort((a, b) => a.localeCompare(b, 'en')),
  track: [...new Set(musicTracks.map((track) => track.id))].sort((a, b) => a.localeCompare(b, 'en')),
  article: [...new Set(getAllEssays().map((essay) => essay.id))].sort((a, b) => a.localeCompare(b, 'en')),
};

expect(manifest.version === 1, 'community target manifest must have version 1');
for (const [targetType, expected] of Object.entries(canonical)) {
  expect(
    JSON.stringify(manifest.targets?.[targetType] ?? []) === JSON.stringify(expected),
    `community target manifest drifted for ${targetType}`,
  );
}

expect(config.includes('__TLP_COMMUNITY_TEST_CONFIG__') && config.includes('LOOPBACK_HOSTS'), 'loopback-only community test config must remain isolated');
expect(auth.includes("postAuth('signup'") && auth.includes('grant_type=refresh_token'), 'remote writes must establish and refresh a server-issued anonymous Auth session');
expect(auth.includes('safeRemove(LEGACY_DEVICE_KEY)'), 'trusted auth establishment must retire the legacy browser UUID');
expect(identity.includes('never sent by the hardened remote transport'), 'legacy UUID must be explicitly local-only');

expect(remote.includes("COMMUNITY_WRITE_FUNCTION = 'community-write'"), 'mutations must use the community-write Edge Function');
expect(remote.includes('getCommunityAccessToken') && remote.includes('Authorization: `Bearer ${accessToken}`'), 'mutation transport must send a server-issued Auth bearer token');
expect(!remote.includes('/rest/v1/rpc/tlp_submit_') && !remote.includes('/rest/v1/rpc/tlp_mark_helpful'), 'browser must not call mutation RPCs directly');
expect(!/p_voter_id|p_actor_id|network_key/i.test(remote), 'browser transport must not choose server actor or network authority fields');
expect(remote.includes('intentionally never serialized into a network request'), 'legacy local outbox ID boundary must be explicit');

expect(edge.includes("withSupabase({ auth: 'user' }") && edge.includes('ctx.userClaims?.sub'), 'Edge Function must validate and derive the Auth actor');
expect(edge.includes("req.headers.get('x-forwarded-for')") && edge.includes("name: 'HMAC'"), 'Edge Function must derive a keyed network authority from gateway client IP');
expect(edge.includes('COMMUNITY_ABUSE_SECRET') && edge.includes('abuseSecret.length < 32'), 'network hash secret must be required and fail closed');
expect(edge.includes('community-targets.json') && edge.includes('canonicalTargets.has'), 'Edge Function must enforce release-derived canonical target membership');
expect(edge.includes("rpcName = 'tlp_submit_rating_server'") && edge.includes("rpcName = 'tlp_submit_comment_server'") && edge.includes("rpcName = 'tlp_mark_helpful_server'"), 'Edge Function must use service-only mutation RPCs');
expect(!/body\.(?:actor|actorId|voter|voterId|network|networkKey)/.test(edge), 'Edge Function must not read identity or network authority from request body');
expect(edge.includes('function hasOnlyKeys') && edge.includes("hasOnlyKeys(body, ['kind', 'targetType', 'targetId', 'scores'])"), 'Edge Function must reject extra request fields');
expect(edgeConfig.includes('[functions.community-write]') && edgeConfig.includes('verify_jwt = false'), '@supabase/server must own current user JWT authorization');

expect(schema === migration, 'checked-in migration must exactly match the repeatable authority schema');
for (const sql of [schema, migration]) {
  expect(sql.includes('create table if not exists public.tlp_community_abuse_buckets'), 'backend must own atomic network abuse buckets');
  expect(sql.includes('create or replace function public.tlp_take_community_budget'), 'backend must enforce an atomic abuse budget helper');
  expect(sql.includes("raise exception 'community rate limit'"), 'backend must fail closed after abuse budget exhaustion');
  expect(sql.includes('p_actor_id uuid') && sql.includes('p_network_key text'), 'server-only mutations must receive trusted Edge-derived actor/network fields');
  expect(sql.includes('drop function if exists public.tlp_submit_rating(text, text, text, uuid, jsonb)'), 'legacy public rating RPC must be removed');
  expect(sql.includes('drop function if exists public.tlp_submit_comment(text, text, text, uuid, text, text, text)'), 'legacy public comment RPC must be removed');
  expect(sql.includes('drop function if exists public.tlp_mark_helpful(text, uuid)'), 'legacy public helpful RPC must be removed');
  expect(sql.includes('grant execute on function public.tlp_submit_rating_server') && sql.includes('to service_role'), 'rating server RPC must be service-role-only');
  expect(sql.includes('grant execute on function public.tlp_submit_comment_server') && sql.includes('to service_role'), 'comment server RPC must be service-role-only');
  expect(sql.includes('grant execute on function public.tlp_mark_helpful_server') && sql.includes('to service_role'), 'helpful server RPC must be service-role-only');
  expect(!/grant execute on function public\.tlp_(?:submit|mark)[^;]+to anon/si.test(sql), 'no mutation RPC may be executable by anon');
  expect(!/grant execute on function public\.tlp_(?:submit|mark)[^;]+to authenticated/si.test(sql), 'no mutation RPC may be executable by authenticated');
}

expect(setup.includes('Edge Function') && setup.includes('анонимной сессии Supabase Auth'), 'setup docs must describe trusted write authority');
expect(storageDoc.includes('не передаётся на сервер') && storageDoc.includes('server-issued'), 'storage docs must separate legacy local UUID from server identity');

for (const failure of failures) console.error(`ERROR community-authority: ${failure}`);
console.log(`Community authority contract: ${failures.length} error(s); Auth actor, HMAC network budget, canonical targets and service-only RPC boundary checked.`);
if (failures.length) process.exit(1);
