import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { useStore } from '../../store.js';
import { Segmented } from '../../components/Segmented.js';
import { Icon } from '../../components/Icon.js';
import { BarChart, LineChart, HBars } from './Charts.js';
import {
  lastPeriods, periodKey, exercisesFromSessions, exMeta, exerciseMetric, exerciseSeries, muscleFrequency,
} from './statsUtils.js';
import { CyclingStats } from './CyclingStats.js';
import { BodyWeightStats } from './BodyWeightStats.js';
import { SweetsStats } from './SweetsStats.js';
import { YogaStats } from './YogaStats.js';

const PERIODS = [{ value: 'day', label: 'Tag' }, { value: 'week', label: 'Woche' }, { value: 'month', label: 'Monat' }, { value: 'year', label: 'Jahr' }];
const NOUN = { day: 'Tag', week: 'Woche', month: 'Monat', year: 'Jahr' };
const SPAN = { day: 7, week: 8, month: 6, year: 4 };
// Oben nur drei Punkte: Übersicht · Sportart (natives Auswahlmenü) · Körper.
const SPORTS = [{ value: 'kraft', label: 'Kraft' }, { value: 'rad', label: 'Rad' }, { value: 'yoga', label: 'Yoga' }];

// #37: Übersicht – Kraft und Rad getrennt gezählt, Einheiten pro Zeitraum, gemeinsamer Umschalter.
function OverviewStats({ sessions, rides, yogaSessions }) {
  const [period, setPeriod] = useState('week');
  const periods = lastPeriods(period, SPAN[period]);
  const bars = (items) => {
    const m = {};
    items.forEach((it) => { const k = periodKey(it.date, period); m[k] = (m[k] || 0) + 1; });
    return periods.map((p) => ({ label: p.label, value: m[p.key] || 0 }));
  };

  if (sessions.length + rides.length + yogaSessions.length === 0) {
    return html`<div class="empty">
      <div class="empty-emoji">📊</div>
      <p>Noch keine Einheiten. Absolviere ein Training oder erfasse eine Fahrt.</p>
    </div>`;
  }

  return html`<div class="stats-views">
    <${Segmented} options=${PERIODS} value=${period} onChange=${setPeriod} />
    <div class="stats-section">
      <h3><span class="ov-dot" style="background:var(--accent)"></span>Krafttraining pro ${NOUN[period]}</h3>
      <${BarChart} data=${bars(sessions)} />
    </div>
    <div class="stats-section">
      <h3><span class="ov-dot" style="background:var(--success)"></span>Radtraining pro ${NOUN[period]}</h3>
      <${BarChart} data=${bars(rides)} color="var(--success)" />
    </div>
    <div class="stats-section">
      <h3><span class="ov-dot" style="background:var(--teal)"></span>Yoga pro ${NOUN[period]}</h3>
      <${BarChart} data=${bars(yogaSessions)} color="var(--teal)" />
    </div>
  </div>`;
}

function KraftStats({ sessions }) {
  const [period, setPeriod] = useState('week');
  const [exId, setExId] = useState('');

  if (sessions.length === 0) {
    return html`<div class="empty">
      <div class="empty-emoji">📊</div>
      <p>Noch keine Auswertung möglich. Absolviere zuerst ein Krafttraining unter „Training“.</p>
    </div>`;
  }

  const exList = exercisesFromSessions(sessions);
  const selEx = exId && exList.some((x) => x.id === exId) ? exId : exList[0].id;
  const meta = exMeta(sessions, selEx);
  const metric = exerciseMetric(meta.type, meta.weighted);
  const lineData = exerciseSeries(sessions, selEx, period).map((p) => ({ label: p.label, value: p[metric.key] }));

  const periods = lastPeriods(period, SPAN[period]);
  const countByKey = {};
  sessions.forEach((s) => { const k = periodKey(s.date, period); countByKey[k] = (countByKey[k] || 0) + 1; });
  const trainBars = periods.map((p) => ({ label: p.label, value: countByKey[p.key] || 0 }));
  const muscleRows = muscleFrequency(sessions).slice(0, 10);

  return html`<div class="stats-views">
    <${Segmented} options=${PERIODS} value=${period} onChange=${setPeriod} />
    <div class="stats-section"><h3>Krafttraining pro ${NOUN[period]}</h3><${BarChart} data=${trainBars} /></div>
    <div class="stats-section">
      <h3>Häufigkeit Muskelgruppen</h3>
      <div class="stats-caption">Sätze je primär trainierter Muskelgruppe (gesamt)</div>
      <${HBars} rows=${muscleRows} />
    </div>
    <div class="stats-section">
      <h3>Verlauf pro Übung</h3>
      <select class="input" value=${selEx} onChange=${(e) => setExId(e.target.value)}>
        ${exList.map((x) => html`<option value=${x.id}>${x.name}</option>`)}
      </select>
      <div class="stats-caption">${metric.label} pro ${NOUN[period]}</div>
      ${lineData.length >= 1 ? html`<${LineChart} data=${lineData} unit=${metric.unit} />` : html`<p class="stats-caption">Noch keine Daten.</p>`}
    </div>
  </div>`;
}

export function StatsPage() {
  const state = useStore();
  const [view, setView] = useState('overview'); // 'overview' | 'sport' | 'body'
  const [sport, setSport] = useState('kraft');
  const sportLabel = (SPORTS.find((s) => s.value === sport) || SPORTS[0]).label;
  return html`<div class="screen">
    <header class="screen-header"><h2>Statistik</h2></header>
    <div class="screen-body">
      <div class="segmented">
        <button type="button" class=${'seg' + (view === 'overview' ? ' active' : '')} onClick=${() => setView('overview')}>Übersicht</button>
        <div class=${'seg seg-select' + (view === 'sport' ? ' active' : '')}>
          ${sportLabel}<${Icon} name="down" size=${14} />
          <select aria-label="Sportart wählen" value=${sport}
            onClick=${() => setView('sport')}
            onChange=${(e) => { setSport(e.target.value); setView('sport'); }}>
            ${SPORTS.map((s) => html`<option key=${s.value} value=${s.value}>${s.label}</option>`)}
          </select>
        </div>
        <button type="button" class=${'seg' + (view === 'body' ? ' active' : '')} onClick=${() => setView('body')}>Körper</button>
      </div>
      ${view === 'overview'
        ? html`<${OverviewStats} sessions=${state.sessions || []} rides=${state.rides || []} yogaSessions=${state.yogaSessions || []} />`
        : view === 'body'
        ? html`<${BodyWeightStats} bodyWeights=${state.bodyWeights || []} /><${SweetsStats} sweets=${state.sweets || {}} />`
        : sport === 'kraft'
        ? html`<${KraftStats} sessions=${state.sessions || []} />`
        : sport === 'rad'
        ? html`<${CyclingStats} rides=${state.rides || []} bodyWeights=${state.bodyWeights || []} />`
        : html`<${YogaStats} yogaSessions=${state.yogaSessions || []} />`}
    </div>
  </div>`;
}
