// The wheel.
//
// It used to have three reels: a task, a rule and a stake. Two of those were
// decoration. The challenge is the rule -- "with a sock over your left hand" --
// and how many solves you do it for is a choice, not a spin, so it is a row of
// buttons now. One reel, one lever, and the daftness left in.
//
// Nothing here is judged by the app except the counting. Whether you really
// stood on one leg is between you and the leg.

/**
 * The rules. These are meant to be daft: the ones that make you laugh are the
 * ones that get done, and a handicap you would never choose is the only kind
 * that teaches you something you did not already know about your own hands.
 *
 * `short` is what fits on the reel while it is still moving; `label` is the
 * whole thing, once it has stopped.
 */
export const RULES = [
  { id: 'leg', short: 'on one leg', label: 'standing on one leg', small: 'swapping is allowed, putting it down is not' },
  { id: 'weak', short: 'weak hand', label: 'with your weak hand as your main hand', small: 'yes, the U turns as well' },
  { id: 'sock', short: 'a sock on your hand', label: 'with a sock over your left hand', small: 'a real sock. This is not negotiable' },
  { id: 'dark', short: 'lights off', label: 'with the lights off', small: 'only the glow of the timer' },
  { id: 'noblink', short: 'no blinking', label: 'without blinking during the inspection', small: 'fifteen seconds. Good luck' },
  { id: 'name', short: 'name every PLL out loud', label: 'say every PLL out loud before you do it', small: 'even when you name it wrong' },
  { id: 'metro', short: 'metronome at 180', label: 'with the metronome at 180', small: 'and you may not fall out of time' },
  { id: 'nolook', short: 'five seconds of scramble', label: 'looking at the scramble for five seconds only', small: 'then turn away and start anyway' },
  { id: 'pushup', short: 'a push-up between each', label: 'one push-up between every solve', small: 'on your knees counts' },
  { id: 'alphabet', short: 'alphabet backwards', label: 'the alphabet backwards between every solve', small: 'out loud. Z Y X W…' },
  { id: 'nofloor', short: 'never touch the table', label: 'the cube may not touch the table', small: 'everything in the air, putting it down included' },
  { id: 'elbows', short: 'elbows in', label: 'with your elbows clamped to your sides', small: 'like a penguin' },
  { id: 'smile', short: 'keep smiling', label: 'keep smiling', small: 'through a DNF too. Especially through a DNF' },
  { id: 'talk', short: 'encourage your cube', label: 'give your cube a name and encourage it', small: 'between every solve, by name' },
  { id: 'colour', short: 'a different colour each time', label: 'cross on a different colour every solve', small: 'six colours, so you have to think' },
  { id: 'sit', short: 'sit on your hands', label: 'sitting on your hands until the timer goes green', small: 'literally' },
  { id: 'hum', short: 'humming', label: 'humming for as long as the clock runs', small: 'stopping humming is stopping solving' },
  { id: 'standup', short: 'standing up', label: 'standing up, cube at eye level', small: 'nobody is watching. Probably' },
  { id: 'noinspect', short: 'no inspection', label: 'without inspection', small: 'pick it up and go' },
  { id: 'slow', short: 'as slow as you can', label: 'as slowly as you can, but without ever pausing', small: 'the clock may see everything. Smooth is the job' },
  { id: 'chair', short: 'on the edge of your chair', label: 'on one buttock, on the edge of your chair', small: 'balance is a finger trick' },
  { id: 'eyes', short: 'eyes shut while inspecting', label: 'with your eyes shut during the inspection', small: 'looking is allowed once the clock runs' }
];

/** How long you keep it up. The last one runs until you say stop. */
export const COUNTS = [
  { id: '5', n: 5, label: '5 solves' },
  { id: '10', n: 10, label: '10 solves' },
  { id: '20', n: 20, label: '20 solves' },
  { id: 'session', n: 0, label: 'until I stop' }
];

export const ruleOf = (id) => RULES.find((rule) => rule.id === id) || null;
export const countOf = (id) => COUNTS.find((count) => count.id === id) || COUNTS[0];

/** One spin. */
export const spin = () => RULES[Math.floor(Math.random() * RULES.length)];

/** What the counter should say. */
export function countText(dare) {
  const want = countOf(dare.count);
  if (!want.n) return { have: dare.done, need: 0, done: false };
  return { have: Math.min(dare.done, want.n), need: want.n, done: dare.done >= want.n };
}

/* ---------- sending one to somebody ----------

   The whole challenge is a rule and a number, so it fits in a fragment: the
   part of a link after the # that a browser never sends to a server. Nothing is
   uploaded and nothing is stored -- the link simply is the challenge. */

export function darePart(rule, countId) {
  return `dare=${encodeURIComponent(rule)}.${encodeURIComponent(countId)}`;
}

export function readDareLink(hash = location.hash) {
  const found = /(?:^|[#&])dare=([^&]+)/.exec(hash || '');
  if (!found) return null;
  const [rule, count] = decodeURIComponent(found[1]).split('.');
  const one = ruleOf(rule);
  return one ? { rule: one, count: countOf(count).id } : null;
}
