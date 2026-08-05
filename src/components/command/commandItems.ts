import { getAllEssays } from '../../data/essays';
import { musicTracks, poets } from '../../data/poets';
export interface CommandItem { id: string; label: string; description: string; path: string; group: string; }
const baseItems: CommandItem[] = [
  { id: 'home', label: 'Главная', description: 'Обложка проекта', path: '/', group: 'Разделы' },
  { id: 'poets', label: 'Поэты', description: 'Каталог поэтов', path: '/poets', group: 'Разделы' },
  { id: 'ratings', label: 'Рейтинг поэтов', description: 'Сводная таблица оценок и комментариев читателей', path: '/ratings', group: 'Разделы' },
  { id: 'hall', label: 'Зал поэтов', description: 'Будущий иммерсивный пантеон', path: '/hall', group: 'Разделы' },
  { id: 'articles', label: 'Статьи', description: 'Материалы и анализы', path: '/articles', group: 'Разделы' },
  { id: 'music', label: 'Музыка', description: 'Официальные музыкальные публикации', path: '/music', group: 'Разделы' },
  { id: 'about', label: 'О проекте', description: 'Миссия и контакты', path: '/about', group: 'Разделы' },
];
export function getCommandItems(): CommandItem[] {
  const poetItems = poets.map((poet) => ({ id: `poet-${poet.id}`, label: poet.name, description: poet.fullName, path: `/poets/${poet.id}`, group: 'Поэты' }));
  /*
   * Search offers the published essays at /essays/<slug>.
   *
   * It must NOT offer the legacy `Article` records: `/articles/:id` is a
   * catch-all redirect back to the listing, so every one of those hits was a
   * dead end — a reader searching "Ахматова" found "Молитва Ахматовой" and
   * landed on the generic article index.
   */
  const essayItems = getAllEssays().map((essay) => ({ id: `essay-${essay.id}`, label: essay.title, description: essay.excerpt, path: `/essays/${essay.slug}`, group: 'Статьи' }));
  const trackItems = musicTracks.map((track) => ({ id: `track-${track.id}`, label: track.title, description: `${track.poet} · ${track.duration}`, path: `/music/${track.id}`, group: 'Музыка' }));
  return [...baseItems, ...poetItems, ...essayItems, ...trackItems];
}
