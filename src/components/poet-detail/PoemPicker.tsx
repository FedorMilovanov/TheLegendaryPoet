import { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import type { Poem } from '../../types/poet';

interface PoemPickerProps {
  poems: Poem[];
}

/** Persistent shortcut to the existing canonical poem anchors. */
export default function PoemPicker({ poems }: PoemPickerProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    const sync = () => setCurrentHash(window.location.hash);
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !detailsRef.current?.contains(event.target)) {
        detailsRef.current?.removeAttribute('open');
      }
    };
    const dismissEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && detailsRef.current?.open) {
        detailsRef.current.open = false;
        detailsRef.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', dismissEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', dismissEscape);
    };
  }, []);

  if (poems.length < 2) return null;

  const closeAfterChoice = () => {
    // Preserve native fragment navigation before collapsing the menu.
    requestAnimationFrame(() => detailsRef.current?.removeAttribute('open'));
  };

  return (
    <details ref={detailsRef} className="poet-poem-picker" data-poem-picker>
      <summary>
        <BookOpen size={17} aria-hidden="true" />
        <span>Выбрать стих</span>
        <span className="poet-poem-picker-count" aria-label={poems.length + ' стихотворений'}>{poems.length}</span>
        <ChevronDown className="poet-poem-picker-chevron" size={16} aria-hidden="true" />
      </summary>
      <nav className="poet-poem-picker-menu" aria-label="Быстрый выбор стихотворения">
        <p className="poet-poem-picker-title">Перейти к стихотворению</p>
        <ol>
          {poems.map((poem, index) => (
            <li key={poem.id}>
              <a
                href={'#poem-' + poem.id}
                aria-current={currentHash === '#poem-' + poem.id ? 'location' : undefined}
                onClick={closeAfterChoice}
              >
                <span className="poet-poem-picker-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span className="poet-poem-picker-name">{poem.title}</span>
                <small>{poem.yearLabel ?? poem.year ?? '—'}</small>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
