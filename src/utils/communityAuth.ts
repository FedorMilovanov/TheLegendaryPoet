import { safeRead, safeRemove, safeWrite } from './browserStorage';
import { communityPublicHeaders, communityUrl, remoteEnabled } from './communityConfig';

const AUTH_KEY = 'tlp-community-auth:v1';
const LEGACY_DEVICE_KEY = 'tlp-community-device-v1';
const REQUEST_TIMEOUT_MS = 12_000;
const EXPIRY_SKEW_MS = 60_000;
const MAX_TOKEN_LENGTH = 16_384;

type StoredCommunityAuth = {
  version: 1;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

type AuthPayload = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
  expires_at?: unknown;
  session?: {
    access_token?: unknown;
    refresh_token?: unknown;
    expires_in?: unknown;
    expires_at?: unknown;
  } | null;
};

let inFlight: Promise<string | null> | null = null;

function normalizeToken(value: unknown) {
  return typeof value === 'string' && value.length >= 16 && value.length <= MAX_TOKEN_LENGTH ? value : null;
}

function normalizeExpiry(value: unknown, expiresIn: unknown) {
  const direct = Number(value);
  if (Number.isFinite(direct) && direct > Date.now() / 1000 - 60) return Math.floor(direct * 1000);
  const seconds = Number(expiresIn);
  return Date.now() + Math.max(60, Math.min(86_400, Number.isFinite(seconds) ? seconds : 3600)) * 1000;
}

function sanitizeStored(value: unknown): StoredCommunityAuth | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<StoredCommunityAuth>;
  const accessToken = normalizeToken(candidate.accessToken);
  const refreshToken = normalizeToken(candidate.refreshToken);
  const expiresAt = Number(candidate.expiresAt);
  if (candidate.version !== 1 || !accessToken || !refreshToken || !Number.isFinite(expiresAt) || expiresAt <= 0) return null;
  return { version: 1, accessToken, refreshToken, expiresAt };
}

function readStoredSession() {
  const raw = safeRead(AUTH_KEY);
  if (!raw) return null;
  try {
    return sanitizeStored(JSON.parse(raw));
  } catch {
    return null;
  }
}

function persistSession(session: StoredCommunityAuth) {
  if (!safeWrite(AUTH_KEY, JSON.stringify(session))) return false;
  safeRemove(LEGACY_DEVICE_KEY);
  return true;
}

function sessionFromPayload(payload: AuthPayload): StoredCommunityAuth | null {
  const source = payload.session && typeof payload.session === 'object' ? payload.session : payload;
  const accessToken = normalizeToken(source.access_token);
  const refreshToken = normalizeToken(source.refresh_token);
  if (!accessToken || !refreshToken) return null;
  return {
    version: 1,
    accessToken,
    refreshToken,
    expiresAt: normalizeExpiry(source.expires_at, source.expires_in),
  };
}

async function postAuth(path: string, body: Record<string, unknown>): Promise<StoredCommunityAuth | null> {
  if (!remoteEnabled || !communityUrl) return null;
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${communityUrl}/auth/v1/${path}`, {
      method: 'POST',
      headers: communityPublicHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = await response.json() as AuthPayload;
    return sessionFromPayload(payload);
  } catch {
    return null;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function refreshSession(refreshToken: string) {
  return postAuth('token?grant_type=refresh_token', { refresh_token: refreshToken });
}

async function createAnonymousSession() {
  return postAuth('signup', { data: {} });
}

async function resolveAccessToken() {
  const existing = readStoredSession();
  if (existing && existing.expiresAt > Date.now() + EXPIRY_SKEW_MS) return existing.accessToken;

  if (existing) {
    const refreshed = await refreshSession(existing.refreshToken);
    if (refreshed && persistSession(refreshed)) return refreshed.accessToken;
    safeRemove(AUTH_KEY);
  }

  const created = await createAnonymousSession();
  if (!created || !persistSession(created)) return null;
  return created.accessToken;
}

async function withBrowserAuthLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator === 'undefined') return task();
  const locks = (navigator as Navigator & {
    locks?: { request<R>(name: string, callback: () => Promise<R>): Promise<R> };
  }).locks;
  if (!locks?.request) return task();
  return locks.request(AUTH_KEY, task);
}

export function getCommunityAccessToken(): Promise<string | null> {
  if (!remoteEnabled) return Promise.resolve(null);
  if (inFlight) return inFlight;
  inFlight = withBrowserAuthLock(resolveAccessToken).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export async function refreshCommunityAccessToken(accessToken?: string): Promise<string | null> {
  if (!remoteEnabled) return null;
  return withBrowserAuthLock(async () => {
    const current = readStoredSession();
    if (!current) return resolveAccessToken();
    if (accessToken && current.accessToken !== accessToken) {
      return current.expiresAt > Date.now() + EXPIRY_SKEW_MS ? current.accessToken : resolveAccessToken();
    }
    const refreshed = await refreshSession(current.refreshToken);
    if (!refreshed || !persistSession(refreshed)) {
      safeRemove(AUTH_KEY);
      return null;
    }
    return refreshed.accessToken;
  });
}

export function invalidateCommunityAccessToken(accessToken?: string) {
  const current = readStoredSession();
  if (!current || (accessToken && current.accessToken !== accessToken)) return;
  safeRemove(AUTH_KEY);
}
