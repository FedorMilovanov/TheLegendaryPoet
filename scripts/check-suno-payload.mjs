import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { measureStyle } from './check-suno-style.mjs';
import { compareLiteralLyrics } from './check-suno-lyrics.mjs';

// Poetry payload only. No provider mutation or claim of musical/linguistic quality.
const fields = ['lyrics', 'style', 'exclude'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const singleLine = value => typeof value === 'string' && !/[\r\n]/.test(value);
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
  for (const [stage, actual] of [['sent', sent], ['returned', returned]]) {
    for (const key of fields) {
      if (!object(actual) || typeof actual[key] !== 'string') mismatches.push({ stage, field: key, reason: 'missing' });
      else if (actual[key] !== prepared[key]) mismatches.push({ stage, field: key, reason: 'different' });
    }
  }
  return { valid: !mismatches.length, mismatches };
}
export function verifySourceMap(ledger, lyrics) {
  if (!object(ledger) || !object(ledger.sources) || !Array.isArray(ledger.sequence) ||
      !ledger.sequence.length || typeof lyrics !== 'string' || !lyrics.trim()) return { valid: false, reason: 'invalid input' };
  const lines = [];
  let sources = 0;
  for (const [index, row] of ledger.sequence.entries()) {
    const fail = reason => ({ valid: false, row: index + 1, reason });
    if (!object(row)) return fail('invalid row');
    if (row.blank === true && Object.keys(row).length === 1) { lines.push(''); continue; }
    if (typeof row.tag === 'string' && Object.keys(row).length === 1) {
      const result = compareLiteralLyrics('x', row.tag + '\nx', { sectionTags: true });
      if (!result.valid || result.tags !== 1 || !singleLine(row.tag)) return fail('invalid tag');
      lines.push(row.tag); continue;
    }
    if (typeof row.sourceId !== 'string' || !Object.hasOwn(ledger.sources, row.sourceId) ||
        Object.keys(row).some(key => !['sourceId', 'edits'].includes(key))) return fail('unknown source or invalid row');
    const source = ledger.sources[row.sourceId];
    if (!object(source) || !singleLine(source.text) || !source.text.trim() ||
        typeof source.locator !== 'string' || !source.locator.trim()) return fail('invalid source');
    let value = source.text;
    const edits = Object.hasOwn(row, 'edits') ? row.edits : [];
    if (!Array.isArray(edits)) return fail('invalid edits');
    for (const edit of edits) {
      if (!object(edit) || !Number.isInteger(edit.at) || edit.at < 0 || edit.at > value.length ||
          !singleLine(edit.before) || !singleLine(edit.after) || edit.before === edit.after ||
          typeof edit.reason !== 'string' || !edit.reason.trim() ||
          value.slice(edit.at, edit.at + edit.before.length) !== edit.before) return fail('invalid edit');
      value = value.slice(0, edit.at) + edit.after + value.slice(edit.at + edit.before.length);
    }
    if (!value.trim()) return fail('empty vocal fragment');
    lines.push(value); sources++;
  }
  if (!sources) return { valid: false, reason: 'no source fragments' };
  const actual = lyrics.replace(/\r\n/g, '\n').split('\n');
  const firstDifference = lines.findIndex((line, i) => line !== actual[i]);
  if (firstDifference !== -1 || lines.length !== actual.length)
    return { valid: false, reason: 'lyrics differ from mapped sequence', row: firstDifference === -1 ? lines.length + 1 : firstDifference + 1 };
  return { valid: true, rows: lines.length, sources };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [mode, ...args] = process.argv.slice(2);
    const read = file => new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(fs.readFileSync(file));
    const json = file => JSON.parse(read(file));
    let result;
    if (mode === 'preflight' && args.length === 1) result = preflight(json(args[0]));
    else if (mode === 'readback' && args.length === 3) result = comparePayload(...args.map(json));
    else if (mode === 'source-map' && args.length === 2) result = verifySourceMap(json(args[0]), read(args[1]));
    else throw new Error('usage');
    console.log(JSON.stringify({ ...result, scope: 'text integrity only; not source authenticity, authorization or audio QA' }));
    if (!result.valid) process.exitCode = 1;
  } catch {
    // JSON parser errors can include private payload text.
    console.error('Suno payload check: invalid arguments, inaccessible file or malformed input.');
    process.exitCode = 1;
  }
}
