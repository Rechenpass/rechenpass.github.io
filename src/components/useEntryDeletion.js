import { html } from '../html.js';
import { useState } from 'preact/hooks';
import { Icon } from './Icon.js';
import { removeWeekEntry, deleteSession, deleteRide, getPlan } from '../store.js';

function entryLabel(e) {
  if (e.type === 'cycling') {
    return e.rideType === 'indoor' ? 'Indoor-Training' : e.rideType === 'outdoor' ? 'Radausfahrt' : 'Radtraining';
  }
  const p = getPlan(e.planId);
  return p ? p.name : 'Plan gelöscht';
}

// Gemeinsamer Lösch-Ablauf für Wocheneinträge (Wochenplan + Dashboard):
// erledigt → Auswahl-Dialog (nur Plan / auch Einheit), vergangen → Rückfrage, offen → direkt.
export function useEntryDeletion() {
  const [deleting, setDeleting] = useState(null); // { weekKey, dayKey, entry }

  const requestDelete = (weekKey, dayKey, entry, status) => {
    if (status === 'done') { setDeleting({ weekKey, dayKey, entry }); return; }
    if (status === 'missed'
      && !confirm('Dieser geplante Termin liegt in der Vergangenheit – wirklich aus dem Plan entfernen?')) return;
    removeWeekEntry(weekKey, dayKey, entry.id);
  };

  const finish = (alsoActivity) => {
    const { weekKey, dayKey, entry } = deleting;
    removeWeekEntry(weekKey, dayKey, entry.id);
    if (alsoActivity) {
      if (entry.sessionId) deleteSession(entry.sessionId);
      if (entry.rideId) deleteRide(entry.rideId);
    }
    setDeleting(null);
  };

  const deleteModal = deleting ? html`
    <div class="modal-overlay" onClick=${() => setDeleting(null)}>
      <div class="modal-sheet" onClick=${(ev) => ev.stopPropagation()}>
        <div class="modal-title">„${entryLabel(deleting.entry)}" ist bereits erledigt</div>
        <button class="modal-opt" onClick=${() => finish(false)}>
          <${Icon} name="x" size=${18} /> Nur aus dem Plan entfernen
        </button>
        <button class="modal-opt danger" onClick=${() => finish(true)}>
          <${Icon} name="trash" size=${18} /> Auch die erfasste Einheit löschen
        </button>
        <p class="hint">„Auch löschen" entfernt das erfasste Training bzw. die Fahrt dauerhaft – auch aus der Statistik.</p>
        <button class="btn full" onClick=${() => setDeleting(null)}>Abbrechen</button>
      </div>
    </div>` : null;

  return { requestDelete, deleteModal };
}
