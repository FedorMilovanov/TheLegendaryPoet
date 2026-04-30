import { MusicTrack } from '../../types/poet';
import TrackRow from './TrackRow';

interface TrackListProps {
  tracks: MusicTrack[];
}

export default function TrackList({ tracks }: TrackListProps) {
  return (
    <div className="space-y-4">
      {tracks.map((track, index) => (
        <TrackRow key={track.id} track={track} index={index} />
      ))}
    </div>
  );
}