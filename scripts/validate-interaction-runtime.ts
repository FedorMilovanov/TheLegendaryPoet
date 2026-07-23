import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

class TokenList {
  private readonly values = new Set<string>();
  add(value: string) { this.values.add(value); }
  remove(value: string) { this.values.delete(value); }
  contains(value: string) { return this.values.has(value); }
}

const bodyStyle: Record<string, string> = {
  position: 'relative',
  top: '',
  left: '',
  right: '',
  width: '',
  overflow: 'visible',
  paddingRight: '4px',
  overscrollBehavior: '',
};
const htmlStyle: Record<string, string> = { overflow: '', overscrollBehavior: '' };
const bodyClasses = new TokenList();
const htmlClasses = new TokenList();
const scrollCalls: Array<[number, number]> = [];
const documentListeners = new Map<string, Set<(event: KeyboardEvent) => void>>();

const fakeWindow = {
  scrollX: 7,
  scrollY: 321,
  innerWidth: 1200,
  getComputedStyle: () => ({ paddingRight: '4px' }),
  scrollTo: (x: number, y: number) => scrollCalls.push([x, y]),
};
const fakeDocument = {
  body: { style: bodyStyle, classList: bodyClasses },
  documentElement: { style: htmlStyle, classList: htmlClasses, clientWidth: 1180 },
  addEventListener: (type: string, listener: (event: KeyboardEvent) => void) => {
    const listeners = documentListeners.get(type) ?? new Set<(event: KeyboardEvent) => void>();
    listeners.add(listener);
    documentListeners.set(type, listeners);
  },
  removeEventListener: (type: string, listener: (event: KeyboardEvent) => void) => {
    documentListeners.get(type)?.delete(listener);
  },
};

Object.defineProperty(globalThis, 'window', { configurable: true, value: fakeWindow });
Object.defineProperty(globalThis, 'document', { configurable: true, value: fakeDocument });

const connectedRoot = () => ({ isConnected: true, contains: () => false }) as unknown as HTMLElement;
const dispatchEscape = () => {
  let prevented = false;
  let stopped = false;
  const event = {
    key: 'Escape',
    preventDefault: () => { prevented = true; },
    stopPropagation: () => { stopped = true; },
  } as unknown as KeyboardEvent;
  for (const listener of documentListeners.get('keydown') ?? []) listener(event);
  return { prevented, stopped };
};

const overlay = await import('../src/utils/overlayRuntime');
const first = overlay.acquireOverlayLock('first', connectedRoot());
expect(bodyStyle.position === 'fixed', 'the first overlay must freeze the body');
expect(bodyStyle.top === '-321px', 'the body lock must preserve the current vertical position');
expect(bodyStyle.paddingRight === '24px', 'the body lock must compensate for the removed scrollbar');
expect(htmlClasses.contains('overlay-open') && bodyClasses.contains('overlay-open'), 'overlay-open classes must be applied');
expect((fakeWindow as typeof fakeWindow & { __TLP_MODAL_OPEN?: boolean }).__TLP_MODAL_OPEN === true, 'legacy modal integration flag must be enabled');
expect(first.isTopmost(), 'the first overlay must initially be topmost');

const second = overlay.acquireOverlayLock('second', connectedRoot());
expect(!first.isTopmost() && second.isTopmost(), 'stacked overlays must expose the correct topmost surface');
first.release();
expect(bodyStyle.position === 'fixed', 'closing a lower overlay must not unlock a higher overlay');
expect(overlay.hasOpenOverlay(), 'the stack must remain open while one overlay survives');
second.release();
const restoredScroll = scrollCalls[scrollCalls.length - 1];
expect(bodyStyle.position === 'relative' && bodyStyle.overflow === 'visible', 'the final release must restore body styles');
expect(bodyStyle.paddingRight === '4px', 'the final release must restore the original padding');
expect(restoredScroll?.[0] === 7 && restoredScroll?.[1] === 321, 'the final release must restore both scroll axes');
expect(!htmlClasses.contains('overlay-open') && !bodyClasses.contains('overlay-open'), 'overlay classes must be removed after the final release');
expect((fakeWindow as typeof fakeWindow & { __TLP_MODAL_OPEN?: boolean }).__TLP_MODAL_OPEN === false, 'legacy modal integration flag must be cleared');
expect((documentListeners.get('keydown')?.size ?? 0) === 0, 'the shared Escape listener must be removed after the final overlay');
second.release();
expect(scrollCalls.length === 1, 'overlay release must be idempotent');

