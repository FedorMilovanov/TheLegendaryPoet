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
      data-active={active ? 'true' : 'false'}
      className="theme-modal-result w-full rounded-2xl border p-4 text-left transition hover:border-cyan-400/25"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="theme-text truncate font-serif text-lg font-bold">{item.label}</div>
          <div className="theme-functional-muted line-clamp-1 text-xs">{item.description}</div>
          <div className="theme-control-action mt-2 text-[10px] font-bold uppercase tracking-[0.16em]">{item.group}</div>
        </div>
        <ArrowRight size={16} className="theme-control-action mt-1 flex-shrink-0" />
      </div>
    </button>
  );
}