import { MusicTrack } from '../../types/poet';
import TrackFeedback from '../community/TrackFeedback';

interface TrackFeedbackSectionProps {
  tracks: MusicTrack[];
}

export default function TrackFeedbackSection({ tracks }: TrackFeedbackSectionProps) {
  return (
    <section className="mt-12 space-y-6">
      <h2 className="font-serif text-3xl font-bold text-white">
        Оценка <span className="neon-blue-gradient neon-glow-text">треков</span>
      </h2>
      <div className="space-y-6">
        {tracks.map((track) => (
          <TrackFeedback key={track.id} track={track} />
        ))}
      </div>
    </section>
  );
}