const lowerControl = {} as HTMLElement;
const upperControl = {} as HTMLElement;
const replacementControl = {} as HTMLElement;
const lowerRoot = { isConnected: true, contains: (candidate: Node) => candidate === lowerControl } as HTMLElement;
const upperRoot = { isConnected: true, contains: (candidate: Node) => candidate === upperControl } as HTMLElement;
const replacementRoot = { isConnected: true, contains: (candidate: Node) => candidate === replacementControl } as HTMLElement;
const lower = overlay.acquireOverlayLock('lower', lowerRoot);
const upper = overlay.acquireOverlayLock('upper', upperRoot);
expect(overlay.canRestoreOverlayFocus(upperControl), 'focus may return to the current topmost dialog');
expect(!overlay.canRestoreOverlayFocus(lowerControl), 'focus must not escape into a covered lower dialog');
upper.setRoot(replacementRoot);
expect(overlay.canRestoreOverlayFocus(replacementControl), 'a keyed dialog replacement must update the active focus root');
expect(!overlay.canRestoreOverlayFocus(upperControl), 'a detached previous dialog root must stop owning focus');
upper.release();
expect(overlay.canRestoreOverlayFocus(lowerControl), 'closing the top dialog must return focus ownership to the lower dialog');
lower.release();
expect(scrollCalls.length === 2, 'each complete overlay session must restore scroll exactly once');

const survivingControl = {} as HTMLElement;
const survivingRoot = {
  isConnected: true,
  contains: (candidate: Node) => candidate === survivingControl,
} as HTMLElement;
const detachedRoot = {
  isConnected: false,
  contains: () => false,
} as unknown as HTMLElement;
const surviving = overlay.acquireOverlayLock('surviving', survivingRoot);
const detached = overlay.acquireOverlayLock('detached', detachedRoot);
expect(surviving.isTopmost(), 'a disconnected stale portal must yield keyboard ownership to the visible dialog below');
expect(!detached.isTopmost(), 'a disconnected overlay entry must not remain topmost');
expect(overlay.canRestoreOverlayFocus(survivingControl), 'focus restoration must ignore a disconnected upper portal');
detached.release();
surviving.release();
expect(scrollCalls.length === 3, 'pruning a stale upper portal must still unlock the document exactly once');

const escapeOrder: string[] = [];
const escapeLower = overlay.acquireOverlayLock('escape-lower', connectedRoot());
escapeLower.setEscapeHandler(() => {
  escapeOrder.push('lower');
  escapeLower.release();
});
const escapeUpper = overlay.acquireOverlayLock('escape-upper', connectedRoot());
escapeUpper.setEscapeHandler(() => {
  escapeOrder.push('upper');
  escapeUpper.release();
});
const firstEscape = dispatchEscape();
expect(firstEscape.prevented && firstEscape.stopped, 'handled Escape must cancel browser and background propagation');
expect(escapeOrder.join(',') === 'upper', 'the first Escape must close only the topmost overlay');
expect(escapeLower.isTopmost(), 'after closing the upper overlay the lower overlay must own the next Escape');
dispatchEscape();
expect(escapeOrder.join(',') === 'upper,lower', 'the second Escape must close the revealed lower overlay');
expect(!overlay.hasOpenOverlay(), 'central Escape routing must leave no phantom overlay entries');
expect(scrollCalls.length === 4, 'a complete centrally-routed overlay session must restore scroll once');

const overlaySource = read('src/utils/overlayRuntime.ts');
const dialogSource = read('src/hooks/useDialogSurface.ts');
const commandSource = read('src/components/command/CommandPalette.tsx');
const immersiveSource = read('src/components/music/ImmersivePlayer.tsx');
const ratingFormSource = read('src/components/community/RatingForm.tsx');
const imageSource = read('src/components/media/ResilientImage.tsx');
const poetImageSource = read('src/components/PoetImage.tsx');
const poetCardSource = read('src/components/PoetCard.tsx');
const essayCoverSource = read('src/components/essay/EssayCover.tsx');
const tiltSource = read('src/components/TiltCard.tsx');
const smoothSource = read('src/utils/smoothScroll.ts');

