import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WORKOUT_SCHEMA_VERSION } from '../core/generator.js';

export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      current: null, // últim generat (encara no desat)
      saved: [],
      setCurrent: (w) => set({ current: w }),
      get: (id) => {
        const s = get();
        return s.saved.find((w) => w.id === id) || (s.current?.id === id ? s.current : null);
      },
      // Actualitza on sigui (actual i/o desat)
      update: (w) => set((s) => ({
        current: s.current?.id === w.id ? w : s.current,
        saved: s.saved.map((x) => (x.id === w.id ? { ...w, saved: true } : x)),
      })),
      save: (w) => set((s) => {
        const item = { ...w, saved: true, savedAt: Date.now() };
        const exists = s.saved.some((x) => x.id === w.id);
        return {
          saved: exists ? s.saved.map((x) => (x.id === w.id ? item : x)) : [item, ...s.saved],
          current: s.current?.id === w.id ? item : s.current,
        };
      }),
      remove: (id) => set((s) => ({ saved: s.saved.filter((w) => w.id !== id) })),
    }),
    { name: 'arsenal-workouts', version: WORKOUT_SCHEMA_VERSION },
  ),
);
