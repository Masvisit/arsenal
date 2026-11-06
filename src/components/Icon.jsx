// Icones pròpies (traç simple, 24×24). No es copien icones de tercers.
const P = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  dumbbell: 'M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  pin: 'M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  check: 'M5 12l5 5 9-10',
  chevronLeft: 'M15 5l-7 7 7 7',
  chevronRight: 'M9 5l7 7-7 7',
  chevronDown: 'M5 9l7 7 7-7',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  arrowLeft: 'M19 12H5M11 6l-6 6 6 6',
  refresh: 'M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
  unlock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 7.5-2',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 11v6M12 7.5v.5',
  close: 'M6 6l12 12M18 6L6 18',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  sparkles: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 7v5l3 2',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  male: 'M10 20a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM14.5 9.5L20 4M15 4h5v5',
  female: 'M12 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14v8M9 19h6',
  body: 'M12 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6 9h12M12 9v6M9 22l3-7 3 7',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  save: 'M5 3h11l3 3v15H5zM8 3v5h7V3M8 14h8v7H8z',
  play: 'M7 4l13 8-13 8z',
  warning: 'M12 3l10 18H2zM12 10v5M12 18v.5',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  flame: 'M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8a7 7 0 0 0 7 7z',
  gauge: 'M4 18a8 8 0 1 1 16 0M12 18l4-6',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  barbell: 'M2 12h20M5 7v10M8 8v8M16 8v8M19 7v10',
  kettlebell: 'M9 7a3 3 0 0 1 6 0M8 7h8M7 11a5 5 0 1 0 10 0 5 5 0 0 0-10 0zM9 20h6',
  cable: 'M12 3v4M12 7l-6 10M12 7l6 10M4 17h4M16 17h4M12 7a1 1 0 1 0 0-.01',
  band: 'M4 12c0-4 4-6 8-6s8 2 8 6-4 6-8 6-8-2-8-6zM8 12h8',
  machine: 'M5 3v18M5 5h10v6H5M15 8h4M19 4v8M9 21h-4M12 15v6',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  home2: 'M4 10l8-6 8 6v10H4zM10 20v-6h4v6',
  tree: 'M12 3l6 9h-4l4 6H6l4-6H6zM12 18v3',
  pause: 'M8 5v14M16 5v14',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
  bellOff: 'M6 16V11a6 6 0 0 1 9.5-4.9M18 11v5l2 2H8M10 21h4M3 3l18 18',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  download: 'M12 4v12M7 11l5 5 5-5M5 20h14',
  upload: 'M12 20V8M7 13l5-5 5 5M5 4h14',
};

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.8 }) {
  const d = P[name] || P.info;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
