import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import ExerciseImage from '../components/ExerciseImage.jsx';
import { useExercises, exerciseName } from '../data/useExercises.js';
import { useWorkoutStore } from '../store/workoutStore.js';
import { useHistoryStore } from '../store/historyStore.js';
import { useLiveStore, stepElapsed } from '../store/liveStore.js';
import { buildTimeline, timelineSeconds, nextExerciseStep, summarizeSession } from '../core/session.js';
import { newId } from '../core/inventory.js';
import { formatKg } from '../core/loads.js';
import { itemAmount } from './Result.jsx';

const mmss = (sec) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const PHASE = { warmup: 'Escalfament', cooldown: 'Estiraments' };
const REST_TITLE = { transition: 'Canvi d\'exercici', round: 'Descans de ronda', block: 'Canvi de bloc' };

// So: xiulets curts amb Web Audio (sense veu)
function useBeeper(enabled) {
  const ctxRef = useRef(null);
  const unlock = useCallback(() => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    } catch { /* sense àudio */ }
  }, []);
  const beep = useCallback((long = false) => {
    if (!enabled || !ctxRef.current) return;
    try {
      const ctx = ctxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = long ? 660 : 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (long ? 0.6 : 0.15));
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + (long ? 0.65 : 0.2));
    } catch { /* res */ }
  }, [enabled]);
  return { unlock, beep };
}

// Mantenir la pantalla encesa (si el navegador ho permet)
function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    let cancelled = false;
    const req = () => navigator.wakeLock.request('screen').then((l) => { if (cancelled) l.release(); else lock = l; }).catch(() => {});
    req();
    const onVis = () => { if (document.visibilityState === 'visible') req(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVis); lock?.release().catch(() => {}); };
  }, [active]);
}

