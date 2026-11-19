import { ArrowRight } from 'lucide-react';
import { CommandItem } from './commandItems';

interface CommandResultProps {
  item: CommandItem;
  active: boolean;
  optionId: string;
  onSelect: () => void;
}

export default function CommandResult({ item, active, optionId, onSelect }: CommandResultProps) {
  return (
    <button
      type="button"
      id={optionId}
      role="option"
      aria-selected={active}
      tabIndex={-1}
      onClick={onSelect}
      data-active={active ? 'true' : 'false'}
      className="theme-modal-result"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="theme-text">{item.label}</div>
          <div className="theme-functional-muted">{item.description}</div>
          <div className="theme-control-action">{item.group}</div>
        </div>
        <ArrowRight size={16} className="theme-control-action mt-1 flex-shrink-0" />
      </div>
    </button>
  );
}