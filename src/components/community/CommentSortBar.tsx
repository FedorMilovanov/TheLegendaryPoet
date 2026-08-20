interface CommentSortBarProps {
  value: 'helpful' | 'newest';
  onChange: (value: 'helpful' | 'newest') => void;
}

const options = [
  { value: 'helpful' as const, label: 'Полезные' },
  { value: 'newest' as const, label: 'Новые' },
];

export default function CommentSortBar({
  value,
  onChange,
}: CommentSortBarProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="Сортировка загруженных комментариев">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
            value === option.value
              ? 'border-cyan-300 bg-cyan-400/10 text-cyan-200'
              : 'border-cyan-400/10 text-cyan-100/38 hover:text-cyan-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
