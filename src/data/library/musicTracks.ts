import { MusicTrack } from '../../types/poet';
import { yeseninYaUstalymWaveform } from '../musicWaveforms';

export const musicTracks: MusicTrack[] = [
  {
    id: 'yesenin-ya-ustalym-takim-eshche-ne-byl',
    title: 'Я усталым таким ещё не был',
    poet: 'Сергей Есенин',
    poetId: 'sergei-yesenin',
    duration: '4:40',
    durationSeconds: 280.241633,
    audioUrl: '/audio/yesenin-ya-ustalym-takim-eshche-ne-byl.tlp-2026.mp3',
    coverUrl: '/images/music/yesenin-ya-ustalym-cover.webp',
    wideCoverUrl: '/images/music/yesenin-ya-ustalym-wide.webp',
    description: 'Первая официальная музыкальная публикация проекта — тёмная кинематографическая интерпретация исповедальной лирики Сергея Есенина.',
    releaseYear: 2026,
    featured: true,
    credits: [
      'Слова — Сергей Есенин',
      'Музыкальная интерпретация и мастер — The Legendary Poet',
      'Создано с использованием генеративных музыкальных технологий',
    ],
    rightsNotice: '© 2026 The Legendary Poet. Права на музыкальную версию и мастер защищены. Повторная загрузка и коммерческое распространение без разрешения запрещены.',
    audioSha256: '2f5b7c0a9b83be4685d0d83728e5896c8adde78b75b46dad361eddfb28356381',
    waveform: yeseninYaUstalymWaveform,
  },
];
