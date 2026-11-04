import { useEffect, useState } from 'react';
import custom from './custom-exercises.json';
import namesCa from './i18n/exercise-names.ca.json';
import coreIds from './core-exercises.json';

export const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
export { coreIds };

let cache = null;
let promise = null;

function load() {
  if (cache) return Promise.resolve(cache);
  if (!promise) {
    promise = fetch(`${import.meta.env.BASE_URL}data/exercises.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((dataset) => {
        const exercises = [...dataset, ...custom];
        const byId = Object.fromEntries(exercises.map((e) => [e.id, e]));
        cache = { exercises, byId };
        return cache;
      })
      .catch((e) => {
        promise = null;
        throw e;
      });
  }
  return promise;
}

/** Exercicis del dataset + propis. */
export function useExercises() {
  const [state, setState] = useState(() => (cache ? { ...cache, ready: true, error: null } : { exercises: [], byId: {}, ready: false, error: null }));
  useEffect(() => {
    if (cache) return undefined;
    let alive = true;
    load()
      .then((c) => alive && setState({ ...c, ready: true, error: null }))
      .catch((e) => alive && setState((s) => ({ ...s, error: e.message })));
    return () => { alive = false; };
  }, []);
  return state;
}

export function exerciseName(ex) {
  if (!ex) return '';
  if (ex.custom) return ex.name;
  return namesCa[ex.id] || ex.name;
}
