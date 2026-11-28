import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPoemRouteCatalog, poemTextDigest } from '../lib/poem-discovery.mjs';

const terminal = path => path.endsWith('/') ? path : path + '/';
const poem = { id: 'work-1', title: 'Title', text: 'Line', analysis: 'Analysis', sourceUrl: 'https://example.org/edition' };
const author = { id: 'author-a', poems: [poem] };
const policy = () => ({ schemaVersion: 1, authors: { 'author-a': { 'work-1': 'fixed-slug' } }, reviews: {} });
const build = (p = policy(), authors = [author]) => buildPoemRouteCatalog(authors, p, terminal);

test('fixed slug survives title changes; legacy anchor and source object identity survive', () => {
  const changed = { ...poem, title: 'Different title' };
  const [row] = build(policy(), [{ ...author, poems: [changed] }]);
  assert.equal(row.candidatePath, '/poets/author-a/fixed-slug/');
  assert.equal(row.legacyPath, '/poets/author-a/#poem-work-1');
  assert.equal(row.poem, changed);
  assert.equal(row.eligible, false);
  assert.equal(row.scope, 'unreviewed');
});
test('unallocated new work remains held without breaking existing author release', () => {
  const rows = build(policy(), [{ ...author, poems: [poem, { ...poem, id: 'new-work' }] }]);
  assert.equal(rows[1].candidatePath, null);
  assert.equal(rows[1].reason, 'slug-not-assigned');
  assert.equal(rows[1].eligible, false);
});
test('duplicate global IDs and duplicate route paths are rejected', () => {
  assert.throws(() => build(policy(), [author, { ...author, id: 'author-b' }]), /duplicate work ID/);
  const p = policy(); p.authors['author-a']['work-2'] = 'fixed-slug';
  assert.throws(() => build(p, [{ ...author, poems: [poem, { ...poem, id: 'work-2' }] }]), /Duplicate poem route/);
});
test('same title/slug under different authors is legitimate', () => {
  const p = policy(); p.authors['author-b'] = { 'work-2': 'fixed-slug' };
  const rows = build(p, [author, { id: 'author-b', poems: [{ ...poem, id: 'work-2' }] }]);
  assert.notEqual(rows[0].candidatePath, rows[1].candidatePath);
});
test('unsafe and stale slug records fail closed', () => {
  for (const slug of ['../x', 'foo/bar', 'bad?x', 'bad#x', 'Upper', '', 'a--b']) {
    const p = policy(); p.authors['author-a']['work-1'] = slug;
    assert.throws(() => build(p), /Invalid work slug/);
  }
  const p = policy(); p.authors['author-a']['ghost'] = 'ghost';
  assert.throws(() => build(p), /Orphan work slug/);
});
test('excerpt status is explicit; a legacy ID suffix never grants or denies rights', () => {
  const p = policy(); p.reviews['work-1'] = { decision: 'hold', scope: 'excerpt', reason: 'Rights pending', evidence: ['ledger'] };
  assert.equal(build(p)[0].scope, 'excerpt');
  assert.equal(build(p)[0].eligible, false);
  const q = policy(); q.authors['author-a'] = { 'work-fragment': 'fixed-slug' };
  assert.equal(build(q, [{ ...author, poems: [{ ...poem, id: 'work-fragment' }] }])[0].scope, 'unreviewed');
});
test('approved review needs exact text, editorial data and explicit rights evidence', () => {
  const p = policy(); p.reviews['work-1'] = { decision: 'approved', scope: 'full', reason: 'Reviewed', evidence: ['ledger'], rightsBasis: 'fixture only', reviewedOn: '2026-11-26', textSha256: poemTextDigest(poem) };
  assert.equal(build(p)[0].eligible, true);
  assert.throws(() => build(p, [{ ...author, poems: [{ ...poem, text: 'Changed text' }] }]), /stale standalone/);
  assert.throws(() => build(p, [{ ...author, poems: [{ ...poem, epigraph: { text: 'New', attribution: 'Other' } }] }]), /stale standalone/);
  assert.throws(() => build(p, [{ ...author, poems: [{ ...poem, analysis: '' }] }]), /stale standalone/);
  delete p.reviews['work-1'].rightsBasis;
  assert.throws(() => build(p), /stale standalone/);
});
test('unknown and malformed review records cannot authorize a page', () => {
  const p = policy(); p.reviews['ghost'] = { decision: 'hold', scope: 'excerpt', reason: 'pending', evidence: ['ledger'] };
  assert.throws(() => build(p), /Orphan work review/);
  p.reviews = { 'work-1': { decision: 'approved' } };
  assert.throws(() => build(p), /Invalid work review/);
});
