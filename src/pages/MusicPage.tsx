import { musicTracks } from '../data/poets';
import MusicFutureNote from '../components/music/MusicFutureNote';
import MusicHero from '../components/music/MusicHero';
import MusicIntro from '../components/music/MusicIntro';
import TrackFeedbackSection from '../components/music/TrackFeedbackSection';
import TrackList from '../components/music/TrackList';

export default function MusicPage() {
  return (
    <div className="min-h-screen pb-20 pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MusicHero />
        <MusicIntro />
        <TrackList tracks={musicTracks} />
        <TrackFeedbackSection tracks={musicTracks} />
        <MusicFutureNote />
      </div>
    </div>
  );
}