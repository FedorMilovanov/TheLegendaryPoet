import { getAllEssays } from '../../data/essays';
import { getAllArticles } from '../../utils/articleLibrary';
import { musicTracks, poets } from '../../data/poets';

export interface CommandItem {
  id: string;
  label: string;
  description: string;
  path: string;
  group: string;
}

const baseItems: CommandItem[] = [
  { id: 'home', label: 'Главная', description: 'Обложка проекта', path: '/', group: 'Разделы' },
  { id: 'poets', label: 'Поэты', description: 'Каталог поэтов', path: '/poets', group: 'Разделы' },
  { id: 'articles', label: 'Статьи', description: 'Материалы и анализы', path: '/articles', group: 'Разделы' },
  { id: 'music', label: 'Музыка', description: 'Аудио и интерпретации', path: '/music', group: 'Разделы' },
  { id: 'about', label: 'О проекте', description: 'Миссия и контакты', path: '/about', group: 'Разделы' },
];

export function getCommandItems(): CommandItem[] {
  const poetItems = poets.map((poet) => ({
    id: `poet-${poet.id}`,
    label: poet.name,
    description: poet.fullName,
    path: `/poets/${poet.id}`,
    group: 'Поэты',
  }));

  const essayItems = getAllEssays().map((essay) => ({
    id: `essay-${essay.id}`,
    label: essay.title,
    description: essay.excerpt,
    path: `/essays/${essay.slug}`,
    group: 'Лонгриды',
  }));

  const articleItems = getAllArticles().map((article) => ({
    id: `article-${article.id}`,
    label: article.title,
    description: article.excerpt,
    path: `/articles/${article.id}`,
    group: 'Статьи',
  }));

  const trackItems = musicTracks.map((track) => ({
    id: `track-${track.id}`,
    label: track.title,
    description: `${track.poet} · ${track.duration}`,
    path: '/music',
    group: 'Музыка',
  }));

  return [...baseItems, ...poetItems, ...essayItems, ...articleItems, ...trackItems];
}
