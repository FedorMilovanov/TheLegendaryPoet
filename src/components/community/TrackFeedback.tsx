import { MusicTrack } from '../../types/poet';
import { trackRatingDimensions } from '../../data/ratingDimensions';
import CommunityPanel from './CommunityPanel';

interface TrackFeedbackProps {
  track: MusicTrack;
}

export default function TrackFeedback({ track }: TrackFeedbackProps) {
  return (
    <CommunityPanel
      compact
      targetType="track"
      targetId={track.id}
      title={`Оценка трека: ${track.title}`}
      dimensions={trackRatingDimensions}
    />
  );
}