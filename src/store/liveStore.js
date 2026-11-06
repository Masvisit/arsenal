import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Sessió en curs (sobreviu a tancar l'app: es pot continuar)
const EMPTY = { workoutId: null, startedAt: null, index: 0, mode: 'manual', sound: true, log: {}, stepBaseSec: 0, runningSince: null };

export const useLiveStore = create(
  persist(
    (set, get) => ({
      ...EMPTY,
      start: (workoutId, mode) => set({ ...EMPTY, workoutId, mode: mode || get().mode, sound: get().sound, startedAt: Date.now(), runningSince: Date.now() }),
      goTo: (index) => set({ index, stepBaseSec: 0, runningSince: Date.now() }),
      setMode: (mode) => set({ mode }),
      setSound: (sound) => set({ sound }),
      pause: () => {
        const s = get();
        if (!s.runningSince) return;
        set({ stepBaseSec: s.stepBaseSec + (Date.now() - s.runningSince) / 1000, runningSince: null });
      },
      resume: () => set({ runningSince: Date.now() }),
      addTime: (sec) => set((s) => ({ stepBaseSec: s.stepBaseSec - sec })),
      logStep: (stepId, entry) => set((s) => ({ log: { ...s.log, [stepId]: { ...(s.log[stepId] || {}), ...entry } } })),
      clear: () => set({ ...EMPTY, mode: get().mode, sound: get().sound }),
    }),
    { name: 'arsenal-live', version: 1 },
  ),
);

/** Segons transcorreguts al pas actual. */
export function stepElapsed(s, now = Date.now()) {
  return s.stepBaseSec + (s.runningSince ? (now - s.runningSince) / 1000 : 0);
}
