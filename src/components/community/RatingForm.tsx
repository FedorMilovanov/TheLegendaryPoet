import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import type { RatingDimension } from '../../types/community';
import RatingStars from './RatingStars';

interface RatingFormProps {
  dimensions: RatingDimension[];
  initialScores?: Record<string, number>;
  onSubmit: (scores: Record<string, number>) => { ok: boolean; message: string };
  onStatus?: (message: string, tone: 'success' | 'warning') => void;
}

function emptyScores(dimensions: RatingDimension[]) {
  return Object.fromEntries(dimensions.map((dimension) => [dimension.key, 0]));
}

function normalizeInitialScores(dimensions: RatingDimension[], initialScores?: Record<string, number>) {
  return Object.fromEntries(dimensions.map((dimension) => {
    const value = Number(initialScores?.[dimension.key]);
    return [dimension.key, Number.isInteger(value) && value >= 1 && value <= 5 ? value : 0];
  }));
}

export default function RatingForm({ dimensions, initialScores, onSubmit, onStatus }: RatingFormProps) {
  const [scores, setScores] = useState<Record<string, number>>(() => ({
    ...emptyScores(dimensions),
    ...normalizeInitialScores(dimensions, initialScores),
  }));

  useEffect(() => {
    setScores(normalizeInitialScores(dimensions, initialScores));
  }, [dimensions, initialScores]);

  const completedCount = useMemo(
    () => dimensions.filter((dimension) => scores[dimension.key] >= 1 && scores[dimension.key] <= 5).length,
    [dimensions, scores],
  );
  const canSubmit = dimensions.length > 0 && completedCount === dimensions.length;
  const isUpdate = Boolean(initialScores && dimensions.every((dimension) => {
    const value = initialScores[dimension.key];
    return Number.isInteger(value) && value >= 1 && value <= 5;
  }));

  return (
    <div className="space-y-4">
      {isUpdate && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.045] px-4 py-3 text-xs leading-relaxed text-emerald-100/60">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" />
          Ваш голос уже учтён. Баллы можно изменить — прежняя оценка обновится, а не продублируется.
        </div>
      )}

      <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100/34" aria-live="polite">
        <span>Заполнено измерений</span>
        <span className={canSubmit ? 'text-emerald-200/70' : 'text-cyan-100/48'}>{completedCount} / {dimensions.length}</span>
      </div>

      {dimensions.map((dimension) => (
        <div key={dimension.key} className="rounded-2xl border border-cyan-400/10 bg-[#061018]/70 p-4 transition focus-within:border-cyan-300/24">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-bold text-white">{dimension.label}</div>
              <div className="text-xs leading-relaxed text-cyan-100/42">{dimension.hint}</div>
            </div>
            <RatingStars
              value={scores[dimension.key] ?? 0}
              label={dimension.label}
              onChange={(value) => setScores((current) => ({ ...current, [dimension.key]: value }))}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => {
          const cleanScores = Object.fromEntries(dimensions.map((dimension) => [dimension.key, scores[dimension.key]]));
          const result = onSubmit(cleanScores);
          onStatus?.(result.message, result.ok ? 'success' : 'warning');
        }}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_24px_rgba(0,212,255,0.28)] transition hover:shadow-[0_0_34px_rgba(0,212,255,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-35"
      >
        {isUpdate && <RefreshCw size={16} />}
        {isUpdate ? 'Обновить оценку' : 'Зафиксировать оценку'}
      </button>
    </div>
  );
}
