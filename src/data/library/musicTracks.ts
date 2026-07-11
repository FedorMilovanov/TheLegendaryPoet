import { MusicTrack } from '../../types/poet';
import { siteConfig } from '../../config/site';

// NOTE: when real recordings are ready, add `audioUrl: '/audio/<file>.mp3'`
// (place the file in public/audio/) — the row then becomes a real player with
// a working download. Until then each track honestly links out to the channel.
export const musicTracks: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'Берёзы (музыка на стихи Есенина)',
    poet: 'Сергей Есенин',
    duration: '4:12',
    externalUrl: siteConfig.channels.rutube,
    description: 'Трогательная композиция о русской природе',
  },
  {
    id: 'track-2',
    title: 'Пророк (музыкальная декламация)',
    poet: 'Александр Пушкин',
    duration: '5:30',
    externalUrl: siteConfig.channels.youtube,
    description: 'Мощное прочтение знаменитого стихотворения под музыку',
  },
];
