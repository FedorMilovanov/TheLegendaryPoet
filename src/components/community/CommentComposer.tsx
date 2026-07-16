import { useId, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { commentKindOptions } from '../../data/commentKinds';
import { FEEDBACK_LIMITS, type CommentKind, type FeedbackActionResult } from '../../types/community';

interface CommentComposerProps {
  onSubmit: (author: string, text: string, kind: CommentKind) => FeedbackActionResult;
  onStatus?: (message: string, tone: 'success' | 'warning') => void;
}

export default function CommentComposer({ onSubmit, onStatus }: CommentComposerProps) {
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [kind, setKind] = useState<CommentKind>('literary');
  const [submitting, setSubmitting] = useState(false);
  const formId = useId();

  const length = text.trim().length;
  const tooShort = length > 0 && length < FEEDBACK_LIMITS.commentMin;
  const nearLimit = length > FEEDBACK_LIMITS.commentMax - 80;
  const canSend = length >= FEEDBACK_LIMITS.commentMin && length <= FEEDBACK_LIMITS.commentMax && !submitting;

  const send = () => {
    if (!canSend) return;
    setSubmitting(true);
    try {
      const result = onSubmit(author, text, kind);
      onStatus?.(result.message, result.ok ? 'success' : 'warning');
      if (result.ok) {
        setAuthor('');
        setText('');
        // keep kind — readers usually leave several of the same type
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="space-y-3 rounded-3xl border border-cyan-400/10 bg-[#050b12]/80 p-4">
      <label className="sr-only" htmlFor={`${formId}-author`}>
        Имя или псевдоним
      </label>
      <input
        id={`${formId}-author`}
        value={author}
        maxLength={FEEDBACK_LIMITS.authorMax}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Ваше имя или псевдоним"
        autoComplete="nickname"
        className="w-full rounded-2xl border border-cyan-400/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-cyan-100/25 focus:border-cyan-400/45"
      />

      <div className="relative">
        <label className="sr-only" htmlFor={`${formId}-text`}>
          Текст комментария
        </label>
        <textarea
          id={`${formId}-text`}
          value={text}
          maxLength={FEEDBACK_LIMITS.commentMax}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Оставьте вдумчивый комментарий: что особенно точно, спорно, сильно или слабо?"
          rows={4}
          className="w-full resize-none rounded-2xl border border-cyan-400/10 bg-black/30 px-4 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-cyan-100/25 focus:border-cyan-400/45"
        />
        <div
          className={`pointer-events-none absolute bottom-3 right-3 text-[10px] tabular-nums ${
            tooShort
              ? 'text-amber-300/70'
              : nearLimit
                ? 'text-amber-200/70'
                : 'text-cyan-100/30'
          }`}
        >
          {length}/{FEEDBACK_LIMITS.commentMax}
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Тип комментария"
        className="grid grid-cols-2 gap-2"
      >
        {commentKindOptions.map((option) => {
          const active = kind === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setKind(option.value)}
              className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                active
                  ? 'border-cyan-300 bg-cyan-400/10 text-cyan-200'
                  : 'border-cyan-400/10 text-cyan-100/40 hover:text-cyan-200'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] leading-relaxed text-cyan-100/30">
          {tooShort
            ? `Ещё ${FEEDBACK_LIMITS.commentMin - length} символов`
            : 'Ctrl/⌘ + Enter — отправить'}
        </p>
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className="rounded-full border border-cyan-400/25 px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {submitting ? 'Публикуем…' : 'Добавить комментарий'}
        </button>
      </div>
    </div>
  );
}
