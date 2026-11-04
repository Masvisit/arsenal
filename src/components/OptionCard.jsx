import Icon from './Icon.jsx';

// Targeta seleccionable de l'assistent (com a la referència: icona, text i check a la dreta).
// `action` = botó secundari opcional (p. ex. ⓘ), germà del botó principal per no niuar botons.
export default function OptionCard({ selected, onClick, icon, title, subtitle, action, multi = false }) {
  return (
    <div className="relative">
      <button type="button" onClick={onClick} aria-pressed={selected}
        className={`flex w-full min-h-[64px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${action ? 'pr-24' : ''} ${selected ? 'border-accent bg-accent/10' : 'border-line bg-card'}`}>
        {icon && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg ${selected ? 'text-accent-soft' : 'text-ink-soft'}`}>
            <Icon name={icon} size={22} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className={`block font-semibold ${selected ? 'text-accent-soft' : 'text-ink'}`}>{title}</span>
          {subtitle && <span className="block text-sm text-ink-soft">{subtitle}</span>}
        </span>
        <span className={`absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 shrink-0 items-center justify-center ${multi ? 'rounded-md' : 'rounded-full'} border-2 ${selected ? 'border-accent bg-accent text-white' : 'border-ink-soft/50'}`}>
          {selected && <Icon name="check" size={14} strokeWidth={3} />}
        </span>
        {!action && <span className="w-6 shrink-0" />}
      </button>
      {action && <div className="absolute right-12 top-1/2 -translate-y-1/2">{action}</div>}
    </div>
  );
}
