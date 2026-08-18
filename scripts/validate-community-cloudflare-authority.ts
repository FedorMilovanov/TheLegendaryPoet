import { readFileSync } from 'node:fs';

const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (path: string) => readFileSync(path, 'utf8');

const remote = read('src/utils/communityRemote.ts');
const config = read('src/utils/communityConfig.ts');
const humanCheck = read('src/utils/communityHumanCheck.ts');
const worker = read('workers/community-api/src/index.ts');
const schema = read('workers/community-api/schema.sql');
const generator = read('scripts/gen-community-targets.ts');
const deploy = read('.github/workflows/deploy.yml');
const setup = read('docs/COMMENTS_SETUP.md');

expect(config.includes('VITE_COMMUNITY_API_URL'), 'browser config must use the Cloudflare community API URL');
expect(config.includes('VITE_TURNSTILE_SITE_KEY'), 'browser config must expose only the public Turnstile site key');
expect(!/VITE_SUPABASE|SUPABASE_ANON_KEY/.test(config + remote + deploy), 'Supabase browser authority must be removed from runtime/deploy config');
expect(!/\/rest\/v1\/rpc\/|p_voter_id|apikey:/i.test(remote), 'browser mutation client must not call public database RPCs or transmit voter authority');
expect(remote.includes("mutation('/v1/rating'") && remote.includes("mutation('/v1/comment'") && remote.includes("mutation('/v1/helpful'"), 'all writes must cross the Worker mutation boundary');
expect(remote.includes("apiUrl('/v1/session')") && remote.includes('requestCommunityHumanProof'), 'shared writes must acquire a Turnstile-backed server actor session');
expect(remote.includes("const ACTOR_KEY = 'tlp-community-actor:v1'"), 'signed actor session must have a dedicated browser envelope');

expect(humanCheck.includes('challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'), 'Turnstile must use Cloudflare explicit rendering');
expect(humanCheck.includes("execution: 'execute'") && humanCheck.includes("appearance: 'interaction-only'"), 'Turnstile must defer verification until a shared write needs a session');
expect(humanCheck.includes("action: 'community_session'"), 'Turnstile client action must be stable and server-verifiable');
expect(humanCheck.includes('LOOPBACK') === false, 'human-check runtime must not carry a standalone production bypass');

expect(worker.includes("request.headers.get('CF-Connecting-IP')"), 'Worker must derive network authority from Cloudflare connection metadata');
expect(worker.includes("crypto.subtle.sign('HMAC'") && worker.includes("crypto.subtle.verify("), 'network and actor authority must be cryptographically server-derived');
expect(worker.includes('COMMUNITY_SESSION_SECRET') && worker.includes('COMMUNITY_NETWORK_SECRET'), 'Worker must separate session and network secrets');
expect(worker.includes('TURNSTILE_SECRET') && worker.includes('TURNSTILE_HOSTNAMES'), 'Worker must keep Turnstile verification server-side');
expect(worker.includes('https://challenges.cloudflare.com/turnstile/v0/siteverify'), 'Worker must call canonical Turnstile Siteverify');
expect(worker.includes("result.action !== 'community_session'") && worker.includes('!hosts.has(result.hostname)'), 'Worker must validate Turnstile action and hostname, not just success');
expect(worker.includes("throw new HttpError(400, 'unexpected_authority_field')"), 'mutation bodies must reject caller-supplied authority fields');
expect(worker.includes('requireCanonicalTarget'), 'mutations must require release-canonical target membership');
expect(worker.includes('COMMUNITY_TARGET_MANIFEST_URL'), 'canonical target authority must come from the release manifest');
expect(worker.includes("INSERT INTO tlp_rate_buckets") && worker.includes('ON CONFLICT(network_key, action, scope, window_start)'), 'network budgets must be atomic D1 upserts');
expect(worker.includes("ON CONFLICT(target_type, target_id, actor_id)"), 'rating uniqueness must be server actor + target');
expect(worker.includes('INSERT OR IGNORE INTO tlp_helpful_votes'), 'helpful retries must be idempotent under the database uniqueness constraint');
expect(!/localStorage|sessionStorage|p_voter_id/.test(worker), 'Worker must not trust browser storage or legacy voter IDs');

expect(schema.includes('PRIMARY KEY (target_type, target_id, actor_id)'), 'D1 schema must enforce one active rating per actor/target');
expect(schema.includes('PRIMARY KEY (comment_id, actor_id)'), 'D1 schema must enforce one helpful vote per actor/comment');
expect(schema.includes('PRIMARY KEY (network_key, action, scope, window_start)'), 'D1 schema must enforce one atomic abuse bucket row');
expect(!/\bip\b|ip_address|raw_ip/i.test(schema), 'D1 schema must not persist raw IP fields');
expect(schema.includes('CHECK (length(network_key) = 64)'), 'D1 must store only fixed-length HMAC network keys');

expect(generator.includes('getAllEssays') && generator.includes('musicTracks') && generator.includes('poets'), 'community target manifest must derive from canonical Product catalogs');
expect(generator.includes("writeFileSync('public/community-targets.json'"), 'site build must materialize the target manifest at a stable public path');
expect(deploy.includes('VITE_COMMUNITY_API_URL') && deploy.includes('VITE_TURNSTILE_SITE_KEY'), 'Pages deploy must inject only the public Worker URL and Turnstile site key');
expect(!deploy.includes('VITE_SUPABASE_URL') && !deploy.includes('VITE_SUPABASE_ANON_KEY'), 'Pages deploy must not retain obsolete Supabase runtime variables');
expect(setup.includes('Cloudflare Worker') && setup.includes('D1') && setup.includes('Turnstile'), 'operator setup must describe the actual production backend');

for (const failure of failures) console.error(`ERROR community-cloudflare-authority: ${failure}`);
console.log(`Community Cloudflare authority contract: ${failures.length} error(s); browser, Worker, D1, Turnstile, target authority and deploy boundaries checked.`);
if (failures.length) process.exit(1);
