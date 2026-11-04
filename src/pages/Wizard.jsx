import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import OptionCard from '../components/OptionCard.jsx';
import Modal from '../components/Modal.jsx';
import BodyMap from '../components/BodyMap.jsx';
import QuickEquipment from '../components/QuickEquipment.jsx';
import { useProfileStore } from '../store/profileStore.js';
import { useInventoryStore } from '../store/inventoryStore.js';
import { useWizardStore } from '../store/wizardStore.js';
import { GOAL_LABELS, LEVEL_LABELS, DURATIONS } from '../core/prescription.js';
import { MUSCLE_GROUPS, TARGET_LABELS, toggleSlug, selectionToSlugs } from '../core/muscles.js';
import { locationSummary, LOCATION_KINDS } from '../core/inventory.js';

export const ALL_STEPS = [
  { id: 'cos', icon: 'body', label: 'Cos' },
  { id: 'objectiu', icon: 'trophy', label: 'Objectiu' },
  { id: 'nivell', icon: 'bolt', label: 'Nivell' },
  { id: 'lloc', icon: 'pin', label: 'Lloc' },
  { id: 'temps', icon: 'clock', label: 'Temps' },
  { id: 'muscles', icon: 'heart', label: 'Músculs' },
];
const QUICK = ['lloc', 'temps', 'muscles'];

const GOALS = [
  { id: 'muscle', icon: 'heart', sub: 'Hipertròfia: 6–15 reps a prop del fallo' },
  { id: 'strength', icon: 'barbell', sub: 'Poques reps amb molta càrrega' },
  { id: 'fatloss', icon: 'flame', sub: 'Circuits i descansos curts' },
  { id: 'endurance', icon: 'layers', sub: '15–25+ reps' },
  { id: 'power', icon: 'bolt', sub: 'Moviments explosius i salts' },
  { id: 'agentRural', icon: 'target', sub: 'Press banca a 40 kg, potència de cames i core' },
];

const LEVELS = [
  { id: 'novice', icon: 'sparkles' },
  { id: 'beginner', icon: 'gauge' },
  { id: 'intermediate', icon: 'bolt' },
  { id: 'advanced', icon: 'trophy' },
];

// Text propi, valors orientatius (secció 6)
const LEVEL_INFO = {
  novice: ['0–3 mesos entrenant', 'Menys de 5 flexions', '0 dominades'],
  beginner: ['3–9 mesos entrenant', '5–15 flexions', '1–4 dominades', 'Press banca ≈ 0,6–0,8 × pes corporal'],
  intermediate: ['9–24 mesos entrenant', '15–30 flexions', '5–12 dominades', 'Press banca ≈ 1 × pes corporal', 'Esquat ≈ 1,25 × pes corporal', 'Pes mort ≈ 1,5 × pes corporal'],
  advanced: ['Més de 2 anys entrenant', '30+ flexions', '12+ dominades', 'Press banca ≥ 1,25 × pes corporal', 'Esquat ≥ 1,75 × pes corporal', 'Pes mort ≥ 2 × pes corporal'],
};
const FEMALE_NOTE = 'Per a dones, les referències de força solen ser un 30–40 % més baixes.';

const LIMITS = [
  ['shoulder', 'Espatlla'], ['elbow', 'Colze'], ['wrist', 'Canell'], ['lowerBack', 'Lumbar'], ['knee', 'Genoll'], ['ankle', 'Turmell'],
];

export default function Wizard() {
  const { pas } = useParams();
  const nav = useNavigate();
  const mode = useWizardStore((s) => s.mode);
  const steps = mode === 'quick' ? ALL_STEPS.filter((s) => QUICK.includes(s.id)) : ALL_STEPS;
  const idx = steps.findIndex((s) => s.id === pas);
  if (idx < 0) return <Navigate to={`/assistent/${steps[0].id}`} replace />;
  const step = steps[idx];
  const go = (i) => nav(`/assistent/${steps[i].id}`);
  return <WizardStep key={step.id} step={step} idx={idx} steps={steps} go={go} mode={mode} />;
}

