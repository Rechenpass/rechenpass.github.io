import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { LineChart } from './Charts.js';
import { addBodyWeight, deleteBodyWeight } from '../../store.js';
import { todayInput, parseDateInput, formatDate } from '../../dateUtils.js';

function shortDate(ts) {
  const d = new Date(ts);
  return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');
}

export function BodyWeightStats({ bodyWeights }) {
  const [date, setDate] = useState(todayInput());
  const [kg, setKg] = useState('');

  const entries = [...bodyWeights].sort((a, b) => a.date - b.date);
  const latest = entries.length ? entries[entries.length - 1] : null;
  const lineData = entries.map((e) => ({ label: shortDate(e.date), value: e.weightKg }));

  const add = () => {
    const w = Number(kg);
    if (!kg || isNaN(w) || w <= 0) return;
    addBodyWeight({ date: parseDateInput(date), weightKg: w });
    setKg('');
  };

  return html`<div class="stats-views">
    <div class="stats-section">
      <h3>Körpergewicht eintragen</h3>
      <div class="weight-add">
        <input class="input" type="date" value=${date} onInput=${(e) => setDate(e.target.value)} />
        <input class="input" type="number" inputmode="decimal" min="0" step="0.1" placeholder="kg" value=${kg} onInput=${(e) => setKg(e.target.value)} />
        <button class="btn primary" onClick=${add}>Hinzufügen</button>
      </div>
    </div>

    ${entries.length === 0
      ? html`<div class="empty"><div class="empty-emoji">⚖️</div><p>Noch keine Gewichtswerte. Trage oben dein erstes Gewicht ein.</p></div>`
      : html`
        <div class="stats-section">
          <h3>Verlauf ${latest ? html`<span class="muted">· aktuell ${latest.weightKg} kg</span>` : ''}</h3>
          <${LineChart} data=${lineData} unit=${' kg'} />
        </div>
        <div class="stats-section">
          <h3>Einträge</h3>
          <div class="weight-list">
            ${[...entries].reverse().map((e) => html`
              <div class="weight-row" key=${e.id}>
                <span>${formatDate(e.date)}</span>
                <span class="weight-val">${e.weightKg} kg</span>
                <button class="iconbtn small" onClick=${() => { if (confirm('Eintrag löschen?')) deleteBodyWeight(e.id); }} aria-label="löschen">
                  <${Icon} name="trash" size=${16} />
                </button>
              </div>`)}
          </div>
        </div>`}
  </div>`;
}
