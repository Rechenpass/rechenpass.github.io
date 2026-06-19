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
    if (e.type === 'yoga') return 'Yoga';
    const p = getPlan(e.planId);
    return p ? p.name : 'Plan gelöscht';
  };

  return html`<div class="screen">
    <header class="screen-header"><h2>Wochenplan</h2></header>
    <div class="screen-body">
      <div class="week-switch">
        <button class="iconbtn" onClick=${() => setWeekKey(shiftWeekKey(weekKey, -1))} aria-label="Vorherige Woche"><${Icon} name="back" /></button>
        <div class="week-switch-center">
          <span class=${'week-kw-pill' + (thisWeek ? ' now' : '')}>KW ${kw}</span>
          <div class="week-range">${weekRangeLabel(weekKey)}</div>
        </div>
        <button class="iconbtn" onClick=${() => setWeekKey(shiftWeekKey(weekKey, 1))} aria-label="Nächste Woche"><${Icon} name="forward" /></button>
      </div>

      <div class="week-list">
        ${WEEKDAYS.map((d, di) => {
          // Feste Reihenfolge: Krafttraining zuerst, dann Radtraining; je alphabetisch.
          const entries = [...(week[d.key] || [])].sort((a, b) => {
            const rank = (e) => (e.type === 'yoga' ? 2 : e.type === 'cycling' ? 1 : 0);
            return (rank(a) - rank(b)) || entryLabel(a).localeCompare(entryLabel(b), 'de');
          });
          const dayDate = new Date(parseDateInput(weekKey));
          dayDate.setDate(dayDate.getDate() + di);
          dayDate.setHours(0, 0, 0, 0);
          const isPast = dayDate.getTime() < todayTs;
          const dateStr = dayDate.getDate() + '.' + (dayDate.getMonth() + 1) + '.';
          return html`<div class=${'day-card' + (entries.length === 0 ? ' rest' : '')} key=${d.key}>
            <div class="day-head">
              <span class="day-name">${d.label}<span class="day-date">, ${dateStr}</span></span>
              <button class="iconbtn small" onClick=${() => setAdding(d.key)} aria-label="Eintrag hinzufügen">
                <${Icon} name="list" size=${18} />
              </button>
            </div>
            ${entries.length === 0
              ? html`<div class="day-empty">Ruhetag</div>`
              : html`<div class="day-entries">
                  ${entries.map((e) => {
                    const status = (e.sessionId || e.rideId || e.yogaId) ? 'done' : (isPast ? 'missed' : 'open');
                    return html`
                    <div class=${'week-chip ' + status} key=${e.id}>
                      ${status === 'done' ? html`<${Icon} name="check" size=${15} />`
                        : status === 'missed' ? html`<${Icon} name="alert" size=${15} />` : null}
                      <span>${entryLabel(e)}</span>
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
        <div class="modal-sheet adding-sheet" onClick=${(ev) => ev.stopPropagation()}>
          <div class="sheet-head">
            <div class="modal-title">Zum ${(WEEKDAYS.find((w) => w.key === adding) || {}).label} hinzufügen</div>
            <button class="iconbtn small" onClick=${() => setAdding(null)} aria-label="Schließen"><${Icon} name="x" size=${18} /></button>
          </div>
          <div class="adding-list">
            <button class="modal-opt" onClick=${() => { addWeekEntry(weekKey, adding, { type: 'cycling', rideType: 'outdoor' }); setAdding(null); }}>
              <${Icon} name="bike" size=${18} /> Radausfahrt
            </button>
            <button class="modal-opt" onClick=${() => { addWeekEntry(weekKey, adding, { type: 'cycling', rideType: 'indoor' }); setAdding(null); }}>
              <${Icon} name="bike" size=${18} /> Indoor-Training
            </button>
            <button class="modal-opt" onClick=${() => { addWeekEntry(weekKey, adding, { type: 'yoga' }); setAdding(null); }}>
              <${Icon} name="yoga" size=${18} stroke=${1.6} /> Yoga
            </button>
            ${state.plans.length === 0
              ? html`<p class="hint">Noch keine Trainingspläne – lege sie unter „Bibliothek → Pläne“ an.</p>`
              : state.plans.map((p) => html`
                <button class="modal-opt" key=${p.id} onClick=${() => { addWeekEntry(weekKey, adding, { type: 'strength', planId: p.id }); setAdding(null); }}>
                  <${Icon} name="dumbbell" size=${18} /> ${p.name}
                </button>`)}
          </div>
          <button class="btn full" onClick=${() => setAdding(null)}>Abbrechen</button>
        </div>
      </div>` : null}

    ${deleteModal}
  </div>`;
}
