import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SESSION_SCHEMA_VERSION } from '../core/session.js';

// Sessions fetes (SessionLog), la més recent primer
export const useHistoryStore = create(
  persist(
    (set) => ({
      logs: [],
      add: (log) => set((s) => ({ logs: [log, ...s.logs.filter((l) => l.id !== log.id)] })),
      remove: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
    }),
    { name: 'arsenal-history', version: SESSION_SCHEMA_VERSION },
  ),
);
