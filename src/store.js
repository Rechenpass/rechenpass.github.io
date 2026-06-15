// Lokaler Datenspeicher: alles im Browser (localStorage), keine Cloud.
// Die UI liest aus einem In-Memory-State und wird bei Änderungen neu gerendert.
// Die Zugriffs-Funktionen sind die einzige Stelle, die den Speicher kennt –
// so lässt sich der Unterbau später bei Bedarf leicht austauschen.
import { useState, useEffect } from 'preact/hooks';
import { weekKeyFor, dayKeyFor } from './dateUtils.js';

const KEY = 'fitnessAppState_v1';
const listeners = new Set();
let state = loadState();

function defaultState() {
  return { exercises: [], plans: [], sessions: [], weeks: {}, rides: [], bodyWeights: [], sweets: {} };
}

function normalize(s) {
  const merged = { ...defaultState(), ...s };
  // Migration: altes Einzel-`week` (eine Vorlage) → `weeks[aktuelle KW]`
  if (s && s.week && (!s.weeks || Object.keys(s.weeks).length === 0)) {
    merged.weeks = { [weekKeyFor(Date.now())]: s.week };
  }
  delete merged.week;
  // Migration: einzelne `bodyRegion` (String) → `bodyRegions` (Array, Mehrfachauswahl)
  merged.exercises = (merged.exercises || []).map((e) => {
    if (e && e.bodyRegions == null && e.bodyRegion != null) {
      const { bodyRegion, ...rest } = e;
      return { ...rest, bodyRegions: bodyRegion ? [bodyRegion] : [] };
    }
    return e;
  });
  return linkExistingActivities(merged);
}

// Migration/Reparatur: bestehende Sessions/Fahrten ohne Verknüpfung nachträglich mit
// einem geplanten Wocheneintrag desselben Tags + Typs verbinden (best-effort), damit
// „erledigt" auch für Altdaten stimmt. Idempotent.
function linkExistingActivities(merged) {
  const weeks = merged.weeks || {};
  const sessions = merged.sessions || [];
  const rides = merged.rides || [];
  const usedS = new Set();
  const usedR = new Set();
  for (const wk of Object.values(weeks)) for (const list of Object.values(wk || {})) for (const e of (list || [])) {
    if (e.sessionId) usedS.add(e.sessionId);
    if (e.rideId) usedR.add(e.rideId);
  }
  for (const [wkKey, wk] of Object.entries(weeks)) {
    for (const [dayKey, list] of Object.entries(wk || {})) {
      for (let i = 0; i < (list || []).length; i++) {
        const e = list[i];
        if (e.sessionId || e.rideId) continue;
        if (e.type === 'strength') {
          const m = sessions.find((x) => !usedS.has(x.id) && weekKeyFor(x.date) === wkKey && dayKeyFor(x.date) === dayKey);
          if (m) { list[i] = { ...e, sessionId: m.id }; usedS.add(m.id); }
        } else if (e.type === 'cycling') {
          const m = rides.find((x) => !usedR.has(x.id) && weekKeyFor(x.date) === wkKey && dayKeyFor(x.date) === dayKey);
          if (m) { list[i] = { ...e, rideId: m.id }; usedR.add(m.id); }
        }
      }
    }
  }
  return merged;
}

function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) {
    console.warn('Konnte gespeicherte Daten nicht laden:', e);
  }
  return defaultState();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Speichern fehlgeschlagen:', e);
  }
  for (const fn of listeners) fn();
}

function uid() {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

export function getState() { return state; }

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Hook: liefert den State und sorgt für Re-Render bei Änderungen.
export function useStore() {
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);
  return state;
}

// ---- Übungen ----
export function addExercise(data) {
  const now = Date.now();
  const ex = { id: uid(), createdAt: now, updatedAt: now, ...data };
  state = { ...state, exercises: [...state.exercises, ex] };
  persist();
  return ex;
}

export function updateExercise(id, patch) {
  if (state.exercises.some((e) => e.id === id)) {
    state = {
      ...state,
      exercises: state.exercises.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e)),
    };
    persist();
  }
}

export function deleteExercise(id) {
  state = { ...state, exercises: state.exercises.filter((e) => e.id !== id) };
  persist();
}

