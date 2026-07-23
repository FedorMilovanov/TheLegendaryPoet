import { useEffect, useMemo, useState, type ImgHTMLAttributes, type SyntheticEvent } from 'react';
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
 * Native image element with a deterministic local-asset resolver, optional
 * fallback source, source-change reset and honest terminal failure state.
 * Parents keep full control of aspect ratio and visual fallback surfaces.
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
  const [state, setState] = useState<ImageLoadState>(candidates.length > 0 ? 'loading' : 'failed');

  useEffect(() => {
    setSourceIndex(0);
    setState(candidates.length > 0 ? 'loading' : 'failed');
  }, [candidates]);

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

  const currentSrc = state === 'failed'
    ? TRANSPARENT_PIXEL
    : candidates[sourceIndex] ?? TRANSPARENT_PIXEL;

  return (
    <img
      {...props}
      src={currentSrc}
      loading={priority ? 'eager' : (loading ?? 'lazy')}
      decoding={decoding}
      fetchPriority={priority ? 'high' : (fetchPriority ?? 'auto')}
      draggable={draggable ?? false}
      data-image-state={state}
      onLoad={(event) => {
        if (state !== 'failed') setState(sourceIndex > 0 ? 'fallback' : 'loaded');
        onLoad?.(event);
      }}
      onError={(event) => {
        onError?.(event);
        if (sourceIndex + 1 < candidates.length) {
          setSourceIndex((index) => index + 1);
          setState('loading');
          return;
        }
        setState('failed');
        onFinalError?.();
      }}
    />
  );
}
