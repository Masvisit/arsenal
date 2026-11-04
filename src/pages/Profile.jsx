import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { useProfileStore } from '../store/profileStore.js';
import { useWizardStore } from '../store/wizardStore.js';
import { GOAL_LABELS, LEVEL_LABELS } from '../core/prescription.js';
import { epley1RM } from '../core/ratios.js';
import { formatKg } from '../core/loads.js';
import { APP_VERSION, BUILD_DATE } from '../version.js';

const LIFTS = [
  ['bench', 'Press de banca'],
  ['squat', 'Esquat'],
  ['deadlift', 'Pes mort'],
  ['ohp', 'Press militar'],
  ['row', 'Rem'],
];
const LIMITS = { shoulder: 'Espatlla', elbow: 'Colze', wrist: 'Canell', lowerBack: 'Lumbar', knee: 'Genoll', ankle: 'Turmell' };

export default function Profile() {
  const nav = useNavigate();
  const { profile, completed, setProfile } = useProfileStore();
  const start = useWizardStore((s) => s.start);
  const refs = profile.referenceLifts || {};
  const setRef = (key, patch) => setProfile({ referenceLifts: { ...refs, [key]: { ...(refs[key] || {}), ...patch } } });
  const n = (v) => (v === '' ? null : Number(v));

  return (
    <div>
      <PageHeader title="Perfil" subtitle={completed ? 'Les dades del teu perfil ajusten nivells i càrregues.' : 'Encara no has fet l\'assistent.'} />
      <div className="space-y-4 px-4 sm:px-6">
        <section className="card p-4">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="Sexe" value={profile.sex === 'female' ? 'Dona' : 'Home'} />
            <Stat label="Edat" value={`${profile.age} anys`} />
            <Stat label="Pes" value={profile.bodyWeightKg ? `${formatKg(profile.bodyWeightKg)} kg` : '–'} />
            <Stat label="Alçada" value={profile.heightCm ? `${profile.heightCm} cm` : '–'} />
            <Stat label="Objectiu" value={GOAL_LABELS[profile.goal]} />
            <Stat label="Nivell" value={LEVEL_LABELS[profile.level]} />
            <Stat label="Molèsties" value={profile.limitations.length ? profile.limitations.map((l) => LIMITS[l]).join(', ') : 'Cap'} />
          </div>
          <button type="button" className="btn-ghost mt-4 w-full" onClick={() => { start('full'); nav('/assistent/cos'); }}>
            <Icon name="edit" size={18} /> {completed ? 'Canviar el perfil (assistent)' : 'Fer l\'assistent'}
          </button>
        </section>

        <section className="card p-4">
          <h2 className="font-bold">Aixecaments de referència</h2>
          <p className="mb-3 text-sm text-ink-soft">Opcionals. "X kg × Y reps" → 1RM estimat (Epley, fins a 10 reps). Si n'hi ha, les càrregues es calculen a partir d'aquí.</p>
          <ul className="space-y-2">
            {LIFTS.map(([key, label]) => {
              const r = refs[key] || {};
              const rm = r.kg && r.reps ? epley1RM(r.kg, r.reps) : null;
              return (
                <li key={key} className="flex flex-wrap items-center gap-2">
                  <span className="w-32 text-sm">{label}</span>
                  <input aria-label={`${label}: kg`} type="number" inputMode="decimal" className="input h-10 min-h-0 w-20" placeholder="kg" value={r.kg ?? ''} onChange={(e) => setRef(key, { kg: n(e.target.value) })} />
                  <span className="text-ink-soft">×</span>
                  <input aria-label={`${label}: reps`} type="number" inputMode="numeric" className="input h-10 min-h-0 w-20" placeholder="reps" value={r.reps ?? ''} onChange={(e) => setRef(key, { reps: n(e.target.value) })} />
                  <span className="text-xs text-accent-soft">{rm ? `1RM ≈ ${formatKg(Math.round(rm * 2) / 2)} kg` : r.reps > 10 ? 'Massa reps per estimar' : ''}</span>
                </li>
              );
            })}
            <li className="flex flex-wrap items-center gap-2">
              <span className="w-32 text-sm">Dominades màx.</span>
              <input aria-label="Dominades màximes" type="number" className="input h-10 min-h-0 w-20" value={refs.pullups ?? ''} onChange={(e) => setProfile({ referenceLifts: { ...refs, pullups: n(e.target.value) } })} />
            </li>
            <li className="flex flex-wrap items-center gap-2">
              <span className="w-32 text-sm">Flexions màx.</span>
              <input aria-label="Flexions màximes" type="number" className="input h-10 min-h-0 w-20" value={refs.pushups ?? ''} onChange={(e) => setProfile({ referenceLifts: { ...refs, pushups: n(e.target.value) } })} />
            </li>
            <li className="flex flex-wrap items-center gap-2">
              <span className="w-32 text-sm">Reps a 40 kg en 45 s</span>
              <input aria-label="Repeticions a 40 kg en 45 segons" type="number" className="input h-10 min-h-0 w-20" value={refs.bench40in45 ?? ''} onChange={(e) => setProfile({ referenceLifts: { ...refs, bench40in45: n(e.target.value) } })} />
            </li>
          </ul>
        </section>
      </div>
      <footer className="px-4 py-8 text-center text-xs text-ink-soft" data-testid="version">
        Arsenal v{APP_VERSION} · {BUILD_DATE}
        <div className="mt-1">Exercicis i fotos: free-exercise-db (domini públic). Tot es desa al teu dispositiu.</div>
      </footer>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs text-ink-soft">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
