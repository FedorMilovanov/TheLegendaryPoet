import fs from 'node:fs';
import path from 'node:path';
import { createDeferredAudioStop } from '../src/utils/deferredAudioStop';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

type FakeAudioSource = {
  id: string;
  stopCalls: number;
  stop: () => void;
};
type DeferredTimer = ReturnType<typeof globalThis.setTimeout>;

const scheduledStops = new Map<DeferredTimer, () => void>();
let nextTimerId = 1;
const controller = createDeferredAudioStop<FakeAudioSource>(
  (callback) => {
    const timer = { id: nextTimerId++ } as unknown as DeferredTimer;
    scheduledStops.set(timer, () => {
      scheduledStops.delete(timer);
      callback();
    });
    return timer;
  },
  (timer) => {
    scheduledStops.delete(timer);
  },
);

const makeSource = (id: string): FakeAudioSource => {
  const source: FakeAudioSource = {
    id,
    stopCalls: 0,
    stop: () => { source.stopCalls += 1; },
  };
  return source;
};

const firstSource = makeSource('first');
const replacementSource = makeSource('replacement');
const stoppedIds: string[] = [];
controller.schedule(firstSource, 380, (source) => stoppedIds.push(source.id));
expect(controller.hasPending(), 'a scheduled fade must expose pending stop ownership');
controller.schedule(replacementSource, 380, (source) => stoppedIds.push(source.id));
expect(scheduledStops.size === 1, 'rescheduling a fade must cancel the older timer');
for (const callback of [...scheduledStops.values()]) callback();
expect(firstSource.stopCalls === 0, 'an older fade timer must never stop a replaced source');
expect(replacementSource.stopCalls === 1, 'the latest scheduled source must stop exactly once');
expect(stoppedIds.join(',') === 'replacement', 'cleanup must report the concrete source it stopped');
expect(!controller.hasPending(), 'executing a deferred stop must clear pending ownership');
expect(scheduledStops.size === 0, 'a fired one-shot timer must leave no scheduler residue');

const cancelledSource = makeSource('cancelled');
controller.schedule(cancelledSource, 380);
controller.cancel();
for (const callback of [...scheduledStops.values()]) callback();
expect(cancelledSource.stopCalls === 0, 'cancelling a fade must prevent a later source stop');
expect(scheduledStops.size === 0, 'cancelling a fade must remove its timer');

const fakeHallWindow = { __TLP_MODAL_OPEN: false };
Object.defineProperty(globalThis, 'window', { configurable: true, value: fakeHallWindow });
const hallInput = await import('../src/components/hall/hallInputGuard');
const plainTarget = { closest: () => null } as unknown as EventTarget;
const editableTarget = { closest: () => ({}) } as unknown as EventTarget;
const buttonTarget = {
  closest: (selector: string) => selector.includes('button') ? {} : null,
} as unknown as EventTarget;
const shortcutEvent = (overrides: Partial<KeyboardEvent> = {}) => ({
  defaultPrevented: false,
  repeat: false,
  isComposing: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  target: plainTarget,
  ...overrides,
}) as KeyboardEvent;

expect(!hallInput.shouldIgnoreHallShortcut(shortcutEvent()), 'an unowned Hall shortcut must remain available');
fakeHallWindow.__TLP_MODAL_OPEN = true;
expect(hallInput.shouldIgnoreHallShortcut(shortcutEvent()), 'an open overlay must own Hall shortcuts');
fakeHallWindow.__TLP_MODAL_OPEN = false;
expect(hallInput.shouldIgnoreHallShortcut(shortcutEvent({ target: editableTarget })), 'text-entry controls must own their keystrokes');
expect(!hallInput.shouldIgnoreHallShortcut(shortcutEvent({ target: buttonTarget })), 'Hall shortcuts must remain active after an ordinary button click');
expect(hallInput.shouldIgnoreHallShortcut(shortcutEvent({ repeat: true })), 'repeated keydown must not toggle Hall modes repeatedly');
expect(hallInput.shouldIgnoreHallShortcut(shortcutEvent({ isComposing: true })), 'IME composition must own Hall keystrokes');
expect(hallInput.shouldIgnoreHallShortcut(shortcutEvent({ defaultPrevented: true })), 'already-handled events must not reach Hall shortcuts');
expect(hallInput.shouldIgnoreHallShortcut(shortcutEvent({ ctrlKey: true })), 'Ctrl chords must remain available to application shortcuts');
expect(hallInput.shouldIgnoreHallShortcut(shortcutEvent({ metaKey: true })), 'Meta chords must remain available to the platform');
expect(hallInput.shouldIgnoreHallShortcut(shortcutEvent({ altKey: true })), 'Alt chords must remain available to the platform');