export default function Live() {
  const { id } = useParams();
  const nav = useNavigate();
  const { byId, ready } = useExercises();
  const workout = useWorkoutStore((s) => s.saved.find((w) => w.id === id) || (s.current?.id === id ? s.current : null));
  const live = useLiveStore();
  const addLog = useHistoryStore((s) => s.add);
  const steps = useMemo(() => (workout ? buildTimeline(workout) : []), [workout]);
  const active = live.workoutId === id && !!workout;
  const { unlock, beep } = useBeeper(live.sound);
  const [now, setNow] = useState(Date.now());
  const [exitOpen, setExitOpen] = useState(false);
  const beeped = useRef({ index: -1, marks: new Set() });
  useWakeLock(active);

  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [active]);

  const step = active ? steps[live.index] : null;
  const elapsed = active ? stepElapsed(live, now) : 0;
  const timed = step && (step.seconds != null || step.phase === 'rest');
  const duration = step ? (timed ? step.seconds ?? step.estSec : live.mode === 'auto' ? step.estSec : null) : null;
  const remaining = duration != null ? duration - elapsed : null;
  const running = !!live.runningSince;

  const finish = useCallback(() => {
    const log = summarizeSession({ workout, steps, log: live.log, startedAt: live.startedAt, endedAt: Date.now(), id: newId('s') });
    addLog(log);
    live.clear();
    nav(`/historial/${log.id}`, { replace: true });
  }, [workout, steps, live, addLog, nav]);

  const next = useCallback(() => {
    unlock();
    const s = steps[live.index];
    if (s?.phase === 'main' && !live.log[s.id]?.done) {
      live.logStep(s.id, { done: true, reps: live.log[s.id]?.reps ?? s.reps?.high ?? null, kg: live.log[s.id]?.kg ?? s.loadKg ?? null });
    }
    if (live.index >= steps.length - 1) finish();
    else live.goTo(live.index + 1);
  }, [steps, live, finish, unlock]);

  // Xiulets i avanç automàtic
  useEffect(() => {
    if (!active || remaining == null || !running) return;
    if (beeped.current.index !== live.index) beeped.current = { index: live.index, marks: new Set() };
    const marks = beeped.current.marks;
    for (const m of [3, 2, 1]) {
      if (remaining <= m && remaining > m - 1 && !marks.has(m)) { marks.add(m); beep(false); }
    }
    if (remaining <= 0 && !marks.has(0)) {
      marks.add(0);
      beep(true);
    }
  }, [active, remaining, running, live.index, beep]);

  // Mode automàtic: en acabar el temps del pas, passa al següent (també si s'activa amb el temps ja exhaurit)
  const advanced = useRef(-1);
  useEffect(() => {
    if (!active || live.mode !== 'auto' || !running || remaining == null || remaining > 0) return;
    if (advanced.current === live.index) return;
    advanced.current = live.index;
    next();
  }, [active, live.mode, running, remaining, live.index, next]);

  if (!workout) {
    return <div className="p-6 text-center"><p className="mb-4 text-ink-soft">No he trobat aquesta sessió.</p><Link to="/" className="btn-primary">Inici</Link></div>;
  }

  // ---------- Pantalla d'inici ----------
  if (!active) {
    const other = live.workoutId && live.workoutId !== id;
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col px-4 pb-8 pt-6">
        <Link to={`/entrenament/${id}`} className="mb-4 inline-flex min-h-tap items-center gap-1 text-accent-soft"><Icon name="chevronLeft" size={18} /> Sessió</Link>
        <div className="h-eyebrow mb-1">Sessió en directe</div>
        <h1 className="text-3xl font-extrabold leading-tight">{workout.title}</h1>
        <p className="mt-2 text-ink-soft">~{Math.round(timelineSeconds(steps) / 60)} min · {workout.blocks.length} blocs · {steps.filter((s) => s.phase === 'main').length} sèries · {workout.locationName}</p>
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-soft">Com vols avançar?</h2>
          {[['manual', 'Manual', 'Passes tu a l\'exercici següent quan acabes. Els descansos tenen compte enrere.'], ['auto', 'Automàtic', 'Passa sol amb un temps aproximat per exercici i els descansos. Pots pausar o saltar.']].map(([m, t, d]) => (
            <button key={m} type="button" onClick={() => live.setMode(m)} aria-pressed={live.mode === m}
              className={`w-full rounded-2xl border p-4 text-left ${live.mode === m ? 'border-accent bg-accent/10' : 'border-line bg-card'}`}>
              <div className={`font-bold ${live.mode === m ? 'text-accent-soft' : ''}`}>{t}</div>
              <div className="text-sm text-ink-soft">{d}</div>
            </button>
          ))}
          <label className="flex min-h-tap items-center justify-between rounded-2xl border border-line bg-card px-4">
            <span>Xiulets als descansos (sense veu)</span>
            <input type="checkbox" checked={live.sound} onChange={(e) => live.setSound(e.target.checked)} className="h-5 w-5 accent-[#2f5bea]" />
          </label>
          {other && <p className="text-sm text-amber-300">Tens una altra sessió a mitges. Si comences aquesta, aquella es descarta.</p>}
        </div>
        <div className="mt-auto pt-8">
          <button type="button" className="btn-primary w-full text-lg" data-testid="live-start" onClick={() => { unlock(); live.start(id); }}>
            <Icon name="play" /> Començar
          </button>
        </div>
      </div>
    );
  }

  // ---------- Sessió en curs ----------
  const ex = step.exerciseId ? byId[step.exerciseId] : null;
  const entry = step.phase === 'main' ? workout.exercises[step.entryIndex] : null;
  const after = nextExerciseStep(steps, live.index);
  const totalElapsed = (now - live.startedAt) / 1000;
  const progress = (live.index / Math.max(1, steps.length - 1)) * 100;
  const logged = live.log[step.id] || {};
  const reps = logged.reps ?? step.reps?.high ?? null;
  const kg = logged.kg ?? step.loadKg ?? null;
  const kgOptions = entry?.load?.chips?.map((c) => c.kg) || (kg ? [kg] : []);
  const title = step.phase === 'rest' ? REST_TITLE[step.kind] : step.title || (ex ? exerciseName(ex) : '');
  const label = step.phase === 'main' ? `${step.blockLabel} · Ronda ${step.round}/${step.rounds}` : step.phase === 'rest' ? 'Descans' : PHASE[step.phase];
  const stepNameOf = (s) => (s ? (s.title || (s.exerciseId ? exerciseName(byId[s.exerciseId]) : '')) : '');

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col" data-testid="live">
      <header className="sticky top-0 z-20 bg-bg/95 px-4 pb-2 pt-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setExitOpen(true)} aria-label="Sortir" className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft"><Icon name="close" /></button>
          <div className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} /></div>
            <div className="mt-1 flex justify-between text-[11px] text-ink-soft"><span>Pas {live.index + 1} de {steps.length}</span><span>{mmss(totalElapsed)}</span></div>
          </div>
          <div className="flex rounded-lg border border-line p-0.5 text-xs" role="group" aria-label="Mode">
            {[['manual', 'Manual'], ['auto', 'Auto']].map(([m, t]) => (
              <button key={m} type="button" onClick={() => live.setMode(m)} aria-pressed={live.mode === m}
                className={`min-h-[36px] rounded-md px-2 font-semibold ${live.mode === m ? 'bg-accent text-white' : 'text-ink-soft'}`}>{t}</button>
            ))}
          </div>
          <button type="button" onClick={() => live.setSound(!live.sound)} aria-label={live.sound ? 'Silencia' : 'Activa el so'} className="flex h-11 w-9 items-center justify-center text-ink-soft">
            <Icon name={live.sound ? 'bell' : 'bellOff'} size={18} />
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 pb-36">
        <div className="mt-2 flex items-center gap-2">
          {step.phase === 'main' && <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-extrabold text-white">{step.pos}</span>}
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent-soft" data-testid="live-phase">{label}</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight" data-testid="live-title">{title}</h1>

        {step.phase === 'rest' ? (
          <div className="flex flex-1 flex-col items-center justify-center py-6">
            <div className="text-7xl font-extrabold tabular-nums" data-testid="live-timer">{mmss(remaining)}</div>
            <div className="mt-6 flex gap-2">
              <button type="button" className="btn-ghost" onClick={() => live.addTime(15)}>+15 s</button>
              <button type="button" className="btn-ghost" onClick={next}>Saltar descans</button>
            </div>
            {after && <p className="mt-8 text-center text-ink-soft">Ara toca: <span className="font-semibold text-ink">{after.pos ? `${after.pos}. ` : ''}{stepNameOf(after)}</span></p>}
          </div>
        ) : (
          <>
            {(ex || entry) && (
              <div className="mx-auto mt-3 w-full" style={{ maxWidth: '52vh' }}><ExerciseImage ex={ex} primary={entry?.primary || []} secondary={entry?.secondary || []} /></div>
            )}
            <div className="mt-4 text-4xl font-extrabold leading-tight" data-testid="live-target">
              {step.phase === 'main'
                ? (step.seconds ? `${step.seconds} s` : step.reps.low === step.reps.high ? `${step.reps.low} reps` : `${step.reps.low}–${step.reps.high} reps`)
                : itemAmount({ seconds: step.perSide ? step.seconds / 2 : step.seconds, reps: step.reps?.low, perSide: step.perSide })}
              {step.perSide && step.phase === 'main' && <span className="text-xl text-ink-soft"> per costat</span>}
            </div>
            {step.phase === 'main' && (step.setup || kg) && <p className="mt-1 text-lg text-accent-soft">{kg && kg !== step.loadKg ? `${formatKg(kg)} kg` : step.setup || `${formatKg(kg)} kg`}</p>}
            {step.phase === 'main' && <p className="mt-1 text-sm text-ink-soft">RIR {step.rir ?? 1}{step.tempo ? ` · Tempo ${step.tempo}` : ''}</p>}
            {step.phase === 'warmup' && step.loadKg != null && <p className="mt-1 text-lg text-accent-soft">{formatKg(step.loadKg)} kg</p>}

            {remaining != null && (
              <div className={`mt-4 text-5xl font-extrabold tabular-nums ${remaining <= 3 ? 'text-fat-3' : ''}`} data-testid="live-timer">{mmss(remaining)}</div>
            )}

            {step.phase === 'main' && !step.seconds && (
              <div className="card mt-4 p-3" data-testid="live-log">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-ink-soft">Reps fetes</span>
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label="Una rep menys" className="flex h-11 w-11 items-center justify-center rounded-xl border border-line" onClick={() => live.logStep(step.id, { reps: Math.max(0, (reps || 0) - 1), kg })}><Icon name="minus" /></button>
                    <span className="w-10 text-center text-2xl font-extrabold tabular-nums">{reps ?? '–'}</span>
                    <button type="button" aria-label="Una rep més" className="flex h-11 w-11 items-center justify-center rounded-xl border border-line" onClick={() => live.logStep(step.id, { reps: (reps || 0) + 1, kg })}><Icon name="plus" /></button>
                  </div>
                </div>
                {kgOptions.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {kgOptions.map((k) => (
                      <button key={k} type="button" aria-pressed={k === kg} onClick={() => live.logStep(step.id, { kg: k, reps })}
                        className={`min-h-[36px] rounded-full border px-3 text-sm font-semibold ${k === kg ? 'border-accent bg-accent text-white' : 'border-line'}`}>{formatKg(k)} kg</button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {after && <p className="mt-4 text-sm text-ink-soft">Després: <span className="font-semibold text-ink">{after.pos ? `${after.pos}. ` : ''}{stepNameOf(after)}</span></p>}
          </>
        )}
      </main>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg gap-2">
          <button type="button" className="btn-ghost w-16 shrink-0" aria-label="Pas anterior" disabled={live.index === 0} onClick={() => live.goTo(live.index - 1)}><Icon name="chevronLeft" /></button>
          {(live.mode === 'auto' || timed) && (
            <button type="button" className="btn-ghost w-16 shrink-0" aria-label={running ? 'Pausa' : 'Continua'} onClick={() => (running ? live.pause() : live.resume())}>
              <Icon name={running ? 'pause' : 'play'} />
            </button>
          )}
          <button type="button" className="btn-primary flex-1 text-lg" data-testid="live-next" onClick={next}>
            {live.index >= steps.length - 1 ? 'Acabar' : step.phase === 'main' ? 'Fet · Següent' : 'Següent'} <Icon name="chevronRight" />
          </button>
        </div>
      </div>

      <Modal open={exitOpen} onClose={() => setExitOpen(false)} title="Sortir de la sessió?">
        <div className="space-y-2">
          <button type="button" className="btn-ghost w-full" onClick={() => { live.pause(); nav(`/entrenament/${id}`); }}>Pausar i continuar més tard</button>
          <button type="button" className="btn-primary w-full" onClick={finish}>Acabar ara i desar a l'historial</button>
          <button type="button" className="btn w-full text-red-400" onClick={() => { live.clear(); nav(`/entrenament/${id}`); }}>Descartar la sessió</button>
        </div>
      </Modal>
    </div>
  );
}
