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
  camera: false,
  crop: { x: 0.5, y: 0.5, size: 1 },
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

// Switches that start off rather than on, so "anything but false is true" --
// the rule the ones above use -- would turn them on by mistake.
const OPT_IN = ['camera'];

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
    for (const key of OPT_IN) settings[key] = settings[key] === true;

    // The square of the picture the camera pays attention to, kept sane
    // whatever is in storage.
    const crop = { ...DEFAULTS.crop, ...(settings.crop || {}) };
    const clamp = (value, low, high, fallback) =>
      Number.isFinite(Number(value)) ? Math.min(Math.max(Number(value), low), high) : fallback;
    settings.crop = {
      size: clamp(crop.size, 0.2, 1, DEFAULTS.crop.size),
      x: clamp(crop.x, 0, 1, DEFAULTS.crop.x),
      y: clamp(crop.y, 0, 1, DEFAULTS.crop.y)
    };

    const colors = { ...DEFAULTS.colors, ...(settings.colors || {}) };
    for (const { key, fallback } of COLOR_SLOTS) {
      if (!isColor(colors[key])) colors[key] = fallback;
    }
    settings.colors = colors;
    return settings;
  } catch (error) {
    // Falling back silently is how a typo in here once wiped every preference
    // on load without a word about it.
    console.error('Instellingen konden niet gelezen worden:', error);
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
