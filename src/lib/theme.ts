import { safeRead, safeWrite } from '../utils/browserStorage';

export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'tlp-theme-mode';
export const THEME_CHANGE_EVENT = 'tlp-theme-change';

const THEME_COLORS: Record<ThemeMode, string> = {
  dark: '#050810',
  light: '#fffaf0',
};

export function normalizeThemeMode(value: string | null | undefined): ThemeMode {
  return value === 'light' ? 'light' : 'dark';
}

export function getAppliedTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'dark';
  return normalizeThemeMode(document.documentElement.dataset.theme);
}

export function readStoredTheme(): ThemeMode {
  return normalizeThemeMode(safeRead(THEME_STORAGE_KEY));
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.classList.toggle('theme-light', mode === 'light');
  root.style.colorScheme = mode;

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[mode]);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', mode);
}

export function setTheme(mode: ThemeMode) {
  applyTheme(mode);
  safeWrite(THEME_STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_CHANGE_EVENT, { detail: mode }));
}

export function subscribeTheme(onTheme: (mode: ThemeMode) => void) {
  const onLocalChange = (event: Event) => {
    const mode = normalizeThemeMode((event as CustomEvent<ThemeMode>).detail);
    applyTheme(mode);
    onTheme(mode);
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    const mode = normalizeThemeMode(event.newValue);
    applyTheme(mode);
    onTheme(mode);
  };

  window.addEventListener(THEME_CHANGE_EVENT, onLocalChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onLocalChange);
    window.removeEventListener('storage', onStorage);
  };
}
