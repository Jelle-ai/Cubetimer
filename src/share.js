import { locale } from './lang.js';
// Handing a result to somebody else.
//
// Two ways, both without a server. A picture, because a screenshot of a list of
// numbers is not something anybody wants to look at. And a link, with the times
// packed into the part of the address that never leaves the browser -- so
// nothing is uploaded, nothing is stored anywhere, and it still opens for
// whoever you send it to.

import { averageOf, best, effective, formatSolve, formatTime } from './stats.js';

/* ---------- the picture ---------- */

const CARD = { width: 1080, height: 1350 };

const round = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/**
 * A card worth sending. Drawn rather than screenshotted: the screen is laid out
 * for solving, not for looking at afterwards.
 *
 * @param {{title: string, headline: string, lines: string[], footer: string, accent: string, dark: boolean}} about
 * @returns {HTMLCanvasElement}
 */
export function drawCard(about) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD.width;
  canvas.height = CARD.height;
  const ctx = canvas.getContext('2d');

  const ink = about.dark ? '#eaf4f8' : '#0b2733';
  const soft = about.dark ? 'rgba(234,244,248,.62)' : 'rgba(11,39,51,.58)';
  const paper = about.dark ? '#0b1a22' : '#f4fbfe';

  const sky = ctx.createLinearGradient(0, 0, CARD.width, CARD.height);
  sky.addColorStop(0, about.accent);
  sky.addColorStop(1, paper);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CARD.width, CARD.height);

  ctx.fillStyle = about.dark ? 'rgba(11,26,34,.82)' : 'rgba(255,255,255,.86)';
  round(ctx, 70, 70, CARD.width - 140, CARD.height - 140, 56);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = soft;
  ctx.font = '600 40px ui-rounded, system-ui, sans-serif';
  ctx.fillText(about.title.toUpperCase(), CARD.width / 2, 220);

  ctx.fillStyle = ink;
  ctx.font = '700 200px ui-rounded, system-ui, sans-serif';
  ctx.fillText(about.headline, CARD.width / 2, 420);

  // Five times side by side is a long line, and a DNF makes it longer. Rather
  // than let it run off the card, each line is shrunk until it fits.
  const room = CARD.width - 200;
  about.lines.forEach((line, index) => {
    let size = index === 0 ? 52 : 46;
    do {
      ctx.font = `500 ${size}px ui-rounded, system-ui, sans-serif`;
      size -= 2;
    } while (size > 20 && ctx.measureText(line).width > room);

    ctx.fillStyle = index === 0 ? ink : soft;
    ctx.fillText(line, CARD.width / 2, 560 + index * 88);
  });

  ctx.fillStyle = soft;
  ctx.font = '500 38px ui-rounded, system-ui, sans-serif';
  ctx.fillText(about.footer, CARD.width / 2, CARD.height - 140);

  return canvas;
}

/** What a run of solves comes to, said the way a card wants it. */
export function cardFor(solves, { title = 'ao5', name = '', accent = '#4fc3f7', dark = false } = {}) {
  const average = averageOf(solves, solves.length);
  const quickest = best(solves);
  const times = solves.map((solve) => formatSolve(solve));

  return {
    title,
    headline: formatTime(average),
    lines: [
      times.join('   '),
      quickest === null ? '' : `beste ${formatTime(quickest)}`
    ].filter(Boolean),
    footer: [name, new Date().toLocaleDateString(locale())].filter(Boolean).join(' · '),
    accent,
    dark
  };
}

/* ---------- the link ---------- */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Base64 without the characters a URL argues about. */
function pack(numbers) {
  let bits = '';
  for (const value of numbers) bits += value.toString(2).padStart(24, '0');
  let out = '';
  for (let at = 0; at < bits.length; at += 6) out += ALPHABET[parseInt(bits.slice(at, at + 6), 2)];
  return out;
}

function unpack(text) {
  let bits = '';
  for (const letter of text) {
    const index = ALPHABET.indexOf(letter);
    if (index < 0) return [];
    bits += index.toString(2).padStart(6, '0');
  }
  const out = [];
  for (let at = 0; at + 24 <= bits.length; at += 24) out.push(parseInt(bits.slice(at, at + 24), 2));
  return out;
}

/**
 * Times packed into a link.
 *
 * Everything rides in the fragment -- the part after the # -- which browsers
 * never send to a server. So there is nothing to host, nothing to store, and
 * nothing about you leaves your device until you send the link yourself.
 *
 * A time is milliseconds with the penalty in the top bits, which keeps five
 * solves inside about twenty characters.
 */
export function packSolves(solves) {
  const numbers = solves.slice(0, 12).map((solve) => {
    const ms = Math.min(Math.max(Math.round(solve.ms), 0), 0x3fffff);
    const penalty = solve.penalty === 'DNF' ? 2 : solve.penalty === '+2' ? 1 : 0;
    return (penalty << 22) | ms;
  });
  return pack(numbers);
}

export function unpackSolves(text) {
  return unpack(text).map((value) => ({
    ms: value & 0x3fffff,
    penalty: ['none', '+2', 'DNF'][(value >> 22) & 3] || 'none'
  }));
}

/** The whole address to send. */
export function shareLink(solves, { name = '', base = location.href } = {}) {
  const url = new URL(base);
  url.hash = '';
  url.search = '';
  const bits = [`t=${packSolves(solves)}`];
  if (name) bits.push(`n=${encodeURIComponent(name.slice(0, 24))}`);
  return `${url.toString()}#${bits.join('&')}`;
}

/**
 * Times someone sent you, or null when this is an ordinary visit.
 * @returns {{solves: object[], name: string}|null}
 */
export function readShared(hash = location.hash) {
  if (!hash || hash.length < 3) return null;
  const bits = new URLSearchParams(hash.slice(1));
  const packed = bits.get('t');
  if (!packed) return null;

  const solves = unpackSolves(packed).filter((solve) => solve.ms > 0);
  if (!solves.length) return null;
  return { solves, name: (bits.get('n') || '').slice(0, 24) };
}
