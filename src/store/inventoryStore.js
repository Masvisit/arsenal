import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import templates from '../data/templates.json';
import { locationFromTemplate, createLocation, duplicateLocation, LOCATION_SCHEMA_VERSION } from '../core/inventory.js';

// Llocs inicials suggerits (secció 5.1)
export function defaultLocations() {
  const t = Object.fromEntries(templates.map((x) => [x.id, x]));
  return [
    locationFromTemplate(t['gym-full'], { name: 'Gimnàs', kind: 'gym' }),
    locationFromTemplate(t['home-basic'], { name: 'Casa', kind: 'home' }),
    locationFromTemplate(t.homemade, { name: 'Jardí', kind: 'garden', constraints: { runSpaceM: 20 } }),
    locationFromTemplate(t.park, { name: 'Parc', kind: 'park' }),
  ];
}

export const useInventoryStore = create(
  persist(
    (set, get) => ({
      locations: defaultLocations(),
      getLocation: (id) => get().locations.find((l) => l.id === id),
      addLocation: (loc) => set((s) => ({ locations: [...s.locations, loc] })),
      addFromTemplate: (templateId, name, kind) => {
        const t = templates.find((x) => x.id === templateId);
        const loc = t ? locationFromTemplate(t, { name, kind }) : createLocation({ name, kind });
        set((s) => ({ locations: [...s.locations, loc] }));
        return loc;
      },
      updateLocation: (id, updater) => set((s) => ({
        locations: s.locations.map((l) => (l.id === id ? (typeof updater === 'function' ? updater(l) : { ...l, ...updater }) : l)),
      })),
      removeLocation: (id) => set((s) => ({ locations: s.locations.filter((l) => l.id !== id) })),
      duplicate: (id) => {
        const src = get().locations.find((l) => l.id === id);
        if (!src) return null;
        const copy = duplicateLocation(src);
        set((s) => ({ locations: [...s.locations, copy] }));
        return copy;
      },
    }),
    { name: 'arsenal-inventory', version: LOCATION_SCHEMA_VERSION },
  ),
);
