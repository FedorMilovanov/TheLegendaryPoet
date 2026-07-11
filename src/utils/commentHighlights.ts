import { CommentEntry } from '../types/community';

// Whole-word negation markers (compared against tokens, so "мне"/"вне" no
// longer falsely match the negation particle "не").
const negativeWords = new Set(['не', 'нет', 'плохо', 'спорно', 'хуже', 'мало', 'слабо', 'скучно']);
// Stems matched at the start of a word (catch inflected forms).
const negativeStems = ['слаб', 'ошиб', 'сыр', 'перегру', 'тяжел', 'лишн', 'недо', 'разочар', 'провал'];

function isCritical(text: string) {
  const words = text.toLowerCase().split(/[^а-яё]+/i).filter(Boolean);
  return words.some((word) => negativeWords.has(word) || negativeStems.some((stem) => word.startsWith(stem)));
}

export function getPositiveComment(comments: CommentEntry[]) {
  return comments
    .filter((comment) => !isCritical(comment.text))
    .slice()
    .sort((a, b) => b.helpful - a.helpful)[0];
}

export function getCriticalComment(comments: CommentEntry[]) {
  return comments
    .filter((comment) => isCritical(comment.text))
    .slice()
    .sort((a, b) => b.helpful - a.helpful)[0];
}
