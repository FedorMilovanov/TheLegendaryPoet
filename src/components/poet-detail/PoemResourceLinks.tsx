import { ExternalLink, Play } from 'lucide-react';
import type { Poem } from '../../types/poet';
import { musicTracks } from '../../data/poets';
import { Link } from '../ui/Link';

interface PoemResourceLinksProps {
  poem: Poem;
}

/** Optional edition/music navigation: fetched only for poems that have references. */
export default function PoemResourceLinks({ poem }: PoemResourceLinksProps) {
  const relatedMusic = musicTracks.filter((track) => poem.relatedMusicTrackIds?.includes(track.id));
  return (
    <>
      {relatedMusic.length > 0 && (
        <div className="mt-6 rounded-2xl border border-luxury-gold/15 bg-[#10100f] p-3 sm:p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#e7c873]">
            Музыкальные интерпретации
          </p>
          {relatedMusic.length === 1 && relatedMusic[0].wideCoverUrl ? (
            <Link
              to={'/music/' + relatedMusic[0].id + '/'}
              className="group block overflow-hidden rounded-xl border border-[#e7c873]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7c873]"
            >
              <img
                src={relatedMusic[0].wideCoverUrl}
                alt=""
                loading="lazy"
                decoding="async"
                width={1600}
                height={900}
                className="block aspect-video w-full object-contain bg-[#0b1824]"
              />
              <div className="min-w-0 bg-[#10100f] p-3 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#e7c873]/50 text-[#e7c873]" aria-hidden="true"><Play size={19} fill="currentColor" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#e7c873]">Слушать · {relatedMusic[0].duration}</p>
                    <p className="mt-1 [overflow-wrap:anywhere] text-base font-semibold leading-snug text-[#f3f4f6] group-hover:text-[#f4da95]">{relatedMusic[0].title}</p>
                  </div>
                </div>
                <p className="mt-3 [overflow-wrap:anywhere] text-sm leading-relaxed text-[#c9c9c9]">{relatedMusic[0].description}</p>
              </div>
            </Link>
          ) : (
          <div className="flex flex-wrap gap-3">
            {relatedMusic.map((track) => (
              <Link
                key={track.id}
                to={'/music/' + track.id + '/'}
                className="inline-flex min-h-11 items-center rounded-xl border border-[#e7c873]/30 px-4 py-2 text-sm text-[#e5e7eb] transition hover:border-[#e7c873]/70 hover:text-[#f4da95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7c873]"
              >
                {track.title}
              </Link>
            ))}
          </div>
          )}
        </div>
      )}
      {poem.sourceUrl && (
        <a
          href={poem.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-luxury-gold underline decoration-luxury-gold/40 underline-offset-4 transition hover:decoration-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70"
        >
          Источник текста <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}

    </>
  );
}
