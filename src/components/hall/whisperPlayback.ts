export interface WhisperSourceNode {
  stop: () => void;
  disconnect: () => void;
}

export interface WhisperGainNode {
  gain: {
    cancelScheduledValues: (time: number) => void;
    linearRampToValueAtTime: (value: number, endTime: number) => void;
  };
  disconnect: () => void;
}

export interface WhisperPannerNode {
  disconnect: () => void;
}

export interface WhisperPlaybackNodes {
  source: WhisperSourceNode;
  gain: WhisperGainNode;
  panner: WhisperPannerNode;
}

export interface WhisperScheduler {
  schedule: (callback: () => void, delayMs: number) => number;
  cancel: (handle: number) => void;
}

export interface WhisperPlaybackController {
  replace: (nodes: WhisperPlaybackNodes) => void;
  fadeOut: (contextTime: number, fadeSeconds?: number) => void;
  stop: () => void;
  complete: (source: WhisperSourceNode) => void;
  dispose: () => void;
}

function safely(callback: () => void) {
  try {
    callback();
  } catch {
    // Web Audio nodes can already be ended or disconnected. Finalization is
    // intentionally idempotent so lifecycle races never surface to the UI.
  }
}

function disconnectNodes(nodes: WhisperPlaybackNodes) {
  safely(() => nodes.source.disconnect());
  safely(() => nodes.gain.disconnect());
  safely(() => nodes.panner.disconnect());
}

function stopAndDisconnect(nodes: WhisperPlaybackNodes) {
  safely(() => nodes.source.stop());
  disconnectNodes(nodes);
}

/**
 * Owns the currently audible whisper and any source that is finishing a fade.
 * A fading source is removed from `current` immediately and captured by its own
 * timer, so a stale timer can never stop a replacement source stored later.
 */
export function createWhisperPlaybackController(scheduler: WhisperScheduler): WhisperPlaybackController {
  let current: WhisperPlaybackNodes | null = null;
  const pendingStops = new Map<number, WhisperPlaybackNodes>();

  const stop = () => {
    if (!current) return;
    const nodes = current;
    current = null;
    stopAndDisconnect(nodes);
  };

  return {
    replace(nodes) {
      stop();
      current = nodes;
    },

    fadeOut(contextTime, fadeSeconds = 0.35) {
      if (!current) return;
      const nodes = current;
      current = null;

      try {
        nodes.gain.gain.cancelScheduledValues(contextTime);
        nodes.gain.gain.linearRampToValueAtTime(0, contextTime + fadeSeconds);
      } catch {
        stopAndDisconnect(nodes);
        return;
      }

      let handle = 0;
      handle = scheduler.schedule(() => {
        pendingStops.delete(handle);
        stopAndDisconnect(nodes);
      }, Math.ceil(fadeSeconds * 1000) + 30);
      pendingStops.set(handle, nodes);
    },

    stop,

    complete(source) {
      if (current?.source !== source) return;
      const nodes = current;
      current = null;
      disconnectNodes(nodes);
    },

    dispose() {
      stop();
      for (const [handle, nodes] of pendingStops) {
        scheduler.cancel(handle);
        stopAndDisconnect(nodes);
      }
      pendingStops.clear();
    },
  };
}
