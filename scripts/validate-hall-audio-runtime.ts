import fs from 'node:fs';
import {
  createWhisperPlaybackController,
  type WhisperPlaybackNodes,
} from '../src/components/hall/whisperPlayback';

const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

let nextHandle = 1;
const scheduled = new Map<number, () => void>();
const controller = createWhisperPlaybackController({
  schedule(callback) {
    const handle = nextHandle;
    nextHandle += 1;
    scheduled.set(handle, callback);
    return handle;
  },
  cancel(handle) {
    scheduled.delete(handle);
  },
});

function createNodes(label: string) {
  const state = {
    label,
    stopped: 0,
    sourceDisconnected: 0,
    gainDisconnected: 0,
    pannerDisconnected: 0,
    cancelledAt: [] as number[],
    ramps: [] as Array<[number, number]>,
  };
  const nodes: WhisperPlaybackNodes = {
    source: {
      stop: () => { state.stopped += 1; },
      disconnect: () => { state.sourceDisconnected += 1; },
    },
    gain: {
      gain: {
        cancelScheduledValues: (time) => { state.cancelledAt.push(time); },
        linearRampToValueAtTime: (value, time) => { state.ramps.push([value, time]); },
      },
      disconnect: () => { state.gainDisconnected += 1; },
    },
    panner: {
      disconnect: () => { state.pannerDisconnected += 1; },
    },
  };
  return { nodes, state };
}

const first = createNodes('first');
const second = createNodes('second');
controller.replace(first.nodes);
controller.fadeOut(10, 0.35);
expect(first.state.cancelledAt[0] === 10, 'fade must cancel stale gain automation at the current context time');
expect(
  first.state.ramps[0]?.[0] === 0 && Math.abs((first.state.ramps[0]?.[1] ?? 0) - 10.35) < 1e-9,
  'fade must ramp the captured source to zero',
);
expect(scheduled.size === 1, 'fade must schedule exactly one delayed source finalizer');

controller.replace(second.nodes);
for (const [handle, callback] of [...scheduled]) {
  scheduled.delete(handle);
  callback();
}
expect(first.state.stopped === 1, 'the faded source must stop once its own timer completes');
expect(second.state.stopped === 0, 'a stale fade timer must never stop the replacement source');

controller.fadeOut(20, 0.2);
expect(scheduled.size === 1, 'replacement source fade must own a new isolated timer');
controller.dispose();
expect(second.state.stopped === 1, 'dispose must finalize a source that is still fading');
expect(scheduled.size === 0, 'dispose must cancel every pending fade timer');

const naturallyEnded = createNodes('naturally-ended');
controller.replace(naturallyEnded.nodes);
controller.complete(naturallyEnded.nodes.source);
expect(naturallyEnded.state.stopped === 0, 'natural completion must not call stop on an already-ended source');
expect(naturallyEnded.state.sourceDisconnected === 1, 'natural completion must release source connections');
expect(naturallyEnded.state.gainDisconnected === 1 && naturallyEnded.state.pannerDisconnected === 1, 'natural completion must release the full Web Audio chain');

const replacedImmediately = createNodes('replaced-immediately');
const finalSource = createNodes('final-source');
controller.replace(replacedImmediately.nodes);
controller.replace(finalSource.nodes);
expect(replacedImmediately.state.stopped === 1, 'replacing a live source must stop it immediately');
expect(finalSource.state.stopped === 0, 'the newly installed source must remain active');
controller.dispose();
expect(finalSource.state.stopped === 1, 'final disposal must stop the active source');

const hookSource = fs.readFileSync('src/components/hall/usePoetWhisper.ts', 'utf8');
const nicheSource = fs.readFileSync('src/components/hall/PoetNiche.tsx', 'utf8');
const hallSource = fs.readFileSync('src/components/hall/HallOfPoets.tsx', 'utf8');
const fpsSource = fs.readFileSync('src/components/hall/FirstPersonControls.tsx', 'utf8');
const railSource = fs.readFileSync('src/components/hall/useHallNavigation.ts', 'utf8');
const guardSource = fs.readFileSync('src/components/hall/hallInputGuard.ts', 'utf8');
expect(hookSource.includes('muted: boolean'), 'whisper hook must receive reactive mute state');
expect(hookSource.includes('[active, muted, poetId, x, y, z]'), 'whisper effect must depend on primitive coordinates rather than an unstable position array');
expect(hookSource.includes('bufferRequests.set(url, request)'), 'audio fetch and decode results must be cached per candidate URL');
expect(!hookSource.includes("method: 'HEAD'"), 'whisper loading must not issue a duplicate HEAD request before every audio GET');
expect(!hookSource.includes('__TLP_AUDIO_MUTED'), 'whisper hook must not read a non-reactive global mute flag');
expect(!hookSource.includes('playbackRef.current = null'), 'StrictMode effect replay must not null the render-owned playback controller');
expect(nicheSource.includes('usePoetWhisper(poet.shortKey, hovered, position, muted)'), 'every niche must pass mute state into its whisper lifecycle');
expect(hallSource.includes('muted={audioMuted}'), 'hall scene must propagate its mute state to every niche');
expect((hallSource.match(/shouldIgnoreHallShortcut\(event\)/g) ?? []).length >= 2, 'global F/M and FPS E shortcuts must share the same overlay/editable guard');
expect(!hallSource.includes('__TLP_AUDIO_MUTED ='), 'hall must not mirror mute state into a stale global variable');
expect(guardSource.includes('__TLP_MODAL_OPEN'), 'the shared Hall guard must use the canonical overlay signal');
expect(guardSource.includes("closest('input, textarea, select, button, [contenteditable=\"true\"]')"), 'the Hall guard must cover nested editable and control targets');
expect(fpsSource.includes('down && shouldIgnoreHallShortcut(event)'), 'FPS keydown must not capture movement behind overlays or editable controls');
expect(fpsSource.includes('if (isHallOverlayOpen())'), 'FPS frame updates and pointer lock must stop while an overlay owns input');
expect(fpsSource.includes('Keyup always clears state'), 'FPS keyup must clear latched movement even after focus enters an overlay');
expect(railSource.includes('shouldIgnoreHallShortcut(event)'), 'rail keyboard navigation must use the shared Hall input guard');
expect(railSource.includes('!enabled || isHallOverlayOpen()'), 'rail frame updates must pause while an overlay owns input');

if (failures.length > 0) {
  console.error('\nHall audio runtime validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall audio runtime validation passed: audio races, StrictMode, input ownership, request caching and overlay guards are enforced.');
