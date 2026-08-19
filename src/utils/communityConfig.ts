const VITE_ENV = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const NODE_ENV = typeof process !== 'undefined' ? process.env : undefined;
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost']);

export type CommunityTestConfig = {
  url: string;
  siteKey?: string;
  humanProof?: string;
};

function normalizeHttpsApiUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (
      parsed.protocol !== 'https:'
      || parsed.username
      || parsed.password
      || parsed.search
      || parsed.hash
    ) return undefined;
    const pathname = parsed.pathname === '/'
      ? ''
      : parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin}${pathname}`;
  } catch {
    return undefined;
  }
}

function readLoopbackTestConfig(): CommunityTestConfig | undefined {
  if (typeof window === 'undefined' || !LOOPBACK_HOSTS.has(window.location?.hostname ?? '')) return undefined;
  const candidate = (globalThis as typeof globalThis & {
    __TLP_COMMUNITY_TEST_CONFIG__?: Partial<CommunityTestConfig>;
  }).__TLP_COMMUNITY_TEST_CONFIG__;
  const url = normalizeHttpsApiUrl(typeof candidate?.url === 'string' ? candidate.url : undefined);
  const siteKey = typeof candidate?.siteKey === 'string' ? candidate.siteKey : undefined;
  const humanProof = typeof candidate?.humanProof === 'string' ? candidate.humanProof : undefined;
  if (!url) return undefined;
  return { url, siteKey, humanProof };
}

const LOOPBACK_TEST_CONFIG = readLoopbackTestConfig();

export const communityApiUrl = [
  VITE_ENV?.VITE_COMMUNITY_API_URL,
  LOOPBACK_TEST_CONFIG?.url,
  NODE_ENV?.VITE_COMMUNITY_API_URL,
].map(normalizeHttpsApiUrl).find((value): value is string => Boolean(value));

export const communityTurnstileSiteKey = (
  VITE_ENV?.VITE_TURNSTILE_SITE_KEY
  ?? LOOPBACK_TEST_CONFIG?.siteKey
  ?? NODE_ENV?.VITE_TURNSTILE_SITE_KEY
)?.trim();

// The Node-only value is used by repository validators. In browser builds the only
// test injection path is loopback-only, so production pages cannot bypass Turnstile.
export const communityTestHumanProof = LOOPBACK_TEST_CONFIG?.humanProof
  ?? (typeof window === 'undefined' ? NODE_ENV?.TLP_COMMUNITY_TEST_HUMAN_PROOF : undefined);

export const remoteEnabled = Boolean(communityApiUrl);
