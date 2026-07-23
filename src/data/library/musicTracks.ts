import type { MusicTrack } from '../../types/poet';
import { getPublishedMusicTracks } from '../musicCatalog';
import { blokRossiyaWaveform, pushkinTuchaWaveform, yeseninYaUstalymWaveform } from '../musicWaveforms';

const standardRights = '© 2026 The Legendary Poet. Права на музыкальную версию и мастер защищены. Текст стихотворения находится в общественном достоянии. Повторная загрузка и коммерческое распространение мастер-файла без разрешения запрещены.';

export const allMusicTracks = [
  {
    id: 'yesenin-ya-ustalym-takim-eshche-ne-byl',
    title: 'Я усталым таким ещё не был',
    poet: 'Сергей Есенин',
    poetId: 'sergei-yesenin',
    availability: 'published',
    releaseOrder: 10,
    publishedAt: '2026-07-23',
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
    rightsNotice: standardRights,
    audioSha256: '2f5b7c0a9b83be4685d0d83728e5896c8adde78b75b46dad361eddfb28356381',
    waveform: yeseninYaUstalymWaveform,
    theme: {
      accent: '#d7a84b',
      secondary: '#577f72',
      surface: '#0b1210',
      heroPosition: '50% center',
    },
  },
  {
    id: 'pushkin-tucha',
    title: 'Туча',
    poet: 'Александр Пушкин',
    poetId: 'alexander-pushkin',
    availability: 'published',
    releaseOrder: 20,
    publishedAt: '2026-07-23',
    duration: '4:24',
    durationSeconds: 263.904,
    audioUrl: '/audio/pushkin-tucha.tlp-2026.mp3',
    coverUrl: '/images/music/pushkin-tucha-cover.webp',
    wideCoverUrl: '/images/music/pushkin-tucha-wide.webp',
    description: 'Грозовая электронно-симфоническая интерпретация пушкинской «Тучи»: от напряжения последней бури к ясному, освобождённому небу.',
    releaseYear: 2026,
    credits: [
      'Слова — Александр Пушкин, «Туча» (1835)',
      'Музыкальная интерпретация и мастер — The Legendary Poet',
      'Создано с использованием генеративных музыкальных технологий',
    ],
    rightsNotice: standardRights,
    audioSha256: '1d4f77fb01ccd31a4fe8934281fc7771157b7f9a0373529ca97ad0aafa86ff30',
    waveform: pushkinTuchaWaveform,
    theme: {
      accent: '#8e82ff',
      secondary: '#39bde8',
      surface: '#080a19',
      heroPosition: '52% center',
    },
  },
  {
    id: 'blok-rossiya',
    title: 'Россия',
    poet: 'Александр Блок',
    poetId: 'alexander-blok',
    availability: 'published',
    releaseOrder: 30,
    publishedAt: '2026-07-23',
    duration: '4:18',
    durationSeconds: 257.664,
    audioUrl: '/audio/blok-rossiya.tlp-2026.mp3',
    coverUrl: '/images/music/blok-rossiya-cover.webp',
    wideCoverUrl: '/images/music/blok-rossiya-wide.webp',
    description: 'Тёмная атмосферная версия блоковской «России», в которой дорожная тоска, бедность и любовь к родине проходят через электронный шум и кинематографический размах.',
    releaseYear: 2026,
    credits: [
      'Слова — Александр Блок, «Россия» (1908)',
      'Музыкальная интерпретация и мастер — The Legendary Poet',
      'Создано с использованием генеративных музыкальных технологий',
    ],
    rightsNotice: standardRights,
    audioSha256: 'feb6d1607278fce8621000a542e76e075cca5a6b44cf63c0a9db67603b943c9d',
    waveform: blokRossiyaWaveform,
    theme: {
      accent: '#87b9c8',
      secondary: '#9d5d64',
      surface: '#0b1115',
      heroPosition: '50% center',
    },
  },
] satisfies readonly MusicTrack[];

/** Published entries only. This is the list passed into the persistent audio runtime. */
export const musicTracks = getPublishedMusicTracks(allMusicTracks);