// Ein paar Beispiel-Übungen zum Ausprobieren (jederzeit löschbar).
export function seedExamples() {
  const now = Date.now();
  const mk = (o) => {
    const { bodyRegion, ...rest } = o;
    return { id: uid(), createdAt: now, updatedAt: now, secondaryMuscles: [], description: '', bodyRegions: bodyRegion ? [bodyRegion] : [], ...rest };
  };
  const samples = [
    mk({ name: 'Hampelmann', group: 'Bodyweight', phase: 'WarmUp', bodyRegion: 'Oberkörper',
      primaryMuscles: ['M. deltoideus lateralis'], secondaryMuscles: ['M. triceps surae'], type: 'time', defaultDurationSec: 40,
      description: 'Aus dem Stand Arme und Beine gleichzeitig öffnen und schließen, locker im Rhythmus bleiben.' }),
    mk({ name: 'Liegestütze', group: 'Bodyweight', phase: 'Training', bodyRegion: 'Oberkörper',
      primaryMuscles: ['M. pectoralis major', 'M. triceps brachii'], secondaryMuscles: ['M. deltoideus anterior', 'M. rectus abdominis (obere Anteile)'], type: 'reps', defaultSets: 3, defaultReps: 12,
      description: 'Körper bildet eine gerade Linie, Ellbogen nah am Körper, kontrolliert bis kurz über den Boden absenken.' }),
    mk({ name: 'Kurzhantel Bizeps-Curls', group: 'Kurzhantel', phase: 'Training', bodyRegion: 'Oberkörper',
      primaryMuscles: ['M. biceps brachii'], secondaryMuscles: ['Mm. antebrachii'], type: 'reps', defaultSets: 3, defaultReps: 10,
      description: 'Oberarme ruhig am Körper fixieren, Kurzhanteln kontrolliert nach oben curlen und langsam absenken.' }),
    mk({ name: 'Kniebeugen', group: 'Bodyweight', phase: 'Training', bodyRegion: 'Unterkörper',
      primaryMuscles: ['M. quadriceps femoris', 'M. gluteus maximus'], secondaryMuscles: ['Mm. ischiocrurales'], type: 'reps', defaultSets: 4, defaultReps: 15,
      description: 'Hüfte nach hinten schieben, Knie über den Füßen, Rücken gerade, bis die Oberschenkel waagerecht sind.' }),
    mk({ name: 'Unterarmstütz (Plank)', group: 'Bodyweight', phase: 'Training', bodyRegion: 'Core',
      primaryMuscles: ['M. rectus abdominis (obere Anteile)'], secondaryMuscles: ['M. erector spinae', 'M. deltoideus anterior'], type: 'time', defaultDurationSec: 30,
      description: 'Auf Unterarmen und Zehenspitzen, Körper als gerade Linie, Bauch und Gesäß fest anspannen.' }),
    mk({ name: 'Oberschenkel-Dehnung', group: 'Bodyweight', phase: 'CoolDown', bodyRegion: 'Unterkörper',
      primaryMuscles: ['M. quadriceps femoris'], type: 'time', defaultDurationSec: 30,
      description: 'Im Stand die Ferse zum Gesäß ziehen, Knie zusammenhalten, Dehnung ruhig halten – Seite wechseln.' }),
  ];
  state = { ...state, exercises: [...state.exercises, ...samples] };
  persist();
}

// ---- Trainingspläne ----
export function getExercise(id) {
  return state.exercises.find((e) => e.id === id);
}

// Baut einen Plan-Eintrag aus einer Übung mit sinnvollen Vorgabewerten.
export function createPlanItem(exercise) {
  return {
    id: uid(),
    exerciseId: exercise.id,
    sets: exercise.type === 'reps' ? (exercise.defaultSets ?? 3) : 1,
    reps: exercise.type === 'reps' ? (exercise.defaultReps ?? 10) : null,
    durationSec: exercise.type === 'time' ? (exercise.defaultDurationSec ?? 30) : null,
    weight: null,
    restBetweenSetsSec: 30,
    restAfterExerciseSec: 30,
  };
}

export function savePlan(plan) {
  const now = Date.now();
  if (plan.id) {
    state = {
      ...state,
      plans: state.plans.map((p) =>
        p.id === plan.id ? { ...p, name: plan.name, items: plan.items, updatedAt: now } : p),
    };
  } else {
    state = {
      ...state,
      plans: [...state.plans, { id: uid(), name: plan.name, items: plan.items, createdAt: now, updatedAt: now }],
    };
  }
  persist();
}

export function deletePlan(id) {
  state = { ...state, plans: state.plans.filter((p) => p.id !== id) };
  persist();
}

// #14: absolvierte Einheit mit einem offenen geplanten Eintrag (gleicher Typ, gleicher
// Tag) verknüpfen – oder sonst als „spontan absolviert" in den Wochenplan eintragen.
function linkOrAddWeekEntry(weeks, activity, type, linkKey, extra) {
  const wk = weekKeyFor(activity.date);
  const day = dayKeyFor(activity.date);
  const week = { ...(weeks[wk] || {}) };
  const list = [...(week[day] || [])];
  const i = list.findIndex((e) => e.type === type && !e.sessionId && !e.rideId);
  if (i >= 0) list[i] = { ...list[i], [linkKey]: activity.id };
  else list.push({ id: uid(), type, spontan: true, [linkKey]: activity.id, ...extra });
  week[day] = list;
  return { ...weeks, [wk]: week };
}

// ---- Trainings-Sessions (absolvierte Workouts, Basis für die Statistik) ----
export function saveSession(session) {
  const s = { id: uid(), ...session };
  const weeks = linkOrAddWeekEntry(state.weeks || {}, s, 'strength', 'sessionId', { planId: s.planId });
  state = { ...state, sessions: [...state.sessions, s], weeks };
  persist();
  return s;
}

