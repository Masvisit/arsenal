import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useWorkoutStore } from '../store/workoutStore.js';
import { useProfileStore } from '../store/profileStore.js';
import { useInventoryStore } from '../store/inventoryStore.js';
import { useStartToday } from './Create.jsx';
import { LEVEL_LABELS } from '../core/prescription.js';

const fmtDate = (ms) => new Date(ms).toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short' });

export default function Home() {
  const saved = useWorkoutStore((s) => s.saved);
  const current = useWorkoutStore((s) => s.current);
  const remove = useWorkoutStore((s) => s.remove);
  const completed = useProfileStore((s) => s.completed);
  const locations = useInventoryStore((s) => s.locations);
  const startToday = useStartToday();
  const lastUnsaved = current && !saved.some((w) => w.id === current.id) ? current : null;

  return (
    <div>
      <PageHeader eyebrow="Arsenal" title="Entrena amb el que tens" subtitle="Entrenaments de força fets amb el material real de cada lloc." />
      <div className="space-y-6 px-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={startToday} className="btn-primary min-h-[64px] text-lg" data-testid="home-generate">
            <Icon name="bolt" /> Generar l'entrenament d'avui
          </button>
          <Link to="/material" className="btn-ghost min-h-[64px]">
            <Icon name="dumbbell" /> El meu material · {locations.length} llocs
          </Link>
        </div>
        {!completed && (
          <p className="text-sm text-ink-soft">La primera vegada et farem unes preguntes (cos, objectiu i nivell). Després només caldrà triar lloc, temps i músculs.</p>
        )}

        {lastUnsaved && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-soft">Últim generat (sense desar)</h2>
            <WorkoutRow w={lastUnsaved} />
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-soft">Entrenaments desats</h2>
          {saved.length === 0 ? (
            <div className="card p-6 text-center text-ink-soft">
              <p>Encara no n'has desat cap.</p>
              <Link to="/crear" className="mt-3 inline-flex min-h-tap items-center gap-1 font-semibold text-accent-soft">Crea'n un <Icon name="arrowRight" size={16} /></Link>
            </div>
          ) : (
            <ul className="space-y-3" data-testid="saved-list">
              {saved.map((w) => <li key={w.id}><WorkoutRow w={w} onDelete={() => remove(w.id)} /></li>)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function WorkoutRow({ w, onDelete }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <Link to={`/entrenament/${w.id}`} className="min-w-0 flex-1">
        <div className="truncate text-lg font-bold">{w.title}</div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
          <span>{fmtDate(w.savedAt || w.createdAt)}</span>
          <span>{w.locationName}</span>
          <span>{w.exercises.length} exercicis</span>
          <span>~{w.estimatedMin} min</span>
          <span>{w.goalLabel}</span>
          <span>{LEVEL_LABELS[w.level]}</span>
        </div>
      </Link>
      {onDelete && (
        <button type="button" onClick={onDelete} aria-label={`Esborra ${w.title}`} className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft">
          <Icon name="trash" size={18} />
        </button>
      )}
      <Icon name="chevronRight" className="text-ink-soft" />
    </div>
  );
}
