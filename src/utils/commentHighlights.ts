import { CommentEntry } from '../types/community';

const negativeHints = [
  'не ',
  'слаб',
  'плохо',
  'спорно',
  'ошиб',
  'сыр',
  'перег',
  'тяжел',
  'лишн',
  'хуже',
  'мало',
];

function isCritical(text: string) {
  const normalized = text.toLowerCase();
  return negativeHints.some((hint) => normalized.includes(hint));
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
