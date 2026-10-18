import assert from 'node:assert/strict';
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

// Full one-time Markdown parity passed at 2cbc1a2. The frozen snapshot is
// deliberately not rewritten to follow subsequent editorial revisions.
test('biblical evaluation retains its contextual source mappings after editing', () => {
  const start = prorokDraft.blocks.findIndex((block) => block.type === 'section' && block.anchor === 'biblical-evaluation');
  assert.ok(start >= 0);
  const conclusion = prorokDraft.blocks.slice(start).filter((block) => block.type === 'paragraph');
  for (const [reference, source] of [
    ['Ис. 6:3–8', 'prorok-isaiah-6'],
    ['Иак. 3:9–10', 'prorok-james-3'],
    ['1 Кор. 15:3–4', 'prorok-1cor-15'],
    ['Мк. 1:15', 'prorok-mark-1'],
  ]) {
    const paragraph = conclusion.find((block) => block.text.includes(reference));
    assert.ok(paragraph, `missing contextual evaluation: ${reference}`);
    assert.ok(paragraph.sourceIds?.includes(source), `lost biblical source: ${source}`);
  }
  assert.ok(conclusion.some((block) => block.text.includes('противоречит уважению к человеку')));
  assert.ok(conclusion.some((block) => block.text.includes('покаянию и вере')));
  const allText = prorokDraft.blocks.filter((block) => block.type === 'paragraph').map((block) => block.text).join('\n');
  assert.equal(allText.includes('якобы прочитанных нами'), false);
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
