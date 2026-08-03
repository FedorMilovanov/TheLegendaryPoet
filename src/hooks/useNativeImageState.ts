import { useEffect, useRef, useState } from 'react';

export type NativeImageState = 'loading' | 'ready' | 'error';

type NativeImageSnapshot = {
  src: string;
  state: NativeImageState;
};

const IMAGE_PRELOAD_MARGIN_PX = 360;

/**
 * Tracks the browser's native image lifecycle without relying exclusively on
 * React's synthetic events. Cached, eager or prerendered images may already be
 * complete before hydration attaches handlers, so each source is synchronized
 * from `complete` and `naturalWidth` after native listeners are installed.
 *
 * Safari/WebKit can leave a native lazy image dormant when a transformed or
 * revealed ancestor crosses the viewport. A small standards-based observer
 * promotes only images that actually approach the viewport and asks the native
 * decoder to settle them. This preserves lazy loading for the rest of the page
 * while preventing a permanently transparent image frame.
 */
export function useNativeImageState(src: string) {
  const ref = useRef<HTMLImageElement>(null);
  const [snapshot, setSnapshot] = useState<NativeImageSnapshot>({ src, state: 'loading' });

  useEffect(() => {
    const image = ref.current;
    let active = true;
    let observer: IntersectionObserver | undefined;
    let promoted = false;

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
      observer?.disconnect();
      publish(image.naturalWidth > 0 ? 'ready' : 'error');
    };

    const promoteVisibleImage = () => {
      if (promoted || image.complete) {
        synchronize();
        return;
      }
      promoted = true;
      observer?.disconnect();

      // Changing the native loading mode after the image enters the preload
      // margin is supported by current engines and wakes WebKit's deferred
      // request without reassigning `src` or creating a second network fetch.
      image.loading = 'eager';
      const decoding = image.decode?.();
      if (decoding) {
        void decoding.then(synchronize, synchronize);
      }
    };

    image.addEventListener('load', synchronize);
    image.addEventListener('error', synchronize);
    synchronize();

    if (!image.complete) {
      const rect = image.getBoundingClientRect();
      const nearViewport =
        rect.bottom >= -IMAGE_PRELOAD_MARGIN_PX &&
        rect.top <= window.innerHeight + IMAGE_PRELOAD_MARGIN_PX;

      if (nearViewport || typeof IntersectionObserver === 'undefined') {
        promoteVisibleImage();
      } else {
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
              promoteVisibleImage();
            }
          },
          { rootMargin: `${IMAGE_PRELOAD_MARGIN_PX}px 0px` },
        );
        observer.observe(image);
      }
    }

    return () => {
      active = false;
      observer?.disconnect();
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
