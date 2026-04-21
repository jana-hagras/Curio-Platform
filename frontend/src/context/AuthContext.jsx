import { createContext, useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('curio_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('curio_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('curio_user');
    }
  }, [user]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await userService.login({ email, password });
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await userService.register(data);
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('curio_user');
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await userService.getMe(user.id);
      setUser(res.data.user);
    } catch {
      // If user not found, log out
      logout();
    }
  }, [user?.id, logout]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isBuyer: user?.type === 'Buyer',
    isArtisan: user?.type === 'Artisan',
    login,
    register,
    logout,
    refreshUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
