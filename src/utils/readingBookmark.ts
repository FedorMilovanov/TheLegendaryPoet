/** Same reading line as the current-chapter indicator. */
export const readingLine = () => window.innerHeight * 0.34;

interface ReadingBookmark {
  flow: string;
  passage: number;
  fraction: number;
  gap: number;
  flowTop: number;
  width: number;
  height: number;
}

export interface PagePosition {
  x: number;
  y: number;
  reading?: ReadingBookmark;
}

const readingFlows = () => document.querySelectorAll<HTMLElement>('[data-reading-flow]');

/** Measure only on departure/lock, not on every scroll. Store layout values
 * and a passage address, never DOM nodes from an unmounted article. */
function captureReadingBookmark(y: number): ReadingBookmark | undefined {
  if (y <= 0) return;
  const line = readingLine();
  for (const flow of readingFlows()) {
    const bounds = flow.getBoundingClientRect();
    if (!bounds.width || bounds.top > line || bounds.bottom < line) continue;
    // A floated photo and the prose beside it can both cross the line. Use
    // the middle of the reading column to disambiguate, not DOM order.
    const center = bounds.left + bounds.width / 2;
    let closest: { passage: number; fraction: number; gap: number; inlineGap: number } | undefined;
    for (let passage = 0; passage < flow.children.length; passage++) {
      const rect = flow.children[passage].getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      const point = Math.min(rect.bottom, Math.max(rect.top, line));
      const gap = line - point;
      const inlineGap = Math.max(0, rect.left - center, center - rect.right);
      if (!closest || Math.abs(gap) < Math.abs(closest.gap) ||
          (Math.abs(gap) === Math.abs(closest.gap) && inlineGap < closest.inlineGap)) {
        closest = { passage, fraction: (point - rect.top) / rect.height, gap, inlineGap };
      }
      if (!gap && !inlineGap) break;
    }
    if (closest) return {
      flow: flow.dataset.readingFlow!, passage: closest.passage, fraction: closest.fraction, gap: closest.gap,
      flowTop: y + bounds.top, width: bounds.width, height: bounds.height,
    };
  }
}

export function capturePagePosition(): PagePosition {
  return { x: window.scrollX, y: window.scrollY, reading: captureReadingBookmark(window.scrollY) };
}

/** Essay reveals animate the ink, not the final reading position. Used by
 * both return bookmarks and incoming quotes; do not wait out the animation. */
export function readingBlockShift(block: HTMLElement | null) {
  const flow = block?.parentElement;
  return block && flow?.dataset.readingFlow === 'essay' && block.offsetParent === flow
    ? flow.getBoundingClientRect().top + flow.clientTop + block.offsetTop - block.getBoundingClientRect().top : 0;
}

/** Call only on the matching page, after restoring the body's normal layout. */
export function resolvePagePosition(saved: PagePosition): { y: number; passage?: HTMLElement } {
  const mark = saved.reading;
  if (mark) {
    const flow = Array.from(readingFlows()).find(candidate => candidate.dataset.readingFlow === mark.flow);
    const passage = flow?.children[mark.passage] as HTMLElement | undefined;
    if (flow && passage?.isConnected) {
      const now = flow.getBoundingClientRect();
      if (Math.abs(window.scrollY + now.top - mark.flowTop) < 1 && Math.abs(now.width - mark.width) < 1 &&
          Math.abs(now.height - mark.height) < 1) return { y: saved.y, passage };
      const rect = passage.getBoundingClientRect();
      if (rect.width && rect.height) {
        return { y: Math.max(0, window.scrollY + rect.top + readingBlockShift(passage) + mark.fraction * rect.height + mark.gap - readingLine()), passage };
      }
    }
  }
  return { y: saved.y };
}
