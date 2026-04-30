import { useState } from 'react';

interface ExpandableTextProps {
  text: string;
  collapsedChars?: number;
}

export default function ExpandableText({ text, collapsedChars = 220 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = text.length > collapsedChars;
  const visibleText = !shouldCollapse || expanded ? text : `${text.slice(0, collapsedChars).trim()}…`;

  return (
    <div>
      <p className="text-sm leading-relaxed text-cyan-50/68">{visibleText}</p>
      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 text-[11px] uppercase tracking-[0.12em] text-cyan-300 transition hover:text-cyan-200"
        >
          {expanded ? 'Свернуть' : 'Читать полностью'}
        </button>
      )}
    </div>
  );
}
