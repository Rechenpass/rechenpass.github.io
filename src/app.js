import { render } from 'preact';
import { useState } from 'preact/hooks';
import { html } from './html.js';
import { BottomNav } from './components/BottomNav.js';
import { HomePage } from './features/home/HomePage.js';
import { WorkoutPage } from './features/workout/WorkoutPage.js';
import { WeekPage } from './pages/WeekPage.js';
import { StatsPage } from './features/stats/StatsPage.js';
import { ManagePage } from './features/manage/ManagePage.js';
import { WorkoutPlayer } from './features/workout/WorkoutPlayer.js';
import { RideForm } from './features/cycling/RideForm.js';
import { unlockAudio } from './features/workout/workoutRuntime.js';

function App() {
  const [tab, setTab] = useState('heute');
  const [activePlan, setActivePlan] = useState(null);   // laufendes Workout
  const [rideForm, setRideForm] = useState(null);       // null | 'new' | ride
  const [trainingMode, setTrainingMode] = useState('kraft'); // Kraft/Rad-Umschalter im Training-Tab

  const startWorkout = (plan) => { unlockAudio(); setActivePlan(plan); };
  const openRide = (ride) => setRideForm(ride || 'new');
  const logRideFromHome = () => { setTrainingMode('rad'); setRideForm('new'); };

  // Vollbild-Abläufe liegen „über" den Tabs (ohne untere Leiste – Fokus, eigener Zurück/Abbrechen-Button)
  if (activePlan) {
    return html`<div class="app"><${WorkoutPlayer} plan=${activePlan} onExit=${() => setActivePlan(null)} /></div>`;
  }
  if (rideForm) {
    return html`<div class="app"><${RideForm} initial=${rideForm === 'new' ? null : rideForm} onClose=${() => setRideForm(null)} /></div>`;
  }

  let page;
  if (tab === 'heute') {
    page = html`<${HomePage} onStartWorkout=${startWorkout} onLogRide=${logRideFromHome} onGoTraining=${() => setTab('training')} />`;
  } else if (tab === 'training') {
    page = html`<${WorkoutPage} mode=${trainingMode} onMode=${setTrainingMode} onStartWorkout=${startWorkout} onEditRide=${openRide} />`;
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
    </div>`;
}

render(html`<${App} />`, document.getElementById('app'));
