'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { User, TokenPair } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setTokens: (tokens: TokenPair) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const tokens = await api.post<TokenPair>('/auth/login', { email, password });
    api.setTokens(tokens);
    const user = await api.get<User>('/users/me');
    set({ user, isAuthenticated: true });
  },

  register: async (data) => {
    const tokens = await api.post<TokenPair>('/auth/register', data);
    api.setTokens(tokens);
    const user = await api.get<User>('/users/me');
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    api.clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      // A missing access token is not a missing session: after a reload the
      // access token may have expired while the 30-day refresh token is still
      // good. Let the request run so the client can renew.
      if (!api.getToken() && !api.getRefreshToken()) {
        set({ isLoading: false });
        return;
      }
      const user = await api.get<User>('/users/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setTokens: (tokens) => {
    api.setTokens(tokens);
  },
}));
