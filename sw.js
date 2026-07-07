/*
 * Service-Worker für „MeinTraining" – macht die App offline-fähig.
 *
 * Strategie: NETZWERK ZUERST, sonst Cache.
 *  - online  → immer frische Dateien (kein veralteter Stand), Cache wird nebenbei aktualisiert
 *  - offline → alles wird aus dem Zwischenspeicher geladen (App läuft ohne Server/Internet)
 *
 * Beim Installieren wird die komplette App vorab gecacht, damit auch der allererste
 * Offline-Start (z. B. frisch aufs iPhone installiert) sofort funktioniert.
 *
 * Bei Code-Änderungen die Version hochzählen (CACHE = '…-v2', …), damit alte Caches
 * sauber ersetzt werden.
 */

const CACHE = 'meintraining-v23';

const ASSETS = [
  './',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon.svg',
  './index.html',
  './manifest.webmanifest',
  './src/app.js',
  './src/components/BottomNav.js',
  './src/components/Icon.js',
  './src/components/Segmented.js',
  './src/components/AutoTextarea.js',
  './src/components/SwipeRow.js',
  './src/components/useEntryDeletion.js',
  './src/constants.js',
  './src/dateUtils.js',
  './src/features/cycling/CyclingPanel.js',
  './src/features/cycling/RideForm.js',
  './src/features/exercises/ExerciseCard.js',
  './src/features/exercises/ExerciseForm.js',
  './src/features/exercises/ExercisesPage.js',
  './src/features/exercises/Filters.js',
  './src/features/exercises/MuscleSelect.js',
  './src/features/home/HomePage.js',
  './src/features/manage/ManagePage.js',
  './src/features/plans/ExercisePicker.js',
  './src/features/plans/PlanEditor.js',
  './src/features/plans/PlanItemCard.js',
  './src/features/plans/PlansPage.js',
  './src/features/plans/planUtils.js',
  './src/features/settings/SettingsPage.js',
  './src/features/stats/BodyWeightStats.js',
  './src/features/stats/Charts.js',
  './src/features/stats/CyclingStats.js',
  './src/features/stats/StatsPage.js',
  './src/features/stats/SweetsStats.js',
  './src/features/stats/statsUtils.js',
  './src/features/workout/WorkoutPage.js',
  './src/features/workout/WorkoutPlayer.js',
  './src/features/workout/WorkoutReview.js',
  './src/features/workout/WorkoutSteps.js',
  './src/features/workout/WorkoutSummary.js',
  './src/features/workout/workoutEngine.js',
  './src/features/workout/workoutRuntime.js',
  './src/html.js',
  './src/pages/WeekPage.js',
  './src/store.js',
  './styles/app.css',
  './vendor/hooks.module.js',
  './vendor/htm.module.js',
  './vendor/preact.module.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      const oldKeys = keys.filter((k) => k !== CACHE);
      const isUpdate = oldKeys.length > 0;
      await Promise.all(oldKeys.map((k) => caches.delete(k)));
      await self.clients.claim();
      if (isUpdate) {
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach((c) => c.postMessage({ type: 'UPDATE_AVAILABLE' }));
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return; // nur eigene Dateien

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
