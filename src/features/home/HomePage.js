import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { useStore, getPlan, getSession, getRide, resetWeekEntry } from '../../store.js';
import { Icon } from '../../components/Icon.js';
import { WEEKDAYS } from '../../constants.js';
import { isoDate, parseDateInput, weekKeyFor, dayKeyFor, startOfWeek, weekRangeLabel } from '../../dateUtils.js';
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
  else { text = `Offen (${open}/${planned})`; }

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

export function HomePage({ onStartWorkout, onLogRide, onGoTraining, onEditRide, onEditSession }) {
  const state = useStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedIso, setSelectedIso] = useState(() => isoDate(Date.now()));
  const { requestDelete, deleteModal } = useEntryDeletion();
  if (settingsOpen) return html`<${SettingsPage} onClose=${() => setSettingsOpen(false)} />`;
  // Gewählter Tag (Dropdown der letzten 7 Tage) – steuert die obere „Heute geplant"-Card.
  const todayIso = isoDate(Date.now());
  const isToday = selectedIso === todayIso;
  const selectedTs = parseDateInput(selectedIso);
  const selDate = new Date(selectedTs);
  const weekKey = weekKeyFor(selectedTs);
  const dayKey = dayKeyFor(selectedTs);
  const week = (state.weeks || {})[weekKey] || {};
  const todays = week[dayKey] || [];
  const dateForNew = isToday ? null : selectedTs; // gesetzt → rückwirkendes Erfassen für den gewählten Tag

  const dayOptions = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i);
    const label = `${DAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
    dayOptions.push({ iso: isoDate(d.getTime()), label: i === 0 ? `Heute · ${label}` : label });
  }

  // „Erledigt?" – über die Verknüpfung (Session/Fahrt) am Eintrag.
  const todaysWithDone = todays.map((e) => ({ e, done: !!(e.sessionId || e.rideId) }));

  // Fortschritt Woche – IMMER die aktuelle Woche (unabhängig vom gewählten Tag), getrennt Kraft/Rad
  const curWeekKey = weekKeyFor(Date.now());
  const curWeek = (state.weeks || {})[curWeekKey] || {};
  const tIdx = todayIndex();
  const cntType = (d, t) => (curWeek[d.key] ? curWeek[d.key].filter((e) => e.type === t).length : 0);
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
      <select class="day-select" value=${selectedIso} onChange=${(e) => setSelectedIso(e.target.value)}>
        ${dayOptions.map((o) => html`<option value=${o.iso}>${o.label}</option>`)}
      </select>

      <div class="stats-section">
        <h3>${isToday ? 'Heute geplant' : `${DAYS[selDate.getDay()]}, ${selDate.getDate()}. ${MONTHS[selDate.getMonth()]}`}</h3>
        ${todays.length === 0
          ? html`<p class="stats-caption">${isToday ? 'Kein Training geplant – Ruhetag. Du kannst unten jederzeit selbst starten.' : 'An diesem Tag war nichts geplant.'}</p>`
          : todaysWithDone.map(({ e, done }) => {
            const onDel = () => requestDelete(weekKey, dayKey, e, done ? 'done' : 'open');
            // Erledigte Einheit: Wisch nach links → Bearbeiten · Zurücksetzen · Löschen.
            const actions = done ? [
              { icon: 'edit', label: 'Bearbeiten', cls: 'edit', onClick: () => {
                  if (e.type === 'strength') { const s = getSession(e.sessionId); if (s) onEditSession(s); }
                  else { const r = getRide(e.rideId); if (r) onEditRide(r); }
              } },
              { icon: 'reset', label: 'Zurücksetzen', cls: 'reset', onClick: () => {
                  if (confirm('Erfasste Werte löschen und Einheit zurücksetzen? Sie gilt danach wieder als offen.')) resetWeekEntry(weekKey, dayKey, e.id);
              } },
              { icon: 'trash', label: 'Löschen', cls: 'del', onClick: onDel },
            ] : null;
            if (e.type === 'strength') {
              const p = getPlan(e.planId);
              return html`<${SwipeRow} key=${e.id} onDelete=${onDel} actions=${actions}>
                <div class="today-row">
                  <div class="pi-main">
                    <div class="card-title">${p ? p.name : 'Plan gelöscht'}</div>
                    <div class="plan-meta">Krafttraining</div>
                  </div>
                  ${done
                    ? doneBadge
                    : (p ? html`<button class="iconbtn start" onClick=${() => onStartWorkout(p, dateForNew)} aria-label="Training starten"><${Icon} name="play" size=${22} /></button>` : null)}
                </div>
              </${SwipeRow}>`;
            }
            return html`<${SwipeRow} key=${e.id} onDelete=${onDel} actions=${actions}>
              <div class="today-row">
                <div class="pi-main">
                  <div class="card-title">${e.rideType === 'indoor' ? 'Indoor-Training' : 'Radausfahrt'}</div>
                  <div class="plan-meta">Radtraining</div>
                </div>
                ${done
                  ? doneBadge
                  : html`<button class="iconbtn start" onClick=${() => onLogRide(dateForNew)} aria-label="Fahrt erfassen"><${Icon} name="edit" size=${22} /></button>`}
              </div>
            </${SwipeRow}>`;
          })}
      </div>

      <div class="stats-section">
        <h3>Doch was anderes?</h3>
        <div class="home-actions">
          <button class="btn full" onClick=${onGoTraining}><${Icon} name="dumbbell" size=${18} /> Training auswählen</button>
          <button class="btn full" onClick=${() => onLogRide()}><${Icon} name="bike" size=${18} /> Fahrt erfassen</button>
        </div>
      </div>

      <div class="stats-section">
        <div class="fw-head">
          <h3>Wochenfortschritt</h3>
          <div class="fw-date">${weekRangeLabel(curWeekKey)}</div>
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
              <span><span class="wp2-dot done"></span>Erledigt</span>
              <span><span class="wp2-dot overdue"></span>Überfällig</span>
              <span><span class="wp2-dot offen"></span>Offen</span>
            </div>`}
      </div>
    </div>
    ${deleteModal}
  </div>`;
}