const hallSource = read('src/components/hall/HallOfPoets.tsx');
const nicheSource = read('src/components/hall/PoetNiche.tsx');
const whisperSource = read('src/components/hall/usePoetWhisper.ts');
const deferredStopSource = read('src/utils/deferredAudioStop.ts');
const inputGuardSource = read('src/components/hall/hallInputGuard.ts');
const firstPersonSource = read('src/components/hall/FirstPersonControls.tsx');
const navigationSource = read('src/components/hall/useHallNavigation.ts');
const loadBufferStart = whisperSource.indexOf('async function loadBuffer');
const loadBufferEnd = whisperSource.indexOf('function safeDisconnect');
const loadBufferSource = whisperSource.slice(loadBufferStart, loadBufferEnd);

expect(hallSource.includes('audioMuted={audioMuted}'), 'HallScene must receive mute state through React props');
expect(hallSource.includes('useHallAudioListener()'), 'HallScene must mount one shared 3D listener bridge');
expect(hallSource.includes("event.code !== 'KeyE' || shouldIgnoreHallShortcut(event)"), 'FPS selection must yield E to the current interaction owner');
expect(hallSource.includes('if (shouldIgnoreHallShortcut(event)) return'), 'global F and M shortcuts must use the shared guard');
expect(!hallSource.includes('__TLP_AUDIO_MUTED'), 'Hall audio must not depend on a mutable Window flag');
expect(nicheSource.includes('muted: boolean'), 'each poet niche must declare explicit mute ownership');
expect(nicheSource.includes('usePoetWhisper(poet.shortKey, hovered, position, muted)'), 'poet niches must pass mute state into the hook');
expect(whisperSource.includes('createDeferredAudioStop'), 'poet whispers must use source-safe delayed stop ownership');
expect(whisperSource.includes('export function useHallAudioListener()'), 'the listener bridge must be an explicit Hall-level hook');
expect((whisperSource.match(/useFrame\(\(\) =>/g) ?? []).length === 1, 'camera listener writes must run through exactly one frame callback implementation');
expect(whisperSource.includes('latestPositionRef.current = position'), 'poet whispers must track coordinates without array-identity restarts');
expect(!whisperSource.includes('muted, poetId, position, resumeCurrent'), 'startup must not depend on a recreated position array');
expect(!whisperSource.includes("fetch(url, { method: 'HEAD' })"), 'audio candidates must not be double-requested through HEAD plus GET');
expect(!loadBufferSource.includes('.resume()'), 'buffer download and decode must not depend on autoplay permission');
expect(!whisperSource.includes('__TLP_AUDIO_MUTED'), 'the hook must not read global mute state');
expect(deferredStopSource.includes('source.stop()'), 'deferred cleanup must stop its captured concrete source');
expect(deferredStopSource.includes('cancel();'), 'replacement scheduling must cancel the previous timer');
expect(inputGuardSource.includes('event.isComposing'), 'Hall input must yield during IME composition');
expect(inputGuardSource.includes('event.ctrlKey'), 'Hall input must yield to modifier chords');
expect(!inputGuardSource.includes('select, button'), 'ordinary Hall buttons must not disable F/M shortcuts');
expect(firstPersonSource.includes('shouldIgnoreHallShortcut(event)'), 'FPS movement must use the shared shortcut guard');
expect(firstPersonSource.includes('clearMove(move.current)'), 'FPS movement must clear latched keys when ownership changes');
expect(firstPersonSource.includes('document.exitPointerLock()'), 'FPS mode must release pointer lock when an overlay owns input');
expect(navigationSource.includes('if (!enabled || isHallOverlayOpen()) return'), 'rail camera writes must pause beneath overlays');
expect(navigationSource.includes('const lastSaveAt = useRef(0)'), 'rail persistence timing must remain instance-local');
expect(!navigationSource.includes('useHallNavigation as any'), 'rail persistence must not attach mutable state to the hook function');
expect(navigationSource.includes('el.style.touchAction = previousTouchAction'), 'rail cleanup must restore the canvas touch contract');

if (failures.length > 0) {
  console.error('\nHall audio and input runtime validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall runtime validation passed: one listener bridge, decode/playback separation, source-safe fades and unified input ownership are enforced.');
