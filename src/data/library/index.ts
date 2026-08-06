import type { Poet } from '../../types/poet';
import { fyodorTyutchev } from './fyodorTyutchev';
import { vladimirMayakovsky } from './vladimirMayakovsky';
import { alexanderPushkin } from './alexanderPushkin';
import { mikhailLermontov } from './mikhailLermontov';
import { borisPasternak } from './borisPasternak';
import { afanasyFet } from './afanasyFet';
import { nikolayGumilev } from './nikolayGumilev';
import { sergeiYesenin } from './sergeiYesenin';
import { annaAkhmatova } from './annaAkhmatova';
import { alexanderBlok } from './alexanderBlok';
import { editorialPortraitOverrides } from './editorialPortraitOverrides';

const sourcePoets: Poet[] = [
  fyodorTyutchev,
  vladimirMayakovsky,
  alexanderPushkin,
  mikhailLermontov,
  borisPasternak,
  afanasyFet,
  nikolayGumilev,
  sergeiYesenin,
  annaAkhmatova,
  alexanderBlok,
];

export const poets: Poet[] = sourcePoets.map((poet) => {
  const editorialOverride = editorialPortraitOverrides[poet.id];
  return editorialOverride ? { ...poet, ...editorialOverride } : poet;
});

export { allMusicTracks, musicTracks } from './musicTracks';
