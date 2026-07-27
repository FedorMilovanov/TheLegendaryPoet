import { useEffect, useRef, useState } from 'react';

export type NativeImageState = 'loading' | 'ready' | 'error';

/**
 * Tracks the browser's native image lifecycle without relying exclusively on
 * React's synthetic `onLoad` event. Cached or prerendered images may already be
 * complete before hydration attaches handlers, so the hook synchronizes from
 * `complete` and `naturalWidth` after listeners are installed.
 */
export function useNativeImageState(src: string) {
  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<NativeImageState>('loading');

  useEffect(() => {
    const image = ref.current;
    setState('loading');
    if (!image) return;

    const synchronize = () => {
      if (!image.complete) {
        setState('loading');
        return;
      }
      setState(image.naturalWidth > 0 ? 'ready' : 'error');
    };

    image.addEventListener('load', synchronize);
    image.addEventListener('error', synchronize);
    synchronize();

    return () => {
      image.removeEventListener('load', synchronize);
      image.removeEventListener('error', synchronize);
    };
  }, [src]);

  return {
    ref,
    state,
    ready: state === 'ready',
  } as const;
}
