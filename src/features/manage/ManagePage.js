import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { ExercisesPage } from '../exercises/ExercisesPage.js';
import { PlansPage } from '../plans/PlansPage.js';

// „Verwalten“ bündelt Bibliothek + Pläne. Der Umschalter sitzt im Kopf der
// jeweiligen Seite (Übungen | Pläne); hier wird nur die aktive Seite gewählt.
export function ManagePage() {
  const [sub, setSub] = useState('exercises'); // exercises | plans
  return sub === 'exercises'
    ? html`<${ExercisesPage} sub=${sub} onSub=${setSub} />`
    : html`<${PlansPage} sub=${sub} onSub=${setSub} />`;
}
