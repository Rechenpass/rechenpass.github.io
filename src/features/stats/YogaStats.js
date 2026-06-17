import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { Segmented } from '../../components/Segmented.js';
import { BarChart } from './Charts.js';
import { lastPeriods, periodKey } from './statsUtils.js';

const PERIODS = [{ value: 'day', label: 'Tag' }, { value: 'week', label: 'Woche' }, { value: 'month', label: 'Monat' }, { value: 'year', label: 'Jahr' }];
const NOUN = { day: 'Tag', week: 'Woche', month: 'Monat', year: 'Jahr' };
const SPAN = { day: 7, week: 8, month: 6, year: 4 };

export function YogaStats({ yogaSessions }) {
  const [period, setPeriod] = useState('week');

  if (!yogaSessions.length) {
    return html`<div class="empty">
      <div class="empty-emoji">🧘</div>
      <p>Noch keine Yoga-Sessions erfasst. Erfasse eine über das Dashboard („Yoga-Session erfassen“).</p>
    </div>`;
  }

  const totalMin = yogaSessions.reduce((a, y) => a + (y.durationMin || 0), 0);
  const totalH = Math.round(totalMin / 6) / 10; // Stunden, 1 Nachkommastelle

  const series = (valueFn) => {
    const periods = lastPeriods(period, SPAN[period]);
    const map = {};
    for (const y of yogaSessions) { const k = periodKey(y.date, period); (map[k] = map[k] || []).push(y); }
    return periods.map((p) => ({ label: p.label, value: valueFn(map[p.key] || []) }));
  };

  const countData = series((arr) => arr.length);
  const minData = series((arr) => arr.reduce((a, y) => a + (y.durationMin || 0), 0));

  return html`<div class="stats-views">
    <div class="summary-stats">
      <div class="stat"><div class="stat-num">${yogaSessions.length}</div><div class="stat-label">Sessions</div></div>
      <div class="stat"><div class="stat-num">${totalH}</div><div class="stat-label">Stunden gesamt</div></div>
    </div>
    <${Segmented} options=${PERIODS} value=${period} onChange=${setPeriod} />
    <div class="stats-section"><h3>Yoga pro ${NOUN[period]}</h3><${BarChart} data=${countData} color="var(--teal)" /></div>
    <div class="stats-section"><h3>Minuten pro ${NOUN[period]}</h3><${BarChart} data=${minData} color="var(--teal)" /></div>
  </div>`;
}
