import { safeRead, safeWrite } from './browserStorage';

const DEVICE_KEY = 'tlp-community-device-v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fallbackUuid() {
  const random = Math.random().toString(16).slice(2);
  return `00000000-0000-4000-8000-${random.padEnd(12, '0').slice(0, 12)}`;
}

/**
 * Stable anonymous browser identifier. It is not a fingerprint and contains no
 * personal data; it only lets the backend enforce one active vote per object
 * from the same browser installation.
 */
export function getCommunityDeviceId(): string {
  if (typeof window === 'undefined') return '00000000-0000-4000-8000-000000000000';
  const existing = safeRead(DEVICE_KEY);
  if (existing && UUID.test(existing)) return existing;
  const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : fallbackUuid();
  safeWrite(DEVICE_KEY, next);
  return next;
}
