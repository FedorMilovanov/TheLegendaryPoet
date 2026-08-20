import { useMemo, useState } from 'react';

interface ExpandableTextProps {
  text: string;
  collapsedChars?: number;
}

function graphemeSegments(value: string) {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const Segmenter = Intl.Segmenter as typeof Intl.Segmenter;
    const segmenter = new Segmenter('ru', { granularity: 'grapheme' });
    return [...segmenter.segment(value)].map((entry) => entry.segment);
  }
  return Array.from(value);
}

export default function ExpandableText({ text, collapsedChars = 220 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const segments = useMemo(() => graphemeSegments(text), [text]);
  const shouldCollapse = segments.length > collapsedChars;
  const visibleText = !shouldCollapse || expanded
    ? text
    : `${segments.slice(0, collapsedChars).join('').trimEnd()}…`;

  return (
    <div>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-cyan-50/68">{visibleText}</p>
      {shouldCollapse && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 text-[11px] uppercase tracking-[0.12em] text-cyan-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
        >
          {expanded ? 'Свернуть' : 'Читать полностью'}
        </button>
      )}
    </div>
  );
}
