import { useEffect, useState } from 'react';
import type { FeedbackActionResult, RatingDimension } from '../../types/community';
import RatingStars from './RatingStars';
import { ShieldCheck } from '../PremiumIcons';

interface RatingFormProps {
  dimensions: RatingDimension[];
  alreadyRated: boolean;
  onSubmit: (scores: Record<string, number>, dimensions: RatingDimension[]) => FeedbackActionResult;
  onStatus?: (message: string, tone: 'success' | 'warning') => void;
}

export default function RatingForm({ dimensions, alreadyRated, onSubmit, onStatus }: RatingFormProps) {
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(dimensions.map((d) => [d.key, 0])),
  );
  const [submitting, setSubmitting] = useState(false);

  // Reset local state if the dimension set changes (e.g. switching targets).
  useEffect(() => {
    setScores(Object.fromEntries(dimensions.map((d) => [d.key, 0])));
  }, [dimensions]);

  if (alreadyRated) {
    return (
      <div className="rounded-2xl border border-cyan-400/15 bg-cyan-950/20 px-5 py-5">
        <div className="mb-1 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
          <ShieldCheck size={13} /> Голос учтён
        </div>
        <p className="text-sm leading-relaxed text-cyan-100/55">
          Вы уже оценили этот материал. Один голос с устройства — чтобы сигнал оставался честным.
        </p>
      </div>
    );
  }

  const filled = dimensions.filter((d) => scores[d.key] > 0).length;
  const canSubmit = filled === dimensions.length && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = onSubmit(scores, dimensions);
      onStatus?.(result.message, result.ok ? 'success' : 'warning');
      if (result.ok) {
        setScores(Object.fromEntries(dimensions.map((d) => [d.key, 0])));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/40">
        <span>Ваша оценка</span>
        <span className="tabular-nums text-cyan-300/70">
          {filled}/{dimensions.length}
        </span>
      </div>

      {dimensions.map((dimension) => (
        <div
          key={dimension.key}
          className="rounded-2xl border border-cyan-400/10 bg-[#061018]/70 p-4 transition hover:border-cyan-400/20"
        >
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-bold text-white">{dimension.label}</div>
              <div className="text-xs text-cyan-100/42">{dimension.hint}</div>
            </div>
            <RatingStars
              value={scores[dimension.key]}
              label={dimension.label}
              onChange={(value) => setScores((prev) => ({ ...prev, [dimension.key]: value }))}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_24px_rgba(0,212,255,0.28)] transition enabled:hover:shadow-[0_0_32px_rgba(0,212,255,0.4)] disabled:cursor-not-allowed disabled:opacity-35"
      >
        {submitting ? 'Сохраняем…' : 'Зафиксировать оценку'}
      </button>
    </div>
  );
}
