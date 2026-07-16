/**
 * Shared validation for community writes.
 * Used by the store (hard gate) and the forms (inline UX). Pure, no I/O.
 */

import { FEEDBACK_LIMITS, type CommentKind, type RatingDimension } from '../types/community';

const KIND_SET = new Set<CommentKind>(['literary', 'history', 'moral', 'performance']);

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(FEEDBACK_LIMITS.scoreMin, Math.min(FEEDBACK_LIMITS.scoreMax, Math.round(value)));
}

export function sanitizeAuthor(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, FEEDBACK_LIMITS.authorMax);
}

export function sanitizeCommentText(raw: string): string {
  // Collapse runs of blank lines, trim edges, hard-cap length.
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, FEEDBACK_LIMITS.commentMax);
}

export function validateScores(
  scores: Record<string, number>,
  dimensions: RatingDimension[],
): { ok: true; scores: Record<string, number> } | { ok: false; message: string } {
  const next: Record<string, number> = {};
  for (const dim of dimensions) {
    const raw = scores[dim.key];
    if (typeof raw !== 'number' || raw < FEEDBACK_LIMITS.scoreMin || raw > FEEDBACK_LIMITS.scoreMax) {
      return { ok: false, message: `Поставьте оценку по шкале «${dim.label}»` };
    }
    next[dim.key] = clampScore(raw);
  }
  return { ok: true, scores: next };
}

export function validateCommentInput(
  author: string,
  text: string,
  kind: CommentKind,
):
  | { ok: true; author: string; text: string; kind: CommentKind }
  | { ok: false; message: string } {
  if (!KIND_SET.has(kind)) {
    return { ok: false, message: 'Выберите тип комментария' };
  }
  const cleanText = sanitizeCommentText(text);
  if (cleanText.length < FEEDBACK_LIMITS.commentMin) {
    return {
      ok: false,
      message: `Напишите чуть подробнее (минимум ${FEEDBACK_LIMITS.commentMin} символов)`,
    };
  }
  if (cleanText.length > FEEDBACK_LIMITS.commentMax) {
    return { ok: false, message: `Слишком длинный текст (максимум ${FEEDBACK_LIMITS.commentMax})` };
  }
  // Block pure-URL spam and character-spam dumps.
  if (/^https?:\/\//i.test(cleanText) && cleanText.split(/\s+/).length < 4) {
    return { ok: false, message: 'Комментарий не может состоять только из ссылки' };
  }
  if (/(.)\1{9,}/.test(cleanText)) {
    return { ok: false, message: 'Похоже на спам — переформулируйте' };
  }
  const cleanAuthor = sanitizeAuthor(author) || 'Анонимный читатель';
  return { ok: true, author: cleanAuthor, text: cleanText, kind };
}

export function formatRelativeRu(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diffSec = Math.round((then - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
