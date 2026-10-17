import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { prorokDraft } from '../../src/data/essays/prorokDraft';
import { essays } from '../../src/data/essays/index';
import { estimateReadTime } from '../../src/utils/readTime';

test('Prorok remains an unpublished Essay draft without invented release fields', () => {
  assert.equal('date' in prorokDraft, false);
  assert.equal('cover' in prorokDraft, false);
  assert.equal(essays.length, 10);
  assert.equal(essays.some((essay) => essay.id === prorokDraft.id || essay.slug === prorokDraft.slug), false);
  assert.equal(prorokDraft.blocks.some((block) => block.type === 'image'), false);
  assert.equal(prorokDraft.readTime, estimateReadTime(prorokDraft.blocks));
});

test('Prorok citations resolve locally to unique, used source IDs', () => {
  const ids = (prorokDraft.sources ?? []).map((source) => source.id);
  assert.equal(ids.length, 9);
  assert.equal(new Set(ids).size, ids.length);
  const used = new Set<string>();
  for (const block of prorokDraft.blocks) {
    if ('sourceIds' in block) for (const id of block.sourceIds ?? []) {
      assert.ok(ids.includes(id), `unresolved source ${id}`);
      used.add(id);
    }
  }
  assert.deepEqual([...used].sort(), [...ids].sort());
  for (const source of prorokDraft.sources ?? []) {
    assert.ok(source.title && source.institution && source.note);
    assert.ok(/^https?:\/\//.test(source.url ?? ''));
  }
});

test('one-time transfer preserves every research paragraph and its citations', () => {
  // The Markdown file is the frozen pre-transfer snapshot, not a generator.
  const snapshot = readFileSync('docs/research/PROROK_DRAFT_2026-10-15.md', 'utf8');
  const body = snapshot.slice(snapshot.indexOf('## Там, где'));
  const sourceByNumber: Record<string, string> = {
    1: 'prorok-pushkin-rvb', 2: 'prorok-lermontov-rvb',
    3: 'prorok-lermontov-commentary', 4: 'prorok-isaiah-6',
    5: 'prorok-lermontov-ilibrary', 6: 'prorok-pushkin-feb-commentary',
    7: 'prorok-james-3', 8: 'prorok-1cor-15', 9: 'prorok-mark-1',
  };
  const paragraphs = body.trim().split('\n\n').filter((part) => !part.startsWith('## '));
  const actual = prorokDraft.blocks.filter((block) => block.type === 'paragraph');
  assert.equal(actual.length, 22);
  assert.equal(actual.length, paragraphs.length);
  paragraphs.forEach((paragraph, index) => {
    const expectedText = paragraph.replace(/\[\d+\]\([^\n]+\)/g, '').trim().split('\n').join(' ');
    const expectedIds = [...new Set([...paragraph.matchAll(/\[(\d+)\]\([^\n]+\)/g)].map((match) => sourceByNumber[match[1]]))];
    assert.equal(actual[index].text, expectedText);
    assert.deepEqual(actual[index].sourceIds ?? [], expectedIds);
  });
});

test('section anchors are unique and the reviewed biblical conclusion survives transfer', () => {
  const anchors = prorokDraft.blocks.filter((block) => block.type === 'section').map((block) => block.anchor);
  assert.equal(anchors.length, 6);
  assert.equal(new Set(anchors).size, anchors.length);
  assert.ok(anchors.every((anchor) => /^[a-z][a-z-]+$/.test(anchor ?? '')));
  const text = prorokDraft.blocks.filter((block) => block.type === 'paragraph').map((block) => block.text).join('\n');
  // Transfer regression only: these assertions do not certify theology.
  for (const fragment of ['И правды чистыя ученья', 'Ис. 6:3–8', 'Иак. 3:9–10', '1 Кор. 15:3–4', 'Мк. 1:15', 'покаянию и вере']) {
    assert.ok(text.includes(fragment), `lost reviewed passage: ${fragment}`);
  }
});
