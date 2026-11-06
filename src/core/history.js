// Seguiment de sessions fetes: setmana, sèries per múscul i evolució. JS pur.

const DAY = 24 * 3600 * 1000;

/** Dilluns 00:00 (hora local) de la setmana d'un instant. */
export function weekStart(ms) {
  const d = new Date(ms);
  const day = (d.getDay() + 6) % 7; // dilluns = 0
  d.setHours(0, 0, 0, 0);
  return d.getTime() - day * DAY;
}

/** Resum d'una setmana: sessions, minuts, sèries i volum. */
export function weekSummary(logs, now = Date.now()) {
  const start = weekStart(now);
  const inWeek = logs.filter((l) => l.endedAt >= start && l.endedAt < start + 7 * DAY);
  return {
    sessions: inWeek.length,
    minutes: Math.round(inWeek.reduce((s, l) => s + l.durationSec, 0) / 60),
    sets: inWeek.reduce((s, l) => s + l.setsDone, 0),
    volumeKg: inWeek.reduce((s, l) => s + (l.volumeKg || 0), 0),
  };
}

/** Sessions per setmana de les últimes `n` setmanes (la més antiga primer). */
export function weeklySeries(logs, n = 8, now = Date.now()) {
  const current = weekStart(now);
  return Array.from({ length: n }, (_, k) => {
    const start = current - (n - 1 - k) * 7 * DAY;
    const list = logs.filter((l) => l.endedAt >= start && l.endedAt < start + 7 * DAY);
    return { start, sessions: list.length, minutes: Math.round(list.reduce((s, l) => s + l.durationSec, 0) / 60) };
  });
}

/** Sèries per múscul dels últims `days` dies: principal ×1, secundari ×0,5. */
export function setsByTarget(logs, days = 7, now = Date.now()) {
  const out = {};
  for (const l of logs) {
    if (now - l.endedAt > days * DAY) continue;
    for (const s of l.sets || []) {
      for (const t of s.primary || []) out[t] = (out[t] || 0) + 1;
      for (const t of s.secondary || []) out[t] = (out[t] || 0) + 0.5;
    }
  }
  return out;
}

/** Setmanes seguides (fins a l'actual) amb almenys una sessió. */
export function weekStreak(logs, now = Date.now()) {
  let streak = 0;
  let start = weekStart(now);
  const has = (s) => logs.some((l) => l.endedAt >= s && l.endedAt < s + 7 * DAY);
  if (!has(start)) start -= 7 * DAY; // la setmana actual encara pot no tenir-ne
  while (has(start)) { streak++; start -= 7 * DAY; }
  return streak;
}

/** Millor marca per exercici (càrrega màxima i reps a aquesta càrrega). */
export function bestSets(logs) {
  const best = {};
  for (const l of logs) for (const s of l.sets || []) {
    if (!s.loadKg) continue;
    const b = best[s.exerciseId];
    if (!b || s.loadKg > b.loadKg || (s.loadKg === b.loadKg && (s.reps || 0) > (b.reps || 0))) best[s.exerciseId] = { loadKg: s.loadKg, reps: s.reps, at: l.endedAt };
  }
  return best;
}
