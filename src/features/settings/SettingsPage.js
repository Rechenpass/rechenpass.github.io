import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { getState, replaceAllData } from '../../store.js';
import { isoDate } from '../../dateUtils.js';

export function SettingsPage({ onClose }) {
  const [msg, setMsg] = useState(null); // { type: 'ok' | 'err', text }
  const s = getState();
  const counts = `${(s.exercises || []).length} Übungen · ${(s.plans || []).length} Pläne · ${(s.sessions || []).length} Trainings · ${(s.rides || []).length} Fahrten`;

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
      if (confirm('Backup importieren? Deine aktuellen Daten werden dabei vollständig ersetzt.')) {
        replaceAllData(parsed);
        setMsg({ type: 'ok', text: 'Backup importiert – deine Daten wurden ersetzt.' });
      }
    };
    reader.readAsText(file);
  };

  return html`<div class="screen">
    <header class="screen-header">
      <button class="iconbtn" onClick=${onClose} aria-label="Zurück"><${Icon} name="back" /></button>
      <h2>Daten & Backup</h2>
    </header>
    <div class="screen-body">
      <p class="muted">Aktuell gespeichert: ${counts}</p>

      ${msg ? html`<div class=${'banner ' + (msg.type === 'err' ? 'error' : 'ok')}>${msg.text}</div>` : null}

      <div class="stats-section">
        <h3>Backup exportieren</h3>
        <p class="stats-caption">Speichert alle Daten als Datei (.json) – zum Sichern oder um sie auf ein anderes Gerät (z. B. iPhone) zu übertragen.</p>
        <button class="btn primary full" onClick=${exportData}><${Icon} name="download" size=${18} /> Backup exportieren</button>
      </div>

      <div class="stats-section">
        <h3>Backup importieren</h3>
        <p class="stats-caption"><b>Achtung:</b> ersetzt deine aktuellen Daten durch den Inhalt der Datei.</p>
        <label class="btn full import-btn">
          <${Icon} name="upload" size=${18} /> Backup-Datei wählen …
          <input type="file" accept="application/json,.json" onChange=${onFile} hidden />
        </label>
      </div>

      <p class="stats-caption">Tipp: Mache regelmäßig ein Backup – dann sind deine Übungen und Trainings immer sicher.</p>
    </div>
  </div>`;
}
