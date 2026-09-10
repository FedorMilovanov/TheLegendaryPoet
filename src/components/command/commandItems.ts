import { essaySearchIndex } from '../../data/essaySearchIndex.generated';
import { musicTracks, poets } from '../../data/poets';

export interface CommandItem {
  id: string;
  label: string;
  description: string;
  path: string;
  group: string;
}

interface CommandPoemSource {
  id: string;
  title: string;
  year?: number;
}

interface CommandPoetSource {
  id: string;
  name: string;
  fullName: string;
  poems: readonly CommandPoemSource[];
}

interface CommandEssaySource {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
}

interface CommandTrackSource {
  id: string;
  title: string;
  poet: string;
  duration?: string;
}

export interface CommandSources {
  poets: readonly CommandPoetSource[];
  essays: readonly CommandEssaySource[];
  tracks: readonly CommandTrackSource[];
}

const baseItems: CommandItem[] = [
  { id: 'home', label: 'Главная', description: 'Обложка проекта', path: '/', group: 'Разделы' },
  { id: 'poets', label: 'Поэты', description: 'Каталог поэтов', path: '/poets', group: 'Разделы' },
  { id: 'ratings', label: 'Рейтинг поэтов', description: 'Сводная таблица оценок и комментариев читателей', path: '/ratings', group: 'Разделы' },
  { id: 'hall', label: 'Зал поэтов', description: 'Иммерсивный музейный раздел в разработке', path: '/hall', group: 'Разделы' },
  { id: 'articles', label: 'Статьи', description: 'Материалы и анализы', path: '/articles', group: 'Разделы' },
  { id: 'music', label: 'Музыка', description: 'Официальные музыкальные публикации', path: '/music', group: 'Разделы' },
  { id: 'about', label: 'О проекте', description: 'Миссия и контакты', path: '/about', group: 'Разделы' },
];

export function buildCommandItems({ poets: poetSources, essays, tracks }: CommandSources): CommandItem[] {
  const poetItems = poetSources.map((poet) => ({
    id: `poet-${poet.id}`,
    label: poet.name,
    description: poet.fullName,
    path: `/poets/${poet.id}`,
    group: 'Поэты',
  }));

  const poemItems = poetSources.flatMap((poet) => poet.poems.map((poem) => ({
    id: `poem-${poet.id}-${poem.id}`,
    label: poem.title,
    description: poem.year ? `${poet.name} · ${poem.year}` : poet.name,
    path: `/poets/${poet.id}#poem-${encodeURIComponent(poem.id)}`,
    group: 'Стихи',
  })));

  /*
   * Keep the persistent command palette lightweight. Importing the full essay
   * registry here pulled every longform block and source record into the entry
   * bundle. The generated index contains only reader-facing search metadata and
   * is verified against the canonical essay registry in CI.
   */
  const essayItems = essays.map((essay) => ({
    id: `essay-${essay.id}`,
    label: essay.title,
    description: essay.excerpt,
    path: `/essays/${essay.slug}`,
    group: 'Статьи',
  }));

  const trackItems = tracks.map((track) => ({
    id: `track-${track.id}`,
    label: track.title,
    description: track.duration ? `${track.poet} · ${track.duration}` : track.poet,
    path: `/music/${track.id}`,
    group: 'Музыка',
  }));

  return [...baseItems, ...poetItems, ...poemItems, ...essayItems, ...trackItems];
}

export function getCommandItems(): CommandItem[] {
  return buildCommandItems({ poets, essays: essaySearchIndex, tracks: musicTracks });
}
