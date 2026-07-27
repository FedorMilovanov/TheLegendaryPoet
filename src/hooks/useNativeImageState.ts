import { useEffect, useRef, useState } from 'react';

export type NativeImageState = 'loading' | 'ready' | 'error';

type NativeImageSnapshot = {
  src: string;
  state: NativeImageState;
};

/**
 * Tracks the browser's native image lifecycle without relying exclusively on
 * React's synthetic events. Cached, eager or prerendered images may already be
 * complete before hydration attaches handlers, so each source is synchronized
 * from `complete` and `naturalWidth` after native listeners are installed.
 */
export function useNativeImageState(src: string) {
  const ref = useRef<HTMLImageElement>(null);
  const [snapshot, setSnapshot] = useState<NativeImageSnapshot>({ src, state: 'loading' });

  useEffect(() => {
    const image = ref.current;
    let active = true;

    const publish = (state: NativeImageState) => {
      if (!active) return;
      setSnapshot((current) => (
        current.src === src && current.state === state ? current : { src, state }
      ));
    };

    publish('loading');
    if (!image) return () => { active = false; };

    const synchronize = () => {
      if (!image.complete) {
        publish('loading');
        return;
      }
      publish(image.naturalWidth > 0 ? 'ready' : 'error');
    };

    image.addEventListener('load', synchronize);
    image.addEventListener('error', synchronize);
    synchronize();

    return () => {
      active = false;
      image.removeEventListener('load', synchronize);
      image.removeEventListener('error', synchronize);
    };
  }, [src]);

  const state = snapshot.src === src ? snapshot.state : 'loading';

  return {
    ref,
    state,
    ready: state === 'ready',
  } as const;
}
