import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { useStore, getPlan } from '../../store.js';
import { Icon } from '../../components/Icon.js';
import { WEEKDAYS } from '../../constants.js';
import { weekKeyFor, startOfWeek, weekRangeLabel } from '../../dateUtils.js';
import { SettingsPage } from '../settings/SettingsPage.js';
import { SwipeRow } from '../../components/SwipeRow.js';
import { useEntryDeletion } from '../../components/useEntryDeletion.js';

const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function todayIndex() {
  return (new Date().getDay() + 6) % 7; // Montag = 0
}
function todayKey() {
  return WEEKDAYS[todayIndex()].key;
}
function todayLabel() {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}
// Ein Fortschritts-Strang (Kraft ODER Rad): erledigt (grün) · überfällig (rot) · offen (grau).
function ProgressStrand({ icon, label, done, overdue, planned }) {
  const segs = [];
  for (let i = 0; i < planned; i++) {
    const cls = i < done ? 'done' : (i < overdue ? 'overdue' : 'offen');
    segs.push(html`<span class=${'wp2-seg ' + cls} key=${i}></span>`);
  }

  const behind = Math.max(0, overdue - done);
  const open = planned - Math.max(done, overdue); // alle noch offenen Felder
  let statusCls = 'open';
  let statusIcon = 'clock';
  let text;
  if (behind > 0) { statusCls = 'behind'; statusIcon = 'alert'; text = 'Rückstand'; }
  else if (open <= 0) { statusCls = 'ok'; statusIcon = 'check'; text = 'Erledigt'; }
  else { text = `${open} offen`; }

  return html`<div class="strand">
    <div class="strand-head">
      <span class="strand-label"><${Icon} name=${icon} size=${16} /> ${label}</span>
      <span class=${'strand-status ' + statusCls}>
        <${Icon} name=${statusIcon} size=${14} /> ${text}
      </span>
    </div>
    <div class="wp2-bar">${segs}</div>
  </div>`;
}

export function HomePage({ onStartWorkout, onLogRide, onGoTraining }) {
  const state = useStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { requestDelete, deleteModal } = useEntryDeletion();
  if (settingsOpen) return html`<${SettingsPage} onClose=${() => setSettingsOpen(false)} />`;
  const week = (state.weeks || {})[weekKeyFor(Date.now())] || {};
  const todays = week[todayKey()] || [];

  // „Heute erledigt?" – über die Verknüpfung (Session/Fahrt) am Eintrag.
  const todaysWithDone = todays.map((e) => ({ e, done: !!(e.sessionId || e.rideId) }));

  // Fortschritt Woche – getrennt nach Kraft und Rad
  const tIdx = todayIndex();
  const cntType = (d, t) => (week[d.key] ? week[d.key].filter((e) => e.type === t).length : 0);
  const calc = (t, doneCount) => ({
    planned: WEEKDAYS.reduce((n, d) => n + cntType(d, t), 0),
    overdue: WEEKDAYS.slice(0, tIdx).reduce((n, d) => n + cntType(d, t), 0),
    done: doneCount,
  });

  const sow = startOfWeek(Date.now()).getTime();
  const eow = sow + 7 * 86400000;
  const doneStrength = (state.sessions || []).filter((s) => s.date >= sow && s.date < eow).length;
  const doneCycling = (state.rides || []).filter((r) => r.date >= sow && r.date < eow).length;
  const kraft = calc('strength', doneStrength);
  const rad = calc('cycling', doneCycling);
  const anyPlanned = kraft.planned + rad.planned;

  const doneBadge = html`<span class="today-done"><${Icon} name="check" size=${16} /> Erledigt</span>`;

  return html`<div class="screen">
    <header class="screen-header">
      <h2>Dashboard</h2>
      <button class="iconbtn" onClick=${() => setSettingsOpen(true)} aria-label="Daten & Backup"><${Icon} name="settings" /></button>
    </header>
    <div class="screen-body">
      <p class="muted">${todayLabel()}</p>

      <div class="stats-section">
        <h3>Heute geplant</h3>
        ${todays.length === 0
          ? html`<p class="stats-caption">Kein Training geplant – Ruhetag. Du kannst unten jederzeit selbst starten.</p>`
          : todaysWithDone.map(({ e, done }) => {
            const onDel = () => requestDelete(weekKeyFor(Date.now()), todayKey(), e, done ? 'done' : 'open');
            if (e.type === 'strength') {
              const p = getPlan(e.planId);
              return html`<${SwipeRow} key=${e.id} onDelete=${onDel}>
                <div class="today-row">
                  <div class="pi-main">
                    <div class="card-title">${p ? p.name : 'Plan gelöscht'}</div>
                    <div class="plan-meta">Krafttraining</div>
                  </div>
                  ${done
                    ? doneBadge
                    : (p ? html`<button class="iconbtn start" onClick=${() => onStartWorkout(p)} aria-label="Training starten"><${Icon} name="play" size=${22} /></button>` : null)}
                </div>
              </${SwipeRow}>`;
            }
            return html`<${SwipeRow} key=${e.id} onDelete=${onDel}>
              <div class="today-row">
                <div class="pi-main">
                  <div class="card-title">${e.rideType === 'indoor' ? 'Indoor-Training' : 'Radausfahrt'}</div>
                  <div class="plan-meta">Radtraining</div>
                </div>
                ${done
                  ? doneBadge
                  : html`<button class="btn primary" onClick=${onLogRide}><${Icon} name="bike" size=${16} /> Erfassen</button>`}
              </div>
            </${SwipeRow}>`;
          })}
      </div>

      <div class="stats-section">
        <h3>Doch was anderes?</h3>
        <div class="home-actions">
          <button class="btn full" onClick=${onGoTraining}><${Icon} name="list" size=${18} /> Training auswählen</button>
          <button class="btn full" onClick=${onLogRide}><${Icon} name="bike" size=${18} /> Fahrt erfassen</button>
        </div>
      </div>

      <div class="stats-section">
        <div class="fw-head">
          <h3>Wochenfortschritt</h3>
          <div class="fw-date">${weekRangeLabel(weekKeyFor(Date.now()))}</div>
        </div>
        ${anyPlanned === 0
          ? html`<p class="stats-caption">Für diese Woche ist noch nichts geplant. Lege im Tab „Woche“ deine Einheiten an.</p>`
          : html`
            <div class="strands">
              ${kraft.planned > 0 ? html`<${ProgressStrand} icon="dumbbell" label="Kraft"
                done=${kraft.done} overdue=${kraft.overdue} planned=${kraft.planned} />` : null}
              ${rad.planned > 0 ? html`<${ProgressStrand} icon="bike" label="Rad"
                done=${rad.done} overdue=${rad.overdue} planned=${rad.planned} />` : null}
            </div>
            <div class="wp2-legend wp2-key">
              <span><span class="wp2-dot done"></span>erledigt</span>
              <span><span class="wp2-dot overdue"></span>überfällig</span>
              <span><span class="wp2-dot offen"></span>offen</span>
            </div>`}
      </div>
    </div>
    ${deleteModal}
  </div>`;
}
