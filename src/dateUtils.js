// Gemeinsame Datums-Helfer (für Fahrten & Körpergewicht).

export function isoDate(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function todayInput() {
  return isoDate(Date.now());
}

// 'YYYY-MM-DD' → Zeitstempel (lokal, Mittag, um Zeitzonen-Verschiebungen zu vermeiden)
export function parseDateInput(str) {
  if (!str) return Date.now();
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0).getTime();
}

export function formatDate(ts) {
  const d = new Date(ts);
  return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
}

// ---- Kalenderwochen ----
export function startOfWeek(ts) {
  const d = new Date(ts);
  const day = (d.getDay() + 6) % 7; // Montag = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

// Schlüssel einer Kalenderwoche = ISO-Datum des Montags ('YYYY-MM-DD')
export function weekKeyFor(ts) {
  return isoDate(startOfWeek(ts).getTime());
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
// Wochentags-Schlüssel ('mon'..'sun', Montag = 0) für einen Zeitstempel.
export function dayKeyFor(ts) {
  return DAY_KEYS[(new Date(ts).getDay() + 6) % 7];
}

export function shiftWeekKey(weekKey, n) {
  const d = new Date(parseDateInput(weekKey));
  d.setDate(d.getDate() + n * 7);
  return isoDate(d.getTime());
}

// ISO-8601-Kalenderwochennummer
export function isoWeekNumber(ts) {
  const date = new Date(ts);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round((d - firstThursday) / 86400000 / 7);
}

const MONTHS_SHORT = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

// "1. bis 7. Juni 2026" bzw. "29. Juni bis 5. Juli 2026"
export function weekRangeLabel(weekKey) {
  const mon = new Date(parseDateInput(weekKey));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  if (mon.getMonth() === sun.getMonth()) {
    return `${mon.getDate()}. bis ${sun.getDate()}. ${MONTHS_SHORT[sun.getMonth()]} ${sun.getFullYear()}`;
  }
  const y = mon.getFullYear() === sun.getFullYear() ? '' : ` ${mon.getFullYear()}`;
  return `${mon.getDate()}. ${MONTHS_SHORT[mon.getMonth()]}${y} bis ${sun.getDate()}. ${MONTHS_SHORT[sun.getMonth()]} ${sun.getFullYear()}`;
}
