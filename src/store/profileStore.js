import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const PROFILE_SCHEMA_VERSION = 1;

export const DEFAULT_PROFILE = {
  schemaVersion: PROFILE_SCHEMA_VERSION,
  sex: 'male',
  age: 26,
  bodyWeightKg: 80,
  heightCm: null,
  goal: 'muscle',
  level: 'intermediate',
  limitations: [],
  referenceLifts: {},
  defaultLocationId: null,
};

export const useProfileStore = create(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      completed: false,
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      complete: () => set({ completed: true }),
      reset: () => set({ profile: DEFAULT_PROFILE, completed: false }),
    }),
    { name: 'arsenal-profile', version: PROFILE_SCHEMA_VERSION },
  ),
);
