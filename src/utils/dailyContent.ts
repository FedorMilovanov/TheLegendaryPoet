import { poets } from '../data/poets';
import { Poet, Poem } from '../types/poet';

const DAY_MS = 86_400_000;

// Стабильный индекс дня, не зависящий от часового пояса
function getDayIndex() {
  return Math.floor((Date.now() - new Date(2024, 0, 1).getTime()) / DAY_MS);
}

export function getPoemOfDay(): { poem: Poem; poet: Poet } {
  const allPoems = poets.flatMap((poet) => poet.poems.map((poem) => ({ poem, poet })));
  if (!allPoems.length) {
    const fallbackPoet: Poet = {
      id: 'fallback',
      name: 'Автор',
      fullName: 'Неизвестный Автор',
      birthYear: 1800,
      nationality: 'Русский',
      photo: '',
      shortBio: '',
      fullBio: '',
      rating: 10,
      tags: [],
      poems: [],
      articles: [],
      famousWorks: [],
    };
    const fallbackPoem: Poem = {
      id: 'fallback-poem',
      title: 'Вдохновение',
      text: 'Безмолвный стих...',
      rating: 10,
    };
    return { poem: fallbackPoem, poet: fallbackPoet };
  }
  return allPoems[getDayIndex() % allPoems.length];
}

const stopWords = new Set([
  'и', 'в', 'во', 'на', 'не', 'что', 'как', 'с', 'со', 'а', 'но', 'я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они',
  'мой', 'моя', 'мое', 'мои', 'твой', 'тебя', 'меня', 'его', 'ее', 'их', 'это', 'все', 'для', 'по', 'из', 'к', 'ко',
  'за', 'от', 'до', 'над', 'под', 'же', 'ли', 'бы', 'уж', 'так', 'там', 'тут', 'нет', 'есть', 'был', 'была', 'были',
]);

function normalizeWord(word: string) {
  return word
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/^[^а-яa-z]+|[^а-яa-z]+$/gi, '')
    .trim();
}

export function getWordOfDay() {
  const entries = poets.flatMap((poet) =>
    poet.poems.flatMap((poem) => {
      const words = poem.text
        .split(/\s+/)
        .map(normalizeWord)
        .filter((word) => word.length > 5 && !stopWords.has(word));

      return words.map((word) => ({ word, poem, poet }));
    }),
  );

  const unique = Array.from(new Map(entries.map((entry) => [entry.word, entry])).values());
  if (!unique.length) {
    const defaultPoemAndPoet = getPoemOfDay();
    return {
      word: 'Поэзия',
      poem: defaultPoemAndPoet.poem,
      poet: defaultPoemAndPoet.poet,
    };
  }
  return unique[(getDayIndex() * 7) % unique.length];
}

export function getPoemPreview(text: string, lines = 4) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, lines);
}