export function deleteSession(id) {
  state = { ...state, sessions: (state.sessions || []).filter((s) => s.id !== id) };
  persist();
}

export function updateSession(id, patch) {
  state = { ...state, sessions: (state.sessions || []).map((s) => (s.id === id ? { ...s, ...patch } : s)) };
  persist();
}

export function getSession(id) {
  return (state.sessions || []).find((s) => s.id === id);
}

export function getRide(id) {
  return (state.rides || []).find((r) => r.id === id);
}

// ---- Radtraining (Fahrten) ----
export function addRide(data) {
  const ride = { id: uid(), createdAt: Date.now(), ...data };
  const weeks = linkOrAddWeekEntry(state.weeks || {}, ride, 'cycling', 'rideId', { rideType: ride.type });
  state = { ...state, rides: [...(state.rides || []), ride], weeks };
  persist();
  return ride;
}

export function updateRide(id, patch) {
  state = { ...state, rides: (state.rides || []).map((r) => (r.id === id ? { ...r, ...patch } : r)) };
  persist();
}

export function deleteRide(id) {
  state = { ...state, rides: (state.rides || []).filter((r) => r.id !== id) };
  persist();
}

// ---- Körpergewicht ----
export function addBodyWeight(data) {
  const w = { id: uid(), ...data };
  state = { ...state, bodyWeights: [...(state.bodyWeights || []), w] };
  persist();
  return w;
}

export function deleteBodyWeight(id) {
  state = { ...state, bodyWeights: (state.bodyWeights || []).filter((w) => w.id !== id) };
  persist();
}

// ---- Süßigkeiten-Tracking ----
// Pro Tag genau ein Eintrag, abgelegt unter dem ISO-Datum ('YYYY-MM-DD'):
// true = Süßigkeiten gegessen · false = keine Süßigkeiten · kein Schlüssel = kein Eintrag.
export function setSweets(dateKey, hadSweets) {
  state = { ...state, sweets: { ...(state.sweets || {}), [dateKey]: hadSweets } };
  persist();
}

export function clearSweets(dateKey) {
  const sweets = { ...(state.sweets || {}) };
  delete sweets[dateKey];
  state = { ...state, sweets };
  persist();
}

// ---- Wochenplan ----
export function getPlan(id) {
  return state.plans.find((p) => p.id === id);
}

export function addWeekEntry(weekKey, day, entry) {
  const weeks = state.weeks || {};
  const wk = weeks[weekKey] || {};
  const dayList = wk[day] || [];
  state = { ...state, weeks: { ...weeks, [weekKey]: { ...wk, [day]: [...dayList, { id: uid(), ...entry }] } } };
  persist();
}

export function removeWeekEntry(weekKey, day, entryId) {
  const weeks = state.weeks || {};
  const wk = weeks[weekKey] || {};
  const dayList = (wk[day] || []).filter((e) => e.id !== entryId);
  state = { ...state, weeks: { ...weeks, [weekKey]: { ...wk, [day]: dayList } } };
  persist();
}

// „Reset" einer erledigten Einheit: die erfasste Aktivität (Session/Fahrt) löschen und die
// Verknüpfung am Wocheneintrag entfernen → der Eintrag steht wieder „offen". War der Eintrag
// nur „spontan" (ohne ursprüngliche Planung), wird er ganz entfernt.
export function resetWeekEntry(weekKey, day, entryId) {
  const weeks = state.weeks || {};
  const wk = weeks[weekKey] || {};
  const list = wk[day] || [];
  const entry = list.find((e) => e.id === entryId);
  if (!entry) return;
  let sessions = state.sessions || [];
  let rides = state.rides || [];
  if (entry.sessionId) sessions = sessions.filter((s) => s.id !== entry.sessionId);
  if (entry.rideId) rides = rides.filter((r) => r.id !== entry.rideId);
  const newList = entry.spontan
    ? list.filter((e) => e.id !== entryId)
    : list.map((e) => {
        if (e.id !== entryId) return e;
        const { sessionId, rideId, ...rest } = e;
        return rest;
      });
  state = { ...state, sessions, rides, weeks: { ...weeks, [weekKey]: { ...wk, [day]: newList } } };
  persist();
}

// ---- Backup ----
// Komplette Daten durch ein importiertes Backup ersetzen.
export function replaceAllData(obj) {
  state = normalize(obj && typeof obj === 'object' ? obj : {});
  persist();
}

// Backup-Erinnerung: Zeitpunkt des letzten Exports/Imports merken (separat, nicht im Backup selbst).
export function markBackupDone() {
  try { localStorage.setItem('_lastBackup', String(Date.now())); } catch (e) { /* egal */ }
}
export function lastBackupTs() {
  const v = localStorage.getItem('_lastBackup');
  return v ? Number(v) : null;
}
