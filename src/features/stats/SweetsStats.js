import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { setSweets, clearSweets } from '../../store.js';
import { todayInput } from '../../dateUtils.js';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const DOW = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const DAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function monthKeyFor(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
function shiftMonthKey(monthKey, n) {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, (m - 1) + n, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
function monthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return MONTHS[m - 1] + ' ' + y;
}
// Überschrift im Auswahl-Sheet, z. B. „Freitag, 10. Juli"
function dayLabel(key) {
  const [y, m, d] = key.split('-').map(Number);
  return `${DAYS_LONG[new Date(y, m - 1, d).getDay()]}, ${d}. ${MONTHS[m - 1]}`;
}

// Süßigkeiten-Tracking: nur der Monatskalender. Ein Tipp auf einen Tag öffnet die
// Auswahl JA/NEIN (bzw. „Eintrag entfernen"), zukünftige Tage sind reine Anzeige.
export function SweetsStats({ sweets }) {
  const [monthKey, setMonthKey] = useState(() => monthKeyFor(Date.now()));
  const [pick, setPick] = useState(null); // angetippter Tag (Datums-Key)

  const sw = sweets || {};
  const today = todayInput();
  const thisMonth = monthKey === monthKeyFor(Date.now());

  // Monatsraster aufbauen (Montag-first), Zustand je Tag.
  const [y, m] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Montag = 0
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ day, key, val: sw[key], future: key > today, isToday: key === today });
  }

  const picked = pick ? sw[pick] : undefined;

  return html`<div class="stats-views">
    <div class="stats-section">
      <h3>Süßigkeiten-Tracking</h3>
      <div class="week-switch">
        <button class="iconbtn" onClick=${() => setMonthKey(shiftMonthKey(monthKey, -1))} aria-label="Vorheriger Monat"><${Icon} name="back" /></button>
        <div class="week-switch-center"><div class="week-range">${monthLabel(monthKey)}</div></div>
        <button class="iconbtn" onClick=${() => setMonthKey(shiftMonthKey(monthKey, 1))} aria-label="Nächster Monat" disabled=${thisMonth}><${Icon} name="forward" /></button>
      </div>

      <div class="sweets-grid">
        ${DOW.map((d) => html`<div class="sweets-dow" key=${d}>${d}</div>`)}
        ${cells.map((c, i) => {
          if (c === null) return html`<div key=${'b' + i}></div>`;
          if (c.future) return html`<div key=${c.key} class="sweets-cell future">${c.day}</div>`;
          return html`<button type="button" key=${c.key}
            class=${'sweets-cell' + (c.val === false ? ' no' : c.val === true ? ' yes' : '') + (c.isToday ? ' today' : '')}
            aria-label=${dayLabel(c.key) + ' eintragen'}
            onClick=${() => setPick(c.key)}>${c.day}</button>`;
        })}
      </div>
    </div>

    ${pick ? html`
      <div class="modal-overlay" onClick=${() => setPick(null)}>
        <div class="modal-sheet" onClick=${(ev) => ev.stopPropagation()}>
          <div class="sheet-head">
            <div class="modal-title">${dayLabel(pick)}</div>
            <button class="iconbtn small" onClick=${() => setPick(null)} aria-label="Schließen"><${Icon} name="x" size=${18} /></button>
          </div>
          <div class="sweets-choice">
            <button class=${'sweets-btn no' + (picked === false ? ' active' : '')} onClick=${() => { setSweets(pick, false); setPick(null); }}>
              NEIN 💪
            </button>
            <button class=${'sweets-btn yes' + (picked === true ? ' active' : '')} onClick=${() => { setSweets(pick, true); setPick(null); }}>
              JA 😔
            </button>
          </div>
          ${picked !== undefined
            ? html`<button class="sweets-clear" onClick=${() => { clearSweets(pick); setPick(null); }}>Eintrag entfernen</button>`
            : null}
          <button class="btn full" onClick=${() => setPick(null)}>Abbrechen</button>
        </div>
      </div>` : null}
  </div>`;
}
