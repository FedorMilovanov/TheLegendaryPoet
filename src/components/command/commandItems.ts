import { essaySearchIndex } from '../../data/essaySearchIndex.generated';
import { musicTracks, poets } from '../../data/poets';
import routeContract from '../../routes/route-contract.json';

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

type CommandEssaySectionSource = readonly [heading: string, anchor: string];

interface CommandEssaySource {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  sections: readonly CommandEssaySectionSource[];
}

interface CommandTrackSource {
  id: string;
  title: string;
  poet: string;
  duration?: string;
}

export interface CommandRouteSource {
  id: string;
  path: string;
}

export interface CommandSectionPresentation {
  label: string;
  description: string;
}

export const commandSectionPresentations = {
  home: { label: 'Главная', description: 'Обложка проекта' },
  hall: { label: 'Зал поэтов', description: 'Иммерсивный музейный раздел в разработке' },
  poets: { label: 'Поэты', description: 'Каталог поэтов' },
  ratings: { label: 'Рейтинг поэтов', description: 'Сводная таблица оценок и комментариев читателей' },
  articles: { label: 'Статьи', description: 'Материалы и анализы' },
  music: { label: 'Музыка', description: 'Официальные музыкальные публикации' },
  about: { label: 'О проекте', description: 'Миссия и контакты' },
  'editorial-policy': { label: 'Редакционная политика', description: 'Принципы редакционной работы и источников' },
  privacy: { label: 'Конфиденциальность', description: 'Политика данных и настройки согласия' },
  archive: { label: 'Мой архив', description: 'Сохранённые материалы этого браузера' },
} as const satisfies Readonly<Record<string, CommandSectionPresentation>>;

export interface CommandSources {
  poets: readonly CommandPoetSource[];
  essays: readonly CommandEssaySource[];
  tracks: readonly CommandTrackSource[];
  routes?: readonly CommandRouteSource[];
  sectionPresentations?: Readonly<Record<string, CommandSectionPresentation>>;
}

function isStaticCommandRoute(route: CommandRouteSource): boolean {
  return route.path !== '*' && !route.path.includes(':');
}

export function buildSectionCommandItems(
  routes: readonly CommandRouteSource[],
  presentations: Readonly<Record<string, CommandSectionPresentation>>,
): CommandItem[] {
  const staticRoutes = routes.filter(isStaticCommandRoute);
  const routeIds = staticRoutes.map((route) => route.id);
  const routeIdSet = new Set(routeIds);
  const presentationIds = Object.keys(presentations);
  const missing = routeIds.filter((id) => !presentations[id]);
  const extra = presentationIds.filter((id) => !routeIdSet.has(id));

  if (routeIdSet.size !== routeIds.length) {
    throw new Error('Command route contract contains duplicate static route ids');
  }
  if (missing.length || extra.length) {
    throw new Error(`Command section presentation drift: missing=[${missing.join(',')}], extra=[${extra.join(',')}]`);
  }

  return staticRoutes.map((route) => ({
    id: route.id,
    label: presentations[route.id].label,
    description: presentations[route.id].description,
    path: route.path,
    group: 'Разделы',
  }));
}

export function buildCommandItems({
  poets: poetSources,
  essays,
  tracks,
  routes = routeContract.routes,
  sectionPresentations = commandSectionPresentations,
}: CommandSources): CommandItem[] {
  const sectionItems = buildSectionCommandItems(routes, sectionPresentations);

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
   * registry here would pull every longform block and source record into the
   * entry bundle. The generated index contains only reader-facing essay and
   * section metadata and is parity-validated against the canonical registry.
   */
  const essayItems = essays.map((essay) => ({
    id: `essay-${essay.id}`,
    label: essay.title,
    description: essay.excerpt,
    path: `/essays/${essay.slug}`,
    group: 'Статьи',
  }));

  const essaySectionItems = essays.flatMap((essay) => essay.sections.map(([heading, anchor]) => ({
    id: `essay-section-${essay.id}-${anchor}`,
    label: heading,
    description: essay.title,
    path: `/essays/${essay.slug}#${encodeURIComponent(anchor)}`,
    group: 'Разделы статей',
  })));

  const trackItems = tracks.map((track) => ({
    id: `track-${track.id}`,
    label: track.title,
    description: track.duration ? `${track.poet} · ${track.duration}` : track.poet,
    path: `/music/${track.id}`,
    group: 'Музыка',
  }));

  return [...sectionItems, ...poetItems, ...poemItems, ...essayItems, ...essaySectionItems, ...trackItems];
}

export function getCommandItems(): CommandItem[] {
  return buildCommandItems({ poets, essays: essaySearchIndex, tracks: musicTracks });
}
