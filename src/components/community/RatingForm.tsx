import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { RatingDimension } from '../../types/community';
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

export default function RatingForm({ dimensions, initialScores, onSubmit, onStatus }: RatingFormProps) {
  const [scores, setScores] = useState<Record<string, number>>(() => ({
    ...emptyScores(dimensions),
    ...initialScores,
  }));

  useEffect(() => {
    setScores({ ...emptyScores(dimensions), ...initialScores });
  }, [dimensions, initialScores]);

  const canSubmit = dimensions.every((dimension) => scores[dimension.key] > 0);
  const isUpdate = Boolean(initialScores && dimensions.every((dimension) => initialScores[dimension.key] > 0));

  return (
    <div className="space-y-4">
      {isUpdate && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.045] px-4 py-3 text-xs leading-relaxed text-emerald-100/60">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" />
          Ваш голос уже учтён. Баллы можно изменить — в общей базе прежняя оценка будет обновлена, а не продублирована.
        </div>
      )}

      {dimensions.map((dimension) => (
        <div key={dimension.key} className="rounded-2xl border border-cyan-400/10 bg-[#061018]/70 p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-bold text-white">{dimension.label}</div>
              <div className="text-xs text-cyan-100/42">{dimension.hint}</div>
            </div>
            <RatingStars
              value={scores[dimension.key]}
              onChange={(value) => setScores((current) => ({ ...current, [dimension.key]: value }))}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => {
          const result = onSubmit(scores);
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
