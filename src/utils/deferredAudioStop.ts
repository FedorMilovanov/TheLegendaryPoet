export interface StoppableAudioSource {
  stop: () => void;
}

type TimerHandle = ReturnType<typeof globalThis.setTimeout>;

type ScheduleTimer = (callback: () => void, delayMs: number) => TimerHandle;
type CancelTimer = (timer: TimerHandle) => void;

export interface DeferredAudioStopController<TSource extends StoppableAudioSource> {
  schedule: (source: TSource, delayMs: number, onStopped?: (source: TSource) => void) => void;
  cancel: () => void;
  hasPending: () => boolean;
}

/**
 * Owns one delayed stop operation and always closes over the concrete source
 * that was scheduled. A later source can therefore replace the caller's ref
 * without being stopped by an older fade-out timer.
 */
export function createDeferredAudioStop<TSource extends StoppableAudioSource>(
  scheduleTimer: ScheduleTimer = (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  cancelTimer: CancelTimer = (timer) => globalThis.clearTimeout(timer),
): DeferredAudioStopController<TSource> {
  let pendingTimer: TimerHandle | null = null;

  const cancel = () => {
    if (pendingTimer === null) return;
    cancelTimer(pendingTimer);
    pendingTimer = null;
  };

  return {
    schedule(source, delayMs, onStopped) {
      cancel();
      pendingTimer = scheduleTimer(() => {
        pendingTimer = null;
        try {
          source.stop();
        } catch {
          // Web Audio throws when a source has already ended; cleanup remains safe.
        }
        onStopped?.(source);
      }, delayMs);
    },
    cancel,
    hasPending: () => pendingTimer !== null,
  };
}
