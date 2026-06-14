import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { setSweets, clearSweets } from '../../store.js';
import { todayInput } from '../../dateUtils.js';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const DOW = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

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

export function SweetsStats({ sweets }) {
  const [date, setDate] = useState(todayInput());
  const [monthKey, setMonthKey] = useState(() => monthKeyFor(Date.now()));

  const sw = sweets || {};
  const current = sw[date]; // true | false | undefined
  const today = todayInput();
  const thisMonth = monthKey === monthKeyFor(Date.now());

  // Monatsraster aufbauen (Montag-first), Soll-/Ist-Zustände je Tag.
  const [y, m] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Montag = 0
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  let noCount = 0; let yesCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const val = sw[key];
    if (val === false) noCount++;
    else if (val === true) yesCount++;
    cells.push({ day, key, val, future: key > today, isToday: key === today });
  }

  return html`<div class="stats-views">
    <div class="stats-section">
      <h3>Süßigkeiten-Tracking</h3>
      <div class="sweets-input">
        <input class="input" type="date" max=${today} value=${date} onInput=${(e) => setDate(e.target.value)} />
        <div class="sweets-choice">
          <button class=${'sweets-btn no' + (current === false ? ' active' : '')} onClick=${() => setSweets(date, false)}>
            NEIN 💪
          </button>
          <button class=${'sweets-btn yes' + (current === true ? ' active' : '')} onClick=${() => setSweets(date, true)}>
            JA 😔
          </button>
        </div>
        ${current !== undefined
          ? html`<button class="sweets-clear" onClick=${() => clearSweets(date)}>Eintrag entfernen</button>`
          : null}
      </div>
    </div>

    <div class="stats-section">
      <div class="week-switch">
        <button class="iconbtn" onClick=${() => setMonthKey(shiftMonthKey(monthKey, -1))} aria-label="Vorheriger Monat"><${Icon} name="back" /></button>
        <div class="week-switch-center"><div class="week-range">${monthLabel(monthKey)}</div></div>
        <button class="iconbtn" onClick=${() => setMonthKey(shiftMonthKey(monthKey, 1))} aria-label="Nächster Monat" disabled=${thisMonth}><${Icon} name="forward" /></button>
      </div>

      <div class="sweets-grid">
        ${DOW.map((d) => html`<div class="sweets-dow" key=${d}>${d}</div>`)}
        ${cells.map((c, i) => (c === null
          ? html`<div key=${'b' + i}></div>`
          : html`<div key=${c.key} class=${'sweets-cell'
              + (c.val === false ? ' no' : c.val === true ? ' yes' : '')
              + (c.future ? ' future' : '')
              + (c.isToday ? ' today' : '')}>${c.day}</div>`))}
      </div>

    </div>
  </div>`;
}
