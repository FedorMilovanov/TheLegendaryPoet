import { ArrowRight } from 'lucide-react';
import { CommandItem } from './commandItems';

interface CommandResultProps {
  item: CommandItem;
  active: boolean;
  onSelect: () => void;
}

export default function CommandResult({ item, active, onSelect }: CommandResultProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        active
          ? 'border-cyan-300/45 bg-cyan-400/10 shadow-[0_0_22px_rgba(0,212,255,0.14)]'
          : 'border-cyan-400/10 bg-black/20 hover:border-cyan-400/25'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate font-serif text-lg font-bold text-white">{item.label}</div>
          <div className="line-clamp-1 text-xs text-cyan-100/45">{item.description}</div>
          <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/65">{item.group}</div>
        </div>
        <ArrowRight size={16} className="mt-1 flex-shrink-0 text-cyan-300" />
      </div>
    </button>
  );
}