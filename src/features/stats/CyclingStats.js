import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { Segmented } from '../../components/Segmented.js';
import { BarChart, LineChart } from './Charts.js';
import { lastPeriods, periodKey } from './statsUtils.js';

const PERIODS = [{ value: 'day', label: 'Tag' }, { value: 'week', label: 'Woche' }, { value: 'month', label: 'Monat' }, { value: 'year', label: 'Jahr' }];
const NOUN = { day: 'Tag', week: 'Woche', month: 'Monat', year: 'Jahr' };
const SPAN = { day: 7, week: 8, month: 6, year: 4 };
const FILTERS = [{ value: 'all', label: 'Alle' }, { value: 'outdoor', label: 'Radausfahrt' }, { value: 'indoor', label: 'Indoor' }];

const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;

// Passendes Körpergewicht zu einem Zeitpunkt: jüngster Eintrag am/vor dem Datum (sonst der früheste).
function weightAt(weights, ts) {
  if (!weights || !weights.length) return null;
  const sorted = [...weights].sort((a, b) => a.date - b.date);
  let w = sorted[0].weightKg;
  for (const e of sorted) { if (e.date <= ts) w = e.weightKg; else break; }
  return w;
}

export function CyclingStats({ rides, bodyWeights }) {
  const [period, setPeriod] = useState('week');
  const [filter, setFilter] = useState('all');

  if (!rides.length) {
    return html`<div class="empty">
      <div class="empty-emoji">🚴</div>
      <p>Noch keine Fahrten erfasst. Trage unter „Training → Rad“ deine Fahrten ein, dann erscheint hier die Auswertung.</p>
    </div>`;
  }

  const data = rides.filter((r) => filter === 'all' || r.type === filter);
  const totalKm = r1(data.reduce((a, r) => a + (r.distanceKm || 0), 0));
  const totalHm = Math.round(data.reduce((a, r) => a + (r.elevationM || 0), 0));
  const hasWatt = data.some((r) => r.type === 'indoor' && r.avgWatt != null);
  const hasWeight = (bodyWeights || []).length > 0;

  const series = (valueFn, agg, prec = 1) => {
    const periods = lastPeriods(period, SPAN[period]);
    const map = {};
    for (const r of data) { const k = periodKey(r.date, period); (map[k] = map[k] || []).push(r); }
    return periods.map((p) => {
      const arr = map[p.key] || [];
      let v = 0;
      if (agg === 'count') v = arr.length;
      else if (agg === 'avg') { const xs = arr.map(valueFn).filter((x) => x != null && !isNaN(x)); v = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; }
      else v = arr.reduce((a, r) => a + (valueFn(r) || 0), 0);
      return { label: p.label, value: (prec === 2 ? r2 : r1)(v) };
    });
  };

  const wattPerKg = (r) => {
    if (r.type === 'indoor' && r.avgWatt != null) {
      const w = weightAt(bodyWeights, r.date);
      return w ? r.avgWatt / w : null;
    }
    return null;
  };

  return html`<div class="stats-views">
    <${Segmented} options=${FILTERS} value=${filter} onChange=${setFilter} />
    <div class="summary-stats">
      <div class="stat"><div class="stat-num">${data.length}</div><div class="stat-label">Fahrten</div></div>
      <div class="stat"><div class="stat-num">${totalKm}</div><div class="stat-label">km gesamt</div></div>
      <div class="stat"><div class="stat-num">${totalHm}</div><div class="stat-label">Höhenmeter</div></div>
    </div>
    <${Segmented} options=${PERIODS} value=${period} onChange=${setPeriod} />

    ${data.length === 0 ? html`<div class="empty"><p>Keine Fahrten dieser Art im Zeitraum.</p></div>` : html`
      <div class="stats-section"><h3>Fahrten pro ${NOUN[period]}</h3><${BarChart} data=${series(() => 1, 'count')} /></div>
      <div class="stats-section"><h3>Kilometer pro ${NOUN[period]}</h3><${BarChart} data=${series((r) => r.distanceKm, 'sum')} /></div>
      <div class="stats-section"><h3>Höhenmeter pro ${NOUN[period]}</h3><${BarChart} data=${series((r) => r.elevationM, 'sum')} /></div>
      ${hasWatt ? html`<div class="stats-section">
        <h3>Ø Watt pro ${NOUN[period]}</h3><div class="stats-caption">Indoor – Durchschnitt der erfassten Watt-Werte</div>
        <${LineChart} data=${series((r) => (r.type === 'indoor' ? r.avgWatt : null), 'avg')} unit=${' W'} />
      </div>` : null}
      ${hasWatt && hasWeight ? html`<div class="stats-section">
        <h3>Watt/kg pro ${NOUN[period]}</h3><div class="stats-caption">Ø Watt ÷ Körpergewicht (Indoor)</div>
        <${LineChart} data=${series(wattPerKg, 'avg', 2)} unit=${' W/kg'} />
      </div>` : null}
      ${hasWatt && !hasWeight ? html`<div class="stats-section">
        <div class="stats-caption">Trage unter „Körper“ dein Körpergewicht ein – dann zeige ich dir hier zusätzlich Watt/kg.</div>
      </div>` : null}
    `}
  </div>`;
}
