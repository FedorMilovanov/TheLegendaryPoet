const FAVORITES_KEY = 'tlp-my-archive-favorites-v2';

export interface FavoritePoem {
  id: string;
  addedAt: number;
}

function readFavorites(): FavoritePoem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeFavorites(favorites: FavoritePoem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {}
}

export function getFavoritePoems(): FavoritePoem[] {
  return readFavorites();
}

export function isFavoritePoem(poemId: string): boolean {
  return readFavorites().some(f => f.id === poemId);
}

export function toggleFavoritePoem(poemId: string): boolean {
  const favorites = readFavorites();
  const index = favorites.findIndex(f => f.id === poemId);
  
  if (index !== -1) {
    favorites.splice(index, 1);
    writeFavorites(favorites);
    return false;
  } else {
    favorites.push({ id: poemId, addedAt: Date.now() });
    writeFavorites(favorites);
    return true;
  }
}