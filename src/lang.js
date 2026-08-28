// Two languages, and English is the one the app is written in.
//
// The source text *is* the key. There is no table of names like
// `settings.timer.inspection` to keep in step with anything -- you write the
// English sentence where it belongs, and the Dutch is looked up beside it. A
// sentence with no translation yet falls through as English, which is the right
// way to be incomplete: nothing ever renders as a missing key.
//
// The static page is handled the same way. Rather than doubling every element
// with a data-attribute, the markup is walked once, each piece of text is
// remembered as it was written, and from then on a switch of language rewrites
// from that memory. Text the app puts there afterwards goes through t() like
// everything else.

import { NL } from './lang-nl.js';

export const LANGS = [
  { id: 'en', name: 'English' },
  { id: 'nl', name: 'Nederlands' }
];

const BOOKS = { nl: NL };

let lang = 'en';

export const currentLang = () => lang;

/** How dates and times are written. Belgian Dutch, British English. */
export const locale = () => (lang === 'nl' ? 'nl-BE' : 'en-GB');

/** What the browser is set to, if it is one we speak. */
export function guessLang() {
  for (const wanted of navigator.languages || [navigator.language || '']) {
    const short = String(wanted).slice(0, 2).toLowerCase();
    if (LANGS.some((one) => one.id === short)) return short;
  }
  return 'en';
}

/** Fill {name} holes from an object. Missing ones are left alone rather than
    printed as "undefined", which is the failure you notice too late. */
function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (whole, name) =>
    (Object.hasOwn(vars, name) ? String(vars[name]) : whole));
}

/**
 * One string, in the language that is on.
 * @param {string} text the English, which is also the key
 * @param {object} [vars] values for any {name} holes
 */
export function t(text, vars) {
  const said = BOOKS[lang]?.[text] ?? text;
  return vars ? fill(said, vars) : said;
}

/** A plural that does not read like a robot: t2(n, 'solve', 'solves'). */
export const t2 = (count, one, many) => t(count === 1 ? one : many, { n: count });

/* ---------- the static page ---------- */

/**
 * Everything in the markup, remembered as it was written.
 * Kept as a list rather than on the elements themselves so that nothing has to
 * be added to the HTML for this to work.
 */
const remembered = [];
let bound = false;

const ATTRS = ['title', 'aria-label', 'placeholder'];

/** Walk the page once and note every piece of text it was written with. */
export function bindStatic(root = document.body) {
  if (bound) return;
  bound = true;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Script and style are not prose, and neither is whitespace between tags.
      const parent = node.parentElement;
      if (!parent || parent.closest('script, style, svg')) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  let node = walker.nextNode();
  while (node) {
    remembered.push({ node, was: node.nodeValue });
    node = walker.nextNode();
  }

  for (const element of root.querySelectorAll('*')) {
    for (const name of ATTRS) {
      const was = element.getAttribute(name);
      if (was && was.trim()) remembered.push({ element, name, was });
    }
  }
  applyStatic();
}

/** Write the remembered text back out in the language that is on. */
function applyStatic() {
  for (const item of remembered) {
    // The whitespace around a piece of text is layout, not language: it is put
    // back exactly as it was so nothing shifts when you switch.
    if (item.node) {
      const [, before, middle, after] = /^(\s*)([\s\S]*?)(\s*)$/.exec(item.was);
      item.node.nodeValue = `${before}${t(middle)}${after}`;
    } else {
      item.element.setAttribute(item.name, t(item.was));
    }
  }
  document.documentElement.lang = lang;
}

/** Everything the app has to redraw when the language changes. */
const listeners = new Set();

export function onLangChange(run) {
  listeners.add(run);
  return () => listeners.delete(run);
}

export function setLang(id) {
  if (!LANGS.some((one) => one.id === id) || id === lang) return false;
  lang = id;
  applyStatic();
  for (const run of listeners) {
    try {
      run(id);
    } catch (error) {
      console.warn('Taal wisselen:', error);
    }
  }
  return true;
}

/** Set the language without telling anybody -- only for the very first draw. */
export function startLang(id) {
  if (LANGS.some((one) => one.id === id)) lang = id;
}
