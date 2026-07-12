export type VisualArchetype =
  | 'classical-marble-bust'
  | 'bronze-monument'
  | 'silver-age-glass'
  | 'futurist-fragmented'
  | 'tragic-shadow'
  | 'archive-hologram';

export type MonumentMaterial = 'marble' | 'bronze' | 'black-stone' | 'glass' | 'mixed';

export type PoetSymbol =
  | 'laurel' | 'book' | 'quill' | 'cross' | 'moon'
  | 'city' | 'village' | 'duel' | 'revolution' | 'candle' | 'manuscript';

export interface PoetMuseumMeta {
  id: string;
  visualArchetype: VisualArchetype;
  material: MonumentMaterial;
  mainQuote: string;
  symbols: PoetSymbol[];
  monumentScale: number;
  accentColor?: string;
}

export const poetMuseumMeta: Record<string, PoetMuseumMeta> = {
  'alexander-pushkin': {
    id: 'alexander-pushkin',
    visualArchetype: 'classical-marble-bust',
    material: 'marble',
    mainQuote: 'Глаголом жги сердца людей',
    symbols: ['laurel', 'quill', 'duel', 'book'],
    monumentScale: 1.15,
    accentColor: '#d4af37',
  },
  'mikhail-lermontov': {
    id: 'mikhail-lermontov',
    visualArchetype: 'classical-marble-bust',
    material: 'marble',
    mainQuote: 'И скучно и грустно, и некому руку подать',
    symbols: ['duel', 'moon', 'manuscript'],
    monumentScale: 1.08,
    accentColor: '#94a3b8',
  },
  'fyodor-tyutchev': {
    id: 'fyodor-tyutchev',
    visualArchetype: 'bronze-monument',
    material: 'bronze',
    mainQuote: 'Мысль изреченная есть ложь',
    symbols: ['book', 'moon', 'cross'],
    monumentScale: 1.0,
    accentColor: '#2ed8ff',
  },
  'afanasy-fet': {
    id: 'afanasy-fet',
    visualArchetype: 'bronze-monument',
    material: 'bronze',
    mainQuote: 'Шепот, робкое дыханье...',
    symbols: ['quill', 'candle', 'moon'],
    monumentScale: 0.95,
    accentColor: '#48bb78',
  },
  'nikolay-gumilev': {
    id: 'nikolay-gumilev',
    visualArchetype: 'silver-age-glass',
    material: 'glass',
    mainQuote: 'Далеко, далеко, на озере Чад изысканный бродит жираф',
    symbols: ['book', 'cross', 'manuscript'],
    monumentScale: 1.02,
    accentColor: '#12cced',
  },
  'anna-akhmatova': {
    id: 'anna-akhmatova',
    visualArchetype: 'tragic-shadow',
    material: 'black-stone',
    mainQuote: 'Я была тогда с моим народом, там, где мой народ, к несчастью, был',
    symbols: ['cross', 'candle', 'manuscript'],
    monumentScale: 1.1,
    accentColor: '#818cf8',
  },
  'vladimir-mayakovsky': {
    id: 'vladimir-mayakovsky',
    visualArchetype: 'futurist-fragmented',
    material: 'mixed',
    mainQuote: 'Послушайте! Ведь, если звезды зажигают — значит — это кому-нибудь нужно?',
    symbols: ['city', 'revolution', 'manuscript'],
    monumentScale: 1.18,
    accentColor: '#ef4444',
  },
  'sergei-yesenin': {
    id: 'sergei-yesenin',
    visualArchetype: 'bronze-monument',
    material: 'bronze',
    mainQuote: 'Не жалею, не зову, не плачу',
    symbols: ['village', 'book', 'candle'],
    monumentScale: 1.0,
    accentColor: '#f59e0b',
  },
  'boris-pasternak': {
    id: 'boris-pasternak',
    visualArchetype: 'archive-hologram',
    material: 'glass',
    mainQuote: 'Жизнь прожить — не поле перейти',
    symbols: ['book', 'candle', 'cross', 'manuscript'],
    monumentScale: 1.05,
    accentColor: '#7dd3fc',
  },
  'alexander-blok': {
    id: 'alexander-blok',
    visualArchetype: 'silver-age-glass',
    material: 'glass',
    mainQuote: 'Ночь, улица, фонарь, аптека…',
    symbols: ['city', 'candle', 'cross', 'revolution'],
    monumentScale: 1.12,
    accentColor: '#9a13ed',
  },
};