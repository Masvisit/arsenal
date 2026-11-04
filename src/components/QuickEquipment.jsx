import { QUICK_TILES } from '../core/catalog.js';
import { activeQuickTiles, toggleQuickTile, selectAllQuickTiles } from '../core/inventory.js';
import Icon from './Icon.jsx';

// Vista ràpida de material com a l'original: graella de 8 caselles amb multiselecció.
export default function QuickEquipment({ location, onChange }) {
  const active = activeQuickTiles(location);
  const all = active.length === QUICK_TILES.length;
  const tile = (key, label, icon, on, onClick) => (
    <button key={key} type="button" onClick={onClick} aria-pressed={on}
      className={`relative flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-xl border px-2 text-sm transition ${on ? 'border-accent bg-accent/10 text-accent-soft' : 'border-line bg-card text-ink'}`}>
      {on && <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white"><Icon name="check" size={10} strokeWidth={3} /></span>}
      <Icon name={icon} size={28} strokeWidth={1.5} />
      <span className="text-center leading-tight">{label}</span>
    </button>
  );
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {tile('all', 'Tot', 'grid', all, () => onChange(all ? QUICK_TILES.reduce((l, t) => toggleQuickTile(l, t.id), location) : selectAllQuickTiles(location)))}
        {QUICK_TILES.map((t) => tile(t.id, t.name, t.icon, active.includes(t.id), () => onChange(toggleQuickTile(location, t.id))))}
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-accent-soft">
        {active.length} {active.length === 1 ? 'tipus seleccionat' : 'tipus seleccionats'} · {location.items.length} elements en total
      </p>
    </div>
  );
}
