import { html } from '../html.js';
import { useState } from 'preact/hooks';
import { useStore, addWeekEntry, getPlan } from '../store.js';
import { Icon } from '../components/Icon.js';
import { WEEKDAYS } from '../constants.js';
import { weekKeyFor, shiftWeekKey, isoWeekNumber, weekRangeLabel, parseDateInput } from '../dateUtils.js';
import { useEntryDeletion } from '../components/useEntryDeletion.js';

export function WeekPage() {
  const state = useStore();
  const [weekKey, setWeekKey] = useState(() => weekKeyFor(Date.now()));
  const [adding, setAdding] = useState(null); // Tag-Key oder null
  const { requestDelete, deleteModal } = useEntryDeletion();

  const week = (state.weeks || {})[weekKey] || {};
  const kw = isoWeekNumber(parseDateInput(weekKey));
  const thisWeek = weekKey === weekKeyFor(Date.now());

  const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
  const todayTs = todayMid.getTime();

  const entryLabel = (e) => {
    if (e.type === 'cycling') {
      return e.rideType === 'indoor' ? 'Indoor-Training' : e.rideType === 'outdoor' ? 'Radausfahrt' : 'Radtraining';
    }
    const p = getPlan(e.planId);
    return p ? p.name : 'Plan gelöscht';
  };

  return html`<div class="screen">
    <header class="screen-header"><h2>Wochenplan</h2></header>
    <div class="screen-body">
      <div class="week-switch">
        <button class="iconbtn" onClick=${() => setWeekKey(shiftWeekKey(weekKey, -1))} aria-label="Vorherige Woche"><${Icon} name="back" /></button>
        <div class="week-switch-center">
          <div class="week-kwline">
            <span class="week-kw">KW ${kw}</span>
            ${thisWeek ? html`<span class="week-now">Diese Woche</span>` : null}
          </div>
          <div class="week-range">${weekRangeLabel(weekKey)}</div>
        </div>
        <button class="iconbtn" onClick=${() => setWeekKey(shiftWeekKey(weekKey, 1))} aria-label="Nächste Woche"><${Icon} name="forward" /></button>
      </div>

      <div class="week-list">
        ${WEEKDAYS.map((d, di) => {
          // Feste Reihenfolge: Krafttraining zuerst, dann Radtraining; je alphabetisch.
          const entries = [...(week[d.key] || [])].sort((a, b) => {
            const rank = (e) => (e.type === 'cycling' ? 1 : 0);
            return (rank(a) - rank(b)) || entryLabel(a).localeCompare(entryLabel(b), 'de');
          });
          const dayDate = new Date(parseDateInput(weekKey));
          dayDate.setDate(dayDate.getDate() + di);
          dayDate.setHours(0, 0, 0, 0);
          const isPast = dayDate.getTime() < todayTs;
          const dateStr = dayDate.getDate() + '.' + (dayDate.getMonth() + 1) + '.';
          return html`<div class="day-card" key=${d.key}>
            <div class="day-head">
              <span class="day-name">${d.label}<span class="day-date">, ${dateStr}</span></span>
              <button class="iconbtn small" onClick=${() => setAdding(d.key)} aria-label="Eintrag hinzufügen">
                <${Icon} name="plus" size=${18} />
              </button>
            </div>
            ${entries.length === 0
              ? html`<div class="day-empty">Ruhetag</div>`
              : html`<div class="day-entries">
                  ${entries.map((e) => {
                    const status = (e.sessionId || e.rideId) ? 'done' : (isPast ? 'missed' : 'open');
                    return html`
                    <div class=${'week-chip ' + (e.type === 'cycling' ? (e.rideType === 'indoor' ? 'indoor' : 'cycling') : 'strength')} key=${e.id}>
                      <${Icon} name=${e.type === 'cycling' ? 'bike' : 'dumbbell'} size=${15} />
                      <span>${entryLabel(e)}</span>
                      ${status === 'done' ? html`<span class="chip-check"><${Icon} name="check" size=${14} /></span>` : null}
                      <button class="chip-x" onClick=${() => requestDelete(weekKey, d.key, e, status)} aria-label="entfernen">
                        <${Icon} name="x" size=${13} />
                      </button>
                    </div>`;
                  })}
                </div>`}
          </div>`;
        })}
      </div>
    </div>

    ${adding ? html`
      <div class="modal-overlay" onClick=${() => setAdding(null)}>
        <div class="modal-sheet" onClick=${(ev) => ev.stopPropagation()}>
          <div class="modal-title">Zum ${(WEEKDAYS.find((w) => w.key === adding) || {}).label} hinzufügen</div>
          <button class="modal-opt" onClick=${() => { addWeekEntry(weekKey, adding, { type: 'cycling', rideType: 'outdoor' }); setAdding(null); }}>
            <${Icon} name="bike" size=${18} /> Radausfahrt
          </button>
          <button class="modal-opt" onClick=${() => { addWeekEntry(weekKey, adding, { type: 'cycling', rideType: 'indoor' }); setAdding(null); }}>
            <${Icon} name="bike" size=${18} /> Indoor-Training
          </button>
          ${state.plans.length === 0
            ? html`<p class="hint">Noch keine Trainingspläne – lege sie unter „Bibliothek → Pläne“ an.</p>`
            : state.plans.map((p) => html`
              <button class="modal-opt" key=${p.id} onClick=${() => { addWeekEntry(weekKey, adding, { type: 'strength', planId: p.id }); setAdding(null); }}>
                <${Icon} name="dumbbell" size=${18} /> ${p.name}
              </button>`)}
          <button class="btn full" onClick=${() => setAdding(null)}>Abbrechen</button>
        </div>
      </div>` : null}

    ${deleteModal}
  </div>`;
}
