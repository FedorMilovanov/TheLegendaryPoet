import { essayMedia, type EssayMediaEntry } from '../../generated/essayMedia';
import type { EssayImageData } from '../../types/essay';
import { asset } from '../../utils/asset';

export interface ResolvedEssayMedia {
  entry?: EssayMediaEntry;
  fallback: string;
  avifSrcSet?: string;
  webpSrcSet?: string;
  placeholder?: string;
  width?: number;
  height?: number;
}

const essayMediaByFallback = new Map<string, EssayMediaEntry>(
  Object.values(essayMedia).map((entry) => [entry.fallback, entry]),
);

function srcSet(variants: EssayMediaEntry['avif']): string | undefined {
  if (variants.length === 0) return undefined;
  return variants.map((variant) => `${asset(variant.src)} ${variant.width}w`).join(', ');
}

function localSrcSet(path: string, format: 'avif' | 'webp'): string | undefined {
  const full = optimizedSibling(path, format);
  const small = optimizedSmallSibling(path, format);
  if (!full || !small) return undefined;
  return `${asset(small)} 640w, ${asset(full)} 1600w`;
}

export function getEssayMediaEntry(
  media: Pick<EssayImageData, 'src' | 'mediaKey'>,
): EssayMediaEntry | undefined {
  return (media.mediaKey ? essayMedia[media.mediaKey] : undefined) ?? essayMediaByFallback.get(media.src);
}

export function resolveEssayMedia(block: Pick<EssayImageData, 'src' | 'mediaKey'>): ResolvedEssayMedia {
  const entry = getEssayMediaEntry(block);
  if (!entry) {
    return {
      fallback: asset(block.src),
      avifSrcSet: localSrcSet(block.src, 'avif'),
      webpSrcSet: localSrcSet(block.src, 'webp'),
    };
  }

  return {
    entry,
    fallback: asset(entry.fallback),
    avifSrcSet: srcSet(entry.avif),
    webpSrcSet: srcSet(entry.webp),
    placeholder: entry.placeholder,
    width: entry.width,
    height: entry.height,
  };
}

export function optimizedSibling(path: string, format: 'avif' | 'webp'): string | undefined {
  if (/^https?:\/\//.test(path) || !/\.(?:jpe?g|png|webp)$/i.test(path)) return undefined;
  return path.replace(/\.(?:jpe?g|png|webp)$/i, `.${format}`);
}

export function optimizedSmallSibling(path: string, format: 'avif' | 'webp'): string | undefined {
  const sibling = optimizedSibling(path, format);
  return sibling?.replace(/\.(avif|webp)$/i, '-640.$1');
}
