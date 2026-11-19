import { useLayoutEffect, type RefObject } from 'react';

const gutter = 8;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

/** Track only the open panel. Controls and pointer previews dismiss when
 * scrolled away. A live selection or focused tooltip can follow its anchor. */
export function useAnchoredPanel(
  open: boolean,
  anchorRef: RefObject<HTMLElement | Range | null>,
  panelRef: RefObject<HTMLElement | null>,
  gap = 0,
  boundsRef?: RefObject<HTMLElement | null>,
) {
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!open || !panel || !anchor) return;
    const viewport = window.visualViewport;
    const header = document.querySelector<HTMLElement>('.site-header');
    const reveal = anchor instanceof Element ? anchor.closest('[data-reveal-state]') : null;
    let frame = 0;

    const position = () => {
      frame = 0;
      const trigger = anchorRef.current?.getBoundingClientRect();
      if (!trigger) return;
      const x = viewport?.offsetLeft ?? 0;
      const y = viewport?.offsetTop ?? 0;
      const width = viewport?.width ?? document.documentElement.clientWidth;
      const bottom = y + (viewport?.height ?? window.innerHeight);
      const top = Math.max(y, document.documentElement.classList.contains('chrome-hidden') ? 0 : header?.offsetHeight ?? 0);
      const bounds = boundsRef?.current?.getBoundingClientRect();
      const left = Math.max(x + gutter, bounds?.left ?? x);
      const right = Math.min(x + width - gutter, bounds?.right ?? x + width);
      const above = trigger.top - top - gap - gutter;
      const below = bottom - trigger.bottom - gap - gutter;

      if (trigger.bottom <= top || trigger.top >= bottom || trigger.right <= left || trigger.left >= right) {
        // Reflow can briefly push a keyboard reader's link off screen
        // without blurring it. Hide its ink, not the native focus preview:
        // Escape/blur still dismiss, and neither can be undone by a resize.
        const focusedTip = panel.getAttribute('role') === 'tooltip' && anchor === document.activeElement;
        if (panel.hasAttribute('popover') && !focusedTip) panel.hidePopover();
        else panel.style.visibility = 'hidden';
        return;
      }
      panel.style.setProperty('--panel-available-width', `${right - left}px`);
      // A selection can span the entire viewport: keep the action reachable
      // at its visible edge rather than squeezing it into a zero-height gap.
      panel.style.maxHeight = `${Math.max(0, anchor instanceof Range ? bottom - top - 2 * gutter : Math.max(above, below))}px`;
      const box = panel.getBoundingClientRect();
      const desiredTop = box.height <= above || above > below ? trigger.top - gap - box.height : trigger.bottom + gap;
      panel.style.left = `${clamp(trigger.left + (trigger.width - box.width) / 2, left, right - box.width)}px`;
      panel.style.top = `${clamp(desiredTop, top + gutter, bottom - gutter - box.height)}px`;
      panel.style.visibility = 'visible';
      if (reveal?.getAnimations().some(animation => animation.playState === 'running')) schedule();
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(position); };
    position();
    const observer = new ResizeObserver(schedule);
    observer.observe(panel);
    if (anchor instanceof Element) observer.observe(anchor);
    if (boundsRef?.current) observer.observe(boundsRef.current);
    reveal?.addEventListener('transitionrun', schedule);
    reveal?.addEventListener('transitionend', schedule);
    if (anchor instanceof Range) document.addEventListener('selectionchange', schedule);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    return () => {
      observer.disconnect();
      reveal?.removeEventListener('transitionrun', schedule);
      reveal?.removeEventListener('transitionend', schedule);
      document.removeEventListener('selectionchange', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      cancelAnimationFrame(frame);
      panel.style.removeProperty('visibility');
    };
  }, [open, anchorRef, panelRef, gap, boundsRef]);
}
