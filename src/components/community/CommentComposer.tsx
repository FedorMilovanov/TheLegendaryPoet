import { useState } from 'react';
import { commentKindOptions } from '../../data/commentKinds';
import { CommentKind } from '../../types/community';

interface CommentComposerProps {
  onSubmit: (author: string, text: string, kind: CommentKind) => { ok: boolean; message: string };
  onStatus?: (message: string, tone: 'success' | 'warning') => void;
}

export default function CommentComposer({ onSubmit, onStatus }: CommentComposerProps) {
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [kind, setKind] = useState<CommentKind>('literary');

  const send = () => {
    if (text.trim().length < 8) return;
    const result = onSubmit(author, text, kind);
    onStatus?.(result.message, result.ok ? 'success' : 'warning');
    if (result.ok) {
      setAuthor('');
      setText('');
    }
  };

  return (
    <div className="space-y-3 rounded-3xl border border-cyan-400/10 bg-[#050b12]/80 p-4">
      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Ваше имя или псевдоним"
        className="w-full rounded-2xl border border-cyan-400/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-cyan-100/25 focus:border-cyan-400/45"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Оставьте вдумчивый комментарий: что особенно точно, спорно, сильно или слабо?"
        rows={4}
        className="w-full resize-none rounded-2xl border border-cyan-400/10 bg-black/30 px-4 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-cyan-100/25 focus:border-cyan-400/45"
      />
      <div className="grid grid-cols-2 gap-2">
        {commentKindOptions.map((option) => {
          const selected = kind === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setKind(option.value)}
              aria-pressed={selected}
              className={`min-h-11 rounded-full border px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
                selected
                  ? 'border-cyan-300 bg-cyan-400/10 text-cyan-200'
                  : 'border-cyan-400/10 text-cyan-100/40 hover:text-cyan-200'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={send}
        disabled={text.trim().length < 8}
        className="min-h-11 rounded-full border border-cyan-400/25 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300 transition hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:opacity-35"
      >
        Добавить комментарий
      </button>
    </div>
  );
}
