// User preferences, stored next to the session.

const KEY = 'cubetimer.settings.v1';

/** Everything the user can recolour, with the shade it starts at. */
export const COLOR_SLOTS = [
  { key: 'led', label: 'Ring en accenten', fallback: '#4fc3f7' },
  { key: 'ready', label: 'Klaar om te starten', fallback: '#21c274' },
  { key: 'hold', label: 'Vasthouden en te traag', fallback: '#f4515b' },
  { key: 'record', label: 'Records', fallback: '#c8890a' }
];

/** Quick picks for the ring, taken from the LED glow of the GAN Halo pads. */
export const LED_COLORS = [
  { id: 'ice', label: 'IJsblauw', color: '#4fc3f7' },
  { id: 'aqua', label: 'Aqua', color: '#22d3ee' },
  { id: 'mint', label: 'Mint', color: '#34d399' },
  { id: 'violet', label: 'Violet', color: '#a78bfa' },
  { id: 'coral', label: 'Koraal', color: '#fb7185' },
  { id: 'amber', label: 'Amber', color: '#fbbf24' }
];

const DEFAULTS = {
  led: 'ice',
  colors: { led: '#4fc3f7', ready: '#21c274', hold: '#f4515b', record: '#c8890a' },
  theme: 'light',
  inspection: true,
  hideTime: true,
  decimals: 2,
  holdMs: 400,
  sound: true,
  haptics: true,
  celebrate: true,
  highlight: true,
  preview: true,
  countUp: true,
  wakeLock: true,
  font: 'rounded',
  practice: true,
  goalKind: 'time',   // 'time' counts the solving up, 'solves' counts the solves
  goalMinutes: 15,
  goalSolves: 25,
  puzzle: '333'
};

/** Faces for the timer digits. All of them ship with the system: a page that
    works offline cannot go and fetch a font. */
export const FONTS = ['rounded', 'system', 'mono'];

const SWITCHES = ['inspection', 'hideTime', 'sound', 'haptics', 'celebrate', 'highlight', 'preview', 'countUp', 'wakeLock', 'practice'];

function clampNumber(value, low, high, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(Math.max(number, low), high) : fallback;
}

const isColor = (value) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    const stored = raw ? JSON.parse(raw) : {};
    const settings = { ...DEFAULTS, ...stored };

    // Guard against hand-edited or outdated values.
    if (!LED_COLORS.some((c) => c.id === settings.led)) settings.led = DEFAULTS.led;
    if (settings.decimals !== 2 && settings.decimals !== 3) settings.decimals = DEFAULTS.decimals;
    if (![250, 400, 550].includes(settings.holdMs)) settings.holdMs = DEFAULTS.holdMs;
    if (!['light', 'dark', 'auto'].includes(settings.theme)) settings.theme = DEFAULTS.theme;
    if (!FONTS.includes(settings.font)) settings.font = DEFAULTS.font;
    if (!['time', 'solves'].includes(settings.goalKind)) settings.goalKind = DEFAULTS.goalKind;
    settings.goalMinutes = clampNumber(settings.goalMinutes, 1, 600, DEFAULTS.goalMinutes);
    settings.goalSolves = clampNumber(settings.goalSolves, 1, 500, DEFAULTS.goalSolves);
    for (const key of SWITCHES) settings[key] = settings[key] !== false;

    const colors = { ...DEFAULTS.colors, ...(settings.colors || {}) };
    for (const { key, fallback } of COLOR_SLOTS) {
      if (!isColor(colors[key])) colors[key] = fallback;
    }
    settings.colors = colors;
    return settings;
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function colorOf(id) {
  return (LED_COLORS.find((c) => c.id === id) || LED_COLORS[0]).color;
}
