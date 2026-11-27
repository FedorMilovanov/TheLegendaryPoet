import type { MemoryPlace } from '../memory-places';
import { asset } from '../../utils/asset';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function textFields(value: unknown, fields: readonly string[]): value is Record<string, unknown> {
  return record(value) && fields.every(field => typeof value[field] === 'string' && value[field].trim().length > 0);
}

function httpsUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

function positiveDimension(value: unknown): boolean {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

// Validate the fields consumed by the renderer at the network boundary.
// Provenance and byte integrity remain the responsibility of the build validator.
function renderablePlace(value: unknown, poetId: string): boolean {
  if (!textFields(value, ['id', 'title', 'location', 'date', 'intro']) || value.poetId !== poetId) return false;
  const { photos, facts, timeline, sources, detailNote, literaryConnection } = value;
  return Array.isArray(photos) && photos.length > 0 && photos.every(photo =>
    textFields(photo, ['src', 'alt', 'caption', 'credit', 'sourceLabel', 'license', 'changes']) &&
    typeof photo.src === 'string' && /^\/images\/memory-places\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/.test(photo.src) &&
    positiveDimension(photo.width) && positiveDimension(photo.height) &&
    httpsUrl(photo.source) && httpsUrl(photo.licenseUrl) &&
    (photo.preview === undefined || (
      textFields(photo.preview, ['src', 'sha256', 'changes']) &&
      typeof photo.preview.src === 'string' && /^\/images\/memory-places\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/.test(photo.preview.src) &&
      photo.preview.src !== photo.src && positiveDimension(photo.preview.bytes)
    ))
  ) &&
    Array.isArray(facts) && facts.every(fact => textFields(fact, ['label', 'value'])) &&
    Array.isArray(timeline) && timeline.every(event => textFields(event, ['date', 'text'])) &&
    Array.isArray(sources) && sources.every(source => textFields(source, ['label']) && httpsUrl(source.url)) &&
    (detailNote === undefined || textFields(detailNote, ['title', 'text'])) &&
    (literaryConnection === undefined || (
      textFields(literaryConnection, ['attribution']) && httpsUrl(literaryConnection.url) &&
      Array.isArray(literaryConnection.lines) && literaryConnection.lines.every(line => typeof line === 'string')
    ));
}

export async function loadMemoryPlaces(id: string, revision: string, signal: AbortSignal): Promise<readonly MemoryPlace[]> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !/^[a-f0-9]{16}$/.test(revision)) throw new Error('Invalid memory place identity');
  const response = await fetch(asset('/data/memory-places/' + id + '.json') + '?v=' + revision, { signal, credentials: 'same-origin' });
  if (!response.ok) throw new Error('Memory places unavailable: ' + response.status);
  const value: unknown = await response.json();
  if (!Array.isArray(value) || value.length === 0 || !value.every(place => renderablePlace(place, id))) {
    throw new Error('Invalid memory places payload');
  }
  return value as MemoryPlace[];
}
