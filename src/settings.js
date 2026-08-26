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
  splits: false,
  pace: true,
  crossTip: false,
  crossFace: 'D',
  // Which scrambles you want dealt: everything, only easy crosses, only hard.
  taste: 'any',
  // Which group of the settings you were last looking at.
  settingsTab: 'timer',
  // And which part of the look-back sheet.
  recordTab: 'now',
  // The groups of the side list you have folded away.
  railShut: [],
  // Which algorithm you starred for each case, as "group/id" to the moves
  // themselves. It used to be a number -- the place in the list -- which broke
  // the moment you added one of your own and the list shifted under it.
  pickedAlg: {},
  // Which cases go on your printable sheet, and whether it shows your notes.
  sheetGroups: ['pll'],
  sheetOnly: 'all',
  sheetNotes: true,
  // How the case book lays a case out: side by side or one under the other.
  bookWide: true,
  // Whether a drilled case turns up facing a random way. On while you are
  // learning to recognise it; off while you are learning the algorithm itself.
  caseAuf: true,
  // A time to be under, and a date to be under it by. Both optional.
  aimTime: 0,
  aimBy: '',
  // The challenge from the wheel you are in the middle of, so it survives a
  // reload -- a challenge that vanishes when you close the tab is not one.
  dare: null,
  wonBadges: [],
  badgesSeeded: false,
  cubes: [],
  cube: '',
  shareName: '',
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

const SWITCHES = ['inspection', 'hideTime', 'pace', 'sound', 'haptics', 'celebrate', 'highlight', 'preview', 'countUp', 'wakeLock', 'practice', 'sheetNotes', 'bookWide'];

// Switches that start off rather than on, so "anything but false is true" --
// the rule the ones above use -- would turn them on by mistake.
const OPT_IN = ['splits', 'crossTip', 'badgesSeeded'];

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
    if (!SKINS.some((skin) => skin.id === settings.skin)) settings.skin = DEFAULTS.skin;
    if (!FONTS.includes(settings.font)) settings.font = DEFAULTS.font;
    if (!['time', 'solves'].includes(settings.goalKind)) settings.goalKind = DEFAULTS.goalKind;
    settings.goalMinutes = clampNumber(settings.goalMinutes, 1, 600, DEFAULTS.goalMinutes);
    settings.goalSolves = clampNumber(settings.goalSolves, 1, 500, DEFAULTS.goalSolves);
    for (const key of SWITCHES) settings[key] = settings[key] !== false;
    for (const key of OPT_IN) settings[key] = settings[key] === true;

    settings.cubes = Array.isArray(settings.cubes)
      ? [...new Set(settings.cubes.filter((name) => typeof name === 'string' && name.trim())
        .map((name) => name.trim().slice(0, 24)))].slice(0, 12)
      : [];
    settings.cube = settings.cubes.includes(settings.cube) ? settings.cube : '';
    settings.shareName = typeof settings.shareName === 'string' ? settings.shareName.slice(0, 24) : '';
    if (!['U', 'D', 'F', 'B', 'R', 'L'].includes(settings.crossFace)) settings.crossFace = DEFAULTS.crossFace;
    const picked = {};
    for (const [where, at] of Object.entries(settings.pickedAlg || {})) {
      if (typeof where !== 'string') continue;
      if (typeof at === 'string' && at.trim()) picked[where] = at.trim().slice(0, 120);
      else if (Number.isInteger(at) && at >= 0 && at < 12) picked[where] = at;
    }
    settings.pickedAlg = picked;

    settings.sheetGroups = Array.isArray(settings.sheetGroups)
      ? settings.sheetGroups.filter((id) => typeof id === 'string').slice(0, 8)
      : [...DEFAULTS.sheetGroups];
    if (!settings.sheetGroups.length) settings.sheetGroups = [...DEFAULTS.sheetGroups];
    if (!['all', 'mine', 'drilled'].includes(settings.sheetOnly)) settings.sheetOnly = DEFAULTS.sheetOnly;

    settings.aimTime = clampNumber(settings.aimTime, 0, 600000, 0);
    settings.aimBy = /^\d{4}-\d{2}-\d{2}$/.test(settings.aimBy) ? settings.aimBy : '';

    const dare = settings.dare;
    settings.dare = dare && Array.isArray(dare.reels) && dare.reels.length === 3
      && dare.reels.every((id) => typeof id === 'string')
      ? {
        reels: dare.reels.map((id) => id.slice(0, 32)),
        tally: dare.tally && typeof dare.tally === 'object' ? dare.tally : {},
        at: Number.isFinite(dare.at) ? dare.at : Date.now()
      }
      : null;

    settings.railShut = Array.isArray(settings.railShut)
      ? settings.railShut.filter((id) => typeof id === 'string').slice(0, 12)
      : [];
    settings.wonBadges = Array.isArray(settings.wonBadges)
      ? settings.wonBadges.filter((id) => typeof id === 'string').slice(0, 200)
      : [];

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
