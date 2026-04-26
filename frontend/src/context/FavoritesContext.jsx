import { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

export const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState(() => {
    const stored = localStorage.getItem('curio_favorites');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('curio_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = useCallback((product) => {
    setFavorites((prev) => {
      if (prev.find((f) => f.id === product.id)) return prev;
      return [...prev, product];
    });
  }, []);

  const removeFavorite = useCallback((productId) => {
    setFavorites((prev) => prev.filter((f) => f.id !== productId));
  }, []);

  const isFavorite = useCallback(
    (productId) => favorites.some((f) => f.id === productId),
    [favorites]
  );

  const value = {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    totalFavorites: favorites.length,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
