import type { CommentEntry } from '../types/community';

// Whole-word negation markers (token-matched so "мне"/"вне" no longer
// falsely hit the particle "не").
const negativeWords = new Set([
  'не', 'нет', 'плохо', 'спорно', 'хуже', 'мало', 'слабо', 'скучно',
  'натянуто', 'фальшиво', 'поверхностно', 'наивн',
]);
// Stems matched at the start of a word (catch inflected forms).
const negativeStems = [
  'слаб', 'ошиб', 'сыр', 'перегру', 'тяжел', 'лишн', 'недо',
  'разочар', 'провал', 'фальш', 'банальн', 'плоск', 'надуман',
];

// Positive markers help rank the "best positive" when several candidates exist.
const positiveWords = new Set([
  'точно', 'сильно', 'глубоко', 'прекрасно', 'верно', 'честно',
  'мощно', 'красиво', 'важно', 'тонко', 'блестяще',
]);
const positiveStems = ['точн', 'сильн', 'глубок', 'прекрасн', 'верн', 'честн', 'мощн', 'красив'];

function tokens(text: string): string[] {
  return text.toLowerCase().split(/[^а-яёa-z0-9]+/i).filter(Boolean);
}

function isCritical(text: string) {
  const words = tokens(text);
  return words.some(
    (word) => negativeWords.has(word) || negativeStems.some((stem) => word.startsWith(stem)),
  );
}

function positivityScore(text: string): number {
  const words = tokens(text);
  let score = 0;
  for (const word of words) {
    if (positiveWords.has(word)) score += 2;
    else if (positiveStems.some((s) => word.startsWith(s))) score += 1;
  }
  return score;
}

function byHelpfulThenFresh(a: CommentEntry, b: CommentEntry) {
  if (b.helpful !== a.helpful) return b.helpful - a.helpful;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function getPositiveComment(comments: CommentEntry[]) {
  return comments
    .filter((comment) => !isCritical(comment.text))
    .slice()
    .sort((a, b) => {
      const helpful = byHelpfulThenFresh(a, b);
      if (helpful !== 0) return helpful;
      return positivityScore(b.text) - positivityScore(a.text);
    })[0];
}

export function getCriticalComment(comments: CommentEntry[]) {
  return comments
    .filter((comment) => isCritical(comment.text))
    .slice()
    .sort(byHelpfulThenFresh)[0];
}
