import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import BodyMap, { FatigueLegend } from '../components/BodyMap.jsx';
import ExerciseCard from '../components/ExerciseCard.jsx';
import { useExercises, coreIds, exerciseName } from '../data/useExercises.js';
import { useHistoryStore } from '../store/historyStore.js';
import { useWorkoutStore } from '../store/workoutStore.js';
import { useProfileStore } from '../store/profileStore.js';
import { useInventoryStore } from '../store/inventoryStore.js';
import { swapExercise, regenerateWorkout, toggleLock } from '../core/generator.js';
import { fatigueScores, fatigueLevels } from '../core/fatigue.js';
import { LEVEL_LABELS } from '../core/prescription.js';

export default function Result() {
  const { id } = useParams();
  const nav = useNavigate();
  const { exercises, byId, ready } = useExercises();
  const workout = useWorkoutStore((s) => s.saved.find((w) => w.id === id) || (s.current?.id === id ? s.current : null));
  const update = useWorkoutStore((s) => s.update);
  const save = useWorkoutStore((s) => s.save);
  const logs = useHistoryStore((s) => s.logs);
  const profile = useProfileStore((s) => s.profile);
  const location = useInventoryStore((s) => s.locations.find((l) => l.id === workout?.locationId));
  const [toast, setToast] = useState('');

  const levels = useMemo(() => (workout ? fatigueLevels(fatigueScores(workout.exercises.map((e) => ({ sets: e.sets.length, primary: e.primary, secondary: e.secondary })))) : {}), [workout]);

  if (!workout) {
    return (
      <div className="p-6 text-center">
        <p className="mb-4 text-ink-soft">No he trobat aquest entrenament.</p>
        <Link to="/" className="btn-primary">Torna a l'inici</Link>
      </div>
    );
  }

  const ctx = { exercises, profile, location, history: logs, coreIds };
  const canEdit = ready && !!location;
  const flash = (t) => { setToast(t); setTimeout(() => setToast(''), 1800); };
  const onSwap = (i) => {
    if (!canEdit) return flash(location ? 'Carregant exercicis…' : 'El lloc d\'aquest entrenament ja no existeix');
    update(swapExercise(workout, i, ctx));
  };
  const onLock = (i) => update(toggleLock(workout, i));
  const onRegenerate = () => {
    if (!canEdit) return flash(location ? 'Carregant exercicis…' : 'El lloc d\'aquest entrenament ja no existeix');
    update(regenerateWorkout(workout, ctx));
  };
  const onSave = () => { save(workout); flash('Entrenament desat'); };

  const chips = [
    ['check', LEVEL_LABELS[workout.level], 'Nivell'],
    ['dumbbell', `${workout.exercises.length} · ${workout.blocks.length} bl.`, 'Exercicis'],
    ['target', workout.goalLabel, 'Objectiu'],
    ['clock', `~${workout.estimatedMin} min`, 'Durada'],
    ['pin', workout.locationName, 'Lloc'],
  ];

  return (
    <div className="pb-28">
      <div className="px-4 pt-4 sm:px-6">
        <Link to="/" className="inline-flex min-h-tap items-center gap-1 text-accent-soft"><Icon name="chevronLeft" size={18} /> Inici</Link>
      </div>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-6">
        <section className="lg:sticky lg:top-4 lg:self-start">
          <div className="card overflow-hidden">
            <div className="flex items-start justify-between gap-3 p-5 pb-3">
              <div>
                <h1 className="text-2xl font-extrabold leading-tight" data-testid="workout-title">{workout.title}</h1>
                <p className="text-sm text-ink-soft">Fet amb el material de {workout.locationName}</p>
              </div>
              <button type="button" onClick={onRegenerate} aria-label="Regenera l'entrenament" title="Regenera (respecta els bloquejats)"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft">
                <Icon name="refresh" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-px border-y border-line bg-line text-center sm:grid-cols-5 lg:grid-cols-3">
              {chips.map(([icon, val, label]) => (
                <div key={label} className="bg-emerald-950/30 px-2 py-2 last:col-span-2 sm:last:col-span-1 lg:last:col-span-2">
                  <div className="flex items-center justify-center gap-1 text-sm font-bold"><Icon name={icon} size={14} className="text-emerald-400" /> <span className="truncate">{val}</span></div>
                  <div className="text-[11px] text-ink-soft">{label}</div>
                </div>
              ))}
            </div>
            <div className="p-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              <BodyMap mode="fatigue" levels={levels} views="both" maxWidth={150} />
              <FatigueLegend />
            </div>
          </div>
          {workout.notes?.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              {workout.notes.map((n) => <p key={n}>{n}</p>)}
            </div>
          )}
        </section>

        <section className="mt-4 space-y-4 lg:mt-0">
          {!ready && <div className="card p-6 text-center text-ink-soft">Carregant exercicis…</div>}
          {ready && (
            <>
              <ItemList title="1. Escalfament" items={workout.warmup} byId={byId} testId="warmup" />
              {workout.blocks.map((b) => (
                <div key={b.index} className="space-y-3" data-testid="block">
                  <div className="flex flex-wrap items-end justify-between gap-2 px-1 pt-2">
                    <h2 className="text-xl font-extrabold">{b.index + 2}. {b.label}: {b.entries.map((i) => workout.exercises[i].pos).join(' → ')}</h2>
                    <span className="text-sm text-ink-soft">{b.rounds} rondes · canvi {b.transitionSec} s · descans {b.restAfterRoundSec} s</span>
                  </div>
                  <p className="px-1 text-sm text-ink-soft">Fes {b.entries.map((i) => workout.exercises[i].pos).join(', ')} seguits, descansa i repeteix fins a {b.rounds} rondes.</p>
                  {b.entries.map((i) => (
                    <ExerciseCard key={`${workout.exercises[i].exerciseId}-${i}`} entry={workout.exercises[i]} ex={byId[workout.exercises[i].exerciseId]} onSwap={() => onSwap(i)} onLock={() => onLock(i)} />
                  ))}
                </div>
              ))}
              <ItemList title={`${workout.blocks.length + 2}. Estiraments`} items={workout.cooldown} byId={byId} testId="cooldown" />
            </>
          )}
          {ready && workout.exercises.length === 0 && (
            <div className="card p-6 text-center text-ink-soft">
              No hi ha cap exercici realitzable amb aquest material i aquests músculs. Afegeix material al lloc o tria altres músculs.
            </div>
          )}
        </section>
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 pt-3 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-5xl gap-3">
          <button type="button" className="btn-primary flex-1" onClick={onSave}>
            <Icon name="save" size={18} /> {workout.saved ? 'Desat ✓' : <>Desar<span className="hidden sm:inline">&nbsp;entrenament</span></>}
          </button>
          <button type="button" className="btn-ghost flex-1" onClick={() => nav(`/entrenament/${workout.id}/fer`)}>
            <Icon name="play" size={18} /> Començar
          </button>
        </div>
      </div>
      {toast && <div role="status" className="fixed inset-x-0 bottom-24 z-40 mx-auto w-fit rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg shadow-lg">{toast}</div>}
    </div>
  );
}

export function itemLabel(it, byId) {
  if (it.name) return it.name;
  return exerciseName(byId[it.exerciseId]) || it.exerciseId;
}

export function itemAmount(it) {
  if (it.reps && !it.seconds) return `${it.reps} reps`;
  if (it.reps) return `${it.reps} reps`;
  const s = it.seconds || 30;
  const t = s >= 60 ? `${Math.round(s / 6) / 10} min`.replace('.', ',') : `${s} s`;
  return it.perSide ? `${t} per costat` : t;
}

function ItemList({ title, items, byId, testId }) {
  return (
    <div className="card p-4" data-testid={testId}>
      <h2 className="mb-2 text-xl font-extrabold">{title}</h2>
      <ol className="divide-y divide-line">
        {items.map((it, k) => (
          <li key={k} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="min-w-0">{itemLabel(it, byId)}</span>
            <span className="shrink-0 font-semibold text-accent-soft">{itemAmount(it)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
