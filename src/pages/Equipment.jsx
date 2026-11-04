import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import { useInventoryStore } from '../store/inventoryStore.js';
import { useExercises } from '../data/useExercises.js';
import { LOCATION_KINDS, locationSummary, locationCapabilities } from '../core/inventory.js';
import { feasibility } from '../core/requirements.js';
import templates from '../data/templates.json';

export function useFeasibleCount(location) {
  const { exercises, ready } = useExercises();
  return useMemo(() => {
    if (!ready || !location) return null;
    const caps = locationCapabilities(location);
    let ok = 0;
    let adapted = 0;
    for (const e of exercises) {
      if (e.category !== 'strength' && e.category !== 'plyometrics') continue;
      const f = feasibility(e, caps, location.constraints);
      if (f.ok) { ok++; if (f.adapted) adapted++; }
    }
    return { ok, adapted };
  }, [exercises, ready, location]);
}

export default function Equipment() {
  const locations = useInventoryStore((s) => s.locations);
  const [params] = useSearchParams();
  const [open, setOpen] = useState(params.get('nou') === '1');
  const back = params.get('tornar') === 'assistent' ? { to: '/assistent/lloc', label: 'Assistent' } : undefined;
  return (
    <div>
      <PageHeader eyebrow="El meu arsenal" title="Llocs i material" subtitle="Cada lloc té el seu material. Detalla'l tant com vulguis." back={back}
        right={<button type="button" className="btn-primary shrink-0" onClick={() => setOpen(true)}><Icon name="plus" size={18} /> Nou</button>} />
      <ul className="grid gap-3 px-4 sm:grid-cols-2 sm:px-6" data-testid="locations">
        {locations.map((l) => <li key={l.id}><LocationCard loc={l} tornar={params.get('tornar')} /></li>)}
      </ul>
      <NewLocationModal open={open} onClose={() => setOpen(false)} tornar={params.get('tornar')} />
    </div>
  );
}

function LocationCard({ loc, tornar }) {
  const duplicate = useInventoryStore((s) => s.duplicate);
  const remove = useInventoryStore((s) => s.removeLocation);
  const count = useFeasibleCount(loc);
  const [confirm, setConfirm] = useState(false);
  const kind = LOCATION_KINDS.find((k) => k.id === loc.kind)?.name;
  return (
    <div className="card p-4">
      <Link to={`/material/${loc.id}${tornar ? `?tornar=${tornar}` : ''}`} className="block">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{loc.name}</h2>
          <span className="chip">{kind}</span>
        </div>
        <p className="mt-1 text-sm text-ink-soft">{locationSummary(loc)}</p>
        <p className="mt-1 text-sm text-accent-soft">{count ? `${count.ok} exercicis realitzables${count.adapted ? ` (${count.adapted} adaptats)` : ''}` : 'Calculant…'}</p>
      </Link>
      <div className="mt-3 flex gap-2">
        <Link to={`/material/${loc.id}${tornar ? `?tornar=${tornar}` : ''}`} className="btn-ghost flex-1 text-sm"><Icon name="edit" size={16} /> Editar</Link>
        <button type="button" className="btn-ghost text-sm" onClick={() => duplicate(loc.id)} aria-label={`Duplica ${loc.name}`}><Icon name="copy" size={16} /></button>
        <button type="button" className="btn-ghost text-sm" onClick={() => setConfirm(true)} aria-label={`Esborra ${loc.name}`}><Icon name="trash" size={16} /></button>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title={`Esborrar «${loc.name}»?`}
        footer={<div className="flex gap-2"><button type="button" className="btn-ghost flex-1" onClick={() => setConfirm(false)}>Cancel·la</button><button type="button" className="btn flex-1 bg-red-600 text-white" onClick={() => { remove(loc.id); setConfirm(false); }}>Esborra</button></div>}>
        <p className="text-sm text-ink-soft">Es perdrà el material detallat d'aquest lloc. Els entrenaments desats no s'esborren.</p>
      </Modal>
    </div>
  );
}

function NewLocationModal({ open, onClose, tornar }) {
  const nav = useNavigate();
  const addFromTemplate = useInventoryStore((s) => s.addFromTemplate);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('home');
  const [tpl, setTpl] = useState('home-basic');
  const create = () => {
    const t = templates.find((x) => x.id === tpl);
    const loc = addFromTemplate(tpl, name.trim() || t?.name || 'Nou lloc', kind);
    onClose();
    nav(`/material/${loc.id}${tornar ? `?tornar=${tornar}` : ''}`);
  };
  return (
    <Modal open={open} onClose={onClose} title="Nou lloc"
      footer={<button type="button" className="btn-primary w-full" onClick={create}>Crear i detallar</button>}>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink-soft">Nom</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="P. ex. Casa dels pares" />
        </label>
        <div>
          <span className="mb-1 block text-sm font-semibold text-ink-soft">Tipus</span>
          <div className="flex flex-wrap gap-1.5">
            {LOCATION_KINDS.map((k) => (
              <button key={k.id} type="button" onClick={() => setKind(k.id)} aria-pressed={kind === k.id}
                className={`min-h-[40px] rounded-full border px-3 text-sm ${kind === k.id ? 'border-accent bg-accent/15 text-accent-soft' : 'border-line'}`}>{k.name}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1 block text-sm font-semibold text-ink-soft">Comença des d'una plantilla</span>
          <div className="space-y-2">
            {[...templates, { id: 'empty', name: 'Buit', description: 'Sense cap element: ho afegeixes tu.' }].map((t) => (
              <button key={t.id} type="button" onClick={() => setTpl(t.id)} aria-pressed={tpl === t.id}
                className={`w-full rounded-xl border p-3 text-left ${tpl === t.id ? 'border-accent bg-accent/10' : 'border-line bg-bg'}`}>
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-ink-soft">{t.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
