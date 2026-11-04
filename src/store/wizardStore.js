import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Estat temporal de l'assistent (sobreviu a recàrregues de la pestanya, no a tancar-la)
export const useWizardStore = create(
  persist(
    (set) => ({
      mode: 'full', // 'full' | 'quick'
      locationId: null,
      durationMin: 45,
      targets: [],
      set: (patch) => set(patch),
      start: (mode, patch = {}) => set({ mode, ...patch }),
    }),
    { name: 'arsenal-wizard', storage: createJSONStorage(() => sessionStorage) },
  ),
);
