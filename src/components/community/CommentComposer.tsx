import { useId, useState } from 'react';
import { Send } from 'lucide-react';
import { commentKindOptions } from '../../data/commentKinds';
import type { CommentKind } from '../../types/community';

interface CommentComposerProps {
  onSubmit: (author: string, text: string, kind: CommentKind) => { ok: boolean; message: string };
  onStatus?: (message: string, tone: 'success' | 'warning') => void;
}

const MIN_COMMENT_LENGTH = 8;
const MAX_COMMENT_LENGTH = 2000;
const MAX_AUTHOR_LENGTH = 60;

export default function CommentComposer({ onSubmit, onStatus }: CommentComposerProps) {
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [kind, setKind] = useState<CommentKind>('literary');
  const helpId = useId();
  const normalizedLength = text.trim().length;
  const canSend = normalizedLength >= MIN_COMMENT_LENGTH && normalizedLength <= MAX_COMMENT_LENGTH;

  const send = () => {
    if (!canSend) return;
    const result = onSubmit(author, text, kind);
    onStatus?.(result.message, result.ok ? 'success' : 'warning');
    if (result.ok) setText('');
  };

  return (
    <div className="space-y-3 rounded-3xl border border-cyan-400/10 bg-[#050b12]/80 p-4">
      <label className="block">
        <span className="sr-only">Имя или псевдоним</span>
        <input
          value={author}
          onChange={(event) => setAuthor(event.target.value.slice(0, MAX_AUTHOR_LENGTH))}
          placeholder="Ваше имя или псевдоним — необязательно"
          maxLength={MAX_AUTHOR_LENGTH}
          autoComplete="nickname"
          className="min-h-11 w-full rounded-2xl border border-cyan-400/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-cyan-100/25 focus:border-cyan-400/45 focus:ring-2 focus:ring-cyan-300/10"
        />
      </label>

      <label className="block">
        <span className="sr-only">Текст комментария</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Что особенно точно, спорно, сильно или слабо?"
          rows={5}
          maxLength={MAX_COMMENT_LENGTH}
          aria-describedby={helpId}
          className="w-full resize-y rounded-2xl border border-cyan-400/10 bg-black/30 px-4 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-cyan-100/25 focus:border-cyan-400/45 focus:ring-2 focus:ring-cyan-300/10"
        />
      </label>

      <div id={helpId} className="flex flex-wrap items-center justify-between gap-2 text-[10px] leading-relaxed text-cyan-100/34">
        <span>Минимум {MIN_COMMENT_LENGTH} символов · Ctrl/⌘ + Enter для отправки</span>
        <span className={normalizedLength >= MAX_COMMENT_LENGTH * 0.9 ? 'text-amber-200/70' : ''}>{normalizedLength} / {MAX_COMMENT_LENGTH}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Тип комментария">
        {commentKindOptions.map((option) => {
          const selected = kind === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setKind(option.value)}
              aria-pressed={selected}
              className={`min-h-11 rounded-full border px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.11em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
                selected
                  ? 'border-cyan-300 bg-cyan-400/10 text-cyan-200'
                  : 'border-cyan-400/10 text-cyan-100/40 hover:border-cyan-400/25 hover:text-cyan-200'
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
        disabled={!canSend}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-cyan-400/25 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300 transition hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Send size={15} /> Добавить комментарий
      </button>
    </div>
  );
}
