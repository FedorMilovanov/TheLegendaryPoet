import type { MemoryPlace } from '../memory-places';
import { asset } from '../../utils/asset';
import { isMemoryPreviewFrame } from '../memory-places/previewFrame';

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

function positiveDimension(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function mediaPath(value: unknown): value is string {
  return typeof value === 'string' && /^\/images\/memory-places\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/.test(value);
}

function list(value: unknown, check: (item: unknown) => boolean, minimum = 0): boolean {
  return Array.isArray(value) && value.length >= minimum && value.every(check);
}

// Validate the fields consumed by the renderer at the network boundary.
// Provenance and byte integrity remain the responsibility of the build validator.
function renderablePlace(value: unknown, poetId: string): boolean {
  if (!textFields(value, ['id', 'title', 'location', 'date', 'intro']) || value.poetId !== poetId) return false;
  const { photos, facts, timeline, sources, detailNote, literaryConnection } = value;
  return list(photos, photo =>
    textFields(photo, ['src', 'alt', 'caption', 'credit', 'sourceLabel', 'license', 'changes']) &&
    mediaPath(photo.src) &&
    positiveDimension(photo.width) && positiveDimension(photo.height) &&
    httpsUrl(photo.source) && httpsUrl(photo.licenseUrl) &&
    (photo.preview === undefined || (
      textFields(photo.preview, ['src', 'sha256', 'changes']) &&
      mediaPath(photo.preview.src) &&
      photo.preview.src !== photo.src && positiveDimension(photo.preview.bytes) &&
      (photo.preview.frame === undefined || isMemoryPreviewFrame(photo.preview.frame, photo.width, photo.height))
    )), 1
  ) &&
    list(facts, fact => textFields(fact, ['label', 'value'])) &&
    list(timeline, event => textFields(event, ['date', 'text'])) &&
    list(sources, source => textFields(source, ['label']) && httpsUrl(source.url)) &&
    (detailNote === undefined || textFields(detailNote, ['title', 'text'])) &&
    (literaryConnection === undefined || (
      textFields(literaryConnection, ['attribution']) && httpsUrl(literaryConnection.url) &&
      list(literaryConnection.lines, line => typeof line === 'string')
    ));
}

export async function loadMemoryPlaces(id: string, revision: string, signal: AbortSignal): Promise<readonly MemoryPlace[]> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !/^[a-f0-9]{16}$/.test(revision)) throw new Error('Invalid memory place identity');
  const response = await fetch(asset('/data/memory-places/' + id + '.json') + '?v=' + revision, { signal, credentials: 'same-origin' });
  if (!response.ok) throw new Error('Memory places unavailable: ' + response.status);
  const value: unknown = await response.json();
  if (!list(value, place => renderablePlace(place, id), 1)) {
    throw new Error('Invalid memory places payload');
  }
  return value as MemoryPlace[];
}
