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

/**
 * A skin rather than an accent colour: the paper, the ink and the glow together,
 * so the app can feel like a blue GAN mat or like a sheet of paper instead of
 * like the same app with a different highlight.
 */
export const SKINS = [
  { id: 'default', label: 'Standaard', font: null, vars: null },
  {
    id: 'mat',
    label: 'Blauw matje',
    font: 'rounded',
    vars: {
      '--page': 'linear-gradient(160deg, #dceaf7, #f2f8fd 55%)',
      '--paper': '#eef6fb', '--card-solid': '#ffffff', '--sunken': '#e4eef7',
      '--hover': '#d8e7f4', '--ink': '#0d2c44', '--ink-soft': '#3c6a92',
      '--led': '#2f6cc0'
    }
  },
  {
    id: 'hall',
    label: 'Wedstrijdzaal',
    font: 'system',
    vars: {
      '--page': 'linear-gradient(180deg, #fafaf8, #f0f0ec)',
      '--paper': '#f7f7f5', '--card-solid': '#ffffff', '--sunken': '#eeeeea',
      '--hover': '#e4e4de', '--ink': '#1c1c1a', '--led': '#c8890a'
    }
  },
  {
    id: 'neon',
    label: 'Neon',
    font: 'mono',
    dark: true,
    vars: {
      '--page': 'radial-gradient(circle at 20% 0%, #1a0f2e, #05050c 60%)',
      '--paper': '#0a0a12', '--card-solid': '#12121f', '--sunken': '#1a1a2c',
      '--hover': '#24243a', '--ink': '#e8e8ff', '--ink-soft': '#a0a0c8',
      '--edge': 'rgba(160,160,220,.18)', '--led': '#ff3cac',
      '--muted': '#8888b0', '--shadow': '0 12px 40px -12px rgba(0,0,0,.7)'
    }
  },
  {
    id: 'paper',
    label: 'Papier',
    font: 'system',
    vars: {
      '--page': 'linear-gradient(180deg, #f8f3e8, #efe7d7)',
      '--paper': '#f6f1e6', '--card-solid': '#fffdf7', '--sunken': '#ece5d6',
      '--hover': '#e2d9c6', '--ink': '#2b2418', '--led': '#8a6a3a'
    }
  }
];

const DEFAULTS = {
  led: 'ice',
  colors: { led: '#4fc3f7', ready: '#21c274', hold: '#f4515b', record: '#c8890a' },
  theme: 'light',
  skin: 'default',
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
  splits: false,
  pace: true,
  crossTip: false,
  crossFace: 'D',
  // Which scrambles you want dealt: everything, only easy crosses, only hard.
  taste: 'any',
  wonBadges: [],
  badgesSeeded: false,
  cubes: [],
  cube: '',
  shareName: '',
  // The four corners of the mat in the camera's picture, clockwise from the
  // top left. A square by default, because a camera pointed straight down at a
  // mat sees a square; every other angle sees a trapezium, so the corners move
  // independently.
  crop: { corners: [[0, 0], [1, 0], [1, 1], [0, 1]] },
  // The chromaticity of this cube's own six stickers, under this room's light,
  // learned from the cube itself. Empty until you teach it.
  cubeColours: [],
  // The same, but kept per named cube, so the camera can say which one is on
  // the mat instead of only what state it is in.
  cubeKits: {},
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

const SWITCHES = ['inspection', 'hideTime', 'pace', 'sound', 'haptics', 'celebrate', 'highlight', 'preview', 'countUp', 'wakeLock', 'practice'];

// Switches that start off rather than on, so "anything but false is true" --
// the rule the ones above use -- would turn them on by mistake.
const OPT_IN = ['camera', 'splits', 'crossTip', 'badgesSeeded'];

function clampNumber(value, low, high, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(Math.max(number, low), high) : fallback;
}

const isColor = (value) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

/** Six pairs of chromaticity, or whatever of them is actually there. */
const cleanPalette = (list) => (Array.isArray(list)
  ? list
    .filter((c) => Array.isArray(c) && c.length === 2 && c.every((v) => Number.isFinite(Number(v))))
    .slice(0, 6)
    .map(([x, y]) => [Number(x), Number(y)])
  : []);

const inside = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(Math.max(number, 0), 1) : fallback;
};

/**
 * The four corners the camera pays attention to, whatever is in storage.
 * Crops used to be a centred square written as a middle and a side; one of
 * those is read back as the square it describes rather than thrown away.
 */
function cleanCorners(crop) {
  const stored = crop?.corners;
  if (Array.isArray(stored) && stored.length === 4 && stored.every((c) => Array.isArray(c) && c.length === 2)) {
    return stored.map(([x, y], i) => [inside(x, DEFAULTS.crop.corners[i][0]), inside(y, DEFAULTS.crop.corners[i][1])]);
  }

  const size = Number(crop?.size);
  if (Number.isFinite(size) && size > 0) {
    const half = Math.min(Math.max(size, 0.1), 1) / 2;
    const x = inside(crop?.x, 0.5);
    const y = inside(crop?.y, 0.5);
    const left = Math.min(Math.max(x - half, 0), 1 - half * 2);
    const top = Math.min(Math.max(y - half, 0), 1 - half * 2);
    const right = left + half * 2;
    const bottom = top + half * 2;
    return [[left, top], [right, top], [right, bottom], [left, bottom]];
  }
  return DEFAULTS.crop.corners.map((corner) => corner.slice());
}

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
    if (!SKINS.some((skin) => skin.id === settings.skin)) settings.skin = DEFAULTS.skin;
    if (!FONTS.includes(settings.font)) settings.font = DEFAULTS.font;
    if (!['time', 'solves'].includes(settings.goalKind)) settings.goalKind = DEFAULTS.goalKind;
    settings.goalMinutes = clampNumber(settings.goalMinutes, 1, 600, DEFAULTS.goalMinutes);
    settings.goalSolves = clampNumber(settings.goalSolves, 1, 500, DEFAULTS.goalSolves);
    for (const key of SWITCHES) settings[key] = settings[key] !== false;
    for (const key of OPT_IN) settings[key] = settings[key] === true;

    settings.crop = { corners: cleanCorners(settings.crop) };
    settings.cubes = Array.isArray(settings.cubes)
      ? [...new Set(settings.cubes.filter((name) => typeof name === 'string' && name.trim())
        .map((name) => name.trim().slice(0, 24)))].slice(0, 12)
      : [];
    settings.cube = settings.cubes.includes(settings.cube) ? settings.cube : '';
    settings.shareName = typeof settings.shareName === 'string' ? settings.shareName.slice(0, 24) : '';
    if (!['U', 'D', 'F', 'B', 'R', 'L'].includes(settings.crossFace)) settings.crossFace = DEFAULTS.crossFace;
    settings.wonBadges = Array.isArray(settings.wonBadges)
      ? settings.wonBadges.filter((id) => typeof id === 'string').slice(0, 200)
      : [];
    settings.cubeColours = cleanPalette(settings.cubeColours);

    // A palette per named cube, and none for a cube that has been forgotten.
    const kits = {};
    for (const [name, palette] of Object.entries(settings.cubeKits || {})) {
      if (!settings.cubes.includes(name)) continue;
      const kept = cleanPalette(palette);
      if (kept.length >= 3) kits[name] = kept;
    }
    settings.cubeKits = kits;

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
