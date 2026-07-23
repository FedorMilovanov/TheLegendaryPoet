const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function formatAudioTime(value: number) {
  const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  return `${Math.floor(safe / 60)}:${(safe % 60).toString().padStart(2, '0')}`;
}

export function formatIsoDuration(seconds = 0) {
  const rounded = Math.max(0, Math.round(Number.isFinite(seconds) ? seconds : 0));
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return `PT${minutes}M${rest}S`;
}

export function parseAudioMoment(raw: string | null, duration?: number) {
  if (raw === null || !/^\d+(?:\.\d+)?$/.test(raw)) return undefined;
  const requested = Number(raw);
  if (!Number.isFinite(requested) || requested < 0) return undefined;
  const upperBound = duration && duration > 0 ? Math.max(0, duration - 0.1) : requested;
  return clamp(requested, 0, upperBound);
}

export function buildTrackMomentPath(trackId: string, seconds: number) {
  const moment = Number.isFinite(seconds) && seconds >= 5 ? Math.floor(seconds) : 0;
  return `/music/${trackId}${moment > 0 ? `?t=${moment}` : ''}`;
}
