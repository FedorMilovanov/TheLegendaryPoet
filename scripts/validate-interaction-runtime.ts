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
const resumeEvents: Array<{ type: string; position: string; scrollCount: number }> = [];
const documentListeners = new Map<string, Set<(event: KeyboardEvent) => void>>();

const fakeWindow = {
  scrollX: 7,
  scrollY: 321,
  innerWidth: 1200,
  getComputedStyle: () => ({ paddingRight: '4px' }),
  scrollTo: (x: number, y: number) => scrollCalls.push([x, y]),
  dispatchEvent: (event: Event) => {
    resumeEvents.push({ type: event.type, position: bodyStyle.position, scrollCount: scrollCalls.length });
    return true;
  },
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
expect(resumeEvents.length === 0, 'partial modal release must not resume document scroll');
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
expect(resumeEvents.length === 1 && resumeEvents[0]?.type === 'tlp-scroll-resumed' && resumeEvents[0]?.position === 'relative' && resumeEvents[0]?.scrollCount === 1, 'final modal release must notify once after body and scroll restoration');

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
expect(resumeEvents.length === 2, 'each complete overlay session must notify scroll ownership exactly once');

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

let writes = 0;
function branch() {
  let inert = false;
  const attributes = new Map<string, string>();
  return {
    isConnected: true, tagName: 'DIV',
    get inert() { return inert; },
    set inert(value: boolean) { writes++; inert = value; },
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => { writes++; attributes.set(name, value); },
    removeAttribute: (name: string) => { writes++; attributes.delete(name); },
    contains: () => false,
    parentElement: fakeDocument.body,
  };
}
const background = branch();
const dialogBranch = branch();
const extra = branch();
Object.assign(fakeDocument.body, { children: [background, dialogBranch] });
const stable = overlay.acquireOverlayLock('stable', dialogBranch as unknown as HTMLElement);
expect(background.inert && background.getAttribute('aria-hidden') === 'true', 'initial branch isolation is required');
writes = 0;
stable.setRoot(dialogBranch as unknown as HTMLElement);
expect(writes === 0, 'unchanged overlay branches must not toggle accessibility attributes');
Object.assign(fakeDocument.body, { children: [background, dialogBranch, extra] });
writes = 0;
stable.setRoot(dialogBranch as unknown as HTMLElement);
expect(extra.inert && extra.getAttribute('aria-hidden') === 'true' && writes === 2, 'new siblings must be isolated without disturbing existing branches');
stable.release();
expect(!background.inert && !extra.inert && background.getAttribute('aria-hidden') === null && extra.getAttribute('aria-hidden') === null, 'final release must restore all original branch states');

const { startNativeDialogEntrance, startNativeDialogExit } = await import('../src/utils/nativeDialogExit');

async function checkNativeExit(kind: string) {
  let now = 0;
  let nextId = 0;
  let current = true;
  let completions = 0;
  let finishCalls = 0;
  let opacity = '0.8';
  let priority = '';
  const tasks = new Map<number, { callback: () => void; at: number }>();
  Object.assign(fakeWindow, {
    setTimeout: (callback: () => void, delay: number) => {
      tasks.set(++nextId, { callback, at: now + delay });
      return nextId;
    },
    clearTimeout: (id: number) => tasks.delete(id),
  });
  Object.assign(fakeDocument, { visibilityState: 'visible' });
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const finished = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  const animation = Object.assign(new EventTarget(), {
    finished,
    finish() {
      finishCalls++;
      if (kind === 'finishThrows') throw new Error('injected compositor failure');
      this.dispatchEvent(new Event('finish'));
    },
    cancel() {},
  });
  const surface = {
    style: {
      getPropertyValue: () => opacity,
      getPropertyPriority: () => priority,
      setProperty: (_name: string, value: string, p: string) => { opacity = value; priority = p; },
      removeProperty: () => { opacity = ''; priority = ''; },
    },
    animate: () => {
      if (kind === 'animateThrows') throw new Error('injected animate failure');
      return animation;
    },
  } as unknown as HTMLElement;
  const cleanup = startNativeDialogExit(surface, () => current, () => { completions++; });
  const advance = (ms: number) => {
    now += ms;
    for (const [id, task] of tasks) {
      if (task.at <= now) { tasks.delete(id); task.callback(); }
    }
  };
  if (kind === 'normal') {
    resolve(); await Promise.resolve();
    animation.dispatchEvent(new Event('finish'));
    advance(2000);
    expect(completions === 1 && opacity === '0.8' && tasks.size === 0, 'normal native exit must settle once and cancel the watchdog');
  } else if (kind === 'eventOnly') {
    animation.dispatchEvent(new Event('finish'));
    expect(completions === 1 && opacity === '0.8' && tasks.size === 0, 'finish event must settle even when the finished promise never resolves');
  } else if (kind === 'stalled' || kind === 'finishThrows') {
    advance(1799);
    expect(completions === 0 && opacity === '0.8', 'stalled exit must retain ownership until its liveness deadline');
    advance(1);
    expect(completions === 1 && opacity === '0' && priority === 'important' && finishCalls === 1, 'stalled exit must force terminal visual state before completing, even if finish throws');
  } else if (kind === 'cancel') {
    reject(new Error('cancel')); await Promise.resolve();
    expect(completions === 1 && opacity === '0' && priority === 'important' && tasks.size === 0, 'cancelled native animation must conceal before completing and clear its watchdog');
  } else if (kind === 'hidden') {
    Object.assign(fakeDocument, { visibilityState: 'hidden' });
    for (const listener of documentListeners.get('visibilitychange') ?? []) listener({} as KeyboardEvent);
    expect(completions === 1 && tasks.size === 0, 'hidden document must settle and clear its watchdog');
  } else if (kind === 'reopen') {
    current = false; cleanup(); advance(5000); resolve(); await Promise.resolve();
    expect(completions === 0 && opacity === '0.8', 'old native exit must not close a reopened dialog');
  } else if (kind === 'reopenCancelled') {
    current = false; cleanup(); reject(new Error('old cancellation')); await Promise.resolve();
    expect(completions === 0 && opacity === '0.8', 'stale rejection must not conceal a reopened dialog');
  } else if (kind === 'cancelAfterFinish') {
    animation.dispatchEvent(new Event('finish')); reject(new Error('late cancellation')); await Promise.resolve();
    expect(completions === 1 && opacity === '0.8', 'late rejection after a finish event must not settle or conceal again');
  } else if (kind === 'animateThrows') {
    expect(completions === 1 && opacity === '0' && priority === 'important', 'synchronous native animation failure must be nonvisual and complete');
  }
  cleanup();
  expect(opacity === '0.8' && priority === '' && tasks.size === 0 && !(documentListeners.get('visibilitychange')?.size), 'exit cleanup must restore prior opacity and remove all callbacks');
}
for (const kind of ['normal', 'eventOnly', 'stalled', 'finishThrows', 'cancel', 'hidden', 'reopen', 'reopenCancelled', 'cancelAfterFinish', 'animateThrows']) {
  await checkNativeExit(kind);
}
Object.assign(fakeDocument, { visibilityState: 'visible' });

// The root's entrance must surrender the actual painted value before exit.
{
  let cancelled = false;
  const animations: { opacity: number }[][] = [];
  const previousStyle = globalThis.getComputedStyle;
  Object.assign(globalThis, { getComputedStyle: () => ({ opacity: '0.37' }) });
  const entranceSurface = {
    animate: (frames: { opacity: number }[]) => {
      animations.push(frames);
      return { finished: Promise.resolve(), cancel: () => { cancelled = true; } };
    },
  } as unknown as HTMLElement;
  try {
    const stop = startNativeDialogEntrance(entranceSurface);
    expect(animations.length === 1 && animations[0][0].opacity === 0 && animations[0][1].opacity === 1, 'native entrance must own the root fade');
    expect(stop() === 0.37 && cancelled, 'entrance cleanup must capture painted opacity before cancellation');
  } finally {
    Object.assign(globalThis, { getComputedStyle: previousStyle });
  }
}

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
const routeScrollSource = read('src/components/SmoothScroll.tsx');
const focusSource = read('src/utils/focusRuntime.ts');
const autoHideSource = read('src/hooks/useAutoHideChrome.ts');
const archivePageSource = read('src/pages/MyArchivePage.tsx');
const miniPlayerSource = read('src/components/music/GlobalMiniPlayer.tsx');
const analyticsConsentSource = read('src/components/AnalyticsConsent.tsx');
const audioPlayerStyleSource = read('src/audio-player.css');

expect(overlaySource.includes('overlayStack'), 'overlay locking must remain stack-based');
expect(overlaySource.includes('pauseSmoothScroll'), 'modal locking must pause Lenis through the shared bridge');
expect(overlaySource.includes('window.scrollTo(snapshot.scrollX, snapshot.scrollY)'), 'modal unlocking must restore the exact scroll position');
expect(overlaySource.includes('canRestoreOverlayFocus'), 'stacked dialogs must guard focus restoration ownership');
expect(overlaySource.includes('pruneDetachedOverlays'), 'keyboard ownership must recover from detached portal entries');
expect(overlaySource.includes('onOverlayKeyDown'), 'Escape must be dispatched by one shared stack listener');
expect(overlaySource.includes('setEscapeHandler'), 'overlay handles must register their close behavior with the runtime');
expect(overlaySource.includes('accessibilitySnapshots'), 'overlay runtime must snapshot background accessibility state');
expect(overlaySource.includes('syncOverlayAccessibility'), 'overlay stack changes must resynchronise topmost accessibility ownership');
expect(overlaySource.includes("element.inert = true"), 'topmost overlays must remove covered branches from sequential focus');
expect(overlaySource.includes("element.setAttribute('aria-hidden', 'true')"), 'topmost overlays must hide covered branches from the accessibility tree');
expect(overlaySource.includes('element.inert = snapshot.inert'), 'overlay teardown must restore exact prior inert state');
expect(overlaySource.includes("snapshot.ariaHidden === null"), 'overlay teardown must restore exact prior aria-hidden state');
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
expect(commandSource.includes('const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>)'), 'command Arrow/Enter handling must be owned by the combobox input');
expect(commandSource.includes('onKeyDown={onInputKeyDown}'), 'the command combobox must bind its keyboard navigation directly');
expect(!commandSource.includes('onKeyDown={onDialogKeyDown}'), 'the command dialog must not intercept Enter from focused close/result buttons');
expect(immersiveSource.includes('useDialogSurface'), 'immersive playback must use the shared dialog lifecycle');
expect(dialogSource.includes('useDialogExitLifetime'), 'animated dialogs must share a presence-aware lock lifetime');
expect(dialogSource.includes('if (!deferReleaseUntilUnmount) handle.release()'), 'Escape must retain animated dialog ownership until exit completion');
expect(immersiveSource.includes('useNativeDialogExitLifetime(immersiveOpen && Boolean(currentTrack), dialogRef)'), 'immersive playback must attach its native exit to the painted dialog');
expect(immersiveSource.includes('open: lifetime.lockOpen') && immersiveSource.includes('deferReleaseUntilUnmount: true'), 'immersive overlay lock must follow painted presence, not logical open');
const nativeExitSource = read('src/utils/nativeDialogExit.ts');
expect(dialogSource.includes('startNativeDialogEntrance(surface)') &&
  immersiveSource.includes('<div\n            ref={dialogRef}') &&
  !immersiveSource.includes('<motion.div\n            ref={dialogRef}'),
  'the immersive root must have one native opacity owner and stay mounted across track changes');
expect(dialogSource.includes('startNativeDialogExit(surface') && dialogSource.includes("typeof surface.animate !== 'function'") && nativeExitSource.includes('exit.finished.then') && nativeExitSource.includes("exit.addEventListener('finish', complete)"), 'immersive overlay must observe both native completion channels through one visual owner');
expect(immersiveSource.includes('{lifetime.lockOpen && currentTrack'), 'immersive dialog DOM must remain mounted throughout native exit');
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
expect(focusSource.includes('focusProgrammatically'), 'route and mutation focus handoffs must share one programmatic focus helper');
expect(focusSource.includes("target.setAttribute('tabindex', '-1')"), 'non-interactive focus destinations must receive a temporary programmatic tabindex');
expect(focusSource.includes('scheduleProgrammaticFocus'), 'settled focus handoffs must be schedulable without sleeps');
expect(autoHideSource.includes('syncChromeAccessibility'), 'reading-mode chrome must have an accessibility-state owner');
expect(autoHideSource.includes('element.inert = true'), 'visually hidden chrome must leave sequential focus');
expect(autoHideSource.includes("element.setAttribute('aria-hidden', 'true')"), 'visually hidden chrome must leave the accessibility tree');
expect(autoHideSource.includes("document.getElementById('main-content')"), 'focus trapped in disappearing chrome must hand off to main content');
expect(routeScrollSource.includes('scheduleProgrammaticFocus'), 'hash restoration must transfer focus after settled target insertion');
expect(routeScrollSource.includes('target.isConnected ? target : null'), 'hash focus must fail closed when the target disappears');
expect(archivePageSource.includes('data-archive-remove-id'), 'archive mutation controls must expose stable focus-handoff identity');
expect(archivePageSource.includes('archiveStatusRef'), 'archive removal must own a stable fallback focus target');
expect(archivePageSource.includes('scheduleProgrammaticFocus'), 'archive removal must schedule post-mutation focus ownership');
expect(miniPlayerSource.includes('seek-focus-shell') && miniPlayerSource.includes('seek-focus-indicator'), 'mini-player seek must expose the shared visible focus owner');
expect(audioPlayerStyleSource.includes('max-width: 760px'), 'mini-player must retain a bounded responsive width without motion-owned transform centering');
expect(!audioPlayerStyleSource.includes('transform: translateX(-50%)'), 'mini-player centering must not compete with Framer Motion transform ownership');
expect(immersiveSource.includes('seek-focus-shell') && immersiveSource.includes('seek-focus-indicator'), 'immersive seek must expose the shared visible focus owner');
expect(audioPlayerStyleSource.includes('.seek-focus-shell:focus-within .seek-focus-indicator'), 'seek focus visibility must be owned by the cross-browser focus-within contract');
expect(analyticsConsentSource.includes('analytics-consent-banner theme-dark-island'), 'analytics consent must be an explicit dark fixed-chrome surface');
expect(analyticsConsentSource.includes('z-[105]'), 'analytics consent must remain below true modal surfaces');
expect(audioPlayerStyleSource.includes('html.global-audio-active .analytics-consent-banner'), 'analytics consent must move clear of persistent audio chrome');
expect(audioPlayerStyleSource.includes('--tlp-consent-bottom'), 'analytics consent placement must use the shared fixed-chrome geometry contract');
expect(audioPlayerStyleSource.includes('max-height: calc(100svh'), 'analytics consent must remain bounded by the mobile visual viewport');

if (failures.length) {
  console.error('\nInteraction runtime validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Interaction runtime validation passed: centralized Escape, topmost accessibility isolation, route/mutation focus ownership, visible seek focus, rating draft safety, resilient images and bounded pointer effects.');