function WizardStep({ step, idx, steps, go, mode }) {
  const nav = useNavigate();
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const complete = useProfileStore((s) => s.complete);
  const wiz = useWizardStore();
  const locations = useInventoryStore((s) => s.locations);
  const updateLocation = useInventoryStore((s) => s.updateLocation);
  const [info, setInfo] = useState(null);
  const [groupsOpen, setGroupsOpen] = useState(false);

  const locationId = wiz.locationId && locations.some((l) => l.id === wiz.locationId) ? wiz.locationId : (profile.defaultLocationId || locations[0]?.id);
  const location = locations.find((l) => l.id === locationId);
  const selSlugs = selectionToSlugs(wiz.targets);
  const toggle = (slug) => wiz.set({ targets: toggleSlug(wiz.targets, slug) });

  const isLast = idx === steps.length - 1;
  const canNext = step.id !== 'lloc' || !!location;
  const next = () => {
    if (step.id === 'lloc' && location) {
      wiz.set({ locationId: location.id });
      setProfile({ defaultLocationId: location.id });
    }
    go(idx + 1);
  };
  const generate = () => {
    if (!wiz.targets.length || !location) return;
    wiz.set({ locationId: location.id });
    complete();
    nav('/generant');
  };

  let title = '';
  let subtitle = '';
  let body = null;

  switch (step.id) {
    case 'cos':
      title = 'Comencem';
      subtitle = 'El tipus de cos ajusta les referències de nivell';
      body = (
        <div className="space-y-6">
          <div className="space-y-3">
            <OptionCard selected={profile.sex === 'male'} onClick={() => setProfile({ sex: 'male' })} icon="male" title="Home" subtitle="Model i referències masculines" />
            <OptionCard selected={profile.sex === 'female'} onClick={() => setProfile({ sex: 'female' })} icon="female" title="Dona" subtitle="Model i referències femenines" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink-soft" htmlFor="age">Edat</label>
            <div className="flex items-end gap-3">
              <div className="rounded-xl border border-line px-5 py-2 text-center text-3xl font-bold text-accent-soft">{profile.age}</div>
              <span className="pb-2 text-sm text-ink-soft">anys</span>
            </div>
            <input id="age" type="range" min={14} max={90} value={profile.age} onChange={(e) => setProfile({ age: Number(e.target.value) })} className="mt-4 h-11 w-full accent-[#2f5bea]" />
            <div className="flex justify-between text-xs text-ink-soft"><span>14</span><span>90</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Pes corporal" unit="kg" value={profile.bodyWeightKg} min={30} max={250} onChange={(v) => setProfile({ bodyWeightKg: v })} />
            <NumberField label="Alçada (opcional)" unit="cm" value={profile.heightCm ?? ''} min={120} max={230} onChange={(v) => setProfile({ heightCm: v || null })} />
          </div>
        </div>
      );
      break;
    case 'objectiu':
      title = 'El teu objectiu';
      subtitle = 'Tria l\'objectiu principal de l\'entrenament';
      body = (
        <div className="space-y-3">
          {GOALS.map((g) => (
            <OptionCard key={g.id} selected={profile.goal === g.id} onClick={() => setProfile({ goal: g.id })} icon={g.icon} title={GOAL_LABELS[g.id]} subtitle={g.sub} />
          ))}
        </div>
      );
      break;
    case 'nivell':
      title = 'El teu nivell';
      subtitle = 'Ajusta la intensitat i la complexitat dels exercicis';
      body = (
        <div className="space-y-3">
          {LEVELS.map((l) => (
            <OptionCard key={l.id} selected={profile.level === l.id} onClick={() => setProfile({ level: l.id })} icon={l.icon} title={LEVEL_LABELS[l.id]}
              action={(
                <button type="button" aria-label={`Informació sobre ${LEVEL_LABELS[l.id]}`} onClick={() => setInfo(l.id)}
                  className="flex h-11 w-11 items-center justify-center text-accent-soft"><Icon name="info" /></button>
              )} />
          ))}
          <Modal open={!!info} onClose={() => setInfo(null)} title="Nivell de forma">
            <p className="mb-4 text-sm text-ink-soft">Valors orientatius: hi ha molta variació entre persones. Serveixen per situar-te, no per examinar-te.</p>
            {info && (
              <>
                <h3 className="mb-2 font-bold text-accent-soft">{LEVEL_LABELS[info]}</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm">{LEVEL_INFO[info].map((x) => <li key={x}>{x}</li>)}</ul>
                {profile.sex === 'female' && <p className="mt-3 text-xs text-ink-soft">{FEMALE_NOTE}</p>}
              </>
            )}
          </Modal>
        </div>
      );
      break;
    case 'lloc':
      title = 'On entrenes avui?';
      subtitle = 'Tria el lloc: només sortiran exercicis amb el material que hi tens';
      body = (
        <div className="space-y-5">
          <div className="space-y-3">
            {locations.map((l) => (
              <OptionCard key={l.id} selected={l.id === locationId} onClick={() => wiz.set({ locationId: l.id })}
                icon={l.kind === 'gym' ? 'barbell' : l.kind === 'park' ? 'tree' : l.kind === 'garden' ? 'tree' : 'home2'}
                title={l.name} subtitle={`${LOCATION_KINDS.find((k) => k.id === l.kind)?.name || ''} · ${locationSummary(l)}`} />
            ))}
            <Link to="/material?nou=1&tornar=assistent" className="btn-ghost w-full"><Icon name="plus" size={18} /> Crear un lloc nou</Link>
          </div>
          {location && (
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-bold">Material de {location.name}</h3>
                <Link to={`/material/${location.id}?tornar=assistent`} className="inline-flex min-h-tap items-center gap-1 text-sm font-semibold text-accent-soft">
                  Detallar <Icon name="chevronRight" size={16} />
                </Link>
              </div>
              <QuickEquipment location={location} onChange={(loc) => updateLocation(location.id, loc)} />
            </div>
          )}
        </div>
      );
      break;
    case 'temps':
      title = 'Temps i molèsties';
      subtitle = 'Quant temps tens i si alguna articulació et fa mal';
      body = (
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink-soft">Durada</h3>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <button key={d} type="button" onClick={() => wiz.set({ durationMin: d })} aria-pressed={wiz.durationMin === d}
                  className={`min-h-[52px] rounded-xl border font-bold ${wiz.durationMin === d ? 'border-accent bg-accent/10 text-accent-soft' : 'border-line bg-card'}`}>{d} min</button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink-soft">Molèsties (s'eviten exercicis de risc)</h3>
            <div className="grid grid-cols-2 gap-2">
              {LIMITS.map(([id, label]) => {
                const on = profile.limitations.includes(id);
                return (
                  <OptionCard key={id} multi selected={on} title={label}
                    onClick={() => setProfile({ limitations: on ? profile.limitations.filter((x) => x !== id) : [...profile.limitations, id] })} />
                );
              })}
            </div>
          </div>
        </div>
      );
      break;
    case 'muscles':
      title = 'Què vols treballar?';
      subtitle = 'Toca els músculs al mapa o fes servir els grups';
      body = (
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-accent-soft" data-testid="muscle-count">
              {wiz.targets.length} {wiz.targets.length === 1 ? 'múscul seleccionat' : 'músculs seleccionats'}
            </span>
            <div className="flex gap-2">
              {wiz.targets.length > 0 && <button type="button" onClick={() => wiz.set({ targets: [] })} className="btn-ghost min-h-[40px] px-3 text-sm">Esborra</button>}
              <button type="button" onClick={() => setGroupsOpen(true)} className="btn-primary min-h-[40px] px-3 text-sm">Grups <Icon name="chevronDown" size={16} /></button>
            </div>
          </div>
          <div className="md:hidden"><BodyMap slugs={selSlugs} onToggle={toggle} views="auto" maxWidth={190} /></div>
          {wiz.targets.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {wiz.targets.map((t) => <span key={t} className="chip border-accent/40 text-accent-soft">{TARGET_LABELS[t]}</span>)}
            </div>
          )}
          <Modal open={groupsOpen} onClose={() => setGroupsOpen(false)} title="Grups musculars">
            <div className="space-y-2">
              {MUSCLE_GROUPS.map((g) => (
                <button key={g.id} type="button" onClick={() => { wiz.set({ targets: [...g.targets] }); setGroupsOpen(false); }}
                  className="w-full rounded-xl border border-line bg-bg p-3 text-left">
                  <div className="font-semibold">{g.name}</div>
                  <div className="text-xs text-ink-soft">{g.targets.map((t) => TARGET_LABELS[t]).join(', ')}</div>
                </button>
              ))}
            </div>
          </Modal>
        </div>
      );
      break;
    default:
      break;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Stepper steps={steps} idx={idx} go={go} />
      <div className={`mx-auto w-full max-w-5xl flex-1 px-4 pb-36 sm:px-6 md:grid md:gap-6 ${step.id === 'muscles' ? 'md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]' : 'md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]'}`}>
        <section className="card p-5">
          <h1 className="h-step">{title}</h1>
          <p className="mb-5 mt-1 text-sm text-ink-soft">{subtitle}</p>
          {body}
          {mode === 'quick' && idx === 0 && (
            <p className="mt-6 text-center text-sm text-ink-soft">
              Perfil: {GOAL_LABELS[profile.goal]} · {LEVEL_LABELS[profile.level]} ·{' '}
              <button type="button" className="font-semibold text-accent-soft underline" onClick={() => { wiz.set({ mode: 'full' }); nav('/assistent/cos'); }}>Canviar perfil</button>
            </p>
          )}
        </section>
        <aside className="hidden md:block">
          <div className="card sticky top-4 p-5">
            <div className="mb-3 text-center text-sm font-semibold text-ink-soft">
              {step.id === 'muscles' ? 'Toca per seleccionar' : 'Músculs seleccionats'}
            </div>
            <BodyMap slugs={selSlugs} onToggle={step.id === 'muscles' ? toggle : undefined} views="both" maxWidth={step.id === 'muscles' ? 240 : 200} />
          </div>
        </aside>
      </div>
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl gap-3">
          {isLast ? (
            <>
              <button type="button" className="btn-ghost w-28 shrink-0" onClick={() => (idx === 0 ? nav('/crear') : go(idx - 1))}>
                <Icon name="arrowLeft" size={18} /> Enrere
              </button>
              <button type="button" className="btn-primary flex-1 text-lg" disabled={!wiz.targets.length || !location} onClick={generate}>
                <Icon name="sparkles" /> Generar
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-ghost flex-1" onClick={() => (idx === 0 ? nav('/crear') : go(idx - 1))}>
                <Icon name="arrowLeft" size={18} /> Enrere
              </button>
              <button type="button" className="btn-primary flex-1" disabled={!canNext} onClick={next}>
                Següent <Icon name="arrowRight" size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ steps, idx, go }) {
  return (
    <div className="pt-safe">
      <div className="h-1 w-full bg-line"><div className="h-1 bg-accent transition-all" style={{ width: `${((idx + 1) / steps.length) * 100}%` }} /></div>
      <ol className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
        {steps.map((s, i) => {
          const done = i < idx;
          const cur = i === idx;
          return (
            <li key={s.id} className="flex flex-1 items-center last:flex-none">
              <button type="button" onClick={() => i < idx && go(i)} disabled={i > idx} aria-label={s.label} aria-current={cur ? 'step' : undefined}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition ${done ? 'border-accent bg-accent text-white' : cur ? 'border-accent bg-accent/15 text-accent-soft' : 'border-line text-ink-soft'}`}>
                <Icon name={done ? 'check' : s.icon} size={20} strokeWidth={done ? 3 : 1.8} />
              </button>
              {i < steps.length - 1 && <span className={`mx-1 h-0.5 flex-1 ${i < idx ? 'bg-accent' : 'bg-line'}`} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function NumberField({ label, unit, value, onChange, min, max }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink-soft">{label}</span>
      <span className="flex items-center gap-2">
        <input type="number" inputMode="decimal" className="input text-lg font-semibold" value={value} min={min} max={max}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
        <span className="text-sm text-ink-soft">{unit}</span>
      </span>
    </label>
  );
}
