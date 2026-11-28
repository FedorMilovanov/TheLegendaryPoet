import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { measureStyle } from './check-suno-style.mjs';

// Poetry payload only. No provider mutation or claim of musical/linguistic quality.
const fields = ['lyrics', 'style', 'exclude'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export function preflight(payload) {
  const missing = fields.filter(key => !object(payload) || typeof payload[key] !== 'string');
  if (missing.length) return { valid: false, missing };
  const lengths = Object.fromEntries(fields.map(key => [key, payload[key].length]));
  const errors = [];
  if (!payload.lyrics.trim() || lengths.lyrics > 5000) errors.push('lyrics');
  if (!measureStyle(payload.style).valid) errors.push('style');
  return { valid: !errors.length, lengths, errors };
}
export function comparePayload(prepared, sent, returned) {
  const initial = preflight(prepared);
  if (!initial.valid) return { valid: false, stage: 'preflight', ...initial };
  const mismatches = [];
  const transportDifferences = [];
  const normalize = value => value.replace(/\r\n/g, '\n');
  for (const [stage, actual] of [['sent', sent], ['returned', returned]]) {
    for (const key of fields) {
      if (!object(actual) || typeof actual[key] !== 'string') mismatches.push({ stage, field: key, reason: 'missing' });
      else if (normalize(actual[key]) !== normalize(prepared[key])) mismatches.push({ stage, field: key, reason: 'different' });
      else if (actual[key] !== prepared[key]) transportDifferences.push({ stage, field: key, reason: 'CRLF' });
    }
  }
  return { valid: !mismatches.length, mismatches, transportDifferences };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [mode, ...args] = process.argv.slice(2);
    const read = file => new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(fs.readFileSync(file));
    const json = file => JSON.parse(read(file));
    let result;
    if (mode === 'preflight' && args.length === 1) result = preflight(json(args[0]));
    else if (mode === 'readback' && args.length === 3) result = comparePayload(...args.map(json));
    else throw new Error('usage');
    console.log(JSON.stringify({ ...result, scope: 'text integrity only; not source authenticity, authorization or audio QA' }));
    if (!result.valid) process.exitCode = 1;
  } catch {
    // JSON parser errors can include private payload text.
    console.error('Suno payload check: invalid arguments, inaccessible file or malformed input.');
    process.exitCode = 1;
  }
}
