import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { supabase } from '../services/supabaseClient';
import type { UserSummary } from '../types';

interface AuthContextValue {
  user: UserSummary | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<UserSummary>;
  register: (payload: Record<string, unknown>) => Promise<UserSummary>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setUser(null);
        return;
      }
      const me = await api.getMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
      } else {
        api.getMe().then(setUser).catch(() => setUser(null));
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [refreshUser]);

  const login = async (email: string, senha: string) => {
    const resp = await api.login(email, senha);
    setUser(resp.usuario);
    return resp.usuario;
  };

  const register = async (payload: Record<string, unknown>) => {
    const resp = await api.register(payload);
    setUser(resp.usuario);
    return resp.usuario;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
