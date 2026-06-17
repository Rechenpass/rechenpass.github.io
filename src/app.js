import { render, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { html } from './html.js';
import { BottomNav } from './components/BottomNav.js';
import { Icon } from './components/Icon.js';
import { ConfirmHost } from './components/confirmHost.js';
import { HomePage } from './features/home/HomePage.js';
import { WorkoutPage } from './features/workout/WorkoutPage.js';
import { WeekPage } from './pages/WeekPage.js';
import { StatsPage } from './features/stats/StatsPage.js';
import { ManagePage } from './features/manage/ManagePage.js';
import { WorkoutPlayer } from './features/workout/WorkoutPlayer.js';
import { RideForm } from './features/cycling/RideForm.js';
import { YogaForm } from './features/yoga/YogaForm.js';
import { WorkoutReview } from './features/workout/WorkoutReview.js';
import { updateSession, getPrefs } from './store.js';
import { isoDate } from './dateUtils.js';
import { unlockAudio, setSoundEnabled } from './features/workout/workoutRuntime.js';

const APP_VERSION = 'v16';

function App() {
  const [tab, setTab] = useState('heute');
  const [activePlan, setActivePlan] = useState(null);   // laufendes Workout
  const [rideForm, setRideForm] = useState(null);       // null | 'new' | ride
  const [yogaForm, setYogaForm] = useState(null);       // null | 'new' | yoga-session
  const [editSession, setEditSession] = useState(null); // erledigtes Krafttraining nachträglich prüfen/korrigieren
  const [pendingDate, setPendingDate] = useState(null); // Datum für rückwirkendes Erfassen (vergangene Tage)
  const [selectedIso, setSelectedIso] = useState(() => isoDate(Date.now())); // gewählter Dashboard-Tag (übersteht das Erfassen)
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    // Versions-Check: neuer Code läuft zum ersten Mal → Banner zeigen
    // Das ist die zuverlässigste Methode auf iOS, weil keine SW-Events benötigt werden.
    const prev = localStorage.getItem('_mv');
    if (prev !== APP_VERSION) {
      if (prev) setUpdateReady(true);
      // Datum des Versionswechsels merken → in den Einstellungen hinter der Version angezeigt.
      try { localStorage.setItem('_mvDate', String(Date.now())); } catch (e) { /* egal */ }
    }
    localStorage.setItem('_mv', APP_VERSION);

    // Fallback: SW-Ereignisse
    if (!('serviceWorker' in navigator)) return;
    // Auf iOS prüft Safari den SW manchmal erst nach 24h – update() erzwingt sofortige Prüfung
    navigator.serviceWorker.ready.then((reg) => reg.update()).catch(() => {});
    let hadController = !!navigator.serviceWorker.controller;
    const onControllerChange = () => { if (hadController) setUpdateReady(true); hadController = true; };
    const onMessage = (e) => { if (e.data?.type === 'UPDATE_AVAILABLE') setUpdateReady(true); };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [tab]);

  const startWorkout = (plan, date) => { const p = getPrefs(); setSoundEnabled(p.sound); if (p.sound) unlockAudio(); setPendingDate(date ?? null); setActivePlan(plan); };
  const logRideFromHome = (date) => { setPendingDate(date ?? null); setRideForm('new'); };
  const logYogaFromHome = (date) => { setPendingDate(date ?? null); setYogaForm('new'); };

  // Vollbild-Abläufe liegen „über" den Tabs (ohne untere Leiste – Fokus, eigener Zurück/Abbrechen-Button)
  if (activePlan) {
    return html`<div class="app"><${WorkoutPlayer} plan=${activePlan} date=${pendingDate}
      onExit=${() => { setActivePlan(null); setPendingDate(null); }} /></div>`;
  }
  if (rideForm) {
    return html`<div class="app"><${RideForm} initial=${rideForm === 'new' ? null : rideForm} initialDate=${rideForm === 'new' ? pendingDate : null}
      onClose=${() => { setRideForm(null); setPendingDate(null); }} /></div>`;
  }
  if (yogaForm) {
    return html`<div class="app"><${YogaForm} initial=${yogaForm === 'new' ? null : yogaForm} initialDate=${yogaForm === 'new' ? pendingDate : null}
      onClose=${() => { setYogaForm(null); setPendingDate(null); }} /></div>`;
  }
  if (editSession) {
    return html`<div class="app"><${WorkoutReview} editMode entries=${editSession.entries}
      onConfirm=${(rows) => { updateSession(editSession.id, { entries: rows }); setEditSession(null); }}
      onCancel=${() => setEditSession(null)} /></div>`;
  }

  let page;
  if (tab === 'heute') {
    page = html`<${HomePage} onStartWorkout=${startWorkout} onLogRide=${logRideFromHome} onGoTraining=${() => setTab('training')}
      onEditRide=${(ride) => setRideForm(ride)} onEditSession=${setEditSession}
      onLogYoga=${logYogaFromHome} onEditYoga=${(y) => setYogaForm(y)}
      selectedIso=${selectedIso} setSelectedIso=${setSelectedIso} />`;
  } else if (tab === 'training') {
    page = html`<${WorkoutPage} onStartWorkout=${startWorkout} />`;
  } else if (tab === 'week') {
    page = html`<${WeekPage} />`;
  } else if (tab === 'stats') {
    page = html`<${StatsPage} />`;
  } else {
    page = html`<${ManagePage} />`;
  }

  return html`
    <div class="app">
      <main class="app-main">${page}</main>
      <${BottomNav} active=${tab} onChange=${setTab} />
      ${updateReady && html`<button class="update-banner" onClick=${() => location.reload()}>
        <${Icon} name="reset" size=${20} />
        <span class="ub-text">App-Update bereit<small>Tippen zum Neustart</small></span>
      </button>`}
    </div>`;
}

render(html`<${Fragment}><${App} /><${ConfirmHost} /></${Fragment}>`, document.getElementById('app'));
