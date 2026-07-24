import { yeseninPartOneSourcesPassFourEarly } from './yeseninPartOneSourcesPassFourEarly';
import { yeseninPartOneSourcesPassFourMoscow } from './yeseninPartOneSourcesPassFourMoscow';
import { yeseninPartOneSourcesPassFourNetworks } from './yeseninPartOneSourcesPassFourNetworks';
import { yeseninPartOneSourcesPassFourBooks } from './yeseninPartOneSourcesPassFourBooks';
import { yeseninPartOneSourcesPassFourImagism } from './yeseninPartOneSourcesPassFourImagism';
import { yeseninPartOneSourcesPassFourDuncan } from './yeseninPartOneSourcesPassFourDuncan';

export const yeseninPartOneSourcesPassFour = [
  ...yeseninPartOneSourcesPassFourEarly,
  ...yeseninPartOneSourcesPassFourMoscow,
  ...yeseninPartOneSourcesPassFourNetworks,
  ...yeseninPartOneSourcesPassFourBooks,
  ...yeseninPartOneSourcesPassFourImagism,
  ...yeseninPartOneSourcesPassFourDuncan,
] as const;

export type YeseninPartOnePassFourSourceId =
  (typeof yeseninPartOneSourcesPassFour)[number]['id'];

export const yeseninPartOnePassFourClaimCoverage = {
  'YE1-002': ['ye1-ekaterina-yesenina-konstantinovo', 'ye1-sardanovsky-youth-memoir', 'ye1-self-note-o-sebe'],
  'YE1-006': ['ye1-letter-panfilov-aug-1912', 'ye1-letter-panfilov-nov-1912', 'ye1-pss-v1-comments'],
  'YE1-007': ['ye1-moscow-appendix-1912-1915', 'ye1-letter-panfilov-sep-1913', 'ye1-letter-balzamova-sep-1913'],
  'YE1-015': ['ye1-gift-inscriptions', 'ye1-neb-yesenin-collection', 'ye1-goluben-first-edition-neb'],
  'YE1-016': ['ye1-tsarskoye-selo-appendix', 'ye1-tsarskoye-selo-appendix-text'],
  'YE1-022': ['ye1-preobrazhenie-first-edition-neb', 'ye1-klyuchi-marii-first-edition-neb', 'ye1-iordanskaya-golubitsa-neb'],
  'YE1-023': ['ye1-plavilnya-slov-neb', 'ye1-mariengof-memoir', 'ye1-ivnev-memoir', 'ye1-kirillov-memoir'],
  'YE1-027': ['ye1-konenkov-memoir', 'ye1-schneider-memoir-commentary', 'ye1-nypl-isadora-programs', 'ye1-letter-schneider-june-1922'],
} as const;
