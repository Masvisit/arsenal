import { useEffect, useRef, useState } from 'react';
import Model from 'react-body-highlighter';
import { FATIGUE_COLORS, levelsToBodyData } from '../core/fatigue.js';
import { SLUG_TO_TARGETS, TARGET_LABELS } from '../core/muscles.js';
import { ANTERIOR_POLYGONS, POSTERIOR_POLYGONS } from './bodyMapPolygons.js';

const SLUG_LABEL = (slug) => (SLUG_TO_TARGETS[slug]?.map((t) => TARGET_LABELS[t]).join(' i ')) || { head: 'Cap', knees: 'Genolls' }[slug] || slug;

// Etiqueta cada polígon amb el seu múscul (accessibilitat, teclat i proves automàtiques)
function useLabelPolygons(ref, interactive, onToggle, deps) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const cleanups = [];
    root.querySelectorAll('figure[data-view]').forEach((fig) => {
      const order = fig.dataset.view === 'anterior' ? ANTERIOR_POLYGONS : POSTERIOR_POLYGONS;
      fig.querySelectorAll('polygon').forEach((p, i) => {
        const slug = order[i];
        if (!slug) return;
        p.dataset.muscle = slug;
        const clickable = interactive && SLUG_TO_TARGETS[slug];
        if (clickable) {
          p.setAttribute('role', 'button');
          p.setAttribute('tabindex', '0');
          p.setAttribute('aria-label', SLUG_LABEL(slug));
          const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(slug); } };
          p.addEventListener('keydown', onKey);
          cleanups.push(() => p.removeEventListener('keydown', onKey));
        } else {
          p.removeAttribute('role');
          p.removeAttribute('tabindex');
          p.setAttribute('aria-hidden', 'true');
        }
      });
    });
    return () => cleanups.forEach((f) => f());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const BODY = '#3a404b';
const ACCENT = '#2f5bea';

/**
 * Mapa corporal frontal + posterior.
 * - mode "select": `slugs` pintats en blau; onToggle(slug) en tocar.
 * - mode "fatigue": `levels` (target → 1..5) amb el gradient groc → vermell.
 * views: 'both' (sempre els dos), 'auto' (pestanyes al mòbil, tots dos a partir de sm), 'front' | 'back'.
 */
export default function BodyMap({ mode = 'select', slugs = [], levels = {}, secondarySlugs = [], onToggle, views = 'both', className = '', maxWidth = 170, showLabels = true }) {
  const [tab, setTab] = useState('anterior');
  const ref = useRef(null);
  let data;
  let colors;
  if (mode === 'fatigue') {
    data = levelsToBodyData(levels);
    colors = FATIGUE_COLORS;
  } else if (mode === 'mini') {
    // principal = vermell, secundari = taronja
    data = [
      ...secondarySlugs.filter((s) => !slugs.includes(s)).map((s) => ({ name: s, muscles: [s], frequency: 1 })),
      ...slugs.map((s) => ({ name: s, muscles: [s], frequency: 2 })),
    ];
    colors = ['#fb923c', '#ef4444'];
  } else {
    data = slugs.map((s) => ({ name: s, muscles: [s], frequency: 1 }));
    colors = [ACCENT];
  }
  const interactive = !!onToggle;
  const handle = interactive ? ({ muscle }) => onToggle(muscle) : undefined;
  useLabelPolygons(ref, interactive, onToggle, [interactive, onToggle, tab, views, JSON.stringify(data)]);
  const model = (type) => (
    <figure data-view={type} className="flex flex-1 flex-col items-center" style={{ maxWidth }}>
      <Model
        type={type}
        data={data}
        bodyColor={BODY}
        highlightedColors={colors}
        onClick={handle}
        style={{ width: '100%' }}
        svgStyle={{ cursor: interactive ? 'pointer' : 'default', overflow: 'visible' }}
      />
      {showLabels && <figcaption className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-soft">{type === 'anterior' ? 'Frontal' : 'Posterior'}</figcaption>}
    </figure>
  );

  const both = (
    <div className="flex items-start justify-center gap-4">
      {model('anterior')}
      {model('posterior')}
    </div>
  );

  return (
    <div ref={ref} className={`${interactive ? '' : 'rbh-static'} ${className}`}>
      {views === 'both' && both}
      {views === 'front' && <div className="flex justify-center">{model('anterior')}</div>}
      {views === 'back' && <div className="flex justify-center">{model('posterior')}</div>}
      {views === 'auto' && (
        <>
          <div className="sm:hidden">
            <div className="mx-auto mb-3 flex w-fit rounded-xl border border-line bg-bg p-1 text-sm">
              {[['anterior', 'Frontal'], ['posterior', 'Posterior']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setTab(v)}
                  className={`min-h-[40px] rounded-lg px-4 font-semibold ${tab === v ? 'bg-accent text-white' : 'text-ink-soft'}`}>{l}</button>
              ))}
            </div>
            <div className="flex justify-center">{model(tab)}</div>
          </div>
          <div className="hidden sm:block">{both}</div>
        </>
      )}
    </div>
  );
}

export function FatigueLegend({ label = 'Gradient de fatiga' }) {
  return (
    <div className="mt-3 flex flex-col items-center gap-1 text-[11px] text-ink-soft">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <span>Poc</span>
        <div className="h-2 w-40 rounded-full" style={{ background: `linear-gradient(90deg, ${FATIGUE_COLORS.join(',')})` }} />
        <span>Molt</span>
      </div>
    </div>
  );
}
