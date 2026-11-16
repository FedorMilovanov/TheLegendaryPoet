import { ExternalLink } from 'lucide-react';
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
        <div className="mt-6 rounded-2xl border border-luxury-gold/15 bg-[#10100f] p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-luxury-gold">
            Музыкальные интерпретации
          </p>
          <div className="flex flex-wrap gap-3">
            {relatedMusic.map((track) => (
              <Link
                key={track.id}
                to={'/music/' + track.id + '/'}
                className="inline-flex min-h-11 items-center rounded-xl border border-luxury-gold/25 px-4 py-2 text-sm text-luxury-gray-light transition hover:border-luxury-gold/60 hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70"
              >
                {track.title}
              </Link>
            ))}
          </div>
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
