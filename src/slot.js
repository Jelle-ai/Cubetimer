// The wheel.
//
// A small, silly, slightly unreasonable challenge, dealt by three reels that
// spin and clunk to a stop one after the other. What it is for: an evening of
// "just a few more solves" has no shape, and a shape you did not choose is
// worth more than one you did -- you would never set yourself the one about the
// socks, which is exactly why it is funny to have to.
//
// Three reels, and they are three different questions:
//
//   what   -- the job. This is the only reel the app can see; it counts solves,
//             drilled cases or recognitions and knows when you are done.
//   how    -- the rule you have to do it under. No app can tell whether you
//             stood on one leg, so this half runs on your own word.
//   stake  -- what riding on it, which is entirely for show and entirely the
//             point.

/** The job. `watch` is what the app counts; `manual` is on your honour. */
export const WHAT = [
  { id: 'five', label: '5 solves', small: 'gewoon vijf, van begin tot eind', watch: { kind: 'solves', n: 5 } },
  { id: 'ten', label: '10 solves', small: 'tien achter elkaar, geen pauze langer dan een minuut', watch: { kind: 'solves', n: 10 } },
  { id: 'one', label: '1 solve', small: 'eentje maar — en die telt', watch: { kind: 'solves', n: 1 } },
  { id: 'ao5', label: 'een ao5', small: 'vijf solves, beste en slechtste eraf', watch: { kind: 'solves', n: 5 } },
  { id: 'under', label: '3 onder je gemiddelde', small: 'drie stuks, elk sneller dan je laatste twaalf', watch: { kind: 'under', n: 3 } },
  { id: 'streak', label: '3 op rij onder je gemiddelde', small: 'op rij. Eentje erover en je begint opnieuw', watch: { kind: 'streak', n: 3 } },
  { id: 'pb', label: 'jaag op je record', small: 'zolang je wil, tot er één onder je beste van de sessie zit', watch: { kind: 'best', n: 1 } },
  { id: 'drill', label: '10 gevallen trainen', small: 'in het trainen, welke groep je zelf kiest', watch: { kind: 'drill', n: 10 } },
  { id: 'spot', label: '15 gevallen herkennen', small: 'zonder kubus, in Herkennen', watch: { kind: 'spot', n: 15 } },
  { id: 'twenty', label: '20 solves', small: 'de lange. Zet iets op', watch: { kind: 'solves', n: 20 } }
];

/**
 * The rule. These are meant to be daft: the ones that make you laugh are the
 * ones that get done, and a handicap you would never choose is the only kind
 * that teaches you anything you did not already know about your own hands.
 */
export const HOW = [
  { id: 'leg', label: 'staand op één been', small: 'wisselen mag, neerzetten niet' , short: 'op één been' },
  { id: 'weak', label: 'met je zwakke hand als hoofdhand', small: 'ja, ook de U-draaien' , short: 'zwakke hand' },
  { id: 'sock', label: 'met een sok over je linkerhand', small: 'een echte sok. Dit is niet onderhandelbaar' , short: 'sok over je hand' },
  { id: 'dark', label: 'met het licht uit', small: 'alleen het scherm van de timer' , short: 'licht uit' },
  { id: 'noblink', label: 'zonder te knipperen tijdens de inspectie', small: 'vijftien seconden. Succes' , short: 'niet knipperen' },
  { id: 'name', label: 'zeg elke PLL hardop voor je hem doet', small: 'ook als je hem fout benoemt' , short: 'PLL hardop zeggen' },
  { id: 'metro', label: 'met de metronoom op 180', small: 'en je mag niet uit de maat' , short: 'metronoom op 180' },
  { id: 'nolook', label: 'de scramble maar 5 seconden bekijken', small: 'daarna wegdraaien en toch beginnen' , short: 'scramble 5 seconden' },
  { id: 'pushup', label: 'één push-up tussen elke solve', small: 'op je knieën telt ook' , short: 'push-up ertussen' },
  { id: 'alphabet', label: 'het alfabet achterstevoren tussen elke solve', small: 'hardop. Z Y X W...' , short: 'alfabet achterstevoren' },
  { id: 'nofloor', label: 'de kubus mag de tafel niet raken', small: 'alles in de lucht, ook het neerleggen' , short: 'niet op tafel' },
  { id: 'elbows', label: 'met je ellebogen tegen je zij geklemd', small: 'als een pinguïn' , short: 'ellebogen vast' },
  { id: 'smile', label: 'blijven glimlachen', small: 'ook bij een DNF. Vooral bij een DNF' , short: 'blijven glimlachen' },
  { id: 'talk', label: 'geef je kubus een naam en moedig hem aan', small: 'tussen elke solve, met naam' , short: 'kubus aanmoedigen' },
  { id: 'colour', label: 'elke solve op een andere kleur crossen', small: 'zes kleuren, dus je moet nadenken' , short: 'elke keer andere kleur' },
  { id: 'sit', label: 'op je handen zitten tot de timer op groen staat', small: 'letterlijk' , short: 'op je handen zitten' },
  { id: 'hum', label: 'neuriën zolang de klok loopt', small: 'stoppen met neuriën is stoppen met solven' , short: 'neuriën' },
  { id: 'standup', label: 'rechtstaand, kubus op ooghoogte', small: 'niemand kijkt. Waarschijnlijk' , short: 'rechtstaand' },
  { id: 'noinspect', label: 'zonder inspectie', small: 'oppakken en gaan' , short: 'zonder inspectie' },
  { id: 'slow', label: 'zo langzaam als je kunt, maar zonder te pauzeren', small: 'de klok mag alles zien. Vloeiend is de opdracht' , short: 'zo traag mogelijk' },
  { id: 'chair', label: 'op één bil op de rand van je stoel', small: 'evenwicht is een vingertruc' , short: 'op de rand van je stoel' },
  { id: 'eyes', label: 'met je ogen dicht tijdens de inspectie', small: 'kijken mag pas als de klok loopt' , short: 'ogen dicht bij inspectie' }
];