expect(overlaySource.includes('overlayStack'), 'overlay locking must remain stack-based');
expect(overlaySource.includes('pauseSmoothScroll'), 'modal locking must pause Lenis through the shared bridge');
expect(overlaySource.includes('window.scrollTo(snapshot.scrollX, snapshot.scrollY)'), 'modal unlocking must restore the exact scroll position');
expect(overlaySource.includes('canRestoreOverlayFocus'), 'stacked dialogs must guard focus restoration ownership');
expect(overlaySource.includes('pruneDetachedOverlays'), 'keyboard ownership must recover from detached portal entries');
expect(overlaySource.includes('onOverlayKeyDown'), 'Escape must be dispatched by one shared stack listener');
expect(overlaySource.includes('setEscapeHandler'), 'overlay handles must register their close behavior with the runtime');
expect(dialogSource.includes("document.addEventListener('keydown', onKeyDown, true)"), 'dialog focus containment must run in capture phase');
expect(dialogSource.includes("event.key !== 'Tab'"), 'shared dialogs must trap keyboard focus without competing for Escape');
expect(dialogSource.includes('handle.setEscapeHandler'), 'dialogs must delegate Escape to the shared runtime');
expect(dialogSource.includes('handleRef.current?.setRoot(dialogRef.current)'), 'keyed dialog replacements must refresh the overlay root');
expect(dialogSource.includes('canRestoreOverlayFocus(previouslyFocused)'), 'dialog close must not restore focus beneath another surface');
expect(dialogSource.includes('restoreFocusRef?.current ?? restoreFocus'), 'navigation-triggered dialog closes must be able to preserve route focus');
expect(commandSource.includes('restoreFocusRef.current = false'), 'command navigation must not refocus the old trigger over the new page');
expect(commandSource.includes('useDialogSurface'), 'command search must use the shared dialog lifecycle');
expect(!commandSource.includes('document.body.style.overflow'), 'command search must not own body locking independently');
expect(commandSource.includes('onPointerDown'), 'the command backdrop must support pointer and touch input');
expect(immersiveSource.includes('useDialogSurface'), 'immersive playback must use the shared dialog lifecycle');
expect(immersiveSource.includes('isTopmost()'), 'background media shortcuts must pause beneath another dialog');
expect(!immersiveSource.includes("document.body.style.overflow = 'hidden'"), 'immersive playback must not duplicate body locking');
expect(ratingFormSource.includes('dirtyRef.current'), 'late community hydration must not erase an in-progress rating draft');
expect(ratingFormSource.includes('initialChanged && !dirtyRef.current'), 'saved rating snapshots may refresh only a pristine form');
expect(imageSource.includes('fallbackSrc'), 'resilient images must support a deterministic fallback source');
expect(imageSource.includes("fetchPriority={priority ? 'high'"), 'priority imagery must advertise high fetch priority');
expect(imageSource.includes('data-image-state'), 'image load state must remain inspectable for UI and QA');
expect(imageSource.includes('setSourceIndex(0)'), 'changing an image source must reset the candidate chain');
expect(poetImageSource.includes('ResilientImage'), 'poet placeholders must use the shared image primitive');
expect(poetCardSource.includes('<PoetImage'), 'catalog portraits must no longer use an unguarded img element');
expect(essayCoverSource.includes('ImageLoadState'), 'essay covers must expose loading and terminal fallback states');
expect(tiltSource.includes('IntersectionObserver'), 'offscreen tilt cards must stop pointer painting');
expect(tiltSource.includes('forced-colors: active'), 'tilt effects must preserve forced-color accessibility');
expect(tiltSource.includes("event.pointerType !== 'mouse'"), 'tilt effects must reject touch pointer movement');
expect(!tiltSource.includes('will-change-transform'), 'large card grids must not permanently promote every tilt card');
expect(smoothSource.includes('pauseTokens'), 'smooth scrolling must remain reference-counted across stacked overlays');

if (failures.length) {
  console.error('\nInteraction runtime validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Interaction runtime validation passed: centralized Escape, route focus, rating draft safety, resilient images and bounded pointer effects.');
