interface RatingDistributionProps {
  distribution: Record<number, number>;
  total: number;
}

export default function RatingDistribution({ distribution, total }: RatingDistributionProps) {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((score) => {
        const count = distribution[score] || 0;
        const width = total ? (count / total) * 100 : 0;
        return (
          <div key={score} className="grid grid-cols-[28px_1fr_36px] items-center gap-3">
            <span className="text-xs font-bold text-cyan-200/60">{score}.0</span>
            <div className="h-2 overflow-hidden rounded-full bg-cyan-950/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_8px_rgba(0,212,255,0.35)]"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="text-right text-[11px] text-cyan-100/40">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
