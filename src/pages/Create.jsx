import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import BodyMap, { FatigueLegend } from '../components/BodyMap.jsx';
import { useProfileStore } from '../store/profileStore.js';
import { useWizardStore } from '../store/wizardStore.js';

// Previsualització del mapa (dades d'exemple: empenta de tren superior + cames)
const DEMO_LEVELS = { chest: 5, 'front-delts': 4, triceps: 4, quads: 3, glutes: 2, abs: 2, 'side-delts': 3, calves: 1, hamstrings: 1, lats: 2 };

export function useStartToday() {
  const nav = useNavigate();
  const completed = useProfileStore((s) => s.completed);
  const start = useWizardStore((s) => s.start);
  return () => {
    if (completed) { start('quick'); nav('/assistent/lloc'); } else { start('full'); nav('/assistent/cos'); }
  };
}

export default function Create() {
  const startToday = useStartToday();
  return (
    <div className="px-4 pb-6 pt-4 sm:px-6">
      <Link to="/" className="inline-flex min-h-tap items-center gap-1 text-accent-soft"><Icon name="chevronLeft" size={18} /> Inici</Link>
      <header className="mb-6 mt-2 text-center">
        <div className="h-eyebrow mb-2">Crear</div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Com vols entrenar?</h1>
        <p className="mt-2 text-ink-soft">Comença de zero o deixa que Arsenal planifiqui amb el teu material.</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <button type="button" onClick={startToday} className="card flex w-full items-center gap-4 p-5 text-left transition active:scale-[0.99]" data-testid="create-today">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-soft"><Icon name="bolt" size={28} /></span>
            <span className="min-w-0 flex-1">
              <span className="h-eyebrow">Ràpid i centrat</span>
              <span className="mt-1 block text-xl font-bold">Generar l'entrenament d'avui</span>
              <span className="mt-1 block text-sm text-ink-soft">Una sessió feta a mida dels teus músculs, el teu material i el teu objectiu.</span>
              <span className="mt-2 flex gap-3 text-xs text-ink-soft"><span className="flex items-center gap-1"><Icon name="clock" size={14} /> ~30 s</span><span className="flex items-center gap-1"><Icon name="target" size={14} /> Una sessió</span></span>
            </span>
            <Icon name="arrowRight" className="shrink-0 text-accent-soft" />
          </button>

          <div className="card flex items-center gap-4 p-5 opacity-80">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-400"><Icon name="calendar" size={28} /></span>
            <span className="min-w-0 flex-1">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400">Programa complet</span>
              <span className="ml-2 chip border-pink-500/40 py-0 text-pink-300">Properament</span>
              <span className="mt-1 block text-xl font-bold">Generar un pla setmanal</span>
              <span className="mt-1 block text-sm text-ink-soft">Una rutina equilibrada de 3–6 dies per progressar de manera constant.</span>
              <span className="mt-2 flex gap-3 text-xs text-ink-soft"><span className="flex items-center gap-1"><Icon name="calendar" size={14} /> 3–6 dies</span><span>Progressiu</span></span>
            </span>
          </div>

          <div className="card border-accent/50 p-5">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-soft"><Icon name="dumbbell" size={28} /></span>
              <span className="min-w-0 flex-1">
                <span className="h-eyebrow">Control total</span>
                <span className="mt-1 block text-xl font-bold">Construir manualment</span>
                <span className="mt-1 block text-sm text-ink-soft">Tria cada exercici, sèrie i repetició de tota la biblioteca.</span>
                <span className="mt-2 flex gap-3 text-xs text-ink-soft"><span>Mapa muscular en directe</span><span>· Desat automàtic</span></span>
              </span>
            </div>
            <button type="button" disabled className="btn-primary mt-4 w-full">Obrir el constructor · Properament</button>
            <p className="mt-2 text-center text-xs text-ink-soft">Sense registre: tot es desa al teu dispositiu.</p>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-center text-sm font-semibold text-ink-soft">Previsualització del mapa muscular</h2>
          <BodyMap mode="fatigue" levels={DEMO_LEVELS} views="both" maxWidth={170} />
          <FatigueLegend label="Volum: poc → molt" />
        </div>
      </div>
    </div>
  );
}
