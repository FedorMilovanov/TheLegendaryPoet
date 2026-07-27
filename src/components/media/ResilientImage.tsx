import { useEffect, useMemo, useRef, useState, type ImgHTMLAttributes, type SyntheticEvent } from 'react';
import { useNativeImageState } from '../../hooks/useNativeImageState';
import { asset } from '../../utils/asset';

const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

export type ImageLoadState = 'loading' | 'loaded' | 'fallback' | 'failed';

export interface ResilientImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onLoad' | 'onError'> {
  src?: string;
  fallbackSrc?: string;
  priority?: boolean;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onFinalError?: () => void;
  onStateChange?: (state: ImageLoadState) => void;
}

function resolveSource(source: string) {
  if (/^(?:data:|blob:|https?:\/\/|\/\/)/i.test(source)) return source;
  return asset(source);
}

/**
 * Native image element with deterministic local-asset resolution and a finite
 * source fallback chain. Readiness comes from the shared native lifecycle hook,
 * so eager or cached images cannot remain stuck in `loading` when a synthetic
 * React event is delivered before or during hydration.
 */
export default function ResilientImage({
  src,
  fallbackSrc,
  priority = false,
  loading,
  decoding = 'async',
  fetchPriority,
  draggable,
  onLoad,
  onError,
  onFinalError,
  onStateChange,
  ...props
}: ResilientImageProps) {
  const candidates = useMemo(() => {
    const sources = [src, fallbackSrc]
      .filter((source): source is string => Boolean(source?.trim()))
      .map(resolveSource);
    return [...new Set(sources)];
  }, [fallbackSrc, src]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const [terminalFailure, setTerminalFailure] = useState(candidates.length === 0);
  const finalErrorReportedRef = useRef(false);

  useEffect(() => {
    setSourceIndex(0);
    setTerminalFailure(candidates.length === 0);
    finalErrorReportedRef.current = false;
  }, [candidates]);

  const hasActiveCandidate = !terminalFailure && sourceIndex < candidates.length;
  const currentSrc = hasActiveCandidate ? candidates[sourceIndex] : TRANSPARENT_PIXEL;
  const { ref, state: nativeState } = useNativeImageState(currentSrc);

  const state: ImageLoadState = !hasActiveCandidate
    ? 'failed'
    : nativeState === 'ready'
      ? (sourceIndex > 0 ? 'fallback' : 'loaded')
      : 'loading';

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

  useEffect(() => {
    if (!hasActiveCandidate || nativeState !== 'error') return;

    if (sourceIndex + 1 < candidates.length) {
      setSourceIndex((index) => index + 1);
      return;
    }

    setTerminalFailure(true);
    if (!finalErrorReportedRef.current) {
      finalErrorReportedRef.current = true;
      onFinalError?.();
    }
  }, [candidates.length, hasActiveCandidate, nativeState, onFinalError, sourceIndex]);

  return (
    <img
      {...props}
      ref={ref}
      src={currentSrc}
      loading={priority ? 'eager' : (loading ?? 'lazy')}
      decoding={decoding}
      fetchPriority={priority ? 'high' : (fetchPriority ?? 'auto')}
      draggable={draggable ?? false}
      data-image-state={state}
      data-image-source-index={hasActiveCandidate ? sourceIndex : undefined}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
