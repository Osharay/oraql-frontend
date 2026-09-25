'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { BuilderState, BuilderSelection } from '@/types';

interface BuilderStore extends BuilderState {
  isLoading: boolean;
  load: () => Promise<void>;
  /** Resolves to null on success, or the reason the selection was refused. */
  add: (marketId: string) => Promise<string | null>;
  remove: (marketId: string) => Promise<void>;
  clear: () => Promise<void>;
  exportText: () => Promise<string>;
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  selections: [],
  count: 0,
  combinedProbability: 1,
  combinedRange: { low: 1, high: 1 },
  sharedMatches: 0,
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<BuilderState>('/builder');
      set({ ...data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  add: async (marketId) => {
    try {
      await api.post(`/builder/add/${marketId}`);
    } catch (error) {
      // The API refuses conflicting selections and matches that have started;
      // hand the reason back so the button can say why nothing happened.
      return error instanceof Error ? error.message : 'Could not add this selection';
    }
    // Reload full state for consistency
    await get().load();
    return null;
  },

  remove: async (marketId) => {
    await api.delete(`/builder/remove/${marketId}`);
    await get().load();
  },

  clear: async () => {
    await api.delete('/builder/clear');
    set({
      selections: [],
      count: 0,
      combinedProbability: 1,
      combinedRange: { low: 1, high: 1 },
      sharedMatches: 0,
    });
  },

  exportText: async () => {
    const result = await api.get<{ text: string }>('/builder/export');
    return result.text;
  },
}));
