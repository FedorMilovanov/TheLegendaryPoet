import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'tlp-theme-mode';

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('theme-light', mode === 'light');
  document.documentElement.style.colorScheme = mode;
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    let stored: ThemeMode | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    } catch {
      stored = null;
    }
    const next = stored === 'light' ? 'light' : 'dark';
    setMode(next);
    applyTheme(next);
  }, []);

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Theme still changes for current session.
    }
  };

  const isLight = mode === 'light';

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle group relative inline-flex h-10 w-10 items-center justify-center rounded-full text-cyan-200/65 transition hover:text-cyan-300"
      aria-label={isLight ? 'Включить темную тему' : 'Включить светлую тему'}
      title={isLight ? 'Темная тема' : 'Светлая тема'}
    >
      <svg viewBox="0 0 44 44" className="h-8 w-8" fill="none" aria-hidden="true">
        <motion.circle
          cx="22"
          cy="22"
          r="12"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          animate={{ opacity: isLight ? 0.92 : 0.52, scale: isLight ? 1.06 : 0.92 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.path
          d="M22 4.5v4.2M22 35.3v4.2M4.5 22h4.2M35.3 22h4.2M9.6 9.6l3 3M31.4 31.4l3 3M34.4 9.6l-3 3M12.6 31.4l-3 3"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          animate={{ opacity: isLight ? 1 : 0, scale: isLight ? 1 : 0.72 }}
          transition={{ duration: 0.3 }}
        />
        <motion.path
          d="M29.9 26.8c-6.5.2-11.7-5-11.4-11.5.1-2.1.8-4.1 1.9-5.8-5.9.9-10.4 6-10.4 12.2 0 6.8 5.5 12.3 12.3 12.3 4.9 0 9.1-2.8 11.1-6.9-1.1-.2-2.3-.3-3.5-.3Z"
          fill="currentColor"
          animate={{ opacity: isLight ? 0 : 0.9, rotate: isLight ? -12 : 0, scale: isLight ? 0.78 : 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="pointer-events-none absolute inset-0 rounded-full bg-cyan-400/0 blur-md transition group-hover:bg-cyan-400/10" />
    </button>
  );
}