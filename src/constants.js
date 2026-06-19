// Feste Auswahllisten der App (Deutsch).

export const REGIONS = ['Oberkörper', 'Core', 'Unterkörper'];

export const GROUPS = ['Bodyweight', 'Kurzhantel', 'Theraband', 'Mini-Band'];

export const PHASES = [
  { key: 'WarmUp', label: 'Warm-Up' },
  { key: 'Training', label: 'Training' },
  { key: 'CoolDown', label: 'Cool-Down' },
];

export function phaseLabel(key) {
  const p = PHASES.find((x) => x.key === key);
  return p ? p.label : key;
}

// Muskelgruppen nach Körperregion gruppiert (für eine übersichtliche Auswahl).
export const MUSCLES_BY_REGION = {
  'Oberkörper': [
    'M. pectoralis major', 'M. pectoralis minor', 'M. trapezius', 'M. latissimus dorsi',
    'Mm. rhomboidei', 'M. serratus anterior', 'M. teres major', 'M. teres minor',
    'M. deltoideus anterior', 'M. deltoideus lateralis', 'M. deltoideus posterior', 'Rotatorenmanschette',
    'M. biceps brachii', 'M. brachialis', 'M. triceps brachii', 'M. brachioradialis', 'Mm. antebrachii',
  ],
  'Core': [
    'M. rectus abdominis (obere Anteile)', 'M. rectus abdominis (untere Anteile)',
    'Mm. obliqui abdominis', 'M. transversus abdominis', 'M. erector spinae',
    'Mm. multifidi', 'M. quadratus lumborum', 'M. iliopsoas',
  ],
  'Unterkörper': [
    'M. gluteus maximus', 'M. gluteus medius', 'M. gluteus minimus', 'M. tensor fasciae latae',
    'Tiefe Hüftaußenrotatoren/Piriformis', 'M. quadriceps femoris', 'Mm. ischiocrurales',
    'Mm. adductores', 'M. triceps surae',
  ],
};

export const ALL_MUSCLES = Object.values(MUSCLES_BY_REGION).flat();

// Dropdown-Optionen
export const SETS_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);          // 1..10
export const REPS_OPTIONS = Array.from({ length: 50 }, (_, i) => i + 1);          // 1..50
export const DURATION_OPTIONS = Array.from({ length: 12 }, (_, i) => (i + 1) * 10); // 10..120 s
export const REST_OPTIONS = [0, 5, ...Array.from({ length: 9 }, (_, i) => (i + 1) * 10)]; // 0, 5, dann 10..90 s

export const WEEKDAYS = [
  { key: 'mon', label: 'Montag' },
  { key: 'tue', label: 'Dienstag' },
  { key: 'wed', label: 'Mittwoch' },
  { key: 'thu', label: 'Donnerstag' },
  { key: 'fri', label: 'Freitag' },
  { key: 'sat', label: 'Samstag' },
  { key: 'sun', label: 'Sonntag' },
];
