import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import BodyMap, { FatigueLegend } from '../components/BodyMap.jsx';
import { useHistoryStore } from '../store/historyStore.js';
import { useExercises, exerciseName } from '../data/useExercises.js';
import { weekSummary, weeklySeries, setsByTarget, weekStreak, bestSets } from '../core/history.js';
import { fatigueLevels } from '../core/fatigue.js';
import { TARGET_LABELS } from '../core/muscles.js';
import { formatKg } from '../core/loads.js';

const fmtDate = (ms) => new Date(ms).toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtTime = (ms) => new Date(ms).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
const min = (sec) => `${Math.round(sec / 60)} min`;
const kgTotal = (kg) => (kg >= 1000 ? `${formatKg(Math.round(kg / 100) / 10)} t` : `${kg} kg`);

export default function History() {
  const logs = useHistoryStore((s) => s.logs);
  const week = weekSummary(logs);
  const series = weeklySeries(logs, 8);
  const sets = setsByTarget(logs, 7);
  const levels = fatigueLevels(sets);
  const streak = weekStreak(logs);
  const maxS = Math.max(1, ...series.map((x) => x.sessions));
  const muscles = Object.entries(sets).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <PageHeader eyebrow="Seguiment" title="Historial" subtitle="Les sessions que has fet, setmana a setmana." />
      <div className="space-y-4 px-4 sm:px-6">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="week-summary">
          {[['Sessions aquesta setmana', week.sessions], ['Minuts', week.minutes], ['Sèries', week.sets], ['Setmanes seguides', streak]].map(([l, v]) => (
            <div key={l} className="card p-4">
              <div className="text-3xl font-extrabold">{v}</div>
              <div className="text-xs text-ink-soft">{l}</div>
            </div>
          ))}
        </section>

        {logs.length === 0 ? (
          <div className="card p-6 text-center text-ink-soft">
            <p>Encara no has acabat cap sessió.</p>
            <p className="mt-1 text-sm">Genera una sessió i prem "Començar": en acabar, apareixerà aquí.</p>
            <Link to="/crear" className="mt-3 inline-flex min-h-tap items-center gap-1 font-semibold text-accent-soft">Crear una sessió <Icon name="arrowRight" size={16} /></Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="card p-4">
                <h2 className="mb-3 font-bold">Sessions per setmana</h2>
                <div className="flex h-32 items-end gap-2" aria-label="Sessions per setmana, les últimes 8 setmanes">
                  {series.map((w) => (
                    <div key={w.start} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-xs font-semibold">{w.sessions || ''}</span>
                      <div className="w-full rounded-t-md bg-accent" style={{ height: `${(w.sessions / maxS) * 88}px`, minHeight: w.sessions ? 6 : 2, opacity: w.sessions ? 1 : 0.25 }} />
                      <span className="text-[10px] text-ink-soft">{new Date(w.start).getDate()}/{new Date(w.start).getMonth() + 1}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="card p-4">
                <h2 className="mb-1 font-bold">Sèries per múscul · últims 7 dies</h2>
                <BodyMap mode="fatigue" levels={levels} views="both" maxWidth={120} />
                <FatigueLegend label="Volum" />
                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {muscles.map(([t, n]) => <li key={t} className="flex justify-between"><span className="text-ink-soft">{TARGET_LABELS[t]}</span><span className="font-semibold">{formatKg(n)}</span></li>)}
                </ul>
              </section>
            </div>

            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-soft">Sessions</h2>
              <ul className="space-y-3" data-testid="history-list">
                {logs.map((l) => (
                  <li key={l.id}>
                    <Link to={`/historial/${l.id}`} className="card flex items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-lg font-bold">{l.title}</div>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-ink-soft">
                          <span>{fmtDate(l.endedAt)} · {fmtTime(l.startedAt)}</span>
                          <span>{min(l.durationSec)}</span>
                          <span>{l.setsDone}/{l.setsPlanned} sèries</span>
                          {l.volumeKg > 0 && <span>{kgTotal(l.volumeKg)}</span>}
                          <span>{l.locationName}</span>
                        </div>
                      </div>
                      <Icon name="chevronRight" className="text-ink-soft" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export function HistoryDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { byId } = useExercises();
  const log = useHistoryStore((s) => s.logs.find((l) => l.id === id));
  const all = useHistoryStore((s) => s.logs);
  const remove = useHistoryStore((s) => s.remove);
  const [confirm, setConfirm] = useState(false);
  const best = useMemo(() => bestSets(all.filter((l) => l.id !== id)), [all, id]);
  if (!log) return <div className="p-6 text-center"><p className="mb-4 text-ink-soft">No he trobat aquesta sessió.</p><Link to="/historial" className="btn-primary">Historial</Link></div>;

  // agrupat per exercici, en ordre d'aparició
  const groups = [];
  for (const s of log.sets) {
    let g = groups.find((x) => x.exerciseId === s.exerciseId && x.block === s.block);
    if (!g) { g = { exerciseId: s.exerciseId, block: s.block, pos: s.pos, sets: [] }; groups.push(g); }
    g.sets.push(s);
  }
  return (
    <div>
      <PageHeader back={{ to: '/historial', label: 'Historial' }} eyebrow={`${fmtDate(log.endedAt)} · ${fmtTime(log.startedAt)}`} title={log.title}
        subtitle={`${min(log.durationSec)} · ${log.setsDone}/${log.setsPlanned} sèries${log.volumeKg ? ` · ${kgTotal(log.volumeKg)} mogudes` : ''} · ${log.locationName}`} />
      <div className="space-y-3 px-4 sm:px-6" data-testid="history-detail">
        {groups.length === 0 && <div className="card p-6 text-center text-ink-soft">No es va registrar cap sèrie.</div>}
        {groups.map((g) => {
          const top = Math.max(...g.sets.map((s) => s.loadKg || 0));
          const pr = top > 0 && (!best[g.exerciseId] || top > best[g.exerciseId].loadKg);
          return (
            <div key={`${g.block}-${g.exerciseId}`} className="card p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-extrabold text-white">{g.pos}</span>
                <h3 className="font-bold">{exerciseName(byId[g.exerciseId]) || g.exerciseId}</h3>
                {pr && <span className="chip border-emerald-500/40 text-emerald-300">Rècord</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-sm">
                {g.sets.map((s, k) => (
                  <span key={k} className="rounded-lg border border-line bg-bg px-2 py-1">
                    {s.seconds ? `${s.seconds} s` : `${s.reps ?? '–'} reps`}{s.loadKg ? ` × ${formatKg(s.loadKg)} kg` : ''}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        <button type="button" className="btn w-full text-red-400" onClick={() => setConfirm(true)}><Icon name="trash" size={18} /> Esborrar aquesta sessió</button>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Esborrar la sessió?"
        footer={<div className="flex gap-2"><button type="button" className="btn-ghost flex-1" onClick={() => setConfirm(false)}>Cancel·la</button><button type="button" className="btn flex-1 bg-red-600 text-white" onClick={() => { remove(log.id); nav('/historial'); }}>Esborra</button></div>}>
        <p className="text-sm text-ink-soft">Desapareixerà de l'historial i de les estadístiques.</p>
      </Modal>
    </div>
  );
}
