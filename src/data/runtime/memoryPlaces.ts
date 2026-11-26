import type { MemoryPlace } from '../memory-places';
import { asset } from '../../utils/asset';

export async function loadMemoryPlaces(id: string, revision: string, signal: AbortSignal): Promise<readonly MemoryPlace[]> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !/^[a-f0-9]{16}$/.test(revision)) throw new Error('Invalid memory place identity');
  const response = await fetch(asset('/data/memory-places/' + id + '.json') + '?v=' + revision, { signal, credentials: 'same-origin' });
  if (!response.ok) throw new Error('Memory places unavailable: ' + response.status);
  const value: unknown = await response.json();
  if (!Array.isArray(value) || value.length === 0 || value.some(place =>
    !place || place.poetId !== id || typeof place.id !== 'string' ||
    typeof place.title !== 'string' || !Array.isArray(place.photos) || !place.photos.length ||
    !Array.isArray(place.timeline) || !Array.isArray(place.sources) || !Array.isArray(place.facts)
  )) throw new Error('Invalid memory places payload');
  return value as MemoryPlace[];
}
