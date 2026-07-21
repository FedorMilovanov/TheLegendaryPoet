import { Poet } from '../../types/poet';
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
import { applyLibraryLiteraryPolish } from './libraryLiteraryPolish';

export const poets: Poet[] = [
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
].map(applyLibraryLiteraryPolish);

export { articles } from './articles';
export { musicTracks } from './musicTracks';
