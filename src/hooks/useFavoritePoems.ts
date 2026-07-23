import { useEffect, useState } from 'react';
import { getFavoritePoems, subscribeFavoritePoems, type FavoritePoem } from '../utils/myArchiveStore';

export function useFavoritePoems() {
  const [favorites, setFavorites] = useState<FavoritePoem[]>(() => getFavoritePoems());

  useEffect(() => subscribeFavoritePoems(() => {
    setFavorites(getFavoritePoems());
  }), []);

  return favorites;
}
