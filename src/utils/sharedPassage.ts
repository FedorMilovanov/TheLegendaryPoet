import { passageStamp } from './passageStamp';
import { readingBlockShift } from './readingBookmark';

// The text directive belongs to the browser and may be stripped before JS
// runs. Put a separate, quote-free address for the start of the selection in
// the ordinary fragment. No document-wide index or replayed Selection.
const editor = 'input,textarea,select,[contenteditable]';
const privateRegion = `${editor},[data-community-target]`;
const skip = `${privateRegion}, button, [popover], [hidden], [aria-hidden="true"], [role="status"]`;

export function selectedPublicRange(scope: HTMLElement | null): Range | null {
  const selection = document.getSelection();
  if (!scope || !selection?.rangeCount || selection.isCollapsed || document.activeElement?.matches(editor)) return null;
  const range = selection.getRangeAt(0), common = range.commonAncestorContainer;
  const host = common instanceof Element ? common : common.parentElement;
  if (!scope.contains(common) || host?.closest(skip)) return null;
  // Public endpoints can still enclose a private composer/local comment.
  if (common instanceof Element && Array.from(common.querySelectorAll(privateRegion)).some(n => range.intersectsNode(n))) return null;
  return selection.toString().trim() ? range : null;
}

function* publicText(root: Node): Generator<Text> {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = root instanceof Text ? root : walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.parentElement?.closest(skip)) yield node as Text;
  }
}

export function sharedPassageId(scope: HTMLElement, range: Range) {
  for (const node of publicText(range.commonAncestorContainer)) {
    if (!range.intersectsNode(node)) continue;
    const from = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.length;
    const first = node.data.slice(from, end).search(/\S/u);
    if (first < 0) continue;
    const parent = node.parentElement!;
    // These real fragments already know how to expose a collapsed source or
    // a section heading. Do not invent a parallel opening mechanism for them.
    const named = parent.closest<HTMLElement>('[data-share-id],li[id^="source-"],h2[id]');
    if (named) return named.dataset.shareId || named.id;
    const flow = parent.closest<HTMLElement>('[data-reading-flow]');
    let ordinal = 0;
    for (const candidate of publicText(flow ?? scope)) {
      if (candidate === node) return `read.${flow?.dataset.readingFlow ?? 'page'}.${node.length}.${passageStamp(node.data)}.${ordinal}.${from + first}`;
      if (candidate.data === node.data) ordinal++;
    }
  }
}

/** Resolve only on an explicit shared arrival, within this published outlet.
 * Geometry is the first glyph, not the start of a potentially very tall block. */
export function resolveSharedPassage(id: string) {
  const parts = /^read\.([a-z0-9-]{1,96})\.(\d{1,6})\.([a-z0-9]{1,7})\.(\d{1,6})\.(\d{1,6})$/.exec(id);
  if (!parts) return;
  const [, flow, length, key, occurrence, at] = parts;
  const scope = document.querySelector('[data-share-scope]');
  const root = flow === 'page' ? scope : scope?.querySelector(`[data-reading-flow="${flow}"]`);
  if (!root || +at >= +length) return;
  let ordinal = +occurrence;
  for (const node of publicText(root)) {
    if (node.length !== +length || passageStamp(node.data) !== key || ordinal-- !== 0) continue;
    const parent = node.parentElement!;
    return {
      target: parent.closest<HTMLElement>('p, [data-poem-canonical] > span') ?? parent,
      // Measure only after the route/overlay/layout checks. Reveal a quoted
      // bibliography entry even if only the sending document had it expanded.
      y: () => {
        const disclosure = parent.closest('details');
        if (disclosure && !parent.closest('summary')) disclosure.open = true;
        const point = document.createRange();
        point.setStart(node, +at); point.setEnd(node, +at + 1);
        const block = parent.closest<HTMLElement>('[data-reading-flow="essay"] > *');
        return point.getBoundingClientRect().top + window.scrollY + readingBlockShift(block);
      },
    };
  }
}
