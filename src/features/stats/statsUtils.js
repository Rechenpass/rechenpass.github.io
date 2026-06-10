const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const p2 = (n) => String(n).padStart(2, '0');

function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Montag = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

export function periodKey(ts, period) {
  const d = new Date(ts);
  if (period === 'year') return String(d.getFullYear());
  if (period === 'month') return d.getFullYear() + '-' + p2(d.getMonth() + 1);
  const s = startOfWeek(d);
  return s.getFullYear() + '-' + p2(s.getMonth() + 1) + '-' + p2(s.getDate());
}

export function periodLabel(ts, period) {
  const d = new Date(ts);
  if (period === 'year') return String(d.getFullYear());
  if (period === 'month') return MONTHS[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2);
  const s = startOfWeek(d);
  return p2(s.getDate()) + '.' + p2(s.getMonth() + 1);
}

// Letzte n Zeiträume (inkl. aktuellem) als {key,label}, damit Lücken als 0 sichtbar werden.
export function lastPeriods(period, n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    let d;
    if (period === 'year') d = new Date(now.getFullYear() - i, 0, 1);
    else if (period === 'month') d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    else { const s = startOfWeek(now); d = new Date(s); d.setDate(s.getDate() - i * 7); }
    out.push({ key: periodKey(d.getTime(), period), label: periodLabel(d.getTime(), period) });
  }
  return out;
}

export function exercisesFromSessions(sessions) {
  const map = new Map();
  for (const s of sessions) for (const e of s.entries) if (!map.has(e.exerciseId)) map.set(e.exerciseId, { id: e.exerciseId, name: e.exerciseName });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

// Typ/Gewichtung einer Übung aus den Session-Daten ableiten (robust gegen gelöschte Übungen).
export function exMeta(sessions, exId) {
  let name = '', type = 'reps', weighted = false;
  for (const s of sessions) for (const e of s.entries) if (e.exerciseId === exId) {
    name = e.exerciseName; type = e.type; if (e.weight != null) weighted = true;
  }
  return { name, type, weighted };
}

export function exerciseMetric(type, weighted) {
  if (type === 'time') return { key: 'maxDuration', label: 'Längste Dauer', unit: ' s' };
  if (weighted) return { key: 'maxWeight', label: 'Gewicht (max.)', unit: ' kg' };
  return { key: 'maxReps', label: 'Wiederholungen (max.)', unit: '' };
}

// Verlauf einer Übung, gebündelt nach Zeitraum.
export function exerciseSeries(sessions, exId, period) {
  const buckets = {};
  for (const s of sessions) {
    const es = s.entries.filter((e) => e.exerciseId === exId);
    if (!es.length) continue;
    const k = periodKey(s.date, period);
    if (!buckets[k]) buckets[k] = { ts: s.date, entries: [] };
    if (s.date < buckets[k].ts) buckets[k].ts = s.date;
    buckets[k].entries.push(...es);
  }
  return Object.keys(buckets)
    .sort((a, b) => buckets[a].ts - buckets[b].ts)
    .map((k) => {
      const es = buckets[k].entries;
      const w = es.map((e) => e.weight).filter((v) => v != null);
      const r = es.map((e) => e.reps).filter((v) => v != null);
      const du = es.map((e) => e.durationSec).filter((v) => v != null);
      return {
        label: periodLabel(buckets[k].ts, period),
        maxWeight: w.length ? Math.max(...w) : 0,
        maxReps: r.length ? Math.max(...r) : 0,
        maxDuration: du.length ? Math.max(...du) : 0,
        sets: es.length,
      };
    });
}

export function muscleFrequency(sessions) {
  const c = {};
  for (const s of sessions) for (const e of s.entries) for (const m of (e.primaryMuscles || [])) c[m] = (c[m] || 0) + 1;
  return Object.entries(c).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}
