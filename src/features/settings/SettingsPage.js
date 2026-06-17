import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { Segmented } from '../../components/Segmented.js';
import { confirmAsk } from '../../components/confirmHost.js';
import { getState, replaceAllData, markBackupDone, lastBackupTs, getPrefs, setPref } from '../../store.js';
import { isoDate, formatDate } from '../../dateUtils.js';

const PREP_OPTS = [
  { value: 0, label: 'Aus' },
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
  { value: 15, label: '15s' },
];

// Kleiner Kippschalter (an/aus).
function Toggle({ on, onChange, label }) {
  return html`<button type="button" role="switch" aria-checked=${on} aria-label=${label}
    class=${'toggle' + (on ? ' on' : '')} onClick=${() => onChange(!on)}>
    <span class="toggle-knob"></span>
  </button>`;
}

function backupInfo() {
  const ts = lastBackupTs();
  if (!ts) return { text: 'noch nie', amber: true };
  const days = Math.floor((Date.now() - ts) / 86400000);
  return { text: formatDate(ts), amber: days > 30 };
}

export function SettingsPage({ onClose }) {
  const [msg, setMsg] = useState(null); // { type: 'ok' | 'err', text }
  const [prefs, setPrefsState] = useState(getPrefs);
  const s = getState();
  const counts = `${(s.exercises || []).length} Übungen · ${(s.plans || []).length} Pläne · ${(s.sessions || []).length} Trainings · ${(s.rides || []).length} Fahrten`;
  const version = localStorage.getItem('_mv') || '';
  const versionDateTs = Number(localStorage.getItem('_mvDate')) || null;
  const versionText = version ? version + (versionDateTs ? ' (' + formatDate(versionDateTs) + ')' : '') : '—';
  const backup = backupInfo();
  const upd = (k, v) => setPrefsState(setPref(k, v));

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-backup-${isoDate(Date.now())}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      markBackupDone();
      setMsg({ type: 'ok', text: 'Backup-Datei wurde erstellt (Download / „Datei sichern").' });
    } catch (e) {
      setMsg({ type: 'err', text: 'Export fehlgeschlagen.' });
    }
  };

  const onFile = (ev) => {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = ''; // erlaubt erneutes Wählen derselben Datei
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (e) {
        setMsg({ type: 'err', text: 'Datei ist kein gültiges JSON.' });
        return;
      }
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.exercises)) {
        setMsg({ type: 'err', text: 'Das sieht nicht nach einer Fitness-Backup-Datei aus.' });
        return;
      }
      confirmAsk({
        title: 'Backup importieren?', message: 'Deine aktuellen Daten werden dabei vollständig ersetzt.',
        confirmLabel: 'Importieren & ersetzen', icon: 'upload',
        onConfirm: () => { replaceAllData(parsed); markBackupDone(); setMsg({ type: 'ok', text: 'Backup importiert – deine Daten wurden ersetzt.' }); },
      });
    };
    reader.readAsText(file);
  };

  return html`<div class="screen">
    <header class="screen-header">
      <button class="iconbtn" onClick=${onClose} aria-label="Zurück"><${Icon} name="back" /></button>
      <h2>Einstellungen</h2>
    </header>
    <div class="screen-body">
      ${msg ? html`<div class=${'banner ' + (msg.type === 'err' ? 'error' : 'ok')}>${msg.text}</div>` : null}

      <div class="stats-section">
        <h3>Info</h3>
        <div class="set-group">
          <div class="set-row"><span class="set-row-label">Version</span><span class="set-row-value">${versionText}</span></div>
          <div class="set-row"><span class="set-row-label">Letztes Backup</span><span class=${'set-row-value' + (backup.amber ? ' amber' : '')}>${backup.text}</span></div>
          <div class="set-row col"><span class="set-row-label">Gespeichert</span><span class="set-row-value left">${counts}</span></div>
        </div>
      </div>

      <div class="stats-section">
        <h3>Training</h3>
        <div class="set-group">
          <div class="set-row">
            <span class="set-row-label">Signaltöne</span>
            <${Toggle} on=${prefs.sound} onChange=${(v) => upd('sound', v)} label="Signaltöne" />
          </div>
          <div class="set-row col">
            <span class="set-row-label">Vorbereitung-Countdown</span>
            <${Segmented} options=${PREP_OPTS} value=${prefs.prepSec} onChange=${(v) => upd('prepSec', v)} />
          </div>
          <div class="set-row">
            <span class="set-row-label">Bildschirm wachhalten</span>
            <${Toggle} on=${prefs.wakeLock} onChange=${(v) => upd('wakeLock', v)} label="Bildschirm wachhalten" />
          </div>
        </div>
      </div>

      <div class="stats-section">
        <h3>Daten & Backup</h3>
        <p class="stats-caption">Speichert alle Daten als Datei (.json) – zum Sichern oder um sie auf ein anderes Gerät (z. B. iPhone) zu übertragen.</p>
        <button class="btn primary full" onClick=${exportData}><${Icon} name="download" size=${18} /> Backup exportieren</button>
        <p class="stats-caption" style="margin-top:10px"><b>Achtung:</b> Importieren ersetzt deine aktuellen Daten durch den Inhalt der Datei.</p>
        <label class="btn full import-btn">
          <${Icon} name="upload" size=${18} /> Backup-Datei wählen …
          <input type="file" accept="application/json,.json" onChange=${onFile} hidden />
        </label>
      </div>

      <p class="stats-caption">Tipp: Mache regelmäßig ein Backup – dann sind deine Übungen und Trainings immer sicher.</p>
    </div>
  </div>`;
}
