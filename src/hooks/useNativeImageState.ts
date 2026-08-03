import { useEffect, useRef, useState } from 'react';

export type NativeImageState = 'loading' | 'ready' | 'error';

type NativeImageSnapshot = {
  src: string;
  state: NativeImageState;
};

const IMAGE_PRELOAD_MARGIN_PX = 360;
const IMAGE_PROXIMITY_POLL_MS = 250;

/**
 * Tracks the browser's native image lifecycle without relying exclusively on
 * React's synthetic events. Cached, eager or prerendered images may already be
 * complete before hydration attaches handlers, so each source is synchronized
 * from `complete` and `naturalWidth` after native listeners are installed.
 *
 * Safari/WebKit can leave a native lazy image dormant when a transformed or
 * revealed ancestor crosses the viewport. IntersectionObserver remains the
 * primary signal, while captured scroll/resize events and a low-frequency
 * geometry check form a bounded independent path. Once an image approaches the
 * viewport, its still-dormant request is restarted exactly once after switching
 * to eager mode. This preserves lazy loading for distant images and prevents a
 * permanently transparent article frame in WebKit.
 */
export function useNativeImageState(src: string) {
  const ref = useRef<HTMLImageElement>(null);
  const [snapshot, setSnapshot] = useState<NativeImageSnapshot>({ src, state: 'loading' });

  useEffect(() => {
    const image = ref.current;
    let active = true;
    let observer: IntersectionObserver | undefined;
    let proximityTimer: number | undefined;
    let restartFrame: number | undefined;
    let promoted = false;
    let restartingRequest = false;

    const publish = (state: NativeImageState) => {
      if (!active) return;
      setSnapshot((current) => (
        current.src === src && current.state === state ? current : { src, state }
      ));
    };

    publish('loading');
    if (!image) return () => { active = false; };

    const stopProximityChecks = () => {
      observer?.disconnect();
      observer = undefined;
      if (proximityTimer !== undefined) {
        window.clearInterval(proximityTimer);
        proximityTimer = undefined;
      }
      document.removeEventListener('scroll', checkProximity, true);
      window.removeEventListener('resize', checkProximity);
      window.removeEventListener('orientationchange', checkProximity);
      window.removeEventListener('pageshow', checkProximity);
      window.visualViewport?.removeEventListener('resize', checkProximity);
      document.removeEventListener('visibilitychange', checkProximity);
    };

    const synchronize = () => {
      if (!image.complete) {
        publish('loading');
        return;
      }
      if (image.naturalWidth > 0) {
        stopProximityChecks();
        publish('ready');
        return;
      }
      if (!restartingRequest) {
        stopProximityChecks();
        publish('error');
      }
    };

    const handleLoad = () => synchronize();
    const handleError = () => {
      if (!restartingRequest) synchronize();
    };

    const restartDormantRequestAsEager = () => {
      if (promoted || image.complete) {
        synchronize();
        return;
      }

      promoted = true;
      stopProximityChecks();
      image.loading = 'eager';

      const requestedSrc = image.getAttribute('src') || src;
      restartingRequest = true;
      image.removeAttribute('src');

      // Reattach on the next frame so WebKit observes an eager image before it
      // receives the source. The URL is unchanged, so an already-started or
      // cached resource remains reusable and no alternate asset is introduced.
      restartFrame = window.requestAnimationFrame(() => {
        restartFrame = undefined;
        if (!active) return;
        image.loading = 'eager';
        image.setAttribute('src', requestedSrc);
        restartingRequest = false;

        if (image.complete) {
          synchronize();
          return;
        }

        const decoding = image.decode?.();
        if (decoding) {
          void decoding.then(synchronize, () => {
            if (image.complete) synchronize();
          });
        }
      });
    };

    function checkProximity() {
      if (!active || promoted) return;
      if (image.complete) {
        synchronize();
        return;
      }

      const rect = image.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const nearViewport =
        rect.bottom >= -IMAGE_PRELOAD_MARGIN_PX &&
        rect.top <= viewportHeight + IMAGE_PRELOAD_MARGIN_PX;

      if (nearViewport) restartDormantRequestAsEager();
    }

    image.addEventListener('load', handleLoad);
    image.addEventListener('error', handleError);
    synchronize();

    if (!image.complete) {
      document.addEventListener('scroll', checkProximity, { capture: true, passive: true });
      window.addEventListener('resize', checkProximity, { passive: true });
      window.addEventListener('orientationchange', checkProximity, { passive: true });
      window.addEventListener('pageshow', checkProximity, { passive: true });
      window.visualViewport?.addEventListener('resize', checkProximity, { passive: true });
      document.addEventListener('visibilitychange', checkProximity);
      proximityTimer = window.setInterval(checkProximity, IMAGE_PROXIMITY_POLL_MS);

      if (typeof IntersectionObserver === 'undefined') {
        checkProximity();
      } else {
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
              restartDormantRequestAsEager();
            }
          },
          { rootMargin: `${IMAGE_PRELOAD_MARGIN_PX}px 0px` },
        );
        observer.observe(image);
        checkProximity();
      }
    }

    return () => {
      active = false;
      stopProximityChecks();
      if (restartFrame !== undefined) window.cancelAnimationFrame(restartFrame);
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };
  }, [src]);

  const state = snapshot.src === src ? snapshot.state : 'loading';

  return {
    ref,
    state,
    ready: state === 'ready',
  } as const;
}
