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

const hallSource = read('src/components/hall/HallOfPoets.tsx');
const nicheSource = read('src/components/hall/PoetNiche.tsx');
const whisperSource = read('src/components/hall/usePoetWhisper.ts');
const deferredStopSource = read('src/utils/deferredAudioStop.ts');

expect(hallSource.includes('audioMuted={audioMuted}'), 'HallScene must receive mute state through React props');
expect(!hallSource.includes('__TLP_AUDIO_MUTED'), 'Hall audio must not depend on a mutable Window flag');
expect(nicheSource.includes('muted: boolean'), 'each poet niche must declare explicit mute ownership');
expect(nicheSource.includes('usePoetWhisper(poet.shortKey, hovered, position, muted)'), 'poet niches must pass mute state into the hook');
expect(whisperSource.includes('createDeferredAudioStop'), 'poet whispers must use source-safe delayed stop ownership');
expect(whisperSource.includes('latestPositionRef.current = position'), 'poet whispers must track coordinates without array-identity restarts');
expect(!whisperSource.includes('muted, poetId, position, resumeCurrent'), 'startup must not depend on a recreated position array');
expect(whisperSource.includes('useFrame(() =>'), 'listener orientation must follow the moving 3D camera every frame');
expect(!whisperSource.includes("fetch(url, { method: 'HEAD' })"), 'audio candidates must not be double-requested through HEAD plus GET');
expect(!whisperSource.includes('__TLP_AUDIO_MUTED'), 'the hook must not read global mute state');
expect(deferredStopSource.includes('source.stop()'), 'deferred cleanup must stop its captured concrete source');
expect(deferredStopSource.includes('cancel();'), 'replacement scheduling must cancel the previous timer');

if (failures.length > 0) {
  console.error('\nHall audio runtime validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall audio runtime validation passed: mute ownership, source capture, timer cancellation and 3D listener updates are race-safe.');
