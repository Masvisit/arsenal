import { useId, useState } from 'react';
import Icon from './Icon.jsx';
import { formatKg } from '../core/loads.js';

const num = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')));

// Editors dels atributs d'un element del catàleg (nivell 2: quantitats/pesos; nivell 3: avançat)
export default function FieldEditor({ field, value, onChange }) {
  const id = useId();
  switch (field.type) {
    case 'weights':
      return <WeightsEditor field={field} value={value || []} onChange={onChange} />;
    case 'plates':
      return <PlatesEditor field={field} value={value || []} onChange={onChange} />;
    case 'bool':
      return (
        <label className="flex min-h-tap items-center justify-between gap-3">
          <span className="text-sm">{field.label}</span>
          <input type="checkbox" className="h-6 w-11 cursor-pointer appearance-none rounded-full bg-line transition before:block before:h-6 before:w-6 before:rounded-full before:bg-ink-soft before:transition checked:bg-accent checked:before:translate-x-5 checked:before:bg-white"
            checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        </label>
      );
    case 'select':
      return (
        <label className="block" htmlFor={id}>
          <span className="mb-1 block text-sm">{field.label}</span>
          <select id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      );
    case 'multi':
      return (
        <div>
          <span className="mb-1 block text-sm">{field.label}</span>
          <div className="flex flex-wrap gap-1.5">
            {field.options.map((o) => {
              const on = (value || []).includes(o);
              return (
                <button key={o} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...(value || []), o].sort((a, b) => a - b))}
                  className={`min-h-[36px] rounded-full border px-3 text-sm ${on ? 'border-accent bg-accent/15 text-accent-soft' : 'border-line'}`}>{o}{field.unit}</button>
              );
            })}
          </div>
        </div>
      );
    case 'text':
      return (
        <label className="block" htmlFor={id}>
          <span className="mb-1 block text-sm">{field.label}</span>
          <input id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
    case 'number':
    default:
      return (
        <label className="flex items-center justify-between gap-3" htmlFor={id}>
          <span className="text-sm">{field.label}</span>
          <span className="flex items-center gap-2">
            <input id={id} type="number" inputMode="decimal" step={field.step || 1} className="input w-24 text-right" value={value ?? ''}
              onChange={(e) => onChange(num(e.target.value))} />
            {field.unit && <span className="w-6 text-sm text-ink-soft">{field.unit}</span>}
          </span>
        </label>
      );
  }
}

function WeightsEditor({ field, value, onChange }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = num(draft);
    if (!(v > 0)) return;
    onChange([...value, v].sort((a, b) => a - b));
    setDraft('');
  };
  return (
    <div>
      <span className="mb-1 block text-sm">{field.label}</span>
      <div className="flex flex-wrap gap-1.5">
        {value.map((w, i) => (
          <span key={`${w}-${i}`} className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-line bg-bg pl-3 text-sm">
            {formatKg(w)} {field.unit}
            <button type="button" aria-label={`Treu ${w}`} onClick={() => onChange(value.filter((_, k) => k !== i))} className="flex h-9 w-9 items-center justify-center text-ink-soft"><Icon name="close" size={14} /></button>
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <input type="number" inputMode="decimal" placeholder={field.unit} value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()} className="input h-9 min-h-0 w-20 rounded-full text-sm" aria-label={`Nou valor (${field.unit})`} />
          <button type="button" onClick={add} className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white" aria-label="Afegeix"><Icon name="plus" size={16} /></button>
        </span>
      </div>
    </div>
  );
}

function PlatesEditor({ field, value, onChange }) {
  const [kg, setKg] = useState('');
  const set = (i, qty) => onChange(value.map((p, k) => (k === i ? { ...p, qty: Math.max(0, qty) } : p)).filter((p) => p.qty > 0));
  const add = () => {
    const v = num(kg);
    if (!(v > 0)) return;
    const ex = value.findIndex((p) => p.kg === v);
    if (ex >= 0) set(ex, value[ex].qty + 2);
    else onChange([...value, { kg: v, qty: 2 }].sort((a, b) => a.kg - b.kg));
    setKg('');
  };
  return (
    <div>
      <span className="mb-1 block text-sm">{field.label}</span>
      <ul className="space-y-1">
        {value.map((p, i) => (
          <li key={p.kg} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-bg px-3 py-1">
            <span className="font-semibold">{formatKg(p.kg)} kg</span>
            <span className="flex items-center gap-1">
              <button type="button" onClick={() => set(i, p.qty - 1)} aria-label={`Un disc de ${p.kg} kg menys`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line"><Icon name="minus" size={16} /></button>
              <span className="w-12 text-center text-sm">× {p.qty}</span>
              <button type="button" onClick={() => set(i, p.qty + 1)} aria-label={`Un disc de ${p.kg} kg més`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line"><Icon name="plus" size={16} /></button>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-2">
        <input type="number" inputMode="decimal" placeholder="kg" value={kg} onChange={(e) => setKg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()}
          className="input h-10 min-h-0 w-24" aria-label="Pes del disc nou" />
        <button type="button" onClick={add} className="btn-ghost min-h-[40px] text-sm"><Icon name="plus" size={16} /> Afegir parell</button>
      </div>
      <p className="mt-1 text-xs text-ink-soft">Els discs només compten per parells (un a cada costat).</p>
    </div>
  );
}