/** What is riding on it. Show, entirely -- and the reason you will do it. */
export const STAKE = [
  { id: 'brag', label: 'eeuwige roem', small: 'de app onthoudt het. Niemand anders' , short: 'eeuwige roem' },
  { id: 'ten', label: 'lukt het niet: 10 extra solves', small: 'meteen, geen uitstel' , short: 'anders 10 extra' },
  { id: 'double', label: 'dubbel of niets', small: 'lukt het, dan telt hij dubbel. Lukt het niet, dan telt hij niet' , short: 'dubbel of niets' },
  { id: 'again', label: 'lukt het niet: morgen dezelfde', small: 'hij komt terug. Zo werkt dat' , short: 'anders morgen weer' },
  { id: 'drop', label: 'lukt het: je traagste van vandaag mag weg', small: 'één keer een streep door de boekhouding' , short: 'traagste mag weg' },
  { id: 'noname', label: 'lukt het niet: je kubus krijgt een vernederende bijnaam', small: 'en je gebruikt hem de hele sessie' , short: 'anders een bijnaam' },
  { id: 'coffee', label: 'lukt het: pauze verdiend', small: 'echt. Ga staan, drink iets' , short: 'pauze verdiend' },
  { id: 'tell', label: 'lukt het: vertel het aan iemand die het niet begrijpt', small: 'kijk hoe ze reageren' , short: 'aan iemand vertellen' },
  { id: 'nothing', label: 'niets. Helemaal niets', small: 'soms is dat het beste wat er op het spel staat' , short: 'niets' },
  { id: 'record', label: 'lukt het: schrijf het in je dagboek bij de sessie', small: 'zodat je het over een jaar terugvindt' , short: 'in je dagboek' },
  { id: 'harder', label: 'lukt het: draai meteen opnieuw', small: 'en die moet je ook doen' , short: 'meteen opnieuw' },
  { id: 'silence', label: 'lukt het niet: vijf minuten stilte met de kubus in je hand', small: 'niet solven. Alleen vasthouden' , short: 'anders vijf minuten stilte' }
];

/** The face a reel shows: short enough to read while it is still moving. */
export const faceOf = (item) => item.short || item.label;

export const REELS = [
  { id: 'what', name: 'Opdracht', items: WHAT },
  { id: 'how', name: 'Regel', items: HOW },
  { id: 'stake', name: 'Inzet', items: STAKE }
];

const pick = (items) => items[Math.floor(Math.random() * items.length)];

/** Three reels, one challenge. */
export function spin() {
  return { what: pick(WHAT), how: pick(HOW), stake: pick(STAKE), at: Date.now() };
}

/** A challenge back from storage, by the ids that were kept. */
export function rebuild(reels) {
  const [what, how, stake] = reels || [];
  const found = {
    what: WHAT.find((one) => one.id === what),
    how: HOW.find((one) => one.id === how),
    stake: STAKE.find((one) => one.id === stake)
  };
  return found.what && found.how && found.stake ? found : null;
}

export const idsOf = (challenge) => [challenge.what.id, challenge.how.id, challenge.stake.id];

/** How far along a challenge is, given what has happened since it was taken on. */
export function progressOf(challenge, tally) {
  const watch = challenge.what.watch;
  const need = watch.n;
  const have = Math.min(tally[watch.kind] || 0, need);
  return { have, need, done: have >= need };
}

/** What the counter should say. */
export function countText(challenge, tally) {
  const { have, need } = progressOf(challenge, tally);
  const kind = challenge.what.watch.kind;
  const unit = kind === 'drill' ? 'gevallen' : kind === 'spot' ? 'herkend' : 'solves';
  if (kind === 'best') return have ? 'gehaald' : 'nog geen record deze sessie';
  if (kind === 'streak') return `${have} op rij van ${need}`;
  return `${have} van ${need} ${unit}`;
}
