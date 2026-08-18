const VITE_ENV = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const NODE_ENV = typeof process !== 'undefined' ? process.env : undefined;
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost']);

type CommunityTestConfig = { url: string; key: string };

function readLoopbackTestConfig(): CommunityTestConfig | undefined {
  if (typeof window === 'undefined' || !LOOPBACK_HOSTS.has(window.location?.hostname ?? '')) return undefined;
  const candidate = (globalThis as typeof globalThis & {
    __TLP_COMMUNITY_TEST_CONFIG__?: Partial<CommunityTestConfig>;
  }).__TLP_COMMUNITY_TEST_CONFIG__;
  const url = typeof candidate?.url === 'string' ? candidate.url.replace(/\/$/, '') : '';
  const key = typeof candidate?.key === 'string' ? candidate.key : '';
  if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(url) || key.length < 8) return undefined;
  return { url, key };
}

const LOOPBACK_TEST_CONFIG = readLoopbackTestConfig();

export const communityUrl = (
  VITE_ENV?.VITE_SUPABASE_URL
  ?? LOOPBACK_TEST_CONFIG?.url
  ?? NODE_ENV?.VITE_SUPABASE_URL
)?.replace(/\/$/, '');

export const communityPublicKey = (
  VITE_ENV?.VITE_SUPABASE_ANON_KEY
  ?? LOOPBACK_TEST_CONFIG?.key
  ?? NODE_ENV?.VITE_SUPABASE_ANON_KEY
);

export const remoteEnabled = Boolean(communityUrl && communityPublicKey);

export function communityPublicHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: communityPublicKey as string,
    'Content-Type': 'application/json',
    ...extra,
  };
}
