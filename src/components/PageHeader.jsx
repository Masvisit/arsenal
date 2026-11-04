import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

export default function PageHeader({ eyebrow, title, subtitle, back, right }) {
  return (
    <header className="px-4 pb-4 pt-5 sm:px-6">
      {back && (
        <Link to={back.to} className="mb-2 inline-flex min-h-tap items-center gap-1 text-accent-soft">
          <Icon name="chevronLeft" size={18} /> {back.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <div className="h-eyebrow mb-1">{eyebrow}</div>}
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
