import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';

const NAV = [
  { to: '/', label: 'Inici', icon: 'home', end: true },
  { to: '/crear', label: 'Crear', icon: 'plus' },
  { to: '/material', label: 'Material', icon: 'dumbbell' },
  { to: '/perfil', label: 'Perfil', icon: 'user' },
];

// Pantalles a pantalla completa (sense barra de navegació)
const FULLSCREEN = [/^\/assistent/, /^\/generant/];

export default function Layout() {
  const { pathname } = useLocation();
  const full = FULLSCREEN.some((r) => r.test(pathname));
  return (
    <div className="min-h-[100dvh] lg:flex">
      {!full && (
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-line lg:p-5">
          <div className="mb-8 flex items-center gap-2 text-lg font-extrabold tracking-wide">
            <img src={`${import.meta.env.BASE_URL}icons/favicon.svg`} alt="" className="h-8 w-8" /> ARSENAL
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => `flex min-h-tap items-center gap-3 rounded-xl px-3 font-medium ${isActive ? 'bg-card text-ink' : 'text-ink-soft'}`}>
                <Icon name={n.icon} /> {n.label}
              </NavLink>
            ))}
          </nav>
        </aside>
      )}
      <main className={`mx-auto w-full pt-safe ${full ? '' : 'max-w-5xl pb-28 lg:pb-10'}`}>
        <Outlet />
      </main>
      {!full && (
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-md justify-around pt-1">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => `flex min-h-tap min-w-[64px] flex-col items-center justify-center text-[11px] ${isActive ? 'text-accent-soft' : 'text-ink-soft'}`}>
                <Icon name={n.icon} size={22} />
                <span>{n.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
