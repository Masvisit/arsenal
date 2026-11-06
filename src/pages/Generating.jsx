import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import BodyMap from '../components/BodyMap.jsx';
import { useExercises, coreIds } from '../data/useExercises.js';
import { useProfileStore } from '../store/profileStore.js';
import { useInventoryStore } from '../store/inventoryStore.js';
import { useWizardStore } from '../store/wizardStore.js';
import { useWorkoutStore } from '../store/workoutStore.js';
import { useHistoryStore } from '../store/historyStore.js';
import { generateWorkout } from '../core/generator.js';
import { selectionToSlugs } from '../core/muscles.js';

const MESSAGES = ['Analitzant objectius…', 'Comprovant el material del lloc…', 'Calculant càrregues que pots muntar…'];

export default function Generating() {
  const nav = useNavigate();
  const { exercises, ready, error } = useExercises();
  const profile = useProfileStore((s) => s.profile);
  const wiz = useWizardStore();
  const location = useInventoryStore((s) => s.locations.find((l) => l.id === wiz.locationId));
  const saved = useHistoryStore((s) => s.logs);
  const setCurrent = useWorkoutStore((s) => s.setCurrent);
  const [msg, setMsg] = useState(0);
  const started = useRef(Date.now());
  const done = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setMsg((m) => (m + 1) % MESSAGES.length), 400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!ready || !location || done.current) return undefined;
    done.current = true;
    const w = generateWorkout(
      { exercises, profile, location, history: saved, coreIds },
      { targets: wiz.targets, durationMin: wiz.durationMin },
    );
    setCurrent(w);
    // animació breu (≤ 1,2 s): el càlcul és local
    const wait = Math.max(0, 1100 - (Date.now() - started.current));
    const t = setTimeout(() => nav(`/entrenament/${w.id}`, { replace: true }), wait);
    return () => clearTimeout(t);
  }, [ready, location, exercises, profile, wiz.targets, wiz.durationMin, saved, setCurrent, nav]);

  if (!wiz.targets.length || !wiz.locationId) return <Navigate to="/assistent/muscles" replace />;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center"
      style={{ backgroundImage: 'radial-gradient(circle at 50% 35%, rgba(239,68,68,0.10), transparent 60%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: 'auto, 24px 24px, 24px 24px' }}>
      <BodyMap slugs={selectionToSlugs(wiz.targets)} views="both" maxWidth={130} showLabels={false} />
      <h1 className="mt-8 text-2xl font-extrabold">Construint el teu entrenament</h1>
      <p className="mt-2 text-ink-soft" aria-live="polite">{error ? `No s'han pogut carregar els exercicis (${error}).` : MESSAGES[msg]}</p>
      <div className="mt-6 h-2 w-64 overflow-hidden rounded-full bg-line">
        <div className="animate-progress h-full rounded-full bg-gradient-to-r from-fat-1 via-fat-3 to-fat-5" />
      </div>
    </div>
  );
}
