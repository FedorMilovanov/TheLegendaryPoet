import { useState } from 'react';
import { RatingDimension } from '../../types/community';
import RatingStars from './RatingStars';

interface RatingFormProps {
  dimensions: RatingDimension[];
  onSubmit: (scores: Record<string, number>) => { ok: boolean; message: string };
  onStatus?: (message: string, tone: 'success' | 'warning') => void;
}

export default function RatingForm({ dimensions, onSubmit, onStatus }: RatingFormProps) {
  const [scores, setScores] = useState<Record<string, number>>(() => Object.fromEntries(dimensions.map((d) => [d.key, 0])));

  const canSubmit = dimensions.every((dimension) => scores[dimension.key] > 0);

  return (
    <div className="space-y-4">
      {dimensions.map((dimension) => (
        <div key={dimension.key} className="rounded-2xl border border-cyan-400/10 bg-[#061018]/70 p-4">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-bold text-white">{dimension.label}</div>
              <div className="text-xs text-cyan-100/42">{dimension.hint}</div>
            </div>
            <RatingStars value={scores[dimension.key]} onChange={(value) => setScores({ ...scores, [dimension.key]: value })} />
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
        className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_24px_rgba(0,212,255,0.28)] transition disabled:cursor-not-allowed disabled:opacity-35"
      >
        Зафиксировать оценку
      </button>
    </div>
  );
}