import { useState } from 'react';
import Icon from './Icon.jsx';
import ExerciseImage from './ExerciseImage.jsx';
import BodyMap from './BodyMap.jsx';
import { exerciseName } from '../data/useExercises.js';
import { TARGET_LABELS, TARGET_TO_SLUGS } from '../core/muscles.js';
import { formatKg } from '../core/loads.js';
import labels from '../data/i18n/labels.ca.json';

function setText(s) {
  if (s.seconds) return `${s.seconds} s`;
  return s.repsLow === s.repsHigh ? `${s.repsLow} reps` : `${s.repsLow}–${s.repsHigh} reps`;
}

export default function ExerciseCard({ entry, ex, index, onSwap, onLock }) {
  const [open, setOpen] = useState(false);
  const [chip, setChip] = useState(null);
  if (!ex) return null;
  const name = exerciseName(ex);
  const material = entry.sets[0]?.loadSetup || entry.equipmentUsed?.[0] || (entry.load ? null : labels.equipment[ex.equipment ?? 'null'] || 'Pes corporal');
  const chosen = chip ?? entry.sets[0]?.loadKg;
  const isCa = !!ex.custom;
  return (
    <article className="card overflow-hidden p-4" data-testid="exercise-card" data-exercise-id={ex.id}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <ExerciseImage ex={ex} primary={entry.primary} secondary={entry.secondary} />
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{index + 1}. {TARGET_LABELS[entry.slot.target]}</div>
              <h3 className="text-lg font-bold leading-snug">{name}</h3>
              {material && <p className="mt-0.5 text-sm text-accent-soft" data-testid="load-setup">{material}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" onClick={onLock} aria-pressed={entry.locked} aria-label={entry.locked ? 'Desbloqueja' : 'Bloqueja'}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border ${entry.locked ? 'border-accent bg-accent/15 text-accent-soft' : 'border-line text-ink-soft'}`}>
                <Icon name={entry.locked ? 'lock' : 'unlock'} size={18} />
              </button>
              <button type="button" onClick={onSwap} aria-label="Canvia l'exercici" className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-ink-soft">
                <Icon name="refresh" size={18} />
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.adapted && <span className="chip border-amber-500/40 text-amber-300">Adaptat</span>}
            {entry.adaptationText && <span className="chip border-fat-3/40 text-fat-2">Material curt</span>}
            {entry.tempo && <span className="chip">Tempo {entry.tempo}</span>}
            {entry.emom && <span className="chip">EMOM</span>}
          </div>

          <div className="mt-3 flex gap-3">
            <ol className="flex-1 space-y-1 text-sm">
              {entry.sets.map((s, i) => (
                <li key={i} className="flex justify-between gap-3 border-b border-line/60 py-1 last:border-0">
                  <span className="text-ink-soft">Sèrie {i + 1}</span>
                  <span className="font-semibold">{setText(s)}{chosen ? ` · ${formatKg(chosen)} kg` : ''}</span>
                </li>
              )).slice(0, entry.emom ? 1 : undefined)}
              {entry.emom && <li className="text-xs text-ink-soft">… durant 10 minuts</li>}
            </ol>
            <div className="w-20 shrink-0">
              <BodyMap mode="mini" views="both" maxWidth={36} showLabels={false}
                slugs={entry.primary.flatMap((t) => TARGET_TO_SLUGS[t] || [])}
                secondarySlugs={entry.secondary.flatMap((t) => TARGET_TO_SLUGS[t] || [])} />
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            {entry.restSec ? `Descans ${entry.restSec} s` : 'Sense descans fix'} · RIR {entry.sets[0]?.rir ?? '–'}
            {entry.note ? ` · ${entry.note}` : ''}
          </p>
        </div>
      </div>

      {entry.load?.chips?.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-xs text-ink-soft">{entry.load.hint}</div>
          <div className="flex flex-wrap gap-1.5">
            {entry.load.chips.map((c) => (
              <button key={c.kg} type="button" title={c.setup} onClick={() => setChip(c.kg)} aria-pressed={c.kg === chosen}
                className={`min-h-[36px] rounded-full border px-3 text-sm font-semibold ${c.kg === chosen ? 'border-accent bg-accent text-white' : 'border-line bg-bg text-ink'}`}>
                {formatKg(c.kg)} kg
              </button>
            ))}
          </div>
          {chip != null && chip !== entry.sets[0]?.loadKg && (
            <p className="mt-1 text-xs text-accent-soft">{entry.load.chips.find((c) => c.kg === chip)?.setup}</p>
          )}
        </div>
      )}

      {entry.adaptationText && (
        <div className="mt-3 rounded-xl border border-fat-3/30 bg-fat-3/10 p-3 text-sm text-fat-2" data-testid="adaptation">
          <Icon name="warning" size={16} className="mr-1 inline -translate-y-0.5" />{entry.adaptationText}
        </div>
      )}
      {entry.adapted && entry.substitutionNotes?.length > 0 && (
        <p className="mt-2 text-sm text-amber-300/90">Adaptat: {entry.substitutionNotes.join(' · ')}</p>
      )}
      {entry.safety?.length > 0 && <p className="mt-1 text-xs text-ink-soft">⚠︎ {entry.safety.join(' ')}</p>}

      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="mt-3 flex min-h-tap w-full items-center justify-between rounded-xl border border-line px-3 text-sm font-semibold">
        Instruccions i per què aquest exercici
        <Icon name="chevronDown" size={18} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <h4 className="mb-1 font-semibold">Per què aquest exercici</h4>
            <p className="text-ink-soft">{entry.why}</p>
            <p className="mt-1 text-xs text-ink-soft">
              Principal: {entry.primary.map((t) => TARGET_LABELS[t]).join(', ') || '–'}
              {entry.secondary.length ? ` · Secundaris: ${entry.secondary.map((t) => TARGET_LABELS[t]).join(', ')}` : ''}
            </p>
          </div>
          <div>
            <h4 className="mb-1 flex items-center gap-2 font-semibold">Instruccions {!isCa && <span className="chip px-2 py-0 text-[10px]">EN</span>}</h4>
            <ol className="list-decimal space-y-1 pl-5 text-ink-soft" lang={isCa ? 'ca' : 'en'}>
              {(ex.instructions || []).map((t, i) => <li key={i}>{t}</li>)}
            </ol>
          </div>
        </div>
      )}
    </article>
  );
}
