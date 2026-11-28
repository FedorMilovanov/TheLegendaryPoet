import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useFavoritePoem } from '../../hooks/useFavoritePoems';
import { toggleFavoritePoem } from '../../utils/myArchiveStore';

export default function PoemArchiveAction({ poemId, title }: { poemId: string; title: string }) {
  const favorite = useFavoritePoem(poemId);
  const [message, setMessage] = useState('');
  function toggle() {
    const result = toggleFavoritePoem(poemId);
    setMessage(result.status === 'added' ? 'Добавлено в архив'
      : result.status === 'removed' ? 'Удалено из архива'
      : 'Не удалось изменить архив. Проверьте доступ к хранилищу браузера.');
  }
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button type="button" onClick={toggle} aria-pressed={favorite}
        aria-label={favorite ? 'Убрать «' + title + '» из архива' : 'Добавить «' + title + '» в архив'}
        className="theme-elevated-surface theme-text inline-flex min-h-11 items-center gap-2 rounded-full border border-current px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
        <Heart size={16} aria-hidden="true" className={favorite ? 'fill-current' : ''} />
        {favorite ? 'В архиве' : 'В архив'}
      </button>
      <span role="status" aria-live="polite" className="theme-functional-muted text-sm">{message}</span>
    </div>
  );
}
