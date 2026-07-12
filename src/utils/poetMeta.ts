import { Poet } from '../types/poet';

export function getPoetInitials(poet: Poet) {
  if (poet.initials) return poet.initials;
  return poet.name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getPoetEpoch(poet: Poet) {
  if (poet.epoch) return poet.epoch;
  if (poet.tags.includes('Золотой век')) return 'golden';
  if (poet.tags.includes('Символизм')) return 'symbolism';
  if (poet.tags.includes('Философия') || poet.tags.includes('Импрессионизм')) return 'philosophy';
  if (poet.tags.includes('Акмеизм')) return 'acmeism';
  if (poet.tags.includes('Футуризм')) return 'futurism';
  if (poet.tags.includes('Серебряный век')) return 'postSymbolism';
  return 'postSymbolism';
}
