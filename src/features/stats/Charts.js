import { html } from '../../html.js';

// Senkrechtes Balkendiagramm (SVG, skaliert per viewBox auf volle Breite).
export function BarChart({ data, color = 'var(--accent)' }) {
  const W = 320, H = 160, padT = 18, padB = 26, padX = 8;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length || 1;
  const slot = (W - padX * 2) / n;
  const bw = Math.min(36, slot * 0.62);
  return html`<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet">
    ${data.map((d, i) => {
      const h = (H - padT - padB) * (d.value / max);
      const x = padX + slot * i + (slot - bw) / 2;
      const y = H - padB - h;
      return html`<g>
        <rect x=${x} y=${y} width=${bw} height=${Math.max(0, h)} rx="4" fill=${color} />
        ${d.value > 0 ? html`<text x=${x + bw / 2} y=${y - 4} text-anchor="middle" class="chart-val">${d.value}</text>` : null}
        <text x=${x + bw / 2} y=${H - 8} text-anchor="middle" class="chart-lbl">${d.label}</text>
      </g>`;
    })}
  </svg>`;
}

// Liniendiagramm (SVG) für Verläufe.
export function LineChart({ data, unit = '' }) {
  const W = 320, H = 160, padT = 20, padB = 26, padL = 10, padR = 10;
  const vals = data.map((d) => d.value);
  const max = Math.max(1, ...vals);
  const min = Math.min(0, ...vals);
  const n = data.length;
  const xAt = (i) => (n <= 1 ? W / 2 : padL + (W - padL - padR) * (i / (n - 1)));
  const yAt = (v) => { const t = (v - min) / (max - min || 1); return H - padB - (H - padT - padB) * t; };
  const pts = data.map((d, i) => `${xAt(i)},${yAt(d.value)}`).join(' ');
  return html`<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet">
    ${n > 1 ? html`<polyline points=${pts} fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />` : null}
    ${data.map((d, i) => html`<g>
      <circle cx=${xAt(i)} cy=${yAt(d.value)} r="3.5" fill="var(--accent)" />
      <text x=${xAt(i)} y=${yAt(d.value) - 7} text-anchor="middle" class="chart-val">${d.value}${unit}</text>
      <text x=${xAt(i)} y=${H - 8} text-anchor="middle" class="chart-lbl">${d.label}</text>
    </g>`)}
  </svg>`;
}

// Waagerechte Balken (HTML) für Ranglisten wie Muskel-Häufigkeit.
export function HBars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return html`<div class="hbars">
    ${rows.map((r) => html`<div class="hbar-row" key=${r.label}>
      <span class="hbar-label">${r.label}</span>
      <div class="hbar-track"><div class="hbar-fill" style=${`width:${(r.value / max) * 100}%`}></div></div>
      <span class="hbar-val">${r.value}</span>
    </div>`)}
  </div>`;
}
