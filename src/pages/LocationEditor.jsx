import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import QuickEquipment from '../components/QuickEquipment.jsx';
import FieldEditor from '../components/FieldEditor.jsx';
import { useInventoryStore } from '../store/inventoryStore.js';
import { CATALOG, CATEGORIES, CATALOG_BY_ID, itemAttrs } from '../core/catalog.js';
import { LOCATION_KINDS, makeItem, DEFAULT_CONSTRAINTS } from '../core/inventory.js';
import { itemLoadOptions, formatKg } from '../core/loads.js';
import { useFeasibleCount } from './Equipment.jsx';

export default function LocationEditor() {
  const { llocId } = useParams();
  const [params] = useSearchParams();
  const loc = useInventoryStore((s) => s.locations.find((l) => l.id === llocId));
  const update = useInventoryStore((s) => s.updateLocation);
  const count = useFeasibleCount(loc);
  const [openCat, setOpenCat] = useState(null);
  const fromWizard = params.get('tornar') === 'assistent';
  const back = fromWizard ? { to: '/assistent/lloc', label: 'Tornar a l\'assistent' } : { to: '/material', label: 'Llocs' };

  if (!loc) {
    return <div className="p-6 text-center"><p className="mb-4 text-ink-soft">Aquest lloc no existeix.</p><Link to="/material" className="btn-primary">Llocs</Link></div>;
  }
  const c = { ...DEFAULT_CONSTRAINTS, ...loc.constraints };
  const setC = (patch) => update(loc.id, (l) => ({ ...l, constraints: { ...DEFAULT_CONSTRAINTS, ...l.constraints, ...patch } }));
  const has = (id) => loc.items.find((i) => i.catalogId === id);
  const toggleItem = (id) => update(loc.id, (l) => (l.items.some((i) => i.catalogId === id)
    ? { ...l, items: l.items.filter((i) => i.catalogId !== id) }
    : { ...l, items: [...l.items, makeItem(id)] }));
  const setAttr = (uid, key, value) => update(loc.id, (l) => ({ ...l, items: l.items.map((i) => (i.uid === uid ? { ...i, attrs: { ...i.attrs, [key]: value } } : i)) }));

  return (
    <div className="pb-6">
      <header className="px-4 pt-5 sm:px-6">
        <Link to={back.to} className="mb-2 inline-flex min-h-tap items-center gap-1 text-accent-soft"><Icon name="chevronLeft" size={18} /> {back.label}</Link>
        <input aria-label="Nom del lloc" className="w-full bg-transparent text-2xl font-extrabold outline-none sm:text-3xl" value={loc.name}
          onChange={(e) => update(loc.id, { name: e.target.value })} />
        <p className="mt-1 text-sm text-accent-soft" data-testid="feasible-count">
          {count ? `${count.ok} exercicis realitzables aquí${count.adapted ? ` · ${count.adapted} adaptats` : ''}` : 'Calculant…'}
        </p>
      </header>

      <div className="mt-4 grid gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="space-y-4">
          <section className="card p-4">
            <h2 className="mb-3 font-bold">Tipus i restriccions</h2>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {LOCATION_KINDS.map((k) => (
                <button key={k.id} type="button" onClick={() => update(loc.id, { kind: k.id })} aria-pressed={loc.kind === k.id}
                  className={`min-h-[40px] rounded-full border px-3 text-sm ${loc.kind === k.id ? 'border-accent bg-accent/15 text-accent-soft' : 'border-line'}`}>{k.name}</button>
              ))}
            </div>
            <div className="divide-y divide-line">
              <FieldEditor field={{ key: 'noJumps', label: 'Sense salts (veïns, lesions…)', type: 'bool' }} value={c.noJumps} onChange={(v) => setC({ noJumps: v })} />
              <FieldEditor field={{ key: 'lowCeiling', label: 'Sostre baix (res per sobre del cap amb barra)', type: 'bool' }} value={c.lowCeiling} onChange={(v) => setC({ lowCeiling: v })} />
              <FieldEditor field={{ key: 'fragileFloor', label: 'Terra delicat (no deixar caure pes)', type: 'bool' }} value={c.fragileFloor} onChange={(v) => setC({ fragileFloor: v })} />
              <div className="py-2"><FieldEditor field={{ key: 'runSpaceM', label: 'Metres lliures per córrer', type: 'number', unit: 'm' }} value={c.runSpaceM} onChange={(v) => setC({ runSpaceM: v || 0 })} /></div>
            </div>
          </section>
          <section className="card p-4">
            <h2 className="mb-1 font-bold">Vista ràpida</h2>
            <p className="mb-3 text-sm text-ink-soft">Marca el que hi ha. Després detalla pesos i atributs a sota.</p>
            <QuickEquipment location={loc} onChange={(l) => update(loc.id, l)} />
          </section>
        </div>

        <section className="space-y-2" data-testid="catalog">
          {CATEGORIES.map((cat) => {
            const items = CATALOG.filter((x) => x.cat === cat.id);
            const n = items.filter((x) => has(x.id)).length;
            const isOpen = openCat === cat.id || (openCat === null && cat.id === 'free');
            return (
              <div key={cat.id} className="card overflow-hidden">
                <button type="button" onClick={() => setOpenCat(isOpen ? '' : cat.id)} aria-expanded={isOpen}
                  className="flex min-h-[56px] w-full items-center justify-between px-4 text-left">
                  <span className="font-bold">{cat.name}</span>
                  <span className="flex items-center gap-2 text-sm text-ink-soft">{n} / {items.length}<Icon name="chevronDown" size={18} className={`transition ${isOpen ? 'rotate-180' : ''}`} /></span>
                </button>
                {isOpen && (
                  <ul className="divide-y divide-line border-t border-line">
                    {items.map((item) => <CatalogRow key={item.id} item={item} inst={has(item.id)} loc={loc} onToggle={() => toggleItem(item.id)} setAttr={setAttr} />)}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

function CatalogRow({ item, inst, loc, onToggle, setAttr }) {
  const [advanced, setAdvanced] = useState(false);
  const attrs = inst ? itemAttrs(inst) : null;
  const lvl2 = item.fields.filter((f) => f.level === 2);
  const lvl3 = item.fields.filter((f) => f.level === 3);
  let loads = null;
  if (inst && CATALOG_BY_ID[item.id]?.load) {
    const opts = itemLoadOptions(inst, loc);
    if (opts.length) {
      const kgs = opts.map((o) => o.kg);
      loads = opts.length <= 8 ? kgs.map(formatKg).join(', ') + ' kg' : `${formatKg(kgs[0])}–${formatKg(kgs.at(-1))} kg (${opts.length} càrregues)`;
    } else if (['barbell_olympic', 'barbell_standard', 'barbell_ez', 'trap_bar'].includes(item.id)) {
      loads = 'Només la barra: afegeix discs del mateix diàmetre';
    }
  }
  return (
    <li className="px-4 py-2" data-testid={`item-${item.id}`}>
      <label className="flex min-h-tap cursor-pointer items-center gap-3">
        <input type="checkbox" checked={!!inst} onChange={onToggle} className="h-5 w-5 accent-[#2f5bea]" />
        <span className="flex-1">
          <span className="font-medium">{item.name}</span>
          {item.pro && <span className="chip ml-2 py-0 text-[10px]">pro</span>}
        </span>
      </label>
      {inst && (
        <div className="mb-2 ml-8 space-y-3">
          {item.equiv && <p className="text-xs text-ink-soft">Equival a: {item.equiv}</p>}
          {item.safety && <p className="text-xs text-amber-300/90">⚠︎ {item.safety}</p>}
          {lvl2.map((f) => <FieldEditor key={f.key} field={f} value={attrs[f.key]} onChange={(v) => setAttr(inst.uid, f.key, v)} />)}
          {loads && <p className="text-xs text-accent-soft" data-testid={`loads-${item.id}`}>Càrregues: {loads}</p>}
          {lvl3.length > 0 && (
            <>
              <button type="button" onClick={() => setAdvanced((a) => !a)} className="inline-flex min-h-[36px] items-center gap-1 text-sm font-semibold text-accent-soft">
                {advanced ? 'Amaga l\'avançat' : 'Avançat'} <Icon name="chevronDown" size={16} className={advanced ? 'rotate-180' : ''} />
              </button>
              {advanced && lvl3.map((f) => <FieldEditor key={f.key} field={f} value={attrs[f.key]} onChange={(v) => setAttr(inst.uid, f.key, v)} />)}
            </>
          )}
        </div>
      )}
    </li>
  );
